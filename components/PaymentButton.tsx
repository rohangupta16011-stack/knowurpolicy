"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, Loader } from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type PaymentState = "idle" | "loading" | "success" | "error";

export default function PaymentButton({
  email,
  label = "Buy another analysis",
  fullWidth = true,
  onSuccess,
}: {
  email: string;
  label?: string;
  fullWidth?: boolean;
  onSuccess?: () => void;
}) {
  const [state, setState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(
    typeof window !== "undefined" && Boolean(window.Razorpay),
  );

  // Lazy-load the Razorpay script once, on first mount.
  // Not via next/script because we want imperative control over the load promise
  // and Razorpay's modal needs the global injected before .open() can be called.
  useEffect(() => {
    if (scriptLoaded || typeof window === "undefined") return;
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError("Couldn't load payment SDK. Check your connection.");
    document.head.appendChild(script);
  }, [scriptLoaded]);

  async function handleClick() {
    if (!email) {
      setError("Email is required before payment.");
      return;
    }
    setError(null);
    setState("loading");

    try {
      // 1. Create order on our server
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const orderData = (await orderRes.json()) as
        | {
            order_id: string;
            amount: number;
            currency: string;
            key_id: string;
            display_amount: string;
          }
        | { error: string; message: string };

      if (!orderRes.ok || !("order_id" in orderData)) {
        const msg = "message" in orderData ? orderData.message : "Couldn't start checkout";
        throw new Error(msg);
      }

      if (!window.Razorpay) {
        throw new Error("Payment SDK not loaded yet. Please try again in a moment.");
      }

      // 2. Open Razorpay Checkout
      const rzp = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "KnowUrPolicy",
        description: "1 document analysis credit",
        order_id: orderData.order_id,
        prefill: { email },
        theme: { color: "#C96A00" },
        modal: {
          ondismiss: () => {
            // User closed the modal — return to idle so they can retry
            setState("idle");
          },
        },
        handler: async (response) => {
          // 3. Verify signature server-side
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email,
              }),
            });
            const verifyData = (await verifyRes.json()) as
              | { ok: true }
              | { error: string; message: string };
            if (!verifyRes.ok || !("ok" in verifyData)) {
              const msg =
                "message" in verifyData
                  ? verifyData.message
                  : "Payment received but verification failed. Contact support if your credit doesn't appear.";
              setError(msg);
              setState("error");
              return;
            }
            setState("success");
            onSuccess?.();
          } catch {
            setError("Payment received but verification failed. Contact support if your credit doesn't appear.");
            setState("error");
          }
        },
      });

      rzp.on("payment.failed", (failure) => {
        setError(
          failure.error?.description ?? failure.error?.reason ?? "Payment failed. Please try again.",
        );
        setState("error");
      });

      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md border border-flag-g-text/30 bg-flag-g-bg px-4 py-3 text-sm font-semibold text-flag-g-text">
        <Check className="h-4 w-4 flex-none" />
        Payment verified · 1 analysis credit added
      </div>
    );
  }

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "loading" || !scriptLoaded || !email}
        className={`btn-primary ${widthClass}`}
      >
        {state === "loading" ? (
          <>
            <Loader className="h-4 w-4 animate-spin" /> Opening checkout…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" /> {label}
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-center text-xs text-flag-r-text">
          {error}
        </p>
      )}
    </div>
  );
}

// Razorpay SDK types — minimal surface, only what we use.
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { email?: string; name?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: RazorpaySuccess) => void;
};

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
  };
};

type RazorpayInstance = {
  open(): void;
  on(event: "payment.failed", handler: (failure: RazorpayFailure) => void): void;
};
