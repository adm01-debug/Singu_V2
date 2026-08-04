// Shared email verification logic. Used by `email-verifier` and `email-finder`.
const DISPOSABLE = new Set([
  "mailinator.com","tempmail.com","10minutemail.com","guerrillamail.com",
  "throwawaymail.com","yopmail.com","trashmail.com","getnada.com",
  "temp-mail.org","fakeinbox.com","sharklasers.com","maildrop.cc",
]);
const FREE_PROVIDERS = new Set([
  "gmail.com","yahoo.com","hotmail.com","outlook.com","live.com","aol.com",
  "icloud.com","me.com","mail.com","protonmail.com","proton.me","yandex.com",
  "zoho.com","gmx.com","uol.com.br","bol.com.br","terra.com.br","ig.com.br",
]);
const ROLE_PREFIXES = new Set([
  "admin","administrator","contact","contato","info","sales","vendas","support","suporte",
  "help","ajuda","noreply","no-reply","postmaster","webmaster","hello","hi","mail",
  "marketing","comercial","financeiro","rh","hr","ti","it","sac",
]);

async function checkMx(domain: string): Promise<boolean> {
  try {
    const records = await Deno.resolveDns(domain, "MX");
    return Array.isArray(records) && records.length > 0;
  } catch {
    try {
      const a = await Deno.resolveDns(domain, "A");
      return Array.isArray(a) && a.length > 0;
    } catch {
      return false;
    }
  }
}

export async function verifyEmail(email: string) {
  const reasons: string[] = [];
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split("@");
  if (!local || !domain) {
    return { status: "invalid", score: 0, mx_found: false, smtp_check: false, disposable: false, role_account: false, free_provider: false, reasons: ["malformed"] };
  }

  const disposable = DISPOSABLE.has(domain);
  const free = FREE_PROVIDERS.has(domain);
  const role = ROLE_PREFIXES.has(local) || ROLE_PREFIXES.has(local.split(/[.\-_]/)[0]);
  const mx = await checkMx(domain);

  if (disposable) reasons.push("disposable_domain");
  if (role) reasons.push("role_account");
  if (!mx) reasons.push("no_mx_record");
  if (free) reasons.push("free_provider");

  let score = 50;
  if (mx) score += 30; else score -= 30;
  if (!disposable) score += 10;
  if (!role) score += 5;
  if (!free) score += 5;
  score = Math.max(0, Math.min(100, score));

  let status: string;
  if (!mx || disposable) status = "invalid";
  else if (role) status = "risky";
  else if (score >= 75) status = "valid";
  else if (score >= 50) status = "risky";
  else status = "unknown";

  return { status, score, mx_found: mx, smtp_check: false, disposable, role_account: role, free_provider: free, reasons };
}
