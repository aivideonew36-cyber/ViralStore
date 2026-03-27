import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3, "Pseudo trop court (3 min)").regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres, et '_' uniquement"),
  referredBy: z.string().optional(),
});

export function Login() {
  const { login, isLoggingIn } = useAuth();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login({ data: values });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="font-display font-bold text-xl text-primary">V</span>
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Bon retour</h1>
            <p className="text-muted-foreground">Gérez votre empire ViralStore</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input 
                {...form.register("email")}
                placeholder="Email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-primary outline-none transition-colors"
              />
              {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <input 
                type="password"
                {...form.register("password")}
                placeholder="Mot de passe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-primary outline-none transition-colors"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Pas encore de compte ? <Link href="/register" className="text-primary hover:underline font-medium">Créer une boutique</Link>
          </p>
        </div>
      </div>
      
      {/* Hero Image Side */}
      <div className="hidden lg:block flex-1 relative overflow-hidden bg-black">
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-20 left-12 right-12">
          <h2 className="text-4xl font-display font-bold text-white mb-4">Votre boutique en format TikTok.</h2>
          <p className="text-lg text-white/70">Vendez plus. Monétisez vos vues via AdSense. Parrainez d'autres vendeurs.</p>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const { register, isRegistering } = useAuth();
  
  // Extract referral from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref') || "";

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { referredBy: ref }
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register({ data: values });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block flex-1 relative overflow-hidden bg-black">
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110" alt="Hero" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-left">
            <h1 className="text-3xl font-display font-bold mb-2">Lancer ma boutique</h1>
            <p className="text-muted-foreground">100% gratuit pour commencer.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input 
                {...form.register("username")}
                placeholder="Nom d'utilisateur (ex: max_store)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-primary outline-none transition-colors"
              />
              {form.formState.errors.username && <p className="text-destructive text-xs mt-1">{form.formState.errors.username.message}</p>}
            </div>
            <div>
              <input 
                {...form.register("email")}
                placeholder="Email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-primary outline-none transition-colors"
              />
              {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <input 
                type="password"
                {...form.register("password")}
                placeholder="Mot de passe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-primary outline-none transition-colors"
              />
              {form.formState.errors.password && <p className="text-destructive text-xs mt-1">{form.formState.errors.password.message}</p>}
            </div>
            
            {ref && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm">
                <span className="text-muted-foreground">Parrainé par: </span>
                <span className="font-bold text-primary">@{ref}</span>
              </div>
            )}
            <input type="hidden" {...form.register("referredBy")} />

            <button 
              type="submit"
              disabled={isRegistering}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 mt-4"
            >
              {isRegistering ? "Création..." : "Créer ma boutique"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Déjà un compte ? <Link href="/login" className="text-primary hover:underline font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
