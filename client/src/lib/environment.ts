/**
 * Access environment variables with helpful error messages
 */

/**
 * Get Razorpay Key ID environment variable
 * @returns Razorpay Key ID
 */
export function getRazorpayKeyId(): string {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  
  if (!keyId) {
    console.error('Missing VITE_RAZORPAY_KEY_ID environment variable');
    return '';
  }
  
  return keyId;
}