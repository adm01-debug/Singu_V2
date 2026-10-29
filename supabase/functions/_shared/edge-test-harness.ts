import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const owner = "11111111-1111-4111-8111-111111111111";

export async function withHandler(
  name: string,
  backend: (req: Request) => Response | Promise<Response>,
  check: (submit: (body: unknown, headers?: Record<string, string>) => Promise<Response>) => Promise<void>,
  mockAI = false,
  extraEnv?: (base: string) => Record<string, string>,
) {
  const api = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, (req) => {
    if (new URL(req.url).pathname === "/auth/v1/user") return Response.json({ id: owner });
    return backend(req);
  });
  const base = `http://127.0.0.1:${api.addr.port}`;
  const entry = new URL(`../${name}/index.ts`, import.meta.url).href;
  const source = `
    const originalServe = Deno.serve;
    Deno.serve = (options, handler) => originalServe({
      ...(typeof options === "function" ? {} : options),
      hostname: "127.0.0.1", port: 0,
      onListen: ({ port }) => console.log("EDGE_TEST_PORT=" + port),
    }, typeof options === "function" ? options : handler);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.origin === ${JSON.stringify(base)}) return originalFetch(input, init);
      if (${mockAI} && url.href === "https://ai.gateway.lovable.dev/v1/chat/completions") {
        return Promise.resolve(Response.json({ choices: [{ message: { content: "{inválido}" } }] }));
      }
      return Promise.reject(new Error("Acesso externo proibido no teste: " + url.origin));
    };
    await import(${JSON.stringify(entry)});
  `;
  const child = new Deno.Command(Deno.execPath(), {
    args: ["run", "--no-lock", "--node-modules-dir=none", "--allow-net=127.0.0.1,0.0.0.0", "--allow-env", "-"],
    clearEnv: true,
    env: {
      HOME: Deno.env.get("HOME")!, SUPABASE_URL: base,
      SUPABASE_ANON_KEY: "anon-teste", SUPABASE_SERVICE_ROLE_KEY: "servico-teste",
      CRON_SECRET: "cron-teste", EVOLUTION_API_SECRET: "evolution-teste", LUX_WEBHOOK_SECRET: "lux-teste",
      ...extraEnv?.(base),
      ...(mockAI ? { LOVABLE_API_KEY: "ia-simulada" } : {}),
    },
    stdin: "piped", stdout: "piped", stderr: "piped",
  }).spawn();
  let port: string | undefined;
  const stdout = (async () => {
    let text = "";
    const decoder = new TextDecoder();
    for await (const chunk of child.stdout) {
      text += decoder.decode(chunk, { stream: true });
      port = /EDGE_TEST_PORT=(\d+)\n/.exec(text)?.[1];
    }
  })();
  const stderr = new Response(child.stderr).text();
  try {
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(source));
    await writer.close();
    for (let attempt = 0; attempt < 100; attempt++) {
      if (port) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assertEquals(typeof port, "string", `Handler ${name} não iniciou`);
    const endpoint = `http://127.0.0.1:${port}/`;
    const preflight = await fetch(endpoint, { method: "OPTIONS" });
    assertEquals(preflight.ok, true);
    await preflight.body?.cancel();
    let requestId = 0;
    await check((body, headers = {}) => fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `192.0.2.${++requestId}`, ...headers },
      body: JSON.stringify(body),
    }));
  } finally {
    try { child.kill("SIGTERM"); } catch { /* O subprocesso pode ter encerrado na inicialização. */ }
    await child.status;
    await stdout;
    await stderr;
    await api.shutdown();
  }
}

export function withEvolutionHandler(
  backend: (req: Request) => Response | Promise<Response>,
  check: (submit: (body: unknown, headers?: Record<string, string>) => Promise<Response>) => Promise<void>,
) {
  return withHandler("evolution-webhook", req => {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/rest/v1/whatsapp_instances") {
      assertEquals(url.searchParams.get("instance_name"), "eq.teste");
      assertEquals(url.searchParams.get("limit"), "2");
      return Response.json([{ user_id: owner }]);
    }
    return backend(req);
  }, check);
}
