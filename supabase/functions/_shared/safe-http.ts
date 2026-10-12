import ipaddr from "npm:ipaddr.js@2.5.0";

export interface HttpTransport {
  resolve(hostname: string, type: "A" | "AAAA", signal: AbortSignal): Promise<string[]>;
  connect(address: string, port: number, signal: AbortSignal): Promise<Deno.TcpConn>;
  startTls(connection: Deno.TcpConn, hostname: string): Promise<Deno.TlsConn>;
}

const transport: HttpTransport = {
  resolve: (hostname, type, signal) => Deno.resolveDns(hostname, type, { signal }),
  connect: (hostname, port, signal) => Deno.connect({ hostname, port, signal }),
  startTls: (connection, hostname) => Deno.startTls(connection, {
    hostname,
    alpnProtocols: ["http/1.1"],
  }),
};

export function isPublicAddress(value: string): boolean {
  if (!ipaddr.isValid(value)) return false;
  const address = ipaddr.process(value);
  if (address.range() !== "unicast") return false;
  if (!(address instanceof ipaddr.IPv6)) return true;
  if (address.parts[0] === 0x2001 && address.parts[1] < 0x200) return false;
  return (address.parts[0] & 0xe000) === 0x2000;
}

export async function resolveDestination(rawUrl: string, signal: AbortSignal, network = transport) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("URL de conexão não permitida");
  }
  if (url.port === "0") throw new Error("Porta zero não permitida");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = ipaddr.isValid(hostname) ? [hostname] : (await Promise.all([
    network.resolve(hostname, "A", signal).catch(() => [] as string[]),
    network.resolve(hostname, "AAAA", signal).catch(() => [] as string[]),
  ])).flat();
  signal.throwIfAborted();
  if (!addresses.length || addresses.some(address => !isPublicAddress(address))) {
    throw new Error("Destino de URL bloqueado: endereço privado, reservado ou não resolvido");
  }
  return { url, hostname, addresses, port: Number(url.port) || (url.protocol === "https:" ? 443 : 80) };
}

async function writeAll(connection: Deno.Conn, bytes: Uint8Array) {
  let offset = 0;
  while (offset < bytes.length) {
    const written = await connection.write(bytes.subarray(offset));
    if (written <= 0) throw new Error("Conexão encerrada durante a requisição");
    offset += written;
  }
}

async function readStatus(connection: Deno.Conn): Promise<number> {
  const buffer = new Uint8Array(1024);
  const decoder = new TextDecoder("latin1");
  let headers = "";
  let bytesRead = 0;
  while (bytesRead < 16 * 1024) {
    const count = await connection.read(buffer);
    if (count === null) throw new Error("Resposta HTTP incompleta");
    bytesRead += count;
    headers += decoder.decode(buffer.subarray(0, count));
    let boundary = headers.indexOf("\r\n\r\n");
    while (boundary >= 0) {
      const firstLine = headers.slice(0, headers.indexOf("\r\n"));
      const status = /^HTTP\/1\.[01] ([1-5]\d{2})(?:[ \t]|$)/.exec(firstLine)?.[1];
      if (!status || status === "101") throw new Error("Resposta HTTP inválida");
      if (Number(status) >= 200) return Number(status);
      headers = headers.slice(boundary + 4);
      boundary = headers.indexOf("\r\n\r\n");
    }
  }
  throw new Error("Cabeçalhos HTTP excedem o limite permitido");
}

export async function safeFetch(rawUrl: string, options: RequestInit = {}, network = transport): Promise<Response> {
  const deadline = Date.now() + 10_000;
  const signal = AbortSignal.timeout(10_000);
  const destination = await resolveDestination(rawUrl, signal, network);
  const request = new Request(destination.url, options);
  if (!["GET", "HEAD", "POST"].includes(request.method)) throw new Error("Método HTTP não permitido");
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.length > 64 * 1024) throw new Error("Corpo de requisição excede o limite permitido");
  signal.throwIfAborted();
  let connection: Deno.Conn | undefined;
  const close = () => {
    try { connection?.close(); } catch { /* Conexão já encerrada. */ }
  };
  signal.addEventListener("abort", close, { once: true });
  try {
    let connectionError: unknown;
    for (const [index, address] of destination.addresses.entries()) {
      signal.throwIfAborted();
      let attemptTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        const remaining = destination.addresses.length - index;
        const controller = new AbortController();
        attemptTimer = setTimeout(() => controller.abort(new DOMException("Tempo de conexão excedido", "TimeoutError")),
          Math.max(1, Math.floor((deadline - Date.now()) / remaining)));
        const attempt = AbortSignal.any([signal, controller.signal]);
        const tcpConnection = await network.connect(address, destination.port, attempt);
        connection = tcpConnection;
        if (destination.url.protocol === "https:") {
          signal.throwIfAborted();
          let stopWaiting = () => {};
          const deadlineExceeded = new Promise<never>((_, reject) => {
            stopWaiting = () => { close(); reject(attempt.reason); };
            attempt.addEventListener("abort", stopWaiting, { once: true });
          });
          try {
            const handshake = network.startTls(tcpConnection, destination.hostname);
            void handshake.then(tlsConnection => {
              if (attempt.aborted) {
                try { tlsConnection.close(); } catch { /* Conexão já encerrada. */ }
              }
            }, () => {});
            const tlsConnection = await Promise.race([handshake, deadlineExceeded]);
            connection = tlsConnection;
            await Promise.race([tlsConnection.handshake(), deadlineExceeded]);
          } finally {
            attempt.removeEventListener("abort", stopWaiting);
          }
        }
        break;
      } catch (error) {
        close();
        connection = undefined;
        connectionError = error;
      } finally {
        clearTimeout(attemptTimer);
      }
    }
    if (!connection) throw connectionError instanceof Error ? connectionError : new Error("Falha na conexão com o destino");
    signal.throwIfAborted();
    const headers = new Headers(request.headers);
    headers.delete("transfer-encoding");
    headers.set("host", destination.url.host);
    headers.set("connection", "close");
    if (body.length || request.method === "POST") headers.set("content-length", String(body.length));
    const path = destination.url.pathname + destination.url.search;
    const lines = [...headers].map(([name, value]) => `${name}: ${value}`).join("\r\n");
    await writeAll(connection, new TextEncoder().encode(`${request.method} ${path} HTTP/1.1\r\n${lines}\r\n\r\n`));
    await writeAll(connection, body);
    const status = await readStatus(connection);
    if (status >= 300 && status < 400) throw new Error("Redirecionamento não permitido no teste de conexão");
    return new Response(null, { status });
  } finally {
    signal.removeEventListener("abort", close);
    close();
  }
}
