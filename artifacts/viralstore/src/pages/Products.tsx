import { useState } from "react";
import { Plus, Trash2, ExternalLink, MessageCircle, CreditCard, AlertCircle } from "lucide-react";
import { useListProducts, useCreateProduct, useDeleteProduct, useGetMe } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/Layout";
import { CloudinaryUpload } from "@/components/CloudinaryUpload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  price: z.coerce.number().min(1, "Prix invalide"),
  actionType: z.enum(["whatsapp", "payment_link"]),
  actionValue: z.string().optional(),
});

export default function Products() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useListProducts();
  const { data: user } = useGetMe();
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [videoData, setVideoData] = useState<{url: string, publicId: string} | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { actionType: "whatsapp" }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!videoData) {
      toast.error("Veuillez uploader une vidéo");
      return;
    }

    createMutation.mutate({
      data: {
        ...values,
        cloudinaryUrl: videoData.url,
        cloudinaryPublicId: videoData.publicId,
      }
    }, {
      onSuccess: () => {
        toast.success("Produit ajouté !");
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        setIsDialogOpen(false);
        form.reset();
        setVideoData(null);
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce produit ?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Produit supprimé");
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Catalogue Vidéos</h2>
            <p className="text-muted-foreground text-sm">Gérez les vidéos affichées dans votre boutique TikTok</p>
          </div>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 flex items-center gap-2 neon-shadow transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Ajouter un produit
          </button>
        </div>

        {/* Create Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-xl rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold">Nouveau Produit</h3>
                <button onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-white">✕</button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-medium mb-2">1. Vidéo du produit</label>
                  <CloudinaryUpload 
                    onUploadSuccess={(url, publicId) => setVideoData({url, publicId})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom du produit</label>
                    <input 
                      {...form.register("name")}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors"
                      placeholder="Ex: Sneakers LED"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Prix (FCFA)</label>
                    <input 
                      type="number"
                      {...form.register("price")}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors"
                      placeholder="Ex: 15000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bouton d'action</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => form.setValue("actionType", "whatsapp")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        form.watch("actionType") === "whatsapp" 
                          ? "bg-green-500/20 border-green-500 text-green-400" 
                          : "bg-black/40 border-white/10 text-muted-foreground"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue("actionType", "payment_link")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        form.watch("actionType") === "payment_link" 
                          ? "bg-primary/20 border-primary text-primary" 
                          : "bg-black/40 border-white/10 text-muted-foreground"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Lien Paiement
                    </button>
                  </div>

                  {form.watch("actionType") === "payment_link" && (
                    <input 
                      {...form.register("actionValue")}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors"
                      placeholder="URL de paiement (ex: PayStack, Stripe...)"
                    />
                  )}
                  {form.watch("actionType") === "whatsapp" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Utilise le numéro de votre profil : {user?.whatsappNumber || "Non défini"}
                    </p>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={createMutation.isPending || !videoData}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold disabled:opacity-50"
                >
                  {createMutation.isPending ? "Création..." : "Mettre en ligne"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3].map(i => <div key={i} className="aspect-[9/16] bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : products?.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucun produit</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Votre boutique est vide. Ajoutez votre première vidéo pour commencer à vendre et à cumuler des vues.</p>
            <button 
              onClick={() => setIsDialogOpen(true)}
              className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-transform"
            >
              Ajouter une vidéo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map(product => (
              <div key={product.id} className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 bg-black">
                <video src={product.cloudinaryUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-red-400 hover:text-red-300 hover:bg-black/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link 
                    href={`/shop/${user?.username}`}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 w-full p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {product.actionType === 'whatsapp' ? (
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">WHATSAPP</span>
                    ) : (
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/20">LIEN</span>
                    )}
                    {product.status === 'under_review' && (
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20">SIGNALÉ</span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 truncate">{product.name}</h3>
                  <p className="text-secondary font-display font-semibold">{product.price.toLocaleString()} FCFA</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
