import {
  buildCheckoutOptions,
  RazorpayCheckoutError,
  type RazorpayCheckoutParams,
  type RazorpaySuccess
} from "./razorpayTypes";

/**
 * Web: Razorpay checkout.js directly in the page — the same way the web parent
 * dashboard does it. (Phones use razorpay.native.ts with the native SDK.)
 */
const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayWebInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: unknown) => void) => void;
}
type RazorpayWebCtor = new (options: object) => RazorpayWebInstance;

let scriptPromise: Promise<void> | null = null;

const loadScript = (): Promise<void> => {
  const w = globalThis as unknown as { Razorpay?: RazorpayWebCtor; document?: Document };
  if (w.Razorpay) {
    return Promise.resolve();
  }
  if (!w.document) {
    return Promise.reject(new Error("Razorpay is only available in the browser"));
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = w.document!.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Failed to load Razorpay"));
      };
      w.document!.body.appendChild(script);
    });
  }
  return scriptPromise;
};

export const openRazorpayCheckout = async (params: RazorpayCheckoutParams): Promise<RazorpaySuccess> => {
  try {
    await loadScript();
  } catch {
    throw new RazorpayCheckoutError("Couldn't load the payment page. Check your connection and try again.");
  }
  const Razorpay = (globalThis as unknown as { Razorpay: RazorpayWebCtor }).Razorpay;

  return new Promise<RazorpaySuccess>((resolve, reject) => {
    let settled = false;
    let lastFailure: RazorpayCheckoutError | null = null;
    const instance = new Razorpay({
      ...buildCheckoutOptions(params),
      handler: (response: RazorpaySuccess) => {
        settled = true;
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (!settled) {
            settled = true;
            // Closed without paying: report the last failure if there was one, else a cancel.
            reject(lastFailure ?? new RazorpayCheckoutError("Payment cancelled", { cancelled: true }));
          }
        }
      }
    });
    instance.on("payment.failed", (response) => {
      // Razorpay keeps its sheet open so the parent can retry another method;
      // remember the error and only report it if they close the sheet.
      const error = (
        response as { error?: { description?: string; code?: string; metadata?: { payment_id?: string } } }
      )?.error;
      lastFailure = new RazorpayCheckoutError(error?.description || "Payment failed", {
        code: error?.code ?? null,
        paymentId: error?.metadata?.payment_id ?? null
      });
    });
    instance.open();
  });
};
