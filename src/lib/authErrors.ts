/** Mapeia erros do Supabase Auth para mensagens amigáveis em pt-BR. */
export function friendlyAuthError(err: unknown): string {
  const raw =
    (typeof err === "object" && err && "message" in err && String((err as { message: unknown }).message)) ||
    (typeof err === "string" ? err : "") ||
    "";

  const msg = raw.toLowerCase();

  if (!msg) return "Não foi possível concluir. Tente novamente.";
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("user already registered")) return "Este e-mail já está cadastrado. Faça login.";
  if (msg.includes("password") && msg.includes("6")) return "A senha precisa ter no mínimo 6 caracteres.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Muitas tentativas. Aguarde alguns instantes.";
  if (msg.includes("network") || msg.includes("failed to fetch")) return "Sem conexão. Verifique sua internet.";
  if (msg.includes("otp_expired") || msg.includes("expired")) return "Código expirado. Solicite um novo.";
  if (msg.includes("invalid otp") || msg.includes("token has expired") || msg.includes("invalid token")) return "Código inválido. Verifique e tente novamente.";
  if (msg.includes("otp") || msg.includes("token")) return "Código inválido ou expirado.";
  if (msg.includes("phone") && msg.includes("invalid")) return "Número de celular inválido.";
  if (msg.includes("sms") || msg.includes("whatsapp")) return "Não foi possível enviar o código. Tente novamente.";
  if (msg.includes("signups not allowed")) return "Cadastro por celular está desativado no momento.";
  if (msg.includes("provider") && msg.includes("not enabled")) return "Este método de login está indisponível.";
  if (msg.includes("session")) return "Sessão expirada. Entre novamente.";

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
