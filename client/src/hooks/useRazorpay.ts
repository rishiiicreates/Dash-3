import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getRazorpayKeyId } from "@/lib/environment";

interface RazorpayOptions {
  key?: string; // Made optional since we add it in the initPayment function
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayResponse) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature?: string;
}

interface CreateOrderParams {
  plan: 'monthly' | 'annual';
  userId: number;
}

interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

interface UseRazorpayReturn {
  isLoaded: boolean;
  isError: boolean;
  createOrder: (params: CreateOrderParams) => Promise<CreateOrderResponse>;
  initPayment: (options: RazorpayOptions) => Promise<RazorpayResponse>;
}

export function useRazorpay(): UseRazorpayReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();
  
  // Load Razorpay script on mount
  useEffect(() => {
    if ((window as any).Razorpay) {
      setIsLoaded(true);
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setIsError(true);
      toast({
        title: "Error",
        description: "Failed to load Razorpay. Please try again later.",
        variant: "destructive"
      });
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [toast]);

  // Create a Razorpay order on the server
  const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResponse> => {
    try {
      const response = await apiRequest('POST', '/api/orders', params);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };
  
  // Initialize Razorpay payment
  const initPayment = async (options: RazorpayOptions): Promise<RazorpayResponse> => {
    return new Promise((resolve, reject) => {
      if (!isLoaded) {
        reject(new Error("Razorpay not loaded yet"));
        return;
      }
      
      try {
        const razorpayKey = getRazorpayKeyId();
        
        if (!razorpayKey) {
          throw new Error('Razorpay key is missing');
        }
        
        const razorpay = new (window as any).Razorpay({
          ...options,
          key: razorpayKey,
          handler: function(response: RazorpayResponse) {
            // Call the handler if provided
            if (options.handler) {
              options.handler(response);
            }
            resolve(response);
          },
        });
        
        razorpay.on('payment.failed', function(response: any) {
          reject(new Error(response.error.description));
        });
        
        razorpay.open();
      } catch (error) {
        reject(error);
      }
    });
  };
  
  return {
    isLoaded,
    isError,
    createOrder,
    initPayment
  };
}
