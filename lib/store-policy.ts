import { money } from "./data";

/**
 * The store's customer promises, in one place. Every page that mentions
 * delivery, exchanges or payment reads from here, so a change made here
 * shows up everywhere.
 */
export const storePolicy = {
  /** Orders at or above this amount (after set savings) ship free. */
  freeDeliveryFrom: 10000,
  /** Flat delivery fee below the free-delivery amount. */
  deliveryFee: 250,
  deliveryTime: "2–5 business days",
  /** Days after delivery during which an item can be exchanged. */
  exchangeDays: 7,
};

export type PaymentMethodId = "cod" | "wallet" | "card" | "bank";

export const paymentMethods: { id: PaymentMethodId; label: string; note: string }[] = [
  { id: "cod", label: "Cash on Delivery", note: "Pay the courier in cash when your order arrives." },
  { id: "wallet", label: "JazzCash / Easypaisa", note: "Pay from your mobile wallet." },
  { id: "card", label: "Debit / credit card", note: "Visa or Mastercard." },
  { id: "bank", label: "Bank transfer", note: "Your order ships once the payment is confirmed." },
];

/** Delivery charge for an order whose goods come to `amount` (after set savings). */
export function deliveryCharge(amount: number) {
  return amount <= 0 || amount >= storePolicy.freeDeliveryFrom ? 0 : storePolicy.deliveryFee;
}

/** Short promise lines, used in the announcement bar, menus and product pages. */
export const promiseText = {
  freeDelivery: `Free delivery over ${money(storePolicy.freeDeliveryFrom)}`,
  deliveryFee: `${money(storePolicy.deliveryFee)} delivery on smaller orders`,
  deliveryTime: `Delivered in ${storePolicy.deliveryTime}`,
  exchange: `${storePolicy.exchangeDays}-day size exchange`,
  cashOnDelivery: "Cash on Delivery available",
};
