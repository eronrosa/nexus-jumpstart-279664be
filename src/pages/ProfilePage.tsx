import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, User, Mail, Phone, MapPin,
  Tag, LogOut, ChevronRight, Edit3, Check, X,
  AlertCircle, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";


const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setPhone(profile.phone ?? "");
      
      // Auto-open editing if data is missing
      if (!profile.display_name || !profile.phone) {
        setEditing(true);
      }
    }
  }, [profile]);

  const isProfileComplete = profile?.display_name && profile?.phone;


  const handleSave = async () => {
    if (!user) return;
    
    if (!displayName.trim() || !phone.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, phone })
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      toast.success("Perfil atualizado com sucesso!");
      setEditing(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };


  const handleCancel = () => {
    setDisplayName(profile?.display_name ?? "");
    setPhone(profile?.phone ?? "");
    setEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl + `?t=${Date.now()}` }).eq("user_id", user.id);
      await refreshProfile();
    }
    setAvatarLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = (profile?.display_name ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>
        <span className="font-bold text-sm">Meu Perfil</span>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="p-1 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            <button onClick={handleSave} disabled={saving} className="p-1 text-primary"><Check size={18} /></button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="p-1 text-primary"><Edit3 size={18} /></button>
        )}
      </div>

      <div className="max-w-lg lg:max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Completion Warning */}
        <AnimatePresence>
          {!isProfileComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="text-primary shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-bold text-primary">Perfil Incompleto</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete seus dados para ter acesso total a todas as funcionalidades do app.
                </p>
              </div>
            </motion.div>
          )}
          {isProfileComplete && !editing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <ShieldCheck className="text-green-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-bold text-green-600">Perfil Completo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seus dados estão atualizados e seguros.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-primary/20 group-hover:border-primary/50 transition-all" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border-4 border-primary/20 group-hover:border-primary/50 transition-all">
                {initials}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg ring-4 ring-background hover:scale-110 transition-transform"
              aria-label="Editar foto de perfil"
            >
              {avatarLoading ? <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <Camera size={15} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
          >
            {avatarLoading ? "Enviando..." : profile?.avatar_url ? "Trocar foto" : "Adicionar foto"}
          </button>
          <div className="text-center">
            <p className="font-bold text-foreground text-lg">{profile?.display_name ?? "Usuário"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </motion.div>


        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden"

        >
          {/* Nome */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <User size={16} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Nome</p>
              {editing ? (
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full text-sm bg-secondary rounded-lg px-2 py-1 mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">{profile?.display_name ?? "—"}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Mail size={16} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {/* Telefone */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Phone size={16} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Telefone</p>
              {editing ? (
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full text-sm bg-secondary rounded-lg px-2 py-1 mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">{profile?.phone ?? "—"}</p>
              )}
            </div>
          </div>
          
          {editing && (
            <div className="p-4 bg-secondary/30">
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="w-full rounded-xl font-bold"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
                * Nome e telefone são obrigatórios
              </p>
            </div>
          )}
        </motion.div>


        {/* Menu items */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border divide-y divide-border"
        >
          {[
            { icon: MapPin, label: "Meus endereços" },
            { icon: Tag, label: "Cupons resgatados" },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
              <Icon size={16} className="text-primary shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground text-left">{label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Sign out */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
        >
          <LogOut size={16} />
          Sair da conta
        </motion.button>
      </div>
    </div>
  );
};

export default ProfilePage;
