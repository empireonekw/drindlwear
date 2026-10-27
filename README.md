# Dirndl Wear — Premium Traditional Fashion Storefront

A responsive, English-only e-commerce frontend and admin dashboard built with **Next.js App Router, TypeScript, Tailwind CSS, React and Recharts**. Based on the supplied **Dirndl Wear Brand Style Guide** and the two supplied logo files. This is a demonstration storefront, not a deployed production shop.

## Brand implementation

- **Brand:** Dirndl Wear — Traditional Dresses
- **Primary color:** Heritage Burgundy `#781D2D`
- **Background:** Warm Ivory `#FBF5F2`
- **Accent:** Dusty Rose `#D9B6B6`
- **Secondary text:** Antique Taupe `#786565`
- **Body text:** Charcoal Black `#211C1D`
- **Logo:** Full logo in site navigation / brand story; monogram included for compact applications. Do not distort either logo.
- **Voice:** Elegant, warm, authentic, feminine, confident and timeless.

## Run locally

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin.

## Main routes

`/` homepage; `/collections/[slug]` categories; `/product/[id]` product detail; `/search` search; `/wishlist` wishlist; `/cart` cart; `/checkout` demo checkout; `/account` demo account; `/club` editorial page; `/pages/our-story` brand story; `/admin` dashboard; `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/categories`, `/admin/content`, `/admin/settings`.

## Assets

`public/brand/dirndl-wear-logo1.png` — full supplied brand lockup.
`public/brand/dirndl-wear-monogram.png` — supplied circular monogram.
`public/images/` — existing product / banner image assets carried over from the supplied previous project.
`BRAND_GUIDE.pdf` — original supplied brand guide for visual reference.

## Important limitations

- Admin is **not authenticated** and must not be exposed publicly as a real management panel.
- Products, orders, cart and other interactions use demo / browser-local state. No database, real orders, payment processing, email delivery or production inventory synchronization.
- Existing product images are illustrative assets; verify their commercial usage rights and match imagery to real SKUs before launch.
- Original Krüger site is not affiliated with this Dirndl Wear branded demo.
- Test all screens, accessibility, checkout logic, and deployment configuration before production.

## Build

```bash
npm run build
npm start
```
