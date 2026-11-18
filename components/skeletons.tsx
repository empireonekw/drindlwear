/**
 * Loading skeletons. Each route's loading.tsx renders one of these the moment
 * a link is clicked, so the new screen appears at once and fills in when its
 * content arrives. They copy the real page's layout so nothing jumps.
 */

import { LoadingLabel } from "./loading-label";

type BoneProps = { className?: string };

/** One grey placeholder block. Size and shape come from `className`. */
export function Bone({ className = "" }: BoneProps) {
  return <div aria-hidden="true" className={"skeleton rounded-md " + className} />;
}

/**
 * Wraps a skeleton: announces "Loading" to screen readers, and opts out of the
 * shop layout's fade-in so the placeholder shows immediately.
 */
function Loading({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className={"!animate-none " + className}>
      <LoadingLabel label={label} />
      {children}
    </div>
  );
}

const shopContainer = "mx-auto max-w-[1360px] px-8 max-[520px]:px-4";

function Lines({ count, last = "w-2/3" }: { count: number; last?: string }) {
  return (
    <div className="grid gap-2.5">
      {Array.from({ length: count }, (_, index) => (
        <Bone key={index} className={"h-3.5 " + (index === count - 1 ? last : "w-full")} />
      ))}
    </div>
  );
}

function ProductCardBone() {
  return (
    <div>
      <Bone className="aspect-[3/4] w-full rounded-none" />
      <Bone className="mt-3 h-4 w-3/4" />
      <Bone className="mt-2 h-3 w-1/3" />
      <Bone className="mt-2.5 h-4 w-1/4" />
    </div>
  );
}

function ProductCardsBone({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <div
      className={
        "grid gap-x-[18px] gap-y-[25px] max-[850px]:grid-cols-2 max-[520px]:gap-2.5 " +
        (columns === 3 ? "grid-cols-3 max-[1100px]:grid-cols-2" : "grid-cols-4")
      }
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardBone key={index} />
      ))}
    </div>
  );
}

