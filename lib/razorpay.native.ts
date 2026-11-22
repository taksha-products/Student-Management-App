import {
  buildCheckoutOptions,
  RazorpayCheckoutError,
  type RazorpayCheckoutParams,
  type RazorpaySuccess
} from "./razorpayTypes";

/** Android Checkout.PAYMENT_CANCELED / iOS cancel code. */
const CANCEL_CODES = new Set<string | number>([0, 2, "0", "2"]);

interface NativeError {
  code?: string | number;
  description?: string;
  error?: { description?: string; reason?: string; code?: string; metadata?: { payment_id?: string } };
}

/** The SDK sometimes sends `description` as a JSON string of Razorpay's error object. */
const readError = (raw: unknown): { message: string; code: string | number | null; paymentId: string | null } => {
  const data = (raw ?? {}) as NativeError;
  let inner = data.error;
  if (!inner && typeof data.description === "string" && data.description.trim().startsWith("{")) {
    try {
      inner = (JSON.parse(data.description) as NativeError).error;
    } catch {
      // keep plain description
    }
  }
  const message =
    inner?.description ||
    (typeof data.description === "string" && !data.description.trim().startsWith("{")
      ? data.description
      : "") ||
    "Payment failed";
  return {
    message,
    code: inner?.code ?? data.code ?? null,
    paymentId: inner?.metadata?.payment_id ?? null
  };
};

/**
 * Opens Razorpay's official native checkout (react-native-razorpay).
 * Handles UPI apps, netbanking and cards natively — no WebView.
 */
export const openRazorpayCheckout = async (params: RazorpayCheckoutParams): Promise<RazorpaySuccess> => {
  let RazorpayCheckout: { open: (options: object) => Promise<RazorpaySuccess> };
  try {
    // Loaded lazily: the native module only exists in a development/production build (not Expo Go).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RazorpayCheckout = require("react-native-razorpay").default;
  } catch {
    throw new RazorpayCheckoutError(
      "Payments need the latest version of the app. Please update the app and try again."
    );
  }

  try {
    return await RazorpayCheckout.open(buildCheckoutOptions(params));
  } catch (raw) {
    const { message, code, paymentId } = readError(raw);
    const cancelled =
      (code !== null && CANCEL_CODES.has(code)) || /cancel/i.test(message);
    throw new RazorpayCheckoutError(message, { code, cancelled, paymentId });
  }
};
