import { Suspense } from "react";
import { CheckoutInterface } from "@/components/payment/checkout-interface"

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutInterface />
    </Suspense>
  );
}