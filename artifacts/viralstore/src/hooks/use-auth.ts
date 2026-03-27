import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLoginUser, useRegisterUser } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("viralstore_token");

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("viralstore_token", data.token);
        queryClient.setQueryData(["/api/auth/me"], data.user);
        toast.success("Bon retour sur ViralStore !");
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast.error("Identifiants incorrects");
        console.error(err);
      }
    }
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("viralstore_token", data.token);
        queryClient.setQueryData(["/api/auth/me"], data.user);
        toast.success("Compte créé avec succès ! 🚀");
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast.error(err.message || "Erreur lors de l'inscription");
      }
    }
  });

  const logout = () => {
    localStorage.removeItem("viralstore_token");
    queryClient.clear();
    setLocation("/login");
  };

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout
  };
}
