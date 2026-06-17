import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Apple, Phone, Pizza, Coffee, IceCream, Cookie, Soup, Sandwich, Salad, Beef } from "lucide-react";
import { lovable } from "@/integrations/lovable";

const tiles = [
  { Icon: Soup, filled: true, dashed: false },
  { Icon: Beef, filled: true, dashed: false },
  { Icon: Pizza, filled: false, dashed: false },
  { Icon: Sandwich, filled: false, dashed: false },
  { Icon: Salad, filled: false, dashed: true },
  { Icon: Coffee, filled: false, dashed: true },
  { Icon: Cookie, filled: false, dashed: false },
];

const GoogleG = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.2-2.13H12v4.03h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.96-4.33 2.96-7.45z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.6A10 10 0 0 0 12 22z"/>
    <path fill="#FBBC05" d="M6.41 13.89A6 6 0 0 1 6.09 12c0-.66.11-1.3.32-1.89V7.51H3.06A10 10 0 0 0 2 12c0 1.61.38 3.13 1.06 4.49l3.35-2.6z"/>
    <path fill="#EA4335" d="M12 6.4c1.47 0 2.8.5 3.84 1.5l2.88-2.88C16.96 3.4 14.7 2.5 12 2.5A10 10 0 0 0 3.06 7.51l3.35 2.6C7.2 8.15 9.4 6.4 12 6.4z"/>
  </svg>
);

const Welcome = () => {
  const navigate = useNavigate();

  const enter = () => {
    localStorage.setItem("zuuppi_welcomed", "1");
    navigate("/home");
  };

  const handleGoogle = async () => {
    localStorage.setItem("zuuppi_welcomed", "1");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/home",
    });
    if (result.error || result.redirected) return;
    navigate("/home");
  };

  const handleEmail = () => {
    localStorage.setItem("zuuppi_welcomed", "1");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto">
      <div className="grid grid-cols-3 gap-3 mb-10">
        {tiles.map(({ Icon, filled, dashed }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 220 }}
            className={[
              "aspect-square rounded-3xl flex items-center justify-center",
              filled
                ? "bg-[hsl(160_70%_35%)] text-white shadow-lg"
                : dashed
                ? "border-2 border-dashed border-[hsl(160_60%_45%)] bg-white"
                : "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
              i === 2 ? "translate-y-2" : "",
            ].join(" ")}
          >
            <Icon
              className={`w-9 h-9 ${filled ? "text-white" : "text-[hsl(160_70%_30%)]"}`}
              strokeWidth={1.8}
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
          Falta um último passo<br />para começar
        </h1>
        <p className="text-sm text-zinc-500 mt-3">
          Cadastre-se em segundos e ganhe até 50% off
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="space-y-3 mt-auto"
      >
        <button
          onClick={enter}
          className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition"
        >
          <Apple className="w-5 h-5" fill="currentColor" />
          Continuar com Apple
        </button>
        <button
          onClick={handleGoogle}
          className="w-full h-14 rounded-2xl bg-white border border-zinc-200 text-zinc-900 font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition"
        >
          <GoogleG />
          Continuar com Google
        </button>
        <button
          onClick={handleEmail}
          className="w-full h-14 rounded-2xl bg-white border border-zinc-200 text-zinc-900 font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition"
        >
          <Phone className="w-5 h-5" />
          Continuar com email
        </button>

        <p className="text-center text-sm text-zinc-500 pt-2">
          Já tem uma conta?{" "}
          <button onClick={handleEmail} className="text-[hsl(160_70%_35%)] font-semibold">
            Entrar
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Welcome;
