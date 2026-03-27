import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import "./lib/fetch-interceptor"; // Import interceptor immediately

// Pages
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Referrals from "./pages/Referrals";
import Withdraw from "./pages/Withdraw";
import Domains from "./pages/Domains";
import PublicShop from "./pages/PublicShop";
import Join from "./pages/Join";
import { Login, Register } from "./pages/Auth";
import { useAuth } from "./hooks/use-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  const [, setLocation] = useLocation();

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={() => {
        // Simple redirect
        useEffect(() => {
          if (localStorage.getItem("viralstore_token")) {
            setLocation("/dashboard");
          } else {
            setLocation("/login");
          }
        }, []);
        return null;
      }} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/shop/:username" component={PublicShop} />
      <Route path="/join/:username" component={Join} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard/products">
        {() => <ProtectedRoute component={Products} />}
      </Route>
      <Route path="/dashboard/referrals">
        {() => <ProtectedRoute component={Referrals} />}
      </Route>
      <Route path="/dashboard/withdraw">
        {() => <ProtectedRoute component={Withdraw} />}
      </Route>
      <Route path="/dashboard/domains">
        {() => <ProtectedRoute component={Domains} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster theme="dark" position="top-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
