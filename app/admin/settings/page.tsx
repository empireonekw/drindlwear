"use client";

import { useState } from "react";
import { ImageIcon, KeyRound, ShieldCheck, Truck } from "lucide-react";

import { Badge, Button, Card, Field, inputClass, PageHeader, useToast } from "@/components/admin/ui";
import { useStore } from "@/components/store";
import { money } from "@/lib/data";
import { paymentMethods, storePolicy } from "@/lib/store-policy";

export default function Settings() {
  const store = useStore();
  const toast = useToast();
  const [name, setName] = useState(store.shopName);
  const [error, setError] = useState("");

  function save() {
    if (!name.trim()) {
      setError("Enter a shop name.");
      return;
    }
    setError("");
    store.setShopName(name.trim());
    toast("Store details saved.");
  }

  const policyRows: [string, string][] = [
    ["Shipping per order", storePolicy.deliveryFee === null ? "Not decided yet" : money(storePolicy.deliveryFee)],
    ["Free shipping", "None"],
    ["Delivery time", storePolicy.deliveryTime],
    ["Size exchange window", `${storePolicy.exchangeDays} days after delivery`],
  ];

  return (
    <>
      <PageHeader title="Settings" description="Store details, delivery rules and how the admin is secured." />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Store details" action={<Button variant="primary" size="sm" onClick={save} disabled={name.trim() === store.shopName}>Save</Button>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop name" htmlFor="shop-name" error={error}>
              <input id="shop-name" className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Currency" htmlFor="currency" hint="Prices are shown as “€149.90”.">
              <select id="currency" className={inputClass} disabled defaultValue="EUR">
                <option value="EUR">Euro (EUR)</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Delivery & exchanges" description="Shown in the announcement bar, product pages, cart and checkout." action={<Truck size={18} className="text-taupe" aria-hidden="true" />}>
          <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-y-3 text-[14px]">
            {policyRows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-taupe">{label}</dt>
                <dd className="m-0 text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 mt-4 rounded-xl bg-[#fbf5f2] px-3.5 py-2.5 text-[12px] text-taupe">
            These rules live in <code className="text-charcoal">lib/store-policy.ts</code>, so every page shows the same numbers.
          </p>
        </Card>

        <Card title="Payment methods" description="Offered at checkout.">
          <ul className="m-0 grid list-none gap-3 p-0">
            {paymentMethods.map((method) => (
              <li key={method.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#f1e8e5] px-4 py-3">
                <span>
                  <span className="block text-[14px] font-medium">{method.label}</span>
                  <span className="block text-[12px] text-taupe">{method.note}</span>
                </span>
                <Badge tone="green">Active</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Security & storage">
          <ul className="m-0 grid list-none gap-4 p-0 text-[14px]">
            <li className="flex gap-3">
              <ShieldCheck size={18} className="mt-0.5 flex-none text-burgundy" aria-hidden="true" />
              <span>
                <strong className="block font-medium">Admin access</strong>
                <span className="text-taupe">Only accounts with the admin role can open these pages. Checked on the server for every request.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <KeyRound size={18} className="mt-0.5 flex-none text-burgundy" aria-hidden="true" />
              <span>
                <strong className="block font-medium">Admin password</strong>
                <span className="text-taupe">
                  Change <code className="text-charcoal">ADMIN_PASSWORD</code> in <code className="text-charcoal">.env.local</code>, then run{" "}
                  <code className="text-charcoal">npm run seed:admin</code>.
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <ImageIcon size={18} className="mt-0.5 flex-none text-burgundy" aria-hidden="true" />
              <span>
                <strong className="block font-medium">Product photos</strong>
                <span className="text-taupe">Uploaded photos are stored in MongoDB. Products, orders and settings are still preview data kept in this browser.</span>
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
