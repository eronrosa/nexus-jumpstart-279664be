import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Leaf, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { friendlyAuthError } from "@/lib/authErrors";
import { AuthSpinner } from "@/components/AuthSpinner";


type Mode = "login" | "signup";

const LIME = "#C6FF00";
const LIME_SOFT = "rgba(198,255,0,0.12)";
const LIME_BORDER = "rgba(198,255,0,0.35)";
const BG = "#070707";
const CARD = "#111111";
const BORDER = "#2A2A2A";
const TEXT_MUTED = "#A0A0A0";

const GoogleG = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.2-2.13H12v4.03h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.96-4.33 2.96-7.45z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.6A10 10 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.41 13.89A6 6 0 0 1 6.09 12c0-.66.11-1.3.32-1.89V7.51H3.06A10 10 0 0 0 2 12c0 1.61.38 3.13 1.06 4.49l3.35-2.6z" />
    <path fill="#EA4335" d="M12 6.4c1.47 0 2.8.5 3.84 1.5l2.88-2.88C16.96 3.4 14.7 2.5 12 2.5A10 10 0 0 0 3.06 7.51l3.35 2.6C7.2 8.15 9.4 6.4 12 6.4z" />
  </svg>
);

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ display_name: "", email: "", password: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { display_name: form.display_name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message ?? "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/home" },
    });
  };

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-5 sm:px-4"
      style={{
        background: `radial-gradient(circle at 50% 0%, rgba(198,255,0,0.08) 0%, ${BG} 45%, ${BG} 100%)`,
        color: "#fff",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm mx-auto"
      >
        {/* Logo hex + brand */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 mx-auto"
            style={{
              background: LIME_SOFT,
              border: `2px solid ${LIME_BORDER}`,
              clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
              boxShadow: `0 0 40px rgba(198,255,0,0.25)`,
            }}
          >
            <Leaf className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: LIME }} fill="currentColor" strokeWidth={1.5} />
          </motion.div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{ color: "#fff", textShadow: `0 0 24px rgba(198,255,0,0.25)` }}
          >
            ZUUPPI
          </h1>
          <p className="text-[13px] sm:text-sm mt-1" style={{ color: TEXT_MUTED }}>
            Tudo que você precisa
          </p>
        </div>

        {/* Toggle */}
        <div
          className="flex rounded-2xl p-1 mb-5"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setSuccess("");
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={
                mode === m
                  ? { background: LIME, color: "#000", boxShadow: `0 0 20px rgba(198,255,0,0.35)` }
                  : { background: "transparent", color: TEXT_MUTED }
              }
            >
              {m === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {mode === "signup" && (
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                <input
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={form.display_name}
                  onChange={set("display_name")}
                  className="w-full rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = LIME)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
              <input
                type="email"
                placeholder="seu@email.com"
                required
                value={form.email}
                onChange={set("email")}
                className="w-full rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
                onFocus={(e) => (e.currentTarget.style.borderColor = LIME)}
                onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                required
                minLength={6}
                value={form.password}
                onChange={set("password")}
                className="w-full rounded-2xl pl-10 pr-11 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
                onFocus={(e) => (e.currentTarget.style.borderColor = LIME)}
                onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: TEXT_MUTED }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs rounded-xl px-3 py-2"
                style={{ background: "rgba(255,71,87,0.12)", color: "#FF7A85", border: "1px solid rgba(255,71,87,0.3)" }}
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs rounded-xl px-3 py-2"
                style={{ background: LIME_SOFT, color: LIME, border: `1px solid ${LIME_BORDER}` }}
              >
                {success}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-2xl transition-all disabled:opacity-60"
              style={{
                background: LIME,
                color: "#000",
                boxShadow: `0 0 28px rgba(198,255,0,0.35)`,
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Entrar" : "Criar conta"}
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: BORDER }} />
          <span className="text-[11px] uppercase tracking-wider" style={{ color: TEXT_MUTED }}>ou</span>
          <div className="flex-1 h-px" style={{ background: BORDER }} />
        </div>

        {/* Social / Phone */}
        <div className="space-y-2.5">
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white active:scale-[0.98] transition-all"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <GoogleG /> Continuar com Google
          </button>
          <button
            onClick={() => navigate("/auth/phone")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white active:scale-[0.98] transition-all"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <Phone size={16} style={{ color: LIME }} /> Continuar com celular
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: TEXT_MUTED }}>
          Ao continuar, você concorda com os{" "}
          <span className="cursor-pointer hover:underline" style={{ color: LIME }}>
            Termos de Uso
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
