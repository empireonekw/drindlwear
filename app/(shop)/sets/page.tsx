"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n";
import { SetCard } from "@/components/set-card";
import { useStore } from "@/components/store";
import { setPricing } from "@/lib/sets";

export default function SetsPage() {
  const { sets, products } = useStore();
  const { t } = useI18n();
  const priced = sets.flatMap((set) => {
    const pricing = setPricing(set, products);
    return pricing ? [{ set, pricing }] : [];
  });

  return (
    <div className="mx-auto max-w-[1360px] px-8 pb-24 max-[520px]:px-4">
      <nav aria-label={t("Breadcrumb")} className="py-6 text-[12px] text-[#786565]">
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li><Link href="/" className="hover:text-[#781d2d]">{t("Home")}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-[#211c1d]">{t("Complete sets")}</li>
        </ol>
      </nav>
      <h1 className="m-0 mt-4 text-center font-serif text-[42px] font-normal text-[#781d2d] max-[520px]:text-[34px]">
        {t("Complete sets")}
      </h1>
      <p className="mx-auto mb-10 mt-3 max-w-[560px] text-center text-[15px] text-[#786565]">
        {t("Whole outfits, put together for you. Choose a size for each piece and save on the set.")}
      </p>

      {priced.length ? (
        <div className="grid grid-cols-3 gap-6 max-[1000px]:grid-cols-2 max-[620px]:grid-cols-1">
          {priced.map(({ set, pricing }) => (
            <SetCard key={set.id} set={set} pricing={pricing} />
          ))}
        </div>
      ) : (
        <p className="py-24 text-center text-[#786565]">{t("No sets available right now.")}</p>
      )}
    </div>
  );
}
