import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { UserCircle, Mail, Phone, Save, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function PerfilTab() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setPhone(data.phone ?? "");
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim() || null,
      phone: phone.trim() || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar perfil"); return; }
    toast.success("Perfil atualizado!");
  };

  if (!loaded) return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="bg-card rounded-2xl h-24 animate-pulse border border-border" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-bold text-foreground text-xl">Perfil do Responsável</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus dados pessoais e informações de contato</p>
      </div>

      {/* Avatar + name */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
          <UserCircle size={40} className="text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground text-lg">{displayName || "Responsável"}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Shield size={12} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600">Proprietário verificado</span>
          </div>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h4 className="font-bold text-foreground">Dados de contato</h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserCircle size={14} className="text-muted-foreground" /> Nome completo
            </label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Seu nome"
              className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mail size={14} className="text-muted-foreground" /> E-mail
            </label>
            <input value={email} disabled
              className="mt-1.5 w-full h-11 rounded-xl border border-input bg-muted/30 px-4 text-sm text-muted-foreground cursor-not-allowed" />
            <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado por aqui</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Phone size={14} className="text-muted-foreground" /> Telefone
            </label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999"
              className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 flex items-center justify-center gap-2">
          <Save size={14} /> {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </motion.div>

      {/* Security section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6">
        <h4 className="font-bold text-foreground mb-3">Segurança</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Alterar senha</p>
              <p className="text-xs text-muted-foreground">Última alteração há mais de 30 dias</p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">Alterar</button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Autenticação em dois fatores</p>
              <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">Em breve</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
