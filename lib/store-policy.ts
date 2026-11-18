import type { I18n } from "./i18n";

/**
 * The store's customer promises, in one place. Every page that mentions
 * delivery, exchanges or payment reads from here, so a change made here
 * shows up everywhere.
 */
export const storePolicy = {
  /**
   * Flat shipping charge per order, in euros. `null` while it hasn't been
   * decided: nothing is charged and the cart and checkout say "To be confirmed".
   * There is no free-shipping threshold.
   */
  deliveryFee: null as number | null,
  deliveryTime: "2–5 business days",
  /** Days after delivery during which an item can be exchanged. */
  exchangeDays: 7,
};

/** Bank transfer is the only way to pay. */
export type PaymentMethodId = "bank";

export const paymentMethods: { id: PaymentMethodId; label: string; note: string }[] = [
  {
    id: "bank",
    label: "Bank transfer",
    note: "Transfer the total to our bank account with your order number as the reference. Your order ships once the payment arrives.",
  },
];

/** True once a shipping charge has been set in `storePolicy.deliveryFee`. */
export const deliveryDecided = storePolicy.deliveryFee !== null;

/** Shipping charged on an order whose goods come to `amount`. 0 while undecided. */
export function deliveryCharge(amount: number) {
  return amount <= 0 ? 0 : (storePolicy.deliveryFee ?? 0);
}

/** How the shipping line reads in the cart and checkout, in the shop's language. */
export const deliveryLabel = (charge: number, { t, money }: Pick<I18n, "t" | "money">) =>
  deliveryDecided ? money(charge) : t("To be confirmed");

/** Short promise lines, used in the announcement bar, menus and product pages, in the shop's language. */
export function promiseText({ t, money }: Pick<I18n, "t" | "money">) {
  return {
    deliveryTime: t("Delivered in {time}", { time: t(storePolicy.deliveryTime) }),
    shippingCost: deliveryDecided
      ? t("{amount} shipping per order", { amount: money(storePolicy.deliveryFee ?? 0) })
      : t("Shipping costs to be confirmed"),
    exchange: t("{days}-day size exchange", { days: storePolicy.exchangeDays }),
    bankTransfer: t("Secure payment by bank transfer"),
  };
}
