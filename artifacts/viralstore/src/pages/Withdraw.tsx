import { useState } from "react";
import { Wallet, Smartphone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useGetWallets, useRequestWithdrawal } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  walletType: z.enum(["sales", "adsense"]),
  amount: z.coerce.number().min(1000, "Montant minimum: 1000 FCFA"),
  mobileMoneyNumber: z.string().min(8, "Numéro invalide"),
});

export default function Withdraw() {
  const queryClient = useQueryClient();
  const { data: wallets } = useGetWallets();
  const withdrawMutation = useRequestWithdrawal();
  
  const [successData, setSuccessData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { walletType: "sales" }
  });

  const watchAmount = form.watch("amount") || 0;
  const watchWallet = form.watch("walletType");
  const maxBalance = wallets ? (watchWallet === "sales" ? wallets.salesBalance : wallets.adsenseBalance) : 0;
  
  const adminFee = Math.round(watchAmount * 0.15);
  const netAmount = watchAmount - adminFee;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.amount > maxBalance) {
      toast.error("Solde insuffisant");
      return;
    }

    withdrawMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        toast.success("Retrait initié avec succès !");
        setSuccessData(res);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      },
      onError: (err: any) => {
        toast.error(err.message || "Erreur lors du retrait");
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Retirer mes gains</h2>
          <p className="text-muted-foreground text-sm">Transférez vos gains vers MTN ou Moov Money (Frais système: 15%)</p>
        </div>

        {successData ? (
          <div className="glass-panel rounded-3xl p-8 text-center border-green-500/30 neon-shadow animate-in fade-in zoom-in">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Demande envoyée !</h3>
            <p className="text-muted-foreground mb-6">
              Votre transfert vers le {successData.mobileMoneyNumber} est en cours de traitement.
            </p>
            <div className="max-w-sm mx-auto bg-black/40 rounded-2xl p-4 text-left space-y-3 mb-8 border border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant brut</span>
                <span>{successData.grossAmount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais (15%)</span>
                <span className="text-destructive">-{successData.adminFee.toLocaleString()} FCFA</span>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div className="flex justify-between font-bold">
                <span>Net à recevoir</span>
                <span className="text-green-400">{successData.netAmount.toLocaleString()} FCFA</span>
              </div>
            </div>
            <button 
              onClick={() => setSuccessData(null)}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              Faire un autre retrait
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            
            {/* Form */}
            <div className="md:col-span-3 glass-panel rounded-3xl p-6 md:p-8">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Source Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">1. Choisir la source</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      watchWallet === "sales" 
                        ? "bg-primary/20 border-primary neon-shadow" 
                        : "bg-black/40 border-white/10 hover:border-white/30"
                    }`}>
                      <input type="radio" value="sales" {...form.register("walletType")} className="sr-only" />
                      <Wallet className={`w-6 h-6 mb-2 ${watchWallet === "sales" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-medium text-sm">Ventes & Pass</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solde: {wallets?.salesBalance.toLocaleString() || 0} FCFA
                      </p>
                    </label>

                    <label className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      watchWallet === "adsense" 
                        ? "bg-secondary/20 border-secondary shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" 
                        : "bg-black/40 border-white/10 hover:border-white/30"
                    }`}>
                      <input type="radio" value="adsense" {...form.register("walletType")} className="sr-only" />
                      <TrendingUp className={`w-6 h-6 mb-2 ${watchWallet === "adsense" ? "text-secondary" : "text-muted-foreground"}`} />
                      <p className="font-medium text-sm">AdSense</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solde: {wallets?.adsenseBalance.toLocaleString() || 0} FCFA
                      </p>
                    </label>
                  </div>
                </div>

                {/* Amount & Destination */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Montant à retirer (FCFA)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        {...form.register("amount")}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-lg font-bold focus:border-primary outline-none transition-colors"
                        placeholder="Ex: 5000"
                      />
                      <button 
                        type="button"
                        onClick={() => form.setValue("amount", maxBalance)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium hover:bg-white/20 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    {form.formState.errors.amount && (
                      <p className="text-destructive text-xs mt-1">{form.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Numéro Mobile Money</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <input 
                        type="tel"
                        {...form.register("mobileMoneyNumber")}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:border-primary outline-none transition-colors"
                        placeholder="Ex: 2250102030405"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={withdrawMutation.isPending || watchAmount <= 0}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all"
                >
                  {withdrawMutation.isPending ? "Traitement..." : "Valider le retrait"} <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Summary Panel */}
            <div className="md:col-span-2">
              <div className="glass-panel rounded-3xl p-6 sticky top-24">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" /> Résumé
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Montant brut</span>
                    <span className="font-medium">{watchAmount.toLocaleString()} FCFA</span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Frais système (15%)</span>
                    <span className="font-medium text-destructive">-{adminFee.toLocaleString()} FCFA</span>
                  </div>

                  <div className="h-px bg-white/10 w-full my-2" />

                  <div className="flex justify-between items-end">
                    <span className="font-bold text-white">Net à recevoir</span>
                    <span className="text-2xl font-display font-bold text-green-400">{netAmount.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-xs text-primary/80 leading-relaxed">
                    Les retraits sont traités automatiquement vers les numéros MTN et Moov. Le délai habituel est de 5 à 15 minutes.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
