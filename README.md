# Dirndl Wear

<p align="center">
  <img src="public/brand/dirndl-wear-logo1.png" alt="Dirndl Wear — Traditional Dresses" width="360">
</p>

<p align="center">
  A traditional-fashion storefront with MongoDB-backed commerce APIs and an admin dashboard.
</p>

> **Project status:** UI-only preview. The backend (API routes, MongoDB models, auth, seed scripts) has been removed while the UI is redesigned. Products come from `lib/placeholder-products.ts`; cart, wishlist, orders and settings are kept in the browser's localStorage.

## Overview

Dirndl Wear presents Bavarian- and Alpine-inspired fashion through a responsive storefront and an authenticated admin dashboard.

### Storefront

- Homepage with featured categories, products, and editorial content
- Collection browsing with category filters and sorting
- Product details, wishlist, and cart
- Search, server-backed checkout, and customer accounts
- Responsive navigation and mobile layouts

### Admin dashboard

- Live dashboard and product, order, customer, and category views
- Database-backed product management and order status controls
- Editable homepage headline and store settings

## Technology

- [Next.js](https://nextjs.org/) 14 with the App Router
- [React](https://react.dev/) 18 and [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for dashboard charts
- [Lucide](https://lucide.dev/) icons

## Getting started

### Requirements

- Node.js 20.19 or newer
- npm

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `.env.local` holds `MONGODB_URI` for the upcoming backend; nothing reads it yet.

### Production build

```bash
npm run build
npm start
```

## Routes

| Route | Description |
| --- | --- |
| `/` | Storefront homepage |
| `/collections/[slug]` | Product collections |
| `/product/[id]` | Product details |
| `/search` | Product search |
| `/wishlist` | Saved products |
| `/cart` | Shopping cart |
| `/checkout` | Checkout; orders are saved in this browser only |
| `/account` | Preview sign-in and order history (no real accounts) |
| `/club` | Dirndl Wear Club page |
| `/pages/our-story` | Brand story |
| `/pages/[slug]` | Informational demo pages |
| `/admin` | Admin dashboard (not protected in preview mode) |
| `/admin/products` | Product management |
| `/admin/orders` | Order list and status controls |
| `/admin/customers` | Customer summary |
| `/admin/categories` | Category summary |
| `/admin/content` | Homepage headline management |
| `/admin/settings` | Store settings |

## Project structure

```text
app/
  (shop)/       Storefront routes and layout
  admin/        Admin dashboard routes
components/     Shared UI and client-side store
lib/            Shared types, helpers, and UI-only placeholder products
public/
  brand/        Dirndl Wear logos
  images/       Storefront and product imagery
```

## Brand palette

| Color | Hex | Use |
| --- | --- | --- |
| Heritage Burgundy | `#781D2D` | Primary brand color |
| Warm Ivory | `#FBF5F2` | Main background |
| Dusty Rose | `#D9B6B6` | Accent |
| Antique Taupe | `#786565` | Secondary text |
| Charcoal Black | `#211C1D` | Body text |

The full logo is in `public/brand/dirndl-wear-logo1.png`; the compact monogram is in `public/brand/dirndl-wear-monogram.png`.

## Current limitations

- **No backend:** there are no API routes, database, accounts, payments, or email. Admin changes to products reset on reload.
- **Placeholder data:** `lib/placeholder-products.ts` is for UI work only; delete it once real data is connected.
- **Asset review required:** Confirm image ownership and commercial usage rights before deployment.
- **Unofficial project:** This demonstration is not affiliated with the original Krüger site.

Before production use, review security and legal requirements, accessibility, deployment settings, payment/email integrations, and operational safeguards.
