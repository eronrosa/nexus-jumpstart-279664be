import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Apple, ChevronDown, Leaf } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { AuthSpinner } from "@/components/AuthSpinner";


const countries = [
  { code: "BR", dial: "+55", flag: "🇧🇷", label: "Brasil" },
  { code: "US", dial: "+1", flag: "🇺🇸", label: "United States" },
  { code: "PT", dial: "+351", flag: "🇵🇹", label: "Portugal" },
  { code: "ES", dial: "+34", flag: "🇪🇸", label: "España" },
  { code: "AR", dial: "+54", flag: "🇦🇷", label: "Argentina" },
];

const GoogleG = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.2-2.13H12v4.03h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.96-4.33 2.96-7.45z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.6A10 10 0 0 0 12 22z"/>
    <path fill="#FBBC05" d="M6.41 13.89A6 6 0 0 1 6.09 12c0-.66.11-1.3.32-1.89V7.51H3.06A10 10 0 0 0 2 12c0 1.61.38 3.13 1.06 4.49l3.35-2.6z"/>
    <path fill="#EA4335" d="M12 6.4c1.47 0 2.8.5 3.84 1.5l2.88-2.88C16.96 3.4 14.7 2.5 12 2.5A10 10 0 0 0 3.06 7.51l3.35 2.6C7.2 8.15 9.4 6.4 12 6.4z"/>
  </svg>
);

const PhoneAuthPage = () => {
  const navigate = useNavigate();
  const [country, setCountry] = useState(countries[0]);
  const [openCountry, setOpenCountry] = useState(false);
  const [phone, setPhone] = useState("");
  const [tourist, setTourist] = useState(false);

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleContinue = () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    localStorage.setItem("zuuppi_welcomed", "1");
    navigate("/auth/verify", { state: { phone: `${country.dial} ${phone}` } });
  };

  const handleGoogle = async () => {
    localStorage.setItem("zuuppi_welcomed", "1");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/home" },
    });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col px-6 pt-6 pb-8 max-w-md mx-auto">
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
        <div className="w-28 h-28 rounded-[2rem] border-2 border-[hsl(160_60%_45%)]/40 flex items-center justify-center"
             style={{ clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)" }}>
          <Leaf className="w-14 h-14 text-[hsl(160_70%_35%)]" fill="currentColor" />
        </div>
      </motion.div>

      <h1 className="text-2xl font-extrabold text-center mt-8 leading-tight">
        Informe seu<br />número de celular
      </h1>
      <p className="text-sm text-zinc-500 text-center mt-3">
        Digite o número para continuar
      </p>

      <div className="mt-6 relative">
        <div className="flex items-center gap-2 h-14 rounded-2xl border border-zinc-200 px-3">
          <button
            onClick={() => setOpenCountry(o => !o)}
            className="flex items-center gap-1.5 pr-3 border-r border-zinc-200 h-full"
          >
            <span className="text-xl leading-none">{country.flag}</span>
            <span className="text-sm font-semibold">{country.code}</span>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </button>
          <span className="text-sm text-zinc-500">{country.dial}</span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(11) 91234-5678"
            className="flex-1 h-full bg-transparent outline-none text-sm placeholder:text-zinc-400"
          />
        </div>

        {openCountry && (
          <div className="absolute top-16 left-0 right-0 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-10">
            {countries.map(c => (
              <button
                key={c.code}
                onClick={() => { setCountry(c); setOpenCountry(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 text-left"
              >
                <span className="text-xl">{c.flag}</span>
                <span className="text-sm font-medium flex-1">{c.label}</span>
                <span className="text-xs text-zinc-400">{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <div>
          <p className="text-sm font-semibold">Sou turista</p>
          <p className="text-xs text-zinc-500">Personalize sua experiência ZUUPPI</p>
        </div>
        <button
          onClick={() => setTourist(t => !t)}
          className={`relative w-12 h-7 rounded-full transition ${tourist ? "bg-[hsl(160_70%_35%)]" : "bg-zinc-200"}`}
          aria-pressed={tourist}
        >
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition ${tourist ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      <div className="space-y-3 mt-auto pt-8">
        <button
          onClick={handleContinue}
          className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition disabled:opacity-50"
          disabled={phone.replace(/\D/g, "").length < 10}
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
      </div>
    </div>
  );
};

export default PhoneAuthPage;
