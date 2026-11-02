# Dirndl Wear

<p align="center">
  <img src="public/brand/dirndl-wear-logo1.png" alt="Dirndl Wear — Traditional Dresses" width="360">
</p>

<p align="center">
  A traditional-fashion storefront with MongoDB-backed commerce APIs and an admin dashboard.
</p>

> **Project status:** The storefront now includes a MongoDB-backed API, customer accounts, admin authorization, product/category/order management, and persisted guest carts. Payment processing and transactional email are not configured.

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

### Install and configure

```bash
npm install
```

Configure MongoDB and secrets before using the backend:

```bash
cp .env.example .env.local
```

Create `.env.local` from `.env.example`, then set `MONGODB_URI` and `AUTH_SECRET` (at least 32 characters). Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` from your Cloudinary dashboard to enable product image uploads. `ADMIN_SETUP_KEY` (at least 24 characters) is only needed if you choose the optional setup-key route for creating an admin. Use a local MongoDB instance or a managed MongoDB URI. Seed the starter catalog and run the app:

```bash
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register the first account; it becomes the admin. Later registrations receive normal customer accounts.

If a database already has user accounts but no admin, review which account was registered first and run `npm run promote-first-user` to make that account the admin. The command does nothing if an admin already exists.

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
| `/checkout` | Checkout; orders are recorded as unpaid |
| `/account` | Customer registration and sign-in |
| `/club` | Dirndl Wear Club page |
| `/pages/our-story` | Brand story |
| `/pages/[slug]` | Informational demo pages |
| `/admin` | Admin dashboard (requires an admin account) |
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
lib/            MongoDB models, auth, API helpers, and seed data
scripts/        Database seeding
app/api/        Next.js backend Route Handlers
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

## Backend API

The Next.js Route Handlers live in `app/api` and use MongoDB through Mongoose.

| Endpoint | Methods | Access |
| --- | --- | --- |
| `/api/health` | GET | Public |
| `/api/products`, `/api/products/[id]` | GET | Public |
| `/api/products`, `/api/products/[id]` | POST, PATCH, DELETE | Admin |
| `/api/uploads/products` | POST, DELETE | Admin; uploads product images to Cloudinary |
| `/api/categories`, `/api/categories/[slug]` | GET | Public |
| `/api/categories`, `/api/categories/[slug]` | POST, PATCH, DELETE | Admin |
| `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | POST, GET | Public / signed-in user |
| `/api/auth/bootstrap` | POST | One-time setup key |
| `/api/cart` | GET, PUT | Guest session cookie |
| `/api/wishlist` | GET, PUT | Signed-in customer |
| `/api/checkout` | POST | Public; creates an unpaid order |
| `/api/orders`, `/api/orders/[id]` | GET, PATCH | Admin |
| `/api/customers` | GET | Admin |
| `/api/dashboard` | GET | Admin |
| `/api/content` | GET, PUT | Public / Admin |
| `/api/settings` | GET, PUT | Public / Admin |
| `/api/newsletter` | POST | Public |

Alternatively, create the first admin once using `POST /api/auth/bootstrap`, the `x-admin-setup-key` header set to `ADMIN_SETUP_KEY`, and a JSON body containing `name`, `email`, and a password of at least 12 characters:

```bash
curl -X POST http://localhost:3000/api/auth/bootstrap \
  -H "Content-Type: application/json" \
  -H "x-admin-setup-key: <your-admin-setup-key>" \
  -d '{"name":"Store Admin","email":"admin@example.com","password":"<strong-password>"}'
```

Admin bootstrap is one-time and shares the same first-admin lock as registration. Registration grants admin only to the first account in an empty database; existing accounts and every later registration remain customers. Since the first public signup receives admin privileges, restrict access to the site while that initial account is being created. Session cookies are HTTP-only and signed with `AUTH_SECRET`.

Checkout verifies product prices and reserves stock on the server. It records orders as unpaid; connect a payment provider before accepting real payments. Protect deployment secrets, use a managed MongoDB deployment with backups, and add rate limiting/email verification before production.

Product images can be selected in the admin product form and are uploaded to Cloudinary (JPEG, PNG, or WebP; maximum 5 MB). The returned secure URL and Cloudinary asset id are saved with the product in MongoDB. Configure all three Cloudinary environment variables before uploading.

The homepage **New Arrivals** section automatically shows up to eight most recently added products. Add a product from `/admin/products`; it appears at the start of New Arrivals after it is saved.

## Current limitations

- **Payments and email:** No payment processor or transactional-email provider is connected; newsletter signup is stored but does not send email.
- **Image uploads:** Product image upload requires Cloudinary credentials in `.env.local`.
- **Starter catalog:** Run `npm run seed` to load the sample catalog into MongoDB.
- **Initial admin:** The first signup becomes admin. Restrict public access until setup is complete, or use the optional one-time setup key instead.
- **Asset review required:** Confirm image ownership and commercial usage rights, and verify that product imagery matches real SKUs before deployment.
- **Unofficial project:** This demonstration is not affiliated with the original Krüger site.

Before production use, review security and legal requirements, accessibility, deployment settings, payment/email integrations, and operational safeguards.
