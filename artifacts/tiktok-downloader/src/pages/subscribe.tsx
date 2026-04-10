import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useGetSubscriptionStatus, useInitiateSubscription } from "@workspace/api-client-react";
import { getApiErrorMessage } from "@/lib/api-error";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ArrowLeft, Smartphone, ShieldCheck, Info } from "lucide-react";
import { useEffect, useState } from "react";

export default function Subscribe() {
  const { user, isLoading: userLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: subStatus, isLoading: subLoading } = useGetSubscriptionStatus();
  const subscribeMutation = useInitiateSubscription();

  const [payPhone, setPayPhone] = useState("");
  const [phoneEdited, setPhoneEdited] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      toast({ title: "Authentication required", description: "Please login to subscribe" });
      setLocation("/login");
    }
  }, [user, userLoading, setLocation, toast]);

  useEffect(() => {
    if (user?.phone && !phoneEdited) {
      setPayPhone(user.phone);
    }
  }, [user?.phone, phoneEdited]);

  if (userLoading || subLoading) {
    return (
      <div className="flex justify-center items-center flex-1">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (subStatus?.isActive) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg border-primary/20">
          <CardContent className="pt-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">You're already Pro!</h2>
            <p className="text-muted-foreground">Your subscription is active. You have unlimited downloads.</p>
            <Button className="mt-4 w-full" onClick={() => setLocation("/")}>Go to Downloader</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = subStatus?.subscriptionPrice || 49;
  const currency = subStatus?.currency || "KES";

  const handleSubscribe = () => {
    subscribeMutation.mutate(
      { data: { phone: payPhone || undefined } },
      {
        onSuccess: (data) => {
          window.location.href = data.paymentUrl;
        },
        onError: (error: unknown) => {
          toast({
            variant: "destructive",
            title: "Payment initiation failed",
            description: getApiErrorMessage(error, "Could not start payment process."),
          });
        },
      }
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg space-y-4">

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-1"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-2xl bg-card">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

          <div className="relative p-8 text-center space-y-2 pt-10 border-b border-border">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Pro Plan</p>
            <h1 className="text-4xl font-extrabold tracking-tight">Unlock Unlimited</h1>
            <p className="text-muted-foreground">Full access to all features</p>
            <div className="pt-4">
              <span className="text-6xl font-black">{currency} {price}</span>
              <span className="text-xl text-muted-foreground font-medium">/month</span>
            </div>
          </div>

          <div className="relative p-8 space-y-6">
            <ul className="space-y-3">
              {[
                "Unlimited watermark-free downloads",
                "Highest quality video resolution",
                "Fastest download speeds",
                "Secure and private",
                "Cancel anytime",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary shrink-0" />
                <Label htmlFor="pay-phone" className="font-semibold text-sm">
                  M-Pesa Number
                </Label>
              </div>

              <Input
                id="pay-phone"
                type="tel"
                placeholder="07XXXXXXXX or 2547XXXXXXXX"
                value={payPhone}
                onChange={(e) => {
                  setPayPhone(e.target.value);
                  setPhoneEdited(true);
                }}
                className="bg-background text-base h-11"
                data-testid="input-pay-phone"
              />

              <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                This is the M-Pesa number that will receive the payment prompt (STK push).
                It can be different from your registered number.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full text-base h-13 font-semibold"
              onClick={handleSubscribe}
              disabled={subscribeMutation.isPending || !payPhone.trim()}
              data-testid="button-subscribe-now"
            >
              {subscribeMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing…</>
              ) : (
                <>Pay {currency} {price} via M-Pesa</>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Secured by Paylor · Powered by M-Pesa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
