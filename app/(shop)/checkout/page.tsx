"use client";

import { useState } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";

import { useI18n } from "@/components/i18n";
import { useStore } from "@/components/store";
import { lineLimit, requiresSize } from "@/lib/data";
import { setDiscounts, totalSetDiscount } from "@/lib/sets";
import { deliveryCharge, deliveryDecided, deliveryLabel, PaymentMethodId, paymentMethods } from "@/lib/store-policy";

const addressFields = [
  ["first", "First Name"],
  ["last", "Last Name"],
  ["email", "E-Mail"],
  ["phone", "Phone Number"],
  ["street", "Street and house number"],
  ["zip", "Postal Code"],
  ["city", "City"],
];

export default function Checkout() {
  const { items, products, sets, clear, checkout, user } = useStore();
  const i18n = useI18n();
  const { t, money } = i18n;
  // Signed-in customers get their saved details filled in.
  const [firstName, ...lastNames] = (user?.name ?? "").split(" ");
  const prefill: Record<string, string> = user
    ? { first: firstName, last: lastNames.join(" "), email: user.email, phone: user.phone ?? "" }
    : {};
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const payment: PaymentMethodId = "bank";
  const [placed, setPlaced] = useState<{ id: string; total: number; method: string } | null>(null);
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (products.find((product) => product.id === item.id)?.price || 0) * item.qty,
    0,
  );
  const discount = totalSetDiscount(setDiscounts(items, products, sets));
  const delivery = deliveryCharge(subtotal - discount);
  const total = subtotal - discount + delivery;
  const inventoryIssues = items.flatMap((item) => {
    const key = `${item.id}-${item.size ?? ""}-${item.setId ?? ""}`;
    const product = products.find((entry) => entry.id === item.id);
    if (!product) {
      return [{ key, message: t("This product is no longer available.") }];
    }
    if (requiresSize(product.category) && !item.size) {
      return [{ key, message: t("Choose a size for {pieces}.", { pieces: product.name }) }];
    }
    const available = lineLimit(items, product, item);
    if (item.qty <= available) return [];
    const sizeNote = item.size ? " " + t("in size {size}", { size: item.size }) : "";
    return [{
      key,
      message: available <= 0
        ? t("{name} is out of stock{size}.", { name: product.name, size: sizeNote })
        : t("Only {count} × {name} left{size}; your cart has {qty}.", { count: available, name: product.name, size: sizeNote, qty: item.qty }),
    }];
  });

  function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;

    const formData = new FormData(event.currentTarget);
    setError("");
    setSubmitting(true);
    try {
      const order = checkout({
        first: String(formData.get("first")),
        last: String(formData.get("last")),
        email: String(formData.get("email")),
        phone: String(formData.get("phone")),
        street: String(formData.get("street")),
        zip: String(formData.get("zip")),
        city: String(formData.get("city")),
      }, payment);
      setPlaced({ id: order.id, total: order.total, method: order.paymentMethod ?? "" });
      clear();
      setDone(true);
    } catch (orderError) {
      setError(
        orderError instanceof Error ? orderError.message : t("Could not place order."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <h1 className="page-heading [text-align:center] [font:500_42px_var(--font-serif)] [margin:35px_0_14px] [color:#781d2d]">{t("Checkout")}</h1>
      {done ? (
        <div className="empty [text-align:center] [padding:100px_0] [color:#786565]">
          <h2>{t("Thank you!")}</h2>
          {placed && (
            <p>
              {t("Order")} <strong>{placed.id}</strong> · {money(placed.total)} · {t(placed.method)}
            </p>
          )}
          <p>
            {placed
              ? t("Please transfer the total to our bank account with {reference} as the reference. We'll ship as soon as the payment arrives.", { reference: placed.id })
              : t("Please transfer the total to our bank account. We'll ship as soon as the payment arrives.")}
          </p>
          <Link className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" href="/">
            {t("BACK TO HOME")}
          </Link>
        </div>
      ) : (
        <form key={user?.email ?? "guest"} className="form-panel [max-width:520px] [margin:40px_auto_90px] [&_label]:[display:block] [&_label]:[margin:17px_0_8px] [&_label]:[font-size:12px] [&_input]:[width:100%] [&_input]:[padding:14px] [&_input]:[border:1px_solid_#dcd0cd] [&_textarea]:[width:100%] [&_textarea]:[padding:14px] [&_textarea]:[border:1px_solid_#dcd0cd] [&_.btn]:[width:100%] [&_.btn]:[margin-top:20px]" onSubmit={placeOrder}>
          <div className="notice [background:#f6eeec] [border:1px_solid_#e8d2d0] [padding:13px_18px] [font-size:12px] [margin-bottom:20px]">
            {t("UI preview: orders are saved in this browser only. No payment is processed.")}
          </div>
          {error && <p role="alert">{error}</p>}
          {inventoryIssues.length > 0 && (
            <div className="stock-error [color:#781d2d] [font-size:13px]" role="alert">
              <p>{t("Please update your cart before ordering:")}</p>
              <ul>
                {inventoryIssues.map((issue) => (
                  <li key={issue.key}>{issue.message}</li>
                ))}
              </ul>
              <Link className="underline" href="/cart">{t("Return to cart")}</Link>
            </div>
          )}
          <h2 className="text-2xl font-serif">{t("Shipping Address")}</h2>
          {addressFields.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`checkout-${key}`}>{t(label)}</label>
              <input
                id={`checkout-${key}`}
                name={key}
                defaultValue={prefill[key]}
                required
                type={
                  key === "email" ? "email" : key === "phone" ? "tel" : "text"
                }
                autoComplete={
                  key === "phone"
                    ? "tel"
                    : key === "street"
                      ? "street-address"
                      : undefined
                }
                placeholder={key === "phone" ? "+49 151 23456789" : undefined}
              />
            </div>
          ))}
          <fieldset className="mt-6 border-0 p-0">
            <legend className="mb-2 font-serif text-2xl">{t("Payment")}</legend>
            {/* Bank transfer is the only method, so it's shown as a fact, not a choice. */}
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-start gap-3 border border-[#781d2d] bg-white p-4 ring-1 ring-[#781d2d]">
                <Landmark size={20} className="mt-0.5 flex-none text-[#781d2d]" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold">{t(method.label)}</span>
                  <span className="block text-[13px] text-[#786565]">{t(method.note)}</span>
                </span>
              </div>
            ))}
          </fieldset>
          <dl className="mt-5 grid grid-cols-[1fr_auto] gap-y-1 text-sm">
            <dt>{t("Subtotal")}</dt>
            <dd className="m-0 text-right">{money(subtotal)}</dd>
            {discount > 0 && (
              <>
                <dt className="text-[#1f6b44]">{t("Set savings")}</dt>
                <dd className="m-0 text-right text-[#1f6b44]">−{money(discount)}</dd>
              </>
            )}
            <dt>{t("Shipping")}</dt>
            <dd className={`m-0 text-right ${deliveryDecided ? "" : "text-[#786565]"}`}>{deliveryLabel(delivery, i18n)}</dd>
            <dt className="pt-1 text-base font-bold">{t("Total")}</dt>
            <dd className="m-0 pt-1 text-right text-base font-bold">{money(total)}</dd>
          </dl>
          <button
            disabled={!items.length || submitting || inventoryIssues.length > 0}
            className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]"
          >
            {submitting ? t("PLACING ORDER...") : t("PLACE ORDER")}
          </button>
        </form>
      )}
    </div>
  );
}
