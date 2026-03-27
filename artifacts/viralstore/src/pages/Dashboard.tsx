import { Wallet, TrendingUp, Users, ArrowRight, Play } from "lucide-react";
import { Link } from "wouter";
import { useGetWallets, useGetMe, useActivateAdsense } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/Layout";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: wallets, isLoading } = useGetWallets();
  const { data: user } = useGetMe();
  
  const activateMutation = useActivateAdsense({
    mutation: {
      onSuccess: (res) => {
        toast.success(res.message);
        queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
    }
  });

  const handleActivateAdsense = () => {
    activateMutation.mutate();
  };

  if (isLoading || !wallets) {
    return (
      <DashboardLayout>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const isEligible = wallets.totalViews >= wallets.adsenseThreshold;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Welcome Banner */}
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-primary/20 p-8 neon-shadow">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
          <div className="relative z-10">
            <h2 className="text-3xl font-display font-bold mb-2">
              Bienvenue, <span className="text-gradient">{user?.username}</span> 👋
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Gérez votre catalogue TikTok, suivez vos gains en temps réel et partagez votre lien pour maximiser vos revenus.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link 
                href={`/shop/${user?.username}`} 
                className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Voir ma boutique
              </Link>
              <Link 
                href="/dashboard/products" 
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-semibold hover:bg-white/10 transition-colors"
              >
                Ajouter une vidéo
              </Link>
            </div>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Wallet */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wallet Ventes & Pass</p>
                <h3 className="text-3xl font-display font-bold">{wallets.salesBalance.toLocaleString()} FCFA</h3>
              </div>
            </div>
            <Link href="/dashboard/withdraw" className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline relative z-10">
              Retirer mes fonds <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* AdSense Wallet */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary border border-secondary/30">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wallet AdSense (Google)</p>
                <h3 className="text-3xl font-display font-bold">{wallets.adsenseBalance.toLocaleString()} FCFA</h3>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
              {!wallets.adsenseActive ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Vues requises: {wallets.totalViews} / {wallets.adsenseThreshold}</p>
                  </div>
                  <button 
                    onClick={handleActivateAdsense}
                    disabled={!isEligible || activateMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-blue-500 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-secondary/20 transition-all"
                  >
                    {activateMutation.isPending ? "Activation..." : "✅ Activer la pub"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    Monétisation active (60%)
                  </span>
                  <Link href="/dashboard/withdraw" className="text-primary hover:underline">Retirer</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Vues Totales", value: wallets.totalViews, icon: Play, color: "text-blue-400" },
            { label: "Filleuls Actifs", value: "...", icon: Users, color: "text-green-400", link: "/dashboard/referrals" },
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.link && (
                <Link href={stat.link} className="text-xs text-primary mt-2 inline-block hover:underline">Voir les détails</Link>
              )}
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
