import { useState } from "react";
import { Users, Copy, Check, Gift } from "lucide-react";
import { useGetReferralSettings, useUpdateReferralSettings, useListReferrals, useGetMe } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/Layout";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Referrals() {
  const queryClient = useQueryClient();
  const { data: settings } = useGetReferralSettings();
  const { data: referrals } = useListReferrals();
  const { data: user } = useGetMe();
  const updateMutation = useUpdateReferralSettings();
  
  const [copied, setCopied] = useState(false);
  const [bonusValue, setBonusValue] = useState<number>(0);

  // Initialize local state when settings load
  if (settings && bonusValue === 0 && !updateMutation.isPending && !updateMutation.isSuccess) {
    setBonusValue(settings.bonusAmount);
  }

  const maxBonus = settings ? settings.passPrice - Math.round(settings.passPrice * (settings.adminCommission / 100)) : 0;
  const myCut = settings ? settings.passPrice - Math.round(settings.passPrice * (settings.adminCommission / 100)) - bonusValue : 0;

  const handleCopy = () => {
    if (!user) return;
    const link = `${window.location.origin}/join/${user.username}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBonus = () => {
    updateMutation.mutate({ data: { bonusAmount: bonusValue } }, {
      onSuccess: () => {
        toast.success("Réglages mis à jour");
        queryClient.invalidateQueries({ queryKey: ["/api/referrals/settings"] });
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Programme de Parrainage</h2>
          <p className="text-muted-foreground text-sm">Créez une offre irrésistible pour recruter des vendeurs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Settings Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Régler l'attractivité de votre lien</h3>
              </div>

              {settings && (
                <div className="space-y-8 relative z-10">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">Bonus offert au filleul (FCFA)</label>
                      <span className="text-primary font-bold">{bonusValue.toLocaleString()} FCFA</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={maxBonus} 
                      step="500"
                      value={bonusValue}
                      onChange={(e) => setBonusValue(Number(e.target.value))}
                      className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>0</span>
                      <span>Max: {maxBonus.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Le filleul reçoit :</p>
                      <p className="text-2xl font-bold text-white">{bonusValue.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span></p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Votre commission net :</p>
                      <p className="text-2xl font-bold text-secondary">{myCut.toLocaleString()} <span className="text-sm font-normal text-secondary/60">FCFA</span></p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={handleSaveBonus}
                      disabled={updateMutation.isPending || bonusValue === settings.bonusAmount}
                      className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex-1"
                    >
                      {updateMutation.isPending ? "Enregistrement..." : "Appliquer le réglage"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Link Share */}
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="font-medium mb-3">Votre lien de recrutement</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-primary overflow-x-auto whitespace-nowrap">
                  {user ? `${window.location.origin}/join/${user.username}` : "..."}
                </code>
                <button 
                  onClick={handleCopy}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/5"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Partagez ce lien. Les utilisateurs verront automatiquement : "Inscris-toi via {user?.username} et reçois {bonusValue} FCFA de bonus sur ton Pass !"
              </p>
            </div>
          </div>

          {/* Stats Column */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Mes Filleuls</h3>
              </div>
              
              <div className="text-center p-6 border border-dashed border-white/10 rounded-2xl mb-6">
                <span className="block text-4xl font-display font-bold text-white mb-1">
                  {referrals?.length || 0}
                </span>
                <span className="text-sm text-muted-foreground">Vendeurs recrutés</span>
              </div>

              <div className="space-y-3">
                {referrals && referrals.length > 0 ? (
                  referrals.map(ref => (
                    <div key={ref.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div>
                        <p className="text-sm font-medium">User #{ref.refereeId}</p>
                        <p className="text-xs text-muted-foreground">{new Date(ref.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                        +{settings ? settings.passPrice - Math.round(settings.passPrice * (settings.adminCommission / 100)) - ref.bonusAmount : 0}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">
                    Aucun filleul pour le moment.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
