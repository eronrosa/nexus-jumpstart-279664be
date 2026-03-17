import { Home, List, Sparkles, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Início", active: true },
  { icon: List, label: "Pedidos" },
  { icon: Sparkles, label: "ZUZU" },
  { icon: Wallet, label: "Zuupay" },
  { icon: User, label: "Perfil" },
];

const Sidebar = () => {
  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-card border-r border-border py-6 px-3 shrink-0">
      <div className="px-3 mb-8">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">ZUUPPI</h1>
        <p className="text-xs text-muted-foreground">Tudo que você precisa</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
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
    </aside>
  );
};

export default Sidebar;
