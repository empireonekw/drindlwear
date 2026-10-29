# Dirndl Wear

<p align="center">
  <img src="public/brand/dirndl-wear-logo1.png" alt="Dirndl Wear — Traditional Dresses" width="360">
</p>

<p align="center">
  A responsive traditional-fashion storefront and admin dashboard, built as a frontend demonstration.
</p>

> **Demo project:** This repository is a demonstration storefront, not a production-ready shop. It has no authentication, backend, database, or real payment processing.

## Overview

Dirndl Wear presents Bavarian- and Alpine-inspired fashion through a modern storefront experience. The project includes product discovery and shopping flows, a responsive navigation, and a demo admin dashboard.

### Storefront

- Homepage with featured categories, products, and editorial content
- Collection browsing with category filters and sorting
- Product details, wishlist, and cart
- Search, demo checkout, and demo account screens
- Responsive navigation and mobile layouts

### Admin dashboard

- Summary dashboard and product, order, customer, and category views
- Demo product management and order status controls
- Illustrative content and store settings screens

## Technology

- [Next.js](https://nextjs.org/) 14 with the App Router
- [React](https://react.dev/) 18 and [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for dashboard charts
- [Lucide](https://lucide.dev/) icons

## Getting started

### Requirements

- Node.js 20 or newer
- npm

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront or [http://localhost:3000/admin](http://localhost:3000/admin) for the demo dashboard.

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
| `/checkout` | Demo checkout; no payment is processed |
| `/account` | Demo sign-in and registration screen |
| `/club` | Dirndl Wear Club page |
| `/pages/our-story` | Brand story |
| `/pages/[slug]` | Informational demo pages |
| `/admin` | Admin dashboard |
| `/admin/products` | Product management |
| `/admin/orders` | Order list and status controls |
| `/admin/customers` | Customer summary |
| `/admin/categories` | Category summary |
| `/admin/content` | Homepage content demo |
| `/admin/settings` | Store settings demo |

## Project structure

```text
app/
  (shop)/       Storefront routes and layout
  admin/        Admin dashboard routes
components/     Shared UI and client-side store
lib/            Product data and formatting helpers
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

## Demo limitations

- **No authentication:** Admin routes are not protected. Do not expose them as a real management interface.
- **Local-only data:** Products, orders, cart, and wishlist use browser storage and sample data; there is no server-side persistence or inventory synchronization.
- **No real transactions:** Checkout does not process payments or create real orders. Newsletter and account forms are demonstrations only.
- **Asset review required:** Confirm image ownership and commercial usage rights, and verify that product imagery matches real SKUs before deployment.
- **Unofficial project:** This demonstration is not affiliated with the original Krüger site.

Before using this project in production, add secure authentication, a backend and database, payment and email integrations, and appropriate legal, accessibility, and deployment reviews.