function CenteredTitle({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <Bone className="h-10 w-[min(320px,70%)]" />
      {subtitle && <Bone className="mt-4 h-3 w-[min(220px,50%)]" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shop

export function HomeSkeleton() {
  return (
    <Loading label="the homepage">
      <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 pb-14 pt-8 sm:px-8 lg:min-h-[clamp(600px,calc(100svh-110px),780px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-12 lg:py-14">
        <div>
          <Bone className="h-3 w-56" />
          <Bone className="mt-7 h-14 w-[90%]" />
          <Bone className="mt-3 h-14 w-[70%]" />
          <div className="mt-7 max-w-[470px]">
            <Lines count={2} />
          </div>
          <div className="mt-9 flex gap-6">
            <Bone className="h-[54px] w-56 rounded-none" />
            <Bone className="h-[54px] w-40" />
          </div>
        </div>
        <div className="order-first mx-auto w-full max-w-[520px] lg:order-none lg:max-w-none lg:pl-16">
          <Bone className="aspect-[6/7] w-full rounded-b-[28px] rounded-t-[999px] sm:aspect-[4/5] lg:aspect-auto lg:h-[clamp(440px,calc(100svh-280px),600px)]" />
        </div>
      </div>
      <div className={shopContainer + " py-[70px] max-[520px]:py-[45px]"}>
        <CenteredTitle />
        <div className="mt-10 grid grid-cols-3 gap-[22px] max-[850px]:grid-cols-2 max-[520px]:gap-2.5">
          {[0, 1, 2].map((index) => (
            <Bone key={index} className="h-[450px] rounded-none max-[520px]:h-[260px]" />
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** Collections, search, wishlist: breadcrumb, title, toolbar and a product grid. */
export function CollectionSkeleton({ label = "products" }: { label?: string }) {
  return (
    <Loading label={label} className={shopContainer + " pb-20"}>
      <Bone className="my-6 h-3 w-40" />
      <div className="mt-4">
        <CenteredTitle />
      </div>
      <div className="mb-8 mt-10 flex items-center justify-between border-y border-[#eadfdc] py-3">
        <Bone className="h-4 w-28" />
        <Bone className="h-10 w-48" />
      </div>
      <div className="grid gap-8 min-[851px]:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden gap-6 min-[851px]:grid min-[851px]:content-start">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="grid gap-3">
              <Bone className="h-4 w-24" />
              <Bone className="h-3.5 w-40" />
              <Bone className="h-3.5 w-32" />
              <Bone className="h-3.5 w-36" />
            </div>
          ))}
        </div>
        <ProductCardsBone count={6} columns={3} />
      </div>
    </Loading>
  );
}

/** A simple grid page (wishlist, outfit sets). */
export function GridSkeleton({ label, columns = 4 }: { label: string; columns?: 3 | 4 }) {
  return (
    <Loading label={label} className={shopContainer + " pb-20 pt-10"}>
      <CenteredTitle />
      <div className="mt-10">
        <ProductCardsBone count={columns === 3 ? 6 : 8} columns={columns} />
      </div>
    </Loading>
  );
}

export function ProductSkeleton() {
  return (
    <Loading label="the product" className={shopContainer + " pb-20"}>
      <Bone className="my-6 h-3 w-56" />
      <div className="grid gap-10 min-[851px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 max-[520px]:grid-cols-1">
          <div className="grid content-start gap-3 max-[520px]:hidden">
            {[0, 1, 2, 3].map((index) => (
              <Bone key={index} className="aspect-[3/4] w-full rounded-none" />
            ))}
          </div>
          <Bone className="aspect-[3/4] w-full rounded-none" />
        </div>
        <div>
          <Bone className="h-3 w-24" />
          <Bone className="mt-4 h-10 w-4/5" />
          <Bone className="mt-5 h-6 w-28" />
          <div className="mt-6">
            <Lines count={3} />
          </div>
          <Bone className="mt-8 h-3.5 w-20" />
          <div className="mt-3 flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
              <Bone key={index} className="h-11 w-12 rounded-none" />
            ))}
          </div>
          <Bone className="mt-8 h-[54px] w-full rounded-none" />
          <div className="mt-6 grid gap-3 border-y border-[#eadfdc] py-5">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    </Loading>
  );
}

export function CartSkeleton({ label = "your cart" }: { label?: string }) {
  return (
    <Loading label={label} className={shopContainer}>
      <div className="mt-9 flex justify-center">
        <Bone className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-12 pb-24 pt-10 max-[850px]:grid-cols-1">
        <div>
          {[0, 1].map((index) => (
            <div key={index} className="flex gap-5 border-b border-[#eadfdc] py-5">
              <Bone className="h-[135px] w-[100px] flex-none rounded-none max-[520px]:h-[110px] max-[520px]:w-[82px]" />
              <div className="flex-1">
                <Bone className="h-4 w-1/2" />
                <Bone className="mt-2 h-3.5 w-1/3" />
                <Bone className="mt-5 h-9 w-32 rounded-none" />
              </div>
              <Bone className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="h-max bg-[#fbf5f2] p-7">
          <Bone className="h-7 w-44" />
          <div className="mt-6 grid gap-5">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-5 w-full" />
          </div>
          <Bone className="mt-6 h-[52px] w-full rounded-none" />
        </div>
      </div>
    </Loading>
  );
}

export function CheckoutSkeleton() {
  return (
    <Loading label="checkout" className={shopContainer}>
      <div className="mt-9 flex justify-center">
        <Bone className="h-10 w-48" />
      </div>
      <div className="mx-auto mb-[90px] mt-10 max-w-[520px]">
        <Bone className="h-11 w-full rounded-none" />
        <Bone className="mt-6 h-7 w-52" />
        {[0, 1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="mt-5">
            <Bone className="h-3 w-24" />
            <Bone className="mt-2 h-[50px] w-full rounded-none" />
          </div>
        ))}
        <Bone className="mt-8 h-[52px] w-full rounded-none" />
      </div>
    </Loading>
  );
}

export function AccountSkeleton() {
  return (
    <Loading label="your account" className="bg-[#fbf5f2]">
      <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-8 sm:px-8">
        <Bone className="h-3 w-32" />
        <Bone className="mt-6 h-3 w-24" />
        <Bone className="mt-3 h-11 w-64" />
        <Bone className="mt-3 h-3.5 w-80 max-w-full" />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#eee3e0] bg-white p-5">
            <div className="flex items-center gap-3">
              <Bone className="h-12 w-12 flex-none rounded-full" />
              <div className="flex-1">
                <Bone className="h-4 w-3/4" />
                <Bone className="mt-2 h-3 w-full" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 max-lg:hidden">
              {[0, 1, 2, 3, 4].map((index) => (
                <Bone key={index} className="h-4 w-2/3" />
              ))}
            </div>
          </div>
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="rounded-2xl border border-[#eee3e0] bg-white p-5">
                  <Bone className="h-10 w-10 rounded-xl" />
                  <Bone className="mt-4 h-3 w-16" />
                  <Bone className="mt-2 h-6 w-24" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#eee3e0] bg-white p-6">
              <div className="flex items-center gap-4">
                <Bone className="h-14 w-11 flex-none rounded-lg" />
                <div className="flex-1">
                  <Bone className="h-5 w-48" />
                  <Bone className="mt-2 h-3 w-36" />
                </div>
                <Bone className="h-6 w-20 rounded-full" />
              </div>
              <div className="mt-8 grid grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((index) => (
                  <Bone key={index} className="mx-auto h-9 w-9 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Loading>
  );
}

/** Information pages (shipping, FAQ, our story, contact, club). */
export function TextPageSkeleton({ label = "the page" }: { label?: string }) {
  return (
    <Loading label={label} className={shopContainer + " pb-24"}>
      <div className="mt-[35px]">
        <CenteredTitle />
      </div>
      <div className="mx-auto mt-12 grid max-w-[760px] gap-10">
        {[0, 1, 2].map((index) => (
          <div key={index}>
            <Bone className="h-6 w-56" />
            <div className="mt-4">
              <Lines count={4} />
            </div>
          </div>
        ))}
      </div>
    </Loading>
  );
}

// ---------------------------------------------------------------------------
// Sign-in and sign-up

export function AuthSkeleton() {
  return (
    <Loading label="the form" className="mx-auto mt-10 w-full max-w-[480px]">
      <div className="flex justify-center">
        <Bone className="h-12 w-44" />
      </div>
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-[0_24px_60px_rgb(74_20_32_/_10%)]">
        <Bone className="mx-auto h-8 w-52" />
        <Bone className="mx-auto mt-3 h-3.5 w-64 max-w-full" />
        {[0, 1, 2].map((index) => (
          <div key={index} className="mt-6">
            <Bone className="h-3 w-24" />
            <Bone className="mt-2 h-[54px] w-full rounded-xl" />
          </div>
        ))}
        <Bone className="mt-8 h-[54px] w-full rounded-xl" />
      </div>
    </Loading>
  );
}

// ---------------------------------------------------------------------------
// Admin (shown inside the admin sidebar and top bar)

export function AdminSkeleton({ stats = 4, rows = 6 }: { stats?: number; rows?: number }) {
  return (
    <Loading label="the dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Bone className="h-8 w-48" />
          <Bone className="mt-3 h-3.5 w-72 max-w-full" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </div>
      {stats > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: stats }, (_, index) => (
            <div key={index} className="rounded-2xl border border-[#f1e8e5] bg-white p-5">
              <Bone className="h-9 w-9 rounded-xl" />
              <Bone className="mt-4 h-3 w-20" />
              <Bone className="mt-2 h-7 w-28" />
            </div>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-[#f1e8e5] bg-white p-5">
        <Bone className="h-5 w-40" />
        <div className="mt-5 grid gap-4">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Bone className="h-10 w-10 flex-none rounded-lg" />
              <Bone className="h-4 flex-1" />
              <Bone className="h-4 w-20 max-sm:hidden" />
              <Bone className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}
