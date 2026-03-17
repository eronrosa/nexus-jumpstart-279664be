import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Camera, User, Mail, Phone, MapPin,
  Tag, LogOut, ChevronRight, Edit3, Check, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ display_name: displayName, phone })
      .eq("user_id", user.id);
    await refreshProfile();
    setSaving(false);
    setEditing(false);
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

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-4 border-primary/20">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            >
              {avatarLoading ? <span className="w-3 h-3 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
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
          className="bg-card rounded-2xl border border-border divide-y divide-border"
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
