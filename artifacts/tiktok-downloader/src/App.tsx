import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Subscribe from "@/pages/subscribe";
import Settings from "@/pages/settings";
import ForgotPassword from "@/pages/forgot-password";
import VerifyEmail from "@/pages/verify-email";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";

import AdminPanel from "@/pages/admin"; // <-- create this if you don't have it yet
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/privacy", "/terms"];

function AppRoutes() {
  const { token, user, isLoading } = useAuth();
  const [location] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  // Read query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get("admin") === "true");
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render admin panel if ?admin=true
  if (isAdmin) {
    return <AdminPanel />;
  }

  const isPublic = PUBLIC_PATHS.some((p) => location === p || location.startsWith(p + "/"));

  if (token && user && !user.emailVerified && location !== "/verify-email") {
    return <Redirect to="/verify-email" />;
  }

  if (!token && !isPublic) {
    return <Redirect to="/login" />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/settings" component={Settings} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
