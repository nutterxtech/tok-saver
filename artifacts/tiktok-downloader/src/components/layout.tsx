import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Download, Share } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout: localLogout } = useAuth();
  const logoutMutation = useLogout();
  const isAdminMode = new URLSearchParams(window.location.search).get("admin") === "true";
  const { installState, install } = usePwaInstall();
  const [showIosDialog, setShowIosDialog] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        localLogout();
      },
    });
  };

  const handleInstall = () => {
    if (installState === "ios") {
      setShowIosDialog(true);
    } else {
      install();
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={isAdminMode ? "/?admin=true" : "/"}
            className="font-bold text-xl tracking-tight flex items-center gap-2"
          >
            <span className="text-primary">Tok</span>Saver
            {isAdminMode && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border ml-1">
                Admin
              </Badge>
            )}
          </Link>

          <nav className="flex items-center gap-2">
            {!isAdminMode && installState !== "installed" && installState !== "unsupported" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInstall}
                className="gap-1.5 text-primary hover:text-primary"
                data-testid="button-install-app"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download App</span>
              </Button>
            )}

            {!isAdminMode && (
              <>
                {user ? (
                  <>
                    <div className="text-sm text-muted-foreground hidden sm:block">
                      {user.email}
                    </div>
                    {!user.hasActiveSubscription && (
                      <Link href="/subscribe">
                        <Button variant="secondary" size="sm" className="text-primary font-semibold" data-testid="link-nav-subscribe">
                          Upgrade to Pro
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" data-testid="link-nav-login">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" data-testid="link-nav-register">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TokSaver. Professional TikTok Downloader.</p>
      </footer>

      <Dialog open={showIosDialog} onOpenChange={setShowIosDialog}>
        <DialogContent className="dark bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share className="w-5 h-5 text-primary" />
              Add TokSaver to Home Screen
            </DialogTitle>
            <DialogDescription className="text-left space-y-2 pt-2">
              <span className="block">To install TokSaver on your iPhone or iPad:</span>
              <ol className="list-decimal list-inside space-y-1 text-foreground/80">
                <li>Tap the <strong>Share</strong> button <Share className="w-3 h-3 inline" /> at the bottom of Safari</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>Add</strong> in the top right corner</li>
              </ol>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
