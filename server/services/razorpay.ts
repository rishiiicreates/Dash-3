import crypto from 'crypto';

// Type definitions for Razorpay
type RazorpayOrderOptions = {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
};

type RazorpayOrder = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
};

type RazorpayPaymentVerificationParams = {
  order_id: string;
  payment_id: string;
  signature: string;
};

class RazorpayService {
  private key_id: string;
  private key_secret: string;
  private baseUrl = 'https://api.razorpay.com/v1';

  constructor() {
    // Access environment variables directly since they're provided by Replit
    this.key_id = process.env.RAZORPAY_KEY_ID || '';
    this.key_secret = process.env.RAZORPAY_KEY_SECRET || '';
    
    if (!this.key_id || !this.key_secret) {
      console.error('Missing Razorpay API keys');
    } else {
      console.log('Razorpay service initialized successfully');
    }
  }

  /**
   * Creates a new order
   */
  async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrder> {
    const url = `${this.baseUrl}/orders`;
    const auth = Buffer.from(`${this.key_id}:${this.key_secret}`).toString('base64');
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Razorpay error: ${errorData.error?.description || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Verifies Razorpay payment signature
   */
  verifyPaymentSignature(params: RazorpayPaymentVerificationParams): boolean {
    const hmac = crypto.createHmac('sha256', this.key_secret);
    hmac.update(`${params.order_id}|${params.payment_id}`);
    const generatedSignature = hmac.digest('hex');
    
    return generatedSignature === params.signature;
  }

  /**
   * Calculates price in lowest currency denomination (e.g. paise for INR, cents for USD)
   */
  calculateAmount(amount: number): number {
    return Math.round(amount * 100);
  }
}

export const razorpayService = new RazorpayService();