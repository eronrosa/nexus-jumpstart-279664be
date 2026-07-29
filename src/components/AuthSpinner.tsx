interface AuthSpinnerProps {
  size?: number;
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Padroniza o spinner usado em botões dos fluxos de auth (AuthPage, PhoneAuthPage, VerifyCodePage).
 * `tone="dark"` para botões claros (lime/branco), `tone="light"` para botões escuros.
 */
export const AuthSpinner = ({ size = 18, tone = "dark", className = "" }: AuthSpinnerProps) => {
  const border =
    tone === "dark"
      ? "border-black/25 border-t-black"
      : "border-white/30 border-t-white";
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block rounded-full border-2 animate-spin ${border} ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default AuthSpinner;
