import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Leaf, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { AuthSpinner } from "@/components/AuthSpinner";

const LIME = "#C6FF00";
const LIME_SOFT = "rgba(198,255,0,0.12)";
const LIME_BORDER = "rgba(198,255,0,0.35)";
const BG = "#070707";
const CARD = "#111111";
const BORDER = "#2A2A2A";
const TEXT_MUTED = "#A0A0A0";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase mints a recovery session automatically from the URL hash.
  // Wait until the auth state confirms it, then allow the form.
  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setReady(true);
    });
    // Fallback: allow the form after 1.2s so users are never stuck
    const t = setTimeout(() => mounted && setReady(true), 1200);
    return () => { mounted = false; sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (password.length < 8) { setError("A senha deve ter ao menos 8 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      toast.success("Senha atualizada. Você já está logado.");
      setTimeout(() => navigate("/home", { replace: true }), 1200);
    } catch (err: unknown) {
      const message = friendlyAuthError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col px-5 sm:px-4"
      style={{
        background: `radial-gradient(circle at 50% 0%, rgba(198,255,0,0.08) 0%, ${BG} 45%, ${BG} 100%)`,
        color: "#fff",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-sm w-full mx-auto flex flex-col flex-1">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 mt-4 mx-auto"
          style={{
            background: LIME_SOFT,
            border: `2px solid ${LIME_BORDER}`,
            clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
            boxShadow: `0 0 40px rgba(198,255,0,0.25)`,
          }}
        >
          <Leaf className="w-8 h-8" style={{ color: LIME }} fill="currentColor" strokeWidth={1.5} />
        </motion.div>

        <h1 className="text-2xl font-extrabold text-center mt-5">Criar nova senha</h1>
        <p className="text-sm text-center mt-2" style={{ color: TEXT_MUTED }}>
          Sua nova senha precisa ter ao menos 8 caracteres.
        </p>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: LIME_SOFT, border: `1px solid ${LIME_BORDER}` }}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: LIME }} />
            <span className="text-sm" style={{ color: LIME }}>Senha atualizada. Redirecionando...</span>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="mt-8 space-y-3"
          >
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
              <input
                type={show ? "text" : "password"}
                required
                autoFocus
                disabled={!ready}
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl pl-10 pr-11 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all disabled:opacity-60"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
                onFocus={(e) => (e.currentTarget.style.borderColor = LIME)}
                onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: TEXT_MUTED }}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
              <input
                type={show ? "text" : "password"}
                required
                disabled={!ready}
                placeholder="Confirmar nova senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all disabled:opacity-60"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
                onFocus={(e) => (e.currentTarget.style.borderColor = LIME)}
                onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="alert"
                className="text-xs rounded-xl px-3 py-2"
                style={{ background: "rgba(255,71,87,0.12)", color: "#FF7A85", border: "1px solid rgba(255,71,87,0.3)" }}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !ready || !password || !confirm}
              className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-2xl transition-all disabled:opacity-60"
              style={{ background: LIME, color: "#000", boxShadow: `0 0 28px rgba(198,255,0,0.35)` }}
            >
              {loading ? (
                <>
                  <AuthSpinner size={16} tone="dark" />
                  <span>Atualizando...</span>
                </>
              ) : (
                <>
                  Salvar nova senha
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
