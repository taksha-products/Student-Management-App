import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { Button } from "./ui/Button";
import { useTheme } from "../contexts/ThemeContext";

export interface RazorpayCheckoutParams {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  themeColor: string;
  prefillName?: string;
  prefillContact?: string;
  prefillEmail?: string;
}

interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * In-app Razorpay Checkout via WebView (Expo-compatible).
 * Requires a https baseUrl so checkout.js loads correctly inside RN WebView.
 */
export const RazorpayCheckoutModal = ({
  visible,
  params,
  onSuccess,
  onDismiss,
  onError
}: {
  visible: boolean;
  params: RazorpayCheckoutParams | null;
  onSuccess: (result: CheckoutResult) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  if (!params) {
    return null;
  }

  const amountRupees = Math.round(params.amount / 100);
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; margin: 0; background: #f5f5f4; }
      .wrap { padding: 24px; }
      h1 { font-size: 18px; margin: 0 0 8px; color: #171717; }
      p { color: #737373; font-size: 14px; line-height: 1.4; }
      button {
        width: 100%; height: 48px; border: 0; border-radius: 12px; margin-top: 16px;
        background: ${params.themeColor}; color: #fff; font-weight: 700; font-size: 15px;
      }
      .hint { margin-top: 12px; font-size: 12px; color: #a3a3a3; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>${params.name.replace(/[<>]/g, "")}</h1>
      <p>${params.description.replace(/[<>]/g, "")}</p>
      <p><strong>Amount: ₹${amountRupees}</strong></p>
      <button id="pay" type="button">Pay securely</button>
      <p class="hint" id="status">Opening Razorpay…</p>
    </div>
    <script>
      function post(msg) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }
      function startCheckout() {
        if (typeof Razorpay === "undefined") {
          document.getElementById("status").textContent = "Razorpay failed to load. Check network.";
          post({ type: "error", message: "Razorpay SDK failed to load" });
          return;
        }
        var options = {
          key: ${JSON.stringify(params.keyId)},
          amount: ${Number(params.amount)},
          currency: ${JSON.stringify(params.currency || "INR")},
          name: ${JSON.stringify(params.name)},
          description: ${JSON.stringify(params.description)},
          order_id: ${JSON.stringify(params.orderId)},
          theme: { color: ${JSON.stringify(params.themeColor)} },
          prefill: {
            name: ${JSON.stringify(params.prefillName || "")},
            contact: ${JSON.stringify(params.prefillContact || "")},
            email: ${JSON.stringify(params.prefillEmail || "")}
          },
          handler: function (response) {
            post({ type: "success", payload: response });
          },
          modal: {
            ondismiss: function () {
              post({ type: "dismiss" });
            }
          }
        };
        var rzp = new Razorpay(options);
        rzp.on("payment.failed", function (response) {
          var message = (response && response.error && (response.error.description || response.error.reason))
            || "Payment failed";
          post({ type: "error", message: message });
        });
        document.getElementById("status").textContent = "Complete payment in the Razorpay sheet.";
        rzp.open();
      }
      document.getElementById("pay").onclick = startCheckout;
      window.addEventListener("load", function () {
        setTimeout(startCheckout, 500);
      });
    </script>
  </body>
</html>`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            // Keep Razorpay's own buttons clear of the status bar and the
            // Android back / home / recents bar (or iOS home indicator).
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom
          }
        ]}
      >
        <View style={styles.top}>
          <Text style={[styles.title, { color: theme.text }]}>Complete payment</Text>
          <Button label="Close" variant="ghost" onPress={onDismiss} />
        </View>
        <WebView
          // HTTPS only for checkout + bank OTP pages; block file/intent/http phishing.
          originWhitelist={["https://*", "about:blank"]}
          source={{
            html,
            baseUrl: "https://checkout.razorpay.com"
          }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          setSupportMultipleWindows={false}
          mixedContentMode="never"
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          allowsInlineMediaPlayback
          style={styles.webview}
          {...(Platform.OS === "android"
            ? { androidLayerType: "hardware" as const }
            : {})}
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url ?? "";
            if (
              url === "" ||
              url.startsWith("about:") ||
              url.startsWith("data:") ||
              url.startsWith("blob:")
            ) {
              return true;
            }
            // Allow Razorpay + bank 3DS pages over HTTPS only.
            if (url.startsWith("https://")) {
              return true;
            }
            return false;
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data) as {
                type: string;
                payload?: CheckoutResult;
                message?: string;
              };
              if (data.type === "success" && data.payload) {
                onSuccess(data.payload);
              } else if (data.type === "dismiss") {
                onDismiss();
              } else if (data.type === "error") {
                onError(data.message || "Payment failed");
              }
            } catch {
              onError("Could not read payment result");
            }
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: { fontSize: 18, fontWeight: "700" },
  webview: { flex: 1 }
});
