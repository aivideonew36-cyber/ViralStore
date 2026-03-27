import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { MessageCircle, ExternalLink, Flag, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import { useGetShop, useTrackView, useReportProduct } from "@workspace/api-client-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PublicShop() {
  const { username } = useParams();
  const { data: shop, isLoading, error } = useGetShop(username || "");
  const trackViewMutation = useTrackView();
  const reportMutation = useReportProduct();

  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // View tracking
  useEffect(() => {
    if (shop && username) {
      let visitorId = localStorage.getItem("viral_visitor_id");
      if (!visitorId) {
        visitorId = `vis_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem("viral_visitor_id", visitorId);
      }
      // Track exactly once per session
      if (!sessionStorage.getItem(`tracked_${username}`)) {
        trackViewMutation.mutate({ data: { username, visitorId } });
        sessionStorage.setItem(`tracked_${username}`, "true");
      }
    }
  }, [shop, username]);

  // Intersection Observer for videos
  useEffect(() => {
    if (!shop?.products || shop.products.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target.querySelector("video");
          if (entry.isIntersecting) {
            setActiveVideoId(Number((entry.target as HTMLElement).dataset.id));
            if (videoElement) {
              videoElement.play().catch(() => console.log("Auto-play prevented"));
            }
          } else {
            if (videoElement) {
              videoElement.pause();
              videoElement.currentTime = 0;
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const elements = document.querySelectorAll(".tiktok-snap-child");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [shop?.products]);

  const handleReport = (productId: number) => {
    if (confirm("Signaler ce contenu comme inapproprié ?")) {
      reportMutation.mutate({ data: { productId, reason: "Contenu inapproprié" } }, {
        onSuccess: () => toast.success("Merci pour votre signalement.")
      });
    }
  };

  const handleAction = (product: any) => {
    if (product.actionType === "whatsapp") {
      const msg = encodeURIComponent(`Bonjour, je suis intéressé par le produit "${product.name}" à ${product.price} FCFA sur votre boutique ViralStore.`);
      window.open(`https://wa.me/${shop?.user.whatsappNumber}?text=${msg}`, "_blank");
    } else if (product.actionType === "payment_link" && product.actionValue) {
      window.open(product.actionValue, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Boutique introuvable</h1>
        <p className="text-white/60 mb-6">L'utilisateur {username} n'existe pas ou la boutique a été suspendue.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white rounded-xl font-bold">Retour à l'accueil</Link>
      </div>
    );
  }

  // Interleave AdSense blocks if active
  const renderItems = () => {
    const items = [];
    shop.products.forEach((product, index) => {
      items.push({ type: 'product', data: product });
      
      // AdSense block every 4 videos
      if (shop.adsenseActive && (index + 1) % 4 === 0) {
        items.push({ type: 'ad', id: `ad_${index}` });
      }
    });
    return items;
  };

  return (
    <div className="bg-black w-full h-[100dvh] overflow-hidden relative text-white">
      {/* Mute Toggle */}
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-4 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Header Overlay */}
      <div className="absolute top-6 left-4 z-50 flex items-center gap-3 drop-shadow-md">
        <img src={`${import.meta.env.BASE_URL}images/avatar-placeholder.png`} className="w-10 h-10 rounded-full border border-white/20 shadow-lg" alt="" />
        <div>
          <h2 className="font-bold text-lg drop-shadow-md">@{shop.user.username}</h2>
        </div>
      </div>

      <div ref={containerRef} className="tiktok-scroll-container">
        {shop.products.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold text-white/50">Cette boutique est vide</h2>
          </div>
        ) : (
          renderItems().map((item: any, idx) => {
            if (item.type === 'ad') {
              return (
                <div key={item.id} className="tiktok-snap-child w-full h-[100dvh] bg-zinc-900 flex flex-col items-center justify-center p-8 text-center relative border-y border-white/5">
                  <span className="absolute top-4 right-4 text-[10px] text-white/30 tracking-widest uppercase">PUBLICITÉ</span>
                  <div className="w-full max-w-sm aspect-video bg-white/5 border border-white/10 flex items-center justify-center rounded-2xl overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10" />
                     <p className="text-white/40 font-display font-medium relative z-10">Espace Publicitaire (AdSense)</p>
                  </div>
                </div>
              );
            }

            const product = item.data;
            const isActive = activeVideoId === product.id;

            return (
              <div key={product.id} data-id={product.id} className="tiktok-snap-child relative w-full h-[100dvh] bg-black">
                <video
                  src={product.cloudinaryUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted={isMuted}
                  playsInline
                  webkit-playsinline="true"
                />
                
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Right side actions */}
                <div className="absolute bottom-24 right-4 flex flex-col items-center gap-6 z-20">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAction(product)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                      product.actionType === 'whatsapp' ? 'bg-green-500 text-white' : 'bg-primary text-white'
                    }`}>
                      {product.actionType === 'whatsapp' ? <MessageCircle className="w-6 h-6" /> : <ExternalLink className="w-6 h-6" />}
                    </div>
                    <span className="text-xs font-medium drop-shadow-md">Acheter</span>
                  </motion.button>
                  
                  <button 
                    onClick={() => handleReport(product.id)}
                    className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
                      <Flag className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] drop-shadow-md">Signaler</span>
                  </button>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-6 left-4 right-20 z-20">
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 inline-block w-full max-w-sm">
                    <h3 className="font-bold text-xl mb-1 line-clamp-2 leading-tight">{product.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-2xl text-secondary">{product.price.toLocaleString()} FCFA</span>
                    </div>
                    
                    <button 
                      onClick={() => handleAction(product)}
                      className="mt-4 w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      {product.actionType === 'whatsapp' ? "Commander via WhatsApp" : "Payer maintenant"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
