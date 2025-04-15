import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlanType = "monthly" | "annual";

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { createOrder, initPayment, isLoaded } = useRazorpay();
  
  const plans = {
    monthly: {
      name: "Monthly",
      price: 9.99,
      priceDisplay: "$9.99",
      period: "/month",
      features: [
        "Complete historical data",
        "Custom date ranges",
        "Advanced analytics",
        "Export reports"
      ]
    },
    annual: {
      name: "Annual",
      price: 89.99,
      priceDisplay: "$89.99",
      period: "/year",
      discount: "Save 25%",
      features: [
        "All monthly features",
        "Priority support",
        "Competitor analytics",
        "Team collaboration"
      ]
    }
  };
  
  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upgrade",
        variant: "destructive"
      });
      return;
    }
    
    if (!isLoaded) {
      toast({
        title: "Error",
        description: "Payment system is loading. Please try again in a moment.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Step 1: Create a Razorpay order
      const orderData = await createOrder({
        plan: selectedPlan,
        userId: user.id
      });
      
      // Step 2: Initialize payment with the order ID
      const plan = plans[selectedPlan];
      
      const paymentResponse = await initPayment({
        amount: orderData.amount, // Amount from the server
        currency: orderData.currency,
        name: "DashMetrics",
        description: `DashMetrics ${plan.name} Plan`,
        order_id: orderData.id, // Use the order ID from the server
        prefill: {
          name: user.username || '',
          email: user.email || ''
        },
        theme: {
          color: "#3B82F6"
        }
      });
      
      // Step 3: Process successful payment
      if (paymentResponse.razorpay_payment_id) {
        // Create subscription in database
        const response = await apiRequest("POST", "/api/subscription", {
          userId: user.id,
          plan: selectedPlan,
          paymentId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          signature: paymentResponse.razorpay_signature
        });
        
        if (response.ok) {
          toast({
            title: "Success",
            description: `You've successfully upgraded to the ${plan.name} plan!`
          });
          
          // Refresh user data to update subscription status
          await refreshUser();
          
          // Invalidate any queries that might be affected by the upgrade
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
          
          onClose();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create subscription");
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary bg-opacity-10 sm:mx-0 sm:h-10 sm:w-10">
              <i className="ri-rocket-line text-lg text-primary"></i>
            </div>
            <div className="ml-4">
              <DialogTitle>Upgrade to DashMetrics Pro</DialogTitle>
              <DialogDescription>
                Get unlimited access to your historical analytics data and unlock premium features.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="bg-gray-50 px-6 py-6 border-t border-b border-gray-200 my-4">
          <div className="space-y-5">
            <div className="flex gap-4">
              {/* Monthly Plan */}
              <div 
                className={`flex-1 bg-white rounded-lg border ${
                  selectedPlan === "monthly" ? "border-primary" : "border-gray-200"
                } p-4 cursor-pointer relative shadow-sm hover:shadow-md transition-shadow`}
                onClick={() => setSelectedPlan("monthly")}
              >
                <div className="absolute top-3 right-3">
                  <div className={`h-5 w-5 rounded-full border-2 ${
                    selectedPlan === "monthly" ? "border-primary" : "border-gray-300"
                  } flex items-center justify-center`}>
                    {selectedPlan === "monthly" && (
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                </div>
                <h4 className="font-medium text-gray-900">Monthly</h4>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl font-bold">{plans.monthly.priceDisplay}</span>
                  <span className="text-sm text-gray-500 ml-1">{plans.monthly.period}</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {plans.monthly.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <i className="ri-check-line text-success mr-2"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Annual Plan */}
              <div 
                className={`flex-1 bg-white rounded-lg border ${
                  selectedPlan === "annual" ? "border-primary" : "border-gray-200"
                } p-4 cursor-pointer relative shadow-sm hover:shadow-md transition-shadow`}
                onClick={() => setSelectedPlan("annual")}
              >
                <div className="absolute top-3 right-3">
                  <div className={`h-5 w-5 rounded-full border-2 ${
                    selectedPlan === "annual" ? "border-primary" : "border-gray-300"
                  } flex items-center justify-center`}>
                    {selectedPlan === "annual" && (
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                </div>
                <h4 className="font-medium text-gray-900">Annual</h4>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl font-bold">{plans.annual.priceDisplay}</span>
                  <span className="text-sm text-gray-500 ml-1">{plans.annual.period}</span>
                </div>
                <div className="mt-1">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                    {plans.annual.discount}
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {plans.annual.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <i className="ri-check-line text-success mr-2"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent animate-spin"></div>
                Processing...
              </>
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
