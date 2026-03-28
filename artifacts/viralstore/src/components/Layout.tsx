import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LayoutDashboard, ShoppingBag, Users, Wallet, Globe, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGetWallets } from "@workspace/api-client-react";
import { AiCoach } from "./AiCoach";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: wallets } = useGetWallets();

  const links = [
    { href: "/dashboard", label: "Aperçu", icon: LayoutDashboard },
    { href: "/dashboard/coach", label: "Coach IA", icon: Sparkles, highlight: true },
    { href: "/dashboard/products", label: "Catalogue Vidéos", icon: ShoppingBag },
    { href: "/dashboard/referrals", label: "Parrainage", icon: Users },
    { href: "/dashboard/withdraw", label: "Retraits", icon: Wallet },
    { href: "/dashboard/domains", label: "Mon Domaine", icon: Globe },
  ];

  const progressPercentage = wallets ? Math.min((wallets.totalViews / wallets.adsenseThreshold) * 100, 100) : 0;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 glass-panel border-r border-white/5 transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:static lg:block'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="font-display font-bold text-2xl tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">V</span>
            ViralStore
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 neon-shadow' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={`${import.meta.env.BASE_URL}images/avatar-placeholder.png`} alt="Avatar" className="w-10 h-10 rounded-full border border-primary/30" />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user?.username}</p>
                <Link href={`/shop/${user?.username}`} className="text-xs text-primary hover:underline truncate block">
                  Voir ma boutique
                </Link>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium text-destructive/80 hover:text-destructive py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 flex-shrink-0 glass-panel border-b border-white/5 flex items-center px-4 lg:px-8 justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground hover:text-primary transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-display font-semibold text-lg hidden sm:block">
              {links.find(l => l.href === location)?.label || "Dashboard"}
            </h1>
          </div>

          {/* AdSense Target Progress */}
          {wallets && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-medium text-muted-foreground mb-1">
                  Objectif Gains Pub ({wallets.totalViews} / {wallets.adsenseThreshold} vues)
                </span>
                <div className="w-48 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              {wallets.adsenseActive ? (
                <span className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Pub Activée
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-xs font-medium">
                  Pub Inactive
                </span>
              )}
            </div>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>

      <AiCoach />
    </div>
  );
}
