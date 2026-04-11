import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useVerifyEmail, useResendVerification, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MailCheck, RefreshCw } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";

const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  useEffect(() => {
    if (!isLoading && user?.emailVerified) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    intervalRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      toast({ variant: "destructive", title: "Enter the 6-digit code from your email" });
      return;
    }

    verifyMutation.mutate(
      { code: trimmed },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Email verified!", description: "Welcome to TokSaver." });
          setLocation("/");
        },
        onError: (error: unknown) => {
          toast({
            variant: "destructive",
            title: "Verification failed",
            description: getApiErrorMessage(error, "Invalid or expired code. Try resending."),
          });
        },
      }
    );
  }

  function handleResend() {
    if (cooldown > 0) return;
    resendMutation.mutate(undefined, {
      onSuccess: () => {
        setCode("");
        toast({ title: "Code resent", description: "Check your email for the new 6-digit code." });
        startCooldown();
      },
      onError: (error: unknown) => {
        toast({
          variant: "destructive",
          title: "Could not resend",
          description: getApiErrorMessage(error, "Please try again."),
        });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            We sent a 6-digit verification code to{" "}
            <strong>{user?.email ?? "your email address"}</strong>.
            <br />
            Enter it below to activate your account.
            <br />
            <span className="text-xs text-muted-foreground/70 mt-1 block">Check your spam folder if it doesn't arrive.</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 border-primary/30 focus:border-primary"
                autoFocus
                data-testid="input-verify-code"
                disabled={verifyMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={verifyMutation.isPending || code.trim().length !== 6}
              data-testid="button-verify-submit"
            >
              {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify my email
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={cooldown > 0 || resendMutation.isPending}
              className="text-muted-foreground hover:text-foreground text-sm"
              data-testid="button-resend-code"
            >
              {resendMutation.isPending ? (
                <><RefreshCw className="mr-1 h-3 w-3 animate-spin" /> Sending…</>
              ) : cooldown > 0 ? (
                `Resend code in ${cooldown}s`
              ) : (
                "Resend code"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
