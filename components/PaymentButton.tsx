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

export type VerifyResponse = {
  ok: true;
  product: "analysis" | "download";
  downloadToken?: string;
};

export default function PaymentButton({
  email,
  product = "analysis",
  label,
  fullWidth = true,
  successHidden = false,
  onSuccess,
}: {
  email: string;
  product?: "analysis" | "download";
  label?: string;
  fullWidth?: boolean;
  /** Suppress the built-in success banner — let the caller render its own */
  successHidden?: boolean;
  onSuccess?: (response: VerifyResponse) => void;
}) {
  const [state, setState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(
    typeof window !== "undefined" && Boolean(window.Razorpay),
  );

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
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, product }),
      });
      const orderData = (await orderRes.json()) as
        | {
            order_id: string;
            amount: number;
            currency: string;
            key_id: string;
            display_amount: string;
            description: string;
            product: "analysis" | "download";
          }
        | { error: string; message: string };

      if (!orderRes.ok || !("order_id" in orderData)) {
        const msg = "message" in orderData ? orderData.message : "Couldn't start checkout";
        throw new Error(msg);
      }

      if (!window.Razorpay) {
        throw new Error("Payment SDK not loaded yet. Please try again in a moment.");
      }

      const rzp = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "KnowUrPolicy",
        description: orderData.description,
        order_id: orderData.order_id,
        prefill: { email },
        theme: { color: "#C96A00" },
        modal: {
          ondismiss: () => {
            setState("idle");
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email,
                product,
              }),
            });
            const verifyData = (await verifyRes.json()) as
              | VerifyResponse
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
            onSuccess?.(verifyData);
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

  if (state === "success" && !successHidden) {
    const msg =
      product === "download"
        ? "Payment verified · preparing your download…"
        : "Payment verified · 1 analysis credit added";
    return (
      <div className="flex items-center justify-center gap-2 rounded-md border border-flag-g-text/30 bg-flag-g-bg px-4 py-3 text-sm font-semibold text-flag-g-text">
        <Check className="h-4 w-4 flex-none" />
        {msg}
      </div>
    );
  }

  const widthClass = fullWidth ? "w-full" : "";
  const defaultLabel =
    product === "download" ? "Download as PDF" : "Buy another analysis";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => handleClick()}
        disabled={state === "loading" || !scriptLoaded || !email}
        className={`btn-primary ${widthClass}`}
      >
        {state === "loading" ? (
          <>
            <Loader className="h-4 w-4 animate-spin" /> Opening checkout…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" /> {label ?? defaultLabel}
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
