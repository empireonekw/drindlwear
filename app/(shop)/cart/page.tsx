"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n";
import { useStore } from "@/components/store";
import { CartItem, lineLimit, Product, requiresSize } from "@/lib/data";
import { setDiscounts, totalSetDiscount } from "@/lib/sets";
import { deliveryCharge, deliveryDecided, deliveryLabel } from "@/lib/store-policy";

const primaryButton =
  "inline-flex w-full items-center justify-center bg-[#781d2d] px-7 py-4 text-[12px] font-medium uppercase tracking-[1.5px] text-white transition hover:bg-[#5e1622] disabled:cursor-not-allowed disabled:bg-[#786565]";

type Row = CartItem & { product: Product };

export default function Cart() {
  const { items, products, sets, quantity, remove } = useStore();
  const i18n = useI18n();
  const { t, money } = i18n;
  const rows: Row[] = items.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return product ? [{ ...item, product }] : [];
  });

  const subtotal = rows.reduce((sum, row) => sum + row.qty * row.product.price, 0);
  const discounts = setDiscounts(items, products, sets);
  const discount = totalSetDiscount(discounts);
  const goods = subtotal - discount;
  const delivery = deliveryCharge(goods);
  const total = goods + delivery;

  const limit = (row: Row) => lineLimit(items, row.product, row);
  const missingSize = (row: Row) => requiresSize(row.product.category) && !row.size;
  const inventoryIssue = rows.some((row) => row.qty > limit(row) || missingSize(row));

  // Set pieces are shown together under their set; everything else below.
  const setGroups = discounts.map((entry) => ({
    ...entry,
    rows: rows.filter((row) => row.setId === entry.set.id),
  }));
  const looseRows = rows.filter(
    (row) => !row.setId || !sets.some((set) => set.id === row.setId),
  );

  const renderRow = (row: Row) => {
    const { id, qty, size, setId, product } = row;
    const available = limit(row);
    const sizeNote = size ? " " + t("in size {size}", { size }) : "";
    return (
      <li key={`${id}-${size ?? ""}-${setId ?? ""}`} className="flex gap-5 border-b border-[#eadfdc] py-5 max-[520px]:gap-3">
        <img src={product.image} alt="" className="h-[135px] w-[100px] shrink-0 object-cover max-[520px]:h-[110px] max-[520px]:w-[82px]" />
        <div className="min-w-0 flex-1">
          <Link href={`/product/${id}`} className="font-semibold hover:text-[#781d2d]">
            {product.name}
          </Link>
          <p className="m-0 mt-1 text-sm text-[#786565]">
            {t(product.color)}
            {size ? ` · ${t("Size {size}", { size })}` : ""}
          </p>
          {missingSize(row) ? (
            <p role="alert" className="m-0 mt-1 text-[13px] text-[#781d2d]">
              {t("No size chosen.")}{" "}
              <Link className="underline" href={`/product/${id}`}>{t("Choose a size")}</Link> {t("and remove this line.")}
            </p>
          ) : available <= 0 ? (
            <p role="alert" className="m-0 mt-1 text-[13px] text-[#781d2d]">{t("Out of stock")}{sizeNote}</p>
          ) : qty > available ? (
            <p role="alert" className="m-0 mt-1 text-[13px] text-[#781d2d]">
              {t("Only {count} left", { count: available })}{sizeNote}. {t("Reduce quantity to continue.")}
            </p>
          ) : available <= 3 ? (
            <p className="m-0 mt-1 text-[13px] text-[#786565]">{t("Only {count} left", { count: available })}{sizeNote}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center border border-[#cfc3bf]">
              <button
                type="button"
                aria-label={t("Decrease {name} quantity", { name: product.name })}
                onClick={() => quantity(id, qty - 1, size, setId)}
                className="h-9 w-9"
              >
                −
              </button>
              <span className="min-w-6 text-center text-sm">{qty}</span>
              <button
                type="button"
                aria-label={t("Increase {name} quantity", { name: product.name })}
                disabled={qty >= available}
                onClick={() => quantity(id, qty + 1, size, setId)}
                className="h-9 w-9 disabled:text-[#c9bdb9]"
              >
                +
              </button>
            </div>
            <button type="button" onClick={() => remove(id, size, setId)} className="text-xs underline underline-offset-2">
              {t("Remove")}
            </button>
          </div>
        </div>
        <strong className="shrink-0 text-sm">{money(product.price * qty)}</strong>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-[1360px] px-8 max-[520px]:px-4">
      <h1 className="m-0 mt-9 text-center font-serif text-[42px] font-normal text-[#781d2d]">{t("Cart")}</h1>
      {!rows.length ? (
        <div className="py-24 text-center text-[#786565]">
          <p>{t("Your cart is empty.")}</p>
          <Link href="/collections/all" className={`${primaryButton} mt-4 w-auto`}>
            {t("Continue shopping")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-12 pb-24 pt-10 max-[850px]:grid-cols-1">
          <div>
            {setGroups.map((group) => (
              <section
                key={group.set.id}
                aria-label={t(group.set.name)}
                className="mb-6 border border-[#eadfdb] bg-white px-5 pt-4 max-[520px]:px-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#eadfdc] pb-3">
                  <Link href={`/sets/${group.set.id}`} className="font-serif text-[22px] text-[#781d2d] hover:underline">
                    {t(group.set.name)}
                  </Link>
                  {group.amount > 0 && (
                    <span className="text-sm font-semibold text-[#1f6b44]">
                      {t("Set price · you save {amount}", { amount: money(group.amount) })}
                    </span>
                  )}
                </div>
                {group.incomplete && (
                  <p className="m-0 mt-3 bg-[#f6eeec] px-3 py-2 text-[13px]">
                    {group.completeSets === 0
                      ? t("A piece of this set is missing, so the set price doesn't apply.")
                      : t("Some pieces have extra quantity; the set price applies to complete sets only.")}{" "}
                    <Link href={`/sets/${group.set.id}`} className="underline">{t("View set")}</Link>
                  </p>
                )}
                <ul className="m-0 list-none p-0 [&>li:last-child]:border-b-0">{group.rows.map(renderRow)}</ul>
              </section>
            ))}
            {looseRows.length > 0 && <ul className="m-0 list-none p-0">{looseRows.map(renderRow)}</ul>}
          </div>

          <aside className="h-max bg-[#fbf5f2] p-7">
            <h2 className="m-0 font-serif text-[26px] font-normal">{t("Order summary")}</h2>
            <dl className="m-0 mt-4 text-sm">
              <div className="flex justify-between border-b border-[#eadfdc] py-4">
                <dt>{t("Subtotal")}</dt>
                <dd className="m-0 font-semibold">{money(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between border-b border-[#eadfdc] py-4 text-[#1f6b44]">
                  <dt>{t("Set savings")}</dt>
                  <dd className="m-0 font-semibold">−{money(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-b border-[#eadfdc] py-4">
                <dt>{t("Shipping")}</dt>
                <dd className={`m-0 ${deliveryDecided ? "" : "text-[#786565]"}`}>{deliveryLabel(delivery, i18n)}</dd>
              </div>
              <div className="flex justify-between py-4 text-base">
                <dt className="font-semibold">{t("Total")}</dt>
                <dd className="m-0 font-semibold">{money(total)}</dd>
              </div>
            </dl>
            {inventoryIssue ? (
              <button type="button" className={primaryButton} disabled>
                {t("Update cart to check out")}
              </button>
            ) : (
              <Link className={primaryButton} href="/checkout">
                {t("Proceed to checkout")}
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
