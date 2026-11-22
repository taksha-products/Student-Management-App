/** Shared Razorpay checkout types (native SDK on phones, checkout.js on web). */
export interface RazorpayCheckoutParams {
  keyId: string;
  orderId: string;
  /** In paise. */
  amount: number;
  currency: string;
  name: string;
  description: string;
  themeColor: string;
  prefillName?: string;
  prefillContact?: string;
  prefillEmail?: string;
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Thrown when checkout does not succeed. `cancelled` = the parent closed it. */
export class RazorpayCheckoutError extends Error {
  code: string | number | null;
  cancelled: boolean;
  paymentId: string | null;

  constructor(
    message: string,
    options: { code?: string | number | null; cancelled?: boolean; paymentId?: string | null } = {}
  ) {
    super(message);
    this.name = "RazorpayCheckoutError";
    this.code = options.code ?? null;
    this.cancelled = options.cancelled ?? false;
    this.paymentId = options.paymentId ?? null;
  }
}

export const buildCheckoutOptions = (params: RazorpayCheckoutParams) => ({
  key: params.keyId,
  order_id: params.orderId,
  amount: params.amount,
  currency: params.currency || "INR",
  name: params.name,
  description: params.description,
  theme: { color: params.themeColor },
  prefill: {
    name: params.prefillName ?? "",
    contact: params.prefillContact ?? "",
    email: params.prefillEmail ?? ""
  }
});
