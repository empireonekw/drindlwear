"use client";

import Link from "next/link";

import { useStore } from "@/components/store";
import { availableStock, money, requiresSize } from "@/lib/data";

export default function Cart() {
  const { items, products, quantity, remove } = useStore();
  const rows = items
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.id),
    }))
    .filter((item) => item.product);
  const total = rows.reduce(
    (sum, item) => sum + item.qty * (item.product?.price || 0),
    0,
  );
  // Stock is per product, so add up every size of the same product.
  const productQty = (id: number) =>
    rows.reduce((sum, row) => (row.id === id ? sum + row.qty : sum), 0);
  const missingSize = (row: (typeof rows)[number]) =>
    Boolean(row.product && requiresSize(row.product.category) && !row.size);
  /** Units of this line's size still available, after other sizes in the cart. */
  const lineAvailable = (row: (typeof rows)[number]) =>
    row.product
      ? Math.min(
          availableStock(row.product, row.size),
          row.product.stock - (productQty(row.id) - row.qty),
        )
      : 0;
  const inventoryIssue = rows.some(
    (row) => !row.product || row.qty > lineAvailable(row) || missingSize(row),
  );

  return (
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <h1 className="page-heading [text-align:center] [font:42px_Georgia,serif] [margin:35px_0_14px] [color:#781d2d]">Cart</h1>
      {!rows.length ? (
        <div className="empty [text-align:center] [padding:100px_0] [color:#777]">
          <p>Your cart is empty.</p>
          <Link href="/collections/all" className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]">
            CONTINUE SHOPPING
          </Link>
        </div>
      ) : (
        <div className="cart-layout [display:grid] [grid-template-columns:minmax(0,_2fr)_minmax(0,_1fr)] [gap:50px] [padding:40px_0_90px] max-[850px]:[grid-template-columns:minmax(0,_1fr)] [&_>_*]:[min-width:0] max-[850px]:[&_>_*]:[min-width:0]">
          <div>
            {rows.map(({ id, qty, size, product }) => (
              <div className="cart-item [display:flex] [gap:20px] [padding:20px_0] [border-bottom:1px_solid_#eee] [&_img]:[width:100px] [&_img]:[height:135px] [&_img]:[object-fit:cover] [&_.info]:[flex:1] motion-safe:[&_img]:[transition:transform_650ms_cubic-bezier(0.2,_0.7,_0.2,_1)]" key={`${id}-${size ?? ""}`}>
                <img src={product!.image} alt={product!.name} />
                <div className="info">
                  <Link href={`/product/${id}`}>
                    <strong>{product!.name}</strong>
                  </Link>
                  <p className="muted [color:#999]">
                    {product!.color}
                    {size ? ` · Size ${size}` : ""}
                  </p>
                  {missingSize({ id, qty, size, product }) && (
                    <p className="stock-error [color:#a32232] [font-size:13px]" role="alert">
                      No size chosen.{" "}
                      <Link className="underline" href={`/product/${id}`}>
                        Choose a size
                      </Link>{" "}
                      and remove this line.
                    </p>
                  )}
                  {(() => {
                    const available = lineAvailable({ id, qty, size, product });
                    const sizeNote = size ? ` in size ${size}` : "";
                    if (available <= 0) {
                      return <p className="stock-error [color:#a32232] [font-size:13px]" role="alert">Out of stock{sizeNote}</p>;
                    }
                    if (qty > available) {
                      return (
                        <p className="stock-error [color:#a32232] [font-size:13px]" role="alert">
                          Only {available} left{sizeNote}. Reduce quantity to continue.
                        </p>
                      );
                    }
                    if (available <= 3) {
                      return <p className="stock-note [color:#786565] [font-size:13px]">Only {available} left{sizeNote}</p>;
                    }
                    return null;
                  })()}
                  <div className="qty [display:flex] [gap:12px] [align-items:center] [&_button]:[border:1px_solid_#ddd] [&_button]:[padding:6px_12px]">
                    <button
                      aria-label={`Decrease ${product!.name} quantity`}
                      onClick={() => quantity(id, qty - 1, size)}
                    >
                      −
                    </button>
                    {qty}
                    <button
                      aria-label={`Increase ${product!.name} quantity`}
                      disabled={qty >= lineAvailable({ id, qty, size, product })}
                      onClick={() => quantity(id, qty + 1, size)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-xs underline mt-3"
                    onClick={() => remove(id, size)}
                  >
                    Remove
                  </button>
                </div>
                <strong>{money(product!.price * qty)}</strong>
              </div>
            ))}
          </div>

          <aside className="summary [background:#f7f5f1] [padding:30px] [height:max-content] [&_h3]:[font:26px_Georgia,serif] [&_.btn]:[width:100%] [&_.btn]:[margin-top:25px]">
            <h3>Order Summary</h3>
            <div className="row-line [display:flex] [align-items:center] [justify-content:space-between] [gap:15px] [padding:20px_0] [border-bottom:1px_solid_#eee] max-[520px]:[flex-wrap:wrap] max-[520px]:[row-gap:8px] max-[520px]:[&_>_:last-child]:[margin-left:auto]">
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="row-line [display:flex] [align-items:center] [justify-content:space-between] [gap:15px] [padding:20px_0] [border-bottom:1px_solid_#eee] max-[520px]:[flex-wrap:wrap] max-[520px]:[row-gap:8px] max-[520px]:[&_>_:last-child]:[margin-left:auto]">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="row-line [display:flex] [align-items:center] [justify-content:space-between] [gap:15px] [padding:20px_0] [border-bottom:1px_solid_#eee] max-[520px]:[flex-wrap:wrap] max-[520px]:[row-gap:8px] max-[520px]:[&_>_:last-child]:[margin-left:auto]">
              <strong>Total</strong>
              <strong>{money(total)}</strong>
            </div>
            {inventoryIssue ? (
              <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" disabled>
                UPDATE CART STOCK TO CHECKOUT
              </button>
            ) : (
              <Link className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" href="/checkout">
                PROCEED TO CHECKOUT
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
