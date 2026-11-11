# Dirndl Wear

<p align="center">
  <img src="public/brand/dirndl-wear-logo.png" alt="Dirndl Wear — Traditional Dresses" width="360">
</p>

<p align="center">
  A traditional-fashion storefront with MongoDB-backed commerce APIs and an admin dashboard.
</p>

> **Project status:** Customer accounts (sign up, sign in, sign out) are real and stored in MongoDB. Everything else is still a UI preview: products come from `lib/placeholder-products.ts`, and the cart, wishlist, orders and settings are kept in the browser's localStorage.

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

Open [http://localhost:3000](http://localhost:3000). `.env.local` must hold `MONGODB_URI`; the database named in the URI is used (or set `MONGODB_DB`). The `users` and `sessions` collections and their indexes are created on first use.

### Admin account

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` (and optionally `ADMIN_NAME`) in `.env.local`, then run:

```bash
npm run seed:admin
```

This creates the admin, or promotes an existing account with that email and resets its password. Run it again whenever you change `ADMIN_PASSWORD`. Sign in at `/account/login` to reach `/admin`.

### Production build

```bash
npm run build
npm start
```

## Security

| Protection | Where |
| --- | --- |
| Passwords hashed with scrypt; sessions are random tokens in an httpOnly cookie (`__Host-` prefixed in production), stored only as SHA-256 | `lib/server/auth.ts` |
| Rate limits kept in MongoDB (`rate_limits`), so they survive restarts and are shared by every server | `lib/server/security.ts` |
| Sign-in: 30 requests per IP per 15 min; 5 wrong passwords lock that email for 15 min; 6+ different emails failing from one IP blocks it for 1 hour | `app/api/auth/login` |
| Sign-up: 5 accounts per IP per 30 days (`MAX_ACCOUNTS_PER_IP`, `ACCOUNTS_PER_IP_WINDOW_DAYS`); 6+ different emails in an hour blocks the IP for 1 hour; 10 attempts per IP per hour; 300 sign-ups per hour site-wide; hidden honeypot field | `app/api/auth/signup` |
| API accepts only same-site POSTs (CSRF), only GET/HEAD/POST, JSON bodies up to 4 KB, and string fields only (no NoSQL operator injection) | `middleware.ts`, `lib/server/security.ts` |
| Security headers: CSP, HSTS (production), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy; no `X-Powered-By`; no browser source maps | `next.config.mjs` |
| IPs and emails in limiter records are stored as keyed hashes (`AUTH_SECRET`), never in plain text | `lib/server/security.ts` |

**Deploying:** set `AUTH_SECRET` and, behind Vercel or nginx, `TRUSTED_IP_HEADER=x-real-ip`. Without a trusted proxy header, a client can fake its IP in `X-Forwarded-For`; the per-email lock and the site-wide sign-up cap still apply.

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
| `/account` | Profile and order history (redirects to sign-in) |
| `/account/login` | Sign in |
| `/account/register` | Create an account |
| `/api/auth/signup`, `/login`, `/logout`, `/me` | Account API (MongoDB, httpOnly session cookie) |
| `/club` | Dirndl Wear Club page |
| `/pages/our-story` | Brand story |
| `/pages/[slug]` | Informational demo pages |
| `/admin` | Admin dashboard (admin accounts only) |
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

Type: Cormorant Garamond for editorial headings, Inter for interface text (loaded with `next/font` in `app/layout.tsx`). The palette is available as Tailwind colours (`burgundy`, `burgundy-dark`, `ivory`, `rose`, `taupe`, `charcoal`) and CSS variables in `app/globals.css`.

Logo files in `public/brand/`, cut with transparent backgrounds from the approved logo artwork:

| File | Use (per the brand guide) |
| --- | --- |
| `dirndl-wear-logo.png` | Full logo where there is room (220 px wide or more) |
| `dirndl-wear-wordmark.png` | Navigation and narrow horizontal spaces |
| `dirndl-wear-monogram.png` | Small spaces (mobile header), 32 px or larger |
| `*-white.png` | Reversed versions, only on solid burgundy (footer, admin sidebar) |
| `app/icon.png`, `app/apple-icon.png` | Favicon and home-screen icon from the DW emblem |

These are raster cut-outs for the website. The guide still asks for SVG/PDF vector masters for print and embroidery.

## Current limitations

- **Partial backend:** only accounts use MongoDB. Products, orders, payments and email are not connected yet, and admin changes to products reset on reload.
- **Placeholder data:** `lib/placeholder-products.ts` is for UI work only; delete it once real data is connected.
- **Asset review required:** Confirm image ownership and commercial usage rights before deployment.
- **Unofficial project:** This demonstration is not affiliated with the original Krüger site.

Before production use, review security and legal requirements, accessibility, deployment settings, payment/email integrations, and operational safeguards.
