"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { X } from "lucide-react";

import type { Product } from "@/lib/data";
import { measuringTips, sizeChartFor } from "@/lib/size-guide";

export type SizeGuideHandle = { open: () => void };

/** Size guide in a native <dialog>: Esc closes it and focus stays inside. */
export const SizeGuide = forwardRef<SizeGuideHandle, { product: Product }>(
  function SizeGuide({ product }, ref) {
    const dialog = useRef<HTMLDialogElement>(null);
    useImperativeHandle(ref, () => ({ open: () => dialog.current?.showModal() }));
    const chart = sizeChartFor(product);
    const close = () => dialog.current?.close();

    return (
      <dialog
        ref={dialog}
        aria-labelledby="size-guide-title"
        // A click on the backdrop lands on the <dialog> itself.
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
        className="m-auto w-[min(640px,calc(100vw-32px))] max-h-[85dvh] overflow-y-auto rounded-sm p-0 text-[#211c1d] shadow-2xl backdrop:bg-[rgb(25_20_21/55%)]"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="size-guide-title" className="m-0 font-serif text-[28px] text-[#781d2d]">
                Size guide
              </h2>
              <p className="m-0 mt-1 text-sm text-[#786565]">{product.name}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close size guide"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#e8ddda] hover:bg-[#f5eae8]"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {product.fit && (
            <p className="mb-5 rounded-sm bg-[#f3e6e3] px-4 py-3 text-sm">
              <strong>Fit:</strong> {product.fit}
              {product.lengthCm ? ` · Length ${product.lengthCm} cm` : ""}
            </p>
          )}

          {chart ? (
            <>
              <h3 className="mb-2 mt-0 text-xs uppercase tracking-[1.6px] text-[#786565]">
                {chart.title} · body measurements in cm
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      {chart.columns.map((column) => (
                        <th key={column} scope="col" className="border-b border-[#e8ddda] px-3 py-2 font-semibold">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((row) => (
                      <tr key={row[0]} className="even:bg-[#fbf7f5]">
                        {row.map((cell, index) =>
                          index === 0 ? (
                            <th key={index} scope="row" className="px-3 py-2 font-semibold">
                              {cell}
                            </th>
                          ) : (
                            <td key={index} className="px-3 py-2">
                              {cell}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-[#786565]">
                Between two sizes? Choose the larger one for a more relaxed bodice.
              </p>
            </>
          ) : (
            <p className="text-sm">
              A size chart for this item is coming soon. Contact us and we&apos;ll help you
              choose a size.
            </p>
          )}

          <h3 className="mb-2 mt-6 text-xs uppercase tracking-[1.6px] text-[#786565]">
            How to measure
          </h3>
          <dl className="m-0 grid gap-3 text-sm">
            {measuringTips.map((item) => (
              <div key={item.label}>
                <dt className="font-semibold">{item.label}</dt>
                <dd className="m-0 text-[#5e5050]">{item.tip}</dd>
              </div>
            ))}
          </dl>
        </div>
      </dialog>
    );
  },
);
