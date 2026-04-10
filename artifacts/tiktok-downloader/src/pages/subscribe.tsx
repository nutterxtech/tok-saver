import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useGetSubscriptionStatus, useInitiateSubscription } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { useEffect } from "react";

export default function Subscribe() {
  const { user, isLoading: userLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: subStatus, isLoading: subLoading } = useGetSubscriptionStatus();
  const subscribeMutation = useInitiateSubscription();

  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please login to subscribe",
      });
      setLocation("/login");
    }
  }, [user, userLoading, setLocation, toast]);

  if (userLoading || subLoading) {
    return <div className="flex justify-center items-center flex-1"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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

  const handleSubscribe = () => {
    subscribeMutation.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.paymentUrl;
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Payment initiation failed",
          description: error.data?.error || "Could not start payment process.",
        });
      }
    });
  };

  const price = subStatus?.subscriptionPrice || 49;
  const currency = subStatus?.currency || "KSH";

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg shadow-2xl border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <CardHeader className="text-center space-y-2 pt-10">
          <CardTitle className="text-4xl font-extrabold tracking-tight">Unlock Unlimited</CardTitle>
          <CardDescription className="text-lg">Get full access to all features</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-4">
          <div className="text-center">
            <span className="text-6xl font-black">{currency} {price}</span>
            <span className="text-xl text-muted-foreground font-medium">/month</span>
          </div>

          <div className="space-y-4 max-w-sm mx-auto bg-card border border-border rounded-xl p-6">
            <ul className="space-y-3">
              {[
                "Unlimited watermark-free downloads",
                "Highest quality video resolution",
                "Fastest download speeds",
                "Secure and private",
                "Cancel anytime"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary font-bold" />
                  </div>
                  <span className="font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="pb-10 px-8">
          <Button 
            size="lg" 
            className="w-full text-lg h-14" 
            onClick={handleSubscribe}
            disabled={subscribeMutation.isPending}
            data-testid="button-subscribe-now"
          >
            {subscribeMutation.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
            ) : (
              "Subscribe Now"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
