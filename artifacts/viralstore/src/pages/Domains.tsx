import { useState } from "react";
import { Globe, Search, CheckCircle2, XCircle } from "lucide-react";
import { useCheckDomain, usePurchaseDomain, useListDomains } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/Layout";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Domains() {
  const queryClient = useQueryClient();
  const { data: domains, isLoading: isLoadingDomains } = useListDomains();
  const checkMutation = useCheckDomain();
  const purchaseMutation = usePurchaseDomain();

  const [searchQuery, setSearchQuery] = useState("");
  const [checkResult, setCheckResult] = useState<{available: boolean, domain: string, price: number} | null>(null);
  const [phone, setPhone] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    // Format simple
    let formatted = searchQuery.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!formatted.includes(".")) formatted += ".com";

    checkMutation.mutate({ data: { domain: formatted } }, {
      onSuccess: (res) => setCheckResult(res)
    });
  };

  const handlePurchase = () => {
    if (!checkResult || !phone) return;
    
    purchaseMutation.mutate({ 
      data: { domain: checkResult.domain, mobileMoneyNumber: phone } 
    }, {
      onSuccess: (res) => {
        toast.success(res.message);
        setCheckResult(null);
        setSearchQuery("");
        setPhone("");
        queryClient.invalidateQueries({ queryKey: ["/api/domains/list"] });
      },
      onError: (err: any) => {
        toast.error(err.message || "Erreur lors de l'achat");
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-display font-bold">Domaine Personnalisé</h2>
          <p className="text-muted-foreground text-sm">Donnez une image pro à votre boutique (ex: maboutique.com)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Search & Buy */}
          <div className="glass-panel rounded-3xl p-6 md:p-8">
            <h3 className="font-bold text-lg mb-4">Rechercher un domaine</h3>
            
            <form onSubmit={handleSearch} className="relative mb-6">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="nom-de-boutique.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-14 py-4 focus:border-primary outline-none transition-colors text-lg"
              />
              <button 
                type="submit"
                disabled={checkMutation.isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {checkResult && (
              <div className={`p-6 rounded-2xl border ${checkResult.available ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className="flex items-start gap-3">
                  {checkResult.available ? <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /> : <XCircle className="w-6 h-6 text-red-400 shrink-0" />}
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{checkResult.domain}</h4>
                    <p className={`text-sm ${checkResult.available ? 'text-green-400' : 'text-red-400'}`}>
                      {checkResult.available ? "Ce domaine est disponible !" : "Ce domaine est déjà pris."}
                    </p>
                    
                    {checkResult.available && (
                      <div className="mt-6 space-y-4">
                        <div className="flex justify-between items-center py-3 border-y border-white/10">
                          <span className="text-muted-foreground">Prix fixe (1 an)</span>
                          <span className="font-bold text-xl">{checkResult.price.toLocaleString()} FCFA</span>
                        </div>
                        
                        <div>
                          <label className="block text-sm mb-2 text-muted-foreground">Numéro Mobile Money pour le paiement</label>
                          <input 
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors"
                            placeholder="Ex: 2250102030405"
                          />
                        </div>

                        <button 
                          onClick={handlePurchase}
                          disabled={!phone || purchaseMutation.isPending}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold disabled:opacity-50"
                        >
                          {purchaseMutation.isPending ? "Paiement en cours..." : "Acheter maintenant"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Vos Domaines</h3>
            {isLoadingDomains ? (
              <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
            ) : domains?.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Vous n'avez pas encore de domaine personnalisé.</p>
              </div>
            ) : (
              domains?.map((domain) => (
                <div key={domain.id} className="glass-panel rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{domain.domain}</p>
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Lié à votre boutique
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-white/5 text-xs text-muted-foreground">Actif</span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
