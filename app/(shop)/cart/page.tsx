"use client";

import Link from "next/link";

import { useStore } from "@/components/store";
import { CartItem, lineLimit, money, Product, requiresSize } from "@/lib/data";
import { setDiscounts, totalSetDiscount } from "@/lib/sets";
import { deliveryCharge, storePolicy } from "@/lib/store-policy";

const primaryButton =
  "inline-flex w-full items-center justify-center bg-[#781d2d] px-7 py-4 text-[12px] font-medium uppercase tracking-[1.5px] text-white transition hover:bg-[#5e1622] disabled:cursor-not-allowed disabled:bg-[#786565]";

type Row = CartItem & { product: Product };

export default function Cart() {
  const { items, products, sets, quantity, remove } = useStore();
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
  const toFreeDelivery = Math.max(0, storePolicy.freeDeliveryFrom - goods);
  const freeProgress = Math.min(100, Math.round((goods / storePolicy.freeDeliveryFrom) * 100));

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
    const sizeNote = size ? ` in size ${size}` : "";
    return (
      <li key={`${id}-${size ?? ""}-${setId ?? ""}`} className="flex gap-5 border-b border-[#eadfdc] py-5 max-[520px]:gap-3">
        <img src={product.image} alt="" className="h-[135px] w-[100px] shrink-0 object-cover max-[520px]:h-[110px] max-[520px]:w-[82px]" />
        <div className="min-w-0 flex-1">
          <Link href={`/product/${id}`} className="font-semibold hover:text-[#781d2d]">
            {product.name}
          </Link>
          <p className="m-0 mt-1 text-sm text-[#786565]">
            {product.color}
            {size ? ` · Size ${size}` : ""}
          </p>
          {missingSize(row) ? (
            <p role="alert" className="m-0 mt-1 text-[13px] text-[#781d2d]">
              No size chosen.{" "}
              <Link className="underline" href={`/product/${id}`}>Choose a size</Link> and remove this line.
            </p>
          ) : available <= 0 ? (
            <p role="alert" className="m-0 mt-1 text-[13px] text-[#781d2d]">Out of stock{sizeNote}</p>
          ) : qty > available ? (
            <p role="alert" className="m-0 mt-1 text-[13px] text-[#781d2d]">
              Only {available} left{sizeNote}. Reduce quantity to continue.
            </p>
          ) : available <= 3 ? (
            <p className="m-0 mt-1 text-[13px] text-[#786565]">Only {available} left{sizeNote}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center border border-[#cfc3bf]">
              <button
                type="button"
                aria-label={`Decrease ${product.name} quantity`}
                onClick={() => quantity(id, qty - 1, size, setId)}
                className="h-9 w-9"
              >
                −
              </button>
              <span className="min-w-6 text-center text-sm">{qty}</span>
              <button
                type="button"
                aria-label={`Increase ${product.name} quantity`}
                disabled={qty >= available}
                onClick={() => quantity(id, qty + 1, size, setId)}
                className="h-9 w-9 disabled:text-[#c9bdb9]"
              >
                +
              </button>
            </div>
            <button type="button" onClick={() => remove(id, size, setId)} className="text-xs underline underline-offset-2">
              Remove
            </button>
          </div>
        </div>
        <strong className="shrink-0 text-sm">{money(product.price * qty)}</strong>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-[1360px] px-8 max-[520px]:px-4">
      <h1 className="m-0 mt-9 text-center font-serif text-[42px] font-normal text-[#781d2d]">Cart</h1>
      {!rows.length ? (
        <div className="py-24 text-center text-[#786565]">
          <p>Your cart is empty.</p>
          <Link href="/collections/all" className={`${primaryButton} mt-4 w-auto`}>
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-12 pb-24 pt-10 max-[850px]:grid-cols-1">
          <div>
            {setGroups.map((group) => (
              <section
                key={group.set.id}
                aria-label={group.set.name}
                className="mb-6 border border-[#eadfdb] bg-white px-5 pt-4 max-[520px]:px-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#eadfdc] pb-3">
                  <Link href={`/sets/${group.set.id}`} className="font-serif text-[22px] text-[#781d2d] hover:underline">
                    {group.set.name}
                  </Link>
                  {group.amount > 0 && (
                    <span className="text-sm font-semibold text-[#1f6b44]">
                      Set price · you save {money(group.amount)}
                    </span>
                  )}
                </div>
                {group.incomplete && (
                  <p className="m-0 mt-3 bg-[#f6eeec] px-3 py-2 text-[13px]">
                    {group.completeSets === 0
                      ? "A piece of this set is missing, so the set price doesn't apply."
                      : "Some pieces have extra quantity; the set price applies to complete sets only."}{" "}
                    <Link href={`/sets/${group.set.id}`} className="underline">View set</Link>
                  </p>
                )}
                <ul className="m-0 list-none p-0 [&>li:last-child]:border-b-0">{group.rows.map(renderRow)}</ul>
              </section>
            ))}
            {looseRows.length > 0 && <ul className="m-0 list-none p-0">{looseRows.map(renderRow)}</ul>}
          </div>

          <aside className="h-max bg-[#fbf5f2] p-7">
            <h2 className="m-0 font-serif text-[26px] font-normal">Order summary</h2>
            <div className="mt-4 bg-white p-4">
              <p className="m-0 text-sm" aria-live="polite">
                {toFreeDelivery > 0 ? (
                  <>
                    Add <strong>{money(toFreeDelivery)}</strong> more for free delivery.
                  </>
                ) : (
                  <strong className="text-[#1f6b44]">You&apos;ve unlocked free delivery.</strong>
                )}
              </p>
              <div
                role="progressbar"
                aria-label="Progress to free delivery"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={freeProgress}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eadfdb]"
              >
                <div
                  className={`h-full rounded-full ${toFreeDelivery > 0 ? "bg-[#781d2d]" : "bg-[#1f6b44]"}`}
                  style={{ width: `${freeProgress}%` }}
                />
              </div>
            </div>
            <dl className="m-0 mt-4 text-sm">
              <div className="flex justify-between border-b border-[#eadfdc] py-4">
                <dt>Subtotal</dt>
                <dd className="m-0 font-semibold">{money(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between border-b border-[#eadfdc] py-4 text-[#1f6b44]">
                  <dt>Set savings</dt>
                  <dd className="m-0 font-semibold">−{money(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-b border-[#eadfdc] py-4">
                <dt>Delivery</dt>
                <dd className={`m-0 ${delivery === 0 ? "font-semibold text-[#1f6b44]" : ""}`}>
                  {delivery === 0 ? "Free" : money(delivery)}
                </dd>
              </div>
              <div className="flex justify-between py-4 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="m-0 font-semibold">{money(total)}</dd>
              </div>
            </dl>
            {inventoryIssue ? (
              <button type="button" className={primaryButton} disabled>
                Update cart to check out
              </button>
            ) : (
              <Link className={primaryButton} href="/checkout">
                Proceed to checkout
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
