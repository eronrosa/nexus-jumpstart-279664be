import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Leaf } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { AuthSpinner } from "@/components/AuthSpinner";

const CODE_LEN = 6;
const RESEND_SECONDS = 60;

const codeSchema = z
  .string()
  .regex(new RegExp(`^\\d{${CODE_LEN}}$`), `O código precisa ter ${CODE_LEN} dígitos.`);

const maskPhone = (p: string) => {
  if (!p || p === "seu WhatsApp") return "seu WhatsApp";
  const visible = p.slice(-4);
  return `${p.slice(0, Math.max(3, p.length - 6))}••${visible}`;
};

const VerifyCodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as { phone?: string } | null)?.phone ?? "";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const submittedForRef = useRef<string>("");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // Se o usuário abriu direto sem passar pela tela de telefone, volta.
  useEffect(() => {
    if (!phone) navigate("/auth/phone", { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const clearInputs = useCallback(() => {
    setDigits(Array(CODE_LEN).fill(""));
    setTimeout(() => inputs.current[0]?.focus(), 0);
  }, []);

  const setAt = (i: number, v: string) => {
    const char = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (error) setError("");
    if (char && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(CODE_LEN).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    if (error) setError("");
    inputs.current[Math.min(text.length, CODE_LEN - 1)]?.focus();
  };

  const code = digits.join("");
  const canSubmit = code.length === CODE_LEN;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading || !phone) return;
    setError("");

    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        phone,
        token: parsed.data,
        type: "sms",
      });
      if (verifyErr) throw verifyErr;
      if (!data.session) throw new Error("Sessão não estabelecida. Tente novamente.");

      localStorage.setItem("zuuppi_welcomed", "1");
      toast.success("Número verificado!");
      navigate("/home", { replace: true });
    } catch (err: unknown) {
      const message = friendlyAuthError(err);
      setError(message);
      toast.error(message);
      setAttempts(a => a + 1);
      clearInputs();
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, phone, code, navigate, clearInputs]);

  // Auto-submit apenas uma vez por código completo (evita loop após erro)
  useEffect(() => {
    if (canSubmit && !loading && submittedForRef.current !== code) {
      submittedForRef.current = code;
      handleSubmit();
    }
    if (!canSubmit && submittedForRef.current) {
      submittedForRef.current = "";
    }
  }, [canSubmit, loading, code, handleSubmit]);

  const handleResend = async () => {
    if (seconds > 0 || resending || !phone) return;
    setError("");
    setResending(true);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: "whatsapp" },
      });
      if (otpErr) throw otpErr;
      setSeconds(RESEND_SECONDS);
      setAttempts(0);
      clearInputs();
      toast.success("Novo código enviado para seu WhatsApp.");
    } catch (err: unknown) {
      const message = friendlyAuthError(err);
      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white text-zinc-900 flex flex-col px-6 pt-6 pb-8 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-zinc-100 flex items-center justify-center active:scale-95 transition"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button className="h-11 px-4 rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
          PT
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="flex justify-center mt-10"
      >
        <div
          className="w-28 h-28 border-2 border-[hsl(160_60%_45%)]/40 flex items-center justify-center"
          style={{ clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)" }}
        >
          <Leaf className="w-14 h-14 text-[hsl(160_70%_35%)]" fill="currentColor" />
        </div>
      </motion.div>

      <h1 className="text-2xl font-extrabold text-center mt-8 leading-tight">
        Verifique seu<br />número de celular
      </h1>
      <p className="text-sm text-zinc-500 text-center mt-3">
        Enviamos um código de {CODE_LEN} dígitos<br />para {maskPhone(phone)}
      </p>

      <div className="flex justify-center gap-2 sm:gap-3 mt-8" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            value={d}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Dígito ${i + 1} de ${CODE_LEN}`}
            aria-invalid={!!error}
            disabled={loading}
            className={`w-10 h-14 sm:w-12 rounded-xl text-center text-xl font-bold outline-none transition border-2 disabled:opacity-60 ${
              error
                ? "border-red-300 bg-red-50 text-red-600"
                : d
                ? "border-[hsl(160_70%_35%)] text-[hsl(160_70%_30%)] bg-[hsl(160_70%_95%)]"
                : "border-zinc-200 bg-white text-zinc-900 focus:border-[hsl(160_70%_35%)]"
            }`}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-4 text-xs rounded-xl px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-center"
        >
          {error}
          {attempts >= 3 && (
            <span className="block mt-1 text-[11px] text-red-500">
              Solicite um novo código para continuar.
            </span>
          )}
        </motion.p>
      )}

      <p className="text-center text-sm text-zinc-500 mt-5">
        {seconds > 0 ? (
          <>Reenviar código em <span className="text-zinc-900 font-medium tabular-nums">{mm}:{ss}</span></>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-[hsl(160_70%_35%)] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            {resending && <AuthSpinner size={14} tone="dark" />}
            {resending ? "Reenviando..." : "Reenviar código"}
          </button>
        )}
      </p>

      <div className="mt-auto pt-8">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <AuthSpinner size={18} tone="light" />
              <span>Verificando...</span>
            </>
          ) : (
            "Verificar"
          )}
        </button>
      </div>
    </div>
  );
};

export default VerifyCodePage;
