import { Home, List, Sparkles, Wallet, User, LogIn, Store, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: "Início", path: "/", active: true },
    { icon: List, label: "Pedidos", path: "/pedidos" },
    { icon: Sparkles, label: "ZUZU", path: "/" },
    { icon: Wallet, label: "Zuupay", path: "/" },
    { icon: Store, label: "Painel", path: "/painel" },
    { icon: ShieldCheck, label: "Admin", path: "/admin" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-card border-r border-border py-6 px-3 shrink-0">
      <div className="px-3 mb-8">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">ZUUPPI</h1>
        <p className="text-xs text-muted-foreground">Tudo que você precisa</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label, path, active }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* Profile or Login */}
      <div className="mt-auto px-1">
        {user ? (
          <button
            onClick={() => navigate("/perfil")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {(profile?.display_name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name ?? "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold text-sm"
          >
            <LogIn size={18} />
            Entrar / Cadastrar
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
