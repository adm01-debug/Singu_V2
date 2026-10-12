/* eslint-disable sonarjs/no-hardcoded-ip, sonarjs/no-clear-text-protocols -- Casos de bloqueio SSRF e socket de teste local. */
import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isPublicAddress, resolveDestination, safeFetch, type HttpTransport } from "./safe-http.ts";

const signal = () => AbortSignal.timeout(2000);

Deno.test("bloqueia redes IPv4 e IPv6 especiais, inclusive formas mapeadas", () => {
  for (const address of [
    "127.0.0.1", "169.254.169.254", "10.0.0.1", "172.16.0.1", "192.168.0.1",
    "100.64.0.1", "198.18.0.1", "192.0.2.1", "198.51.100.1", "203.0.113.1",
    "224.0.0.1", "240.0.0.1", "255.255.255.255", "0.0.0.0", "::", "::1",
    "fc00::1", "fd00::1", "fe80::1", "ff02::1", "2001:db8::1", "2002:a00:1::1",
    "::ffff:10.0.0.1", "::ffff:192.168.0.1", "::ffff:c0a8:1", "0:0:0:0:0:ffff:ac10:1",
    "::a00:1", "64:ff9b::a00:1", "2001::1", "2001:2::1", "3fff::1", "endereço inválido",
  ]) assertEquals(isPublicAddress(address), false, address);
  for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) {
    assertEquals(isPublicAddress(address), true, address);
  }
});

function networkWithRecords(records: string[]): HttpTransport {
  return {
    resolve: () => Promise.resolve(records),
    connect: () => { throw new Error("A conexão não deveria ser aberta"); },
    startTls: () => { throw new Error("TLS não deveria ser iniciado"); },
  };
}

Deno.test("rejeita DNS misto, sem endereços e URLs alternativas de loopback", async () => {
  for (const records of [[], ["8.8.8.8", "10.0.0.1"], ["8.8.8.8", "::ffff:c0a8:1"]]) {
    await assertRejects(() => resolveDestination("https://public.test/", signal(), networkWithRecords(records)));
  }
  for (const url of ["http://2130706433", "http://0x7f000001", "http://0177.0.0.1", "http://[::ffff:192.168.0.1]", "file:///etc/hosts", "https://user:password@public.test/"]) {
    await assertRejects(() => resolveDestination(url, signal(), networkWithRecords(["8.8.8.8"])));
  }
});

Deno.test("literal público dispensa DNS, preservando IPv6 e porta", async () => {
  const result = await resolveDestination("https://[2606:4700:4700::1111]:8443/", signal(), {
    ...networkWithRecords([]),
    resolve: () => { throw new Error("Literal não deve passar por DNS"); },
  });
  assertEquals(result.address, "2606:4700:4700::1111");
  assertEquals(result.hostname, "2606:4700:4700::1111");
  assertEquals(result.port, 8443);
});

async function testExchange(status: number) {
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const requests: string[] = [];
  const addresses: string[] = [];
  let resolutions = 0;
  const server = (async () => {
    const connection = await listener.accept();
    try {
      const buffer = new Uint8Array(2048);
      const length = await connection.read(buffer);
      requests.push(new TextDecoder().decode(buffer.subarray(0, length ?? 0)));
      await connection.write(new TextEncoder().encode(`HTTP/1.1 ${status} Resultado\r\nContent-Length: 0\r\nLocation: http://127.0.0.1/\r\n\r\n`));
    } finally { connection.close(); }
  })();
  const network: HttpTransport = {
    ...networkWithRecords([]),
    resolve: (_hostname, type) => {
      resolutions++;
      return Promise.resolve(type === "AAAA" ? [] : [resolutions > 2 ? "127.0.0.1" : "8.8.8.8"]);
    },
    connect: (address) => {
      addresses.push(address);
      return Deno.connect({ hostname: "127.0.0.1", port: listener.addr.port });
    },
  };
  try {
    if (status >= 300) await assertRejects(() => safeFetch("http://public.test/path?q=1", {}, network));
    else assertEquals((await safeFetch("http://public.test/path?q=1", {}, network)).status, status);
    await server;
    assertEquals(resolutions, 2);
    assertEquals(addresses, ["8.8.8.8"]);
    assert(requests[0].startsWith("GET /path?q=1 HTTP/1.1\r\n"));
    assert(requests[0].includes("host: public.test\r\n"));
  } finally { listener.close(); }
}

Deno.test("fixa o endereço validado sem segunda resolução e conserva Host/caminho", () => testExchange(200));
Deno.test("não segue redirecionamento de endereço público para rede interna", () => testExchange(302));
