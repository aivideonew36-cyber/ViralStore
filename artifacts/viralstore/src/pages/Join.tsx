import { useParams, Link } from "wouter";
import { useGetReferralPage, usePurchasePass } from "@workspace/api-client-react";
import { ShieldCheck, Gift, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useState } from "react";

export default function Join() {
  const { username } = useParams();
  const { data: pageData, isLoading, error } = useGetReferralPage(username || "");
  const purchaseMutation = usePurchasePass();
  const [success, setSuccess] = useState(false);

  // In a real app, this would redirect to login/register with a return URL
  // Here we simulate the purchase for a logged-in user (demo purposes)
  const currentUserId = localStorage.getItem("viralstore_token") ? 
    JSON.parse(atob(localStorage.getItem("viralstore_token")!.split('.')[1] || "{}")).userId || 1 
    : 1;

  const handlePurchase = () => {
    if (!pageData) return;
    
    purchaseMutation.mutate({
      data: { referrerUsername: username!, buyerUserId: currentUserId }
    }, {
      onSuccess: () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#A855F7', '#06B6D4', '#ffffff']
        });
        setSuccess(true);
        toast.success("Pass activé avec succès !");
      },
      onError: (err: any) => {
        toast.error(err.message || "Erreur lors de l'achat");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold mb-2">Lien invalide</h1>
        <p className="text-muted-foreground mb-6">Ce lien de parrainage n'existe pas ou n'est plus actif.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white rounded-xl font-bold">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[80px] opacity-50 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {!success ? (
          <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-secondary" />
            
            <div className="w-16 h-16 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/50">
              <span className="font-display font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary">V</span>
            </div>

            <h1 className="text-3xl font-display font-bold text-center mb-2">Rejoignez ViralStore</h1>
            <p className="text-center text-muted-foreground mb-8">
              Invité par <span className="font-bold text-white">@{pageData.referrerUsername}</span>
            </p>

            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/20 rounded-full blur-xl" />
              <Gift className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-1">Bonus de bienvenue</p>
              <p className="text-4xl font-display font-bold text-white mb-1">+{pageData.bonusAmount.toLocaleString()} FCFA</p>
              <p className="text-xs text-muted-foreground">Crédité immédiatement dans votre Wallet Ventes</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pass d'accès ViralStore</span>
                <span className="font-bold">{pageData.passPrice.toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl text-xs text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
                <p>Donne accès au dashboard, création de boutique TikTok, portefeuille et système de monétisation AdSense.</p>
              </div>
            </div>

            <button 
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50"
            >
              {purchaseMutation.isPending ? "Traitement..." : "Acheter le Pass & Récupérer le bonus"}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Paiement sécurisé par Mobile Money (MTN/Moov)
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-8 text-center border-primary/30 neon-shadow animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">Félicitations !</h2>
            <p className="text-muted-foreground mb-6">
              Votre compte est activé. Vous avez reçu <span className="font-bold text-primary">{pageData.bonusAmount.toLocaleString()} FCFA</span> dans votre Wallet.
            </p>
            <Link 
              href="/register" 
              className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              Créer mon compte maintenant <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
