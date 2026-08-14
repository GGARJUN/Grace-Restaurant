// Thin wrapper around Razorpay's checkout.js widget (spec §7).
// Real payment only runs when a public key is configured; otherwise the
// booking flow just proceeds (dev/mock mode — see README).

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function isRazorpayConfigured() {
  return Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
}

let scriptPromise = null;

function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment widget. Check your connection."));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

// Opens the Razorpay checkout modal for a previously-created order.
// Resolves with the payment response on success, rejects on failure or
// if the user closes the modal without paying.
export async function openRazorpayCheckout({ razorpayOrderId, amount, customer, description }) {
  await loadCheckoutScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      order_id: razorpayOrderId,
      amount: Math.round(amount * 100),
      currency: "INR",
      name: "Grace Restaurant",
      description,
      prefill: {
        name: customer.name,
        contact: customer.phone,
        email: customer.email || undefined,
      },
      theme: { color: "#7A1F2B" },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment was cancelled.")),
      },
    });
    rzp.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed. Please try again."));
    });
    rzp.open();
  });
}
