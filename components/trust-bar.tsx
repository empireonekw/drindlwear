import { Banknote, MessageCircle, RotateCcw, Truck } from "lucide-react";

import { money } from "@/lib/data";
import { promiseText, storePolicy } from "@/lib/store-policy";

const items = [
  {
    icon: Truck,
    title: promiseText.freeDelivery,
    text: `${money(storePolicy.deliveryFee)} on smaller orders`,
  },
  { icon: Banknote, title: "Cash on Delivery", text: "Or JazzCash, Easypaisa, card or bank transfer" },
  { icon: RotateCcw, title: promiseText.exchange, text: "Wrong size? Swap it after delivery" },
  { icon: MessageCircle, title: "Help choosing a size", text: "Fit notes and a size guide on product pages" },
];

/** The store's key promises in a row; reads from lib/store-policy.ts. */
export function TrustBar() {
  return (
    <section aria-label="Why shop with us" className="border-y border-[#eadfdb] bg-white">
      <ul className="mx-auto my-0 grid max-w-[1360px] list-none grid-cols-4 gap-6 px-8 py-6 max-[1000px]:grid-cols-2 max-[520px]:grid-cols-1 max-[520px]:gap-4 max-[520px]:px-4">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3">
            <Icon size={26} strokeWidth={1.6} className="shrink-0 text-[#781d2d]" aria-hidden="true" />
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-[13px] text-[#786565]">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
