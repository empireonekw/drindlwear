"use client";

import Link from "next/link";

import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";
import { TrustBar } from "@/components/trust-bar";

const categories = [
  { name: "WOMEN", image: "/images/asset-06.webp", slug: "women" },
  { name: "MEN", image: "/images/asset-09.webp", slug: "men" },
  { name: "ACCESSORIES", image: "/images/asset-08.webp", slug: "accessories" },
];

export default function Home() {
  const { products, headline } = useStore();
  // Newest first: placeholder ids grow as products are added.
  const newArrivals = [...products].sort((a, b) => b.id - a.id).slice(0, 8);

  return (
    <>
      <section
        className="hero [height:min(70vw,690px)] [min-height:520px] [background-size:cover] [background-position:center_top] [position:relative] [display:flex] [align-items:center] [&:before]:[content:''] [&:before]:[position:absolute] [&:before]:[inset:0] [&:before]:[background:linear-gradient(90deg,_rgb(20_16_17_/_62%)_0%,_rgb(20_16_17_/_36%)_48%,_rgb(20_16_17_/_5%)_100%)] [&_h1]:[font:500_clamp(42px,6vw,83px)_var(--font-serif)] [&_h1]:[line-height:1.04] [&_h1]:[margin:0] [&_p]:[font-size:15px] [&_p]:[letter-spacing:2px] max-[520px]:[min-height:min(680px,_max(560px,_76svh))] [&_h1]:[max-width:860px] [&_h1]:[font-size:clamp(40px,_5.2vw,_84px)] [&_h1]:[letter-spacing:-1.5px] [&_h1]:[text-wrap:balance] max-[1100px]:[&_h1]:[font-size:clamp(40px,_6vw,_64px)] max-[850px]:[width:100%] max-[850px]:[min-width:0] max-[850px]:[min-height:clamp(520px,_78svh,_680px)] max-[850px]:[background-position:62%_center] max-[850px]:[&:before]:[background:linear-gradient(90deg,_rgb(20_16_17_/_76%)_0%,_rgb(20_16_17_/_55%)_60%,_rgb(20_16_17_/_20%)_100%)] max-[850px]:[&_h1]:[width:100%] max-[850px]:[&_h1]:[max-width:100%] max-[850px]:[&_h1]:[font-size:clamp(32px,_7.5vw,_52px)] max-[850px]:[&_h1]:[letter-spacing:-0.8px] max-[850px]:[&_h1]:[overflow-wrap:anywhere] max-[520px]:[background-position:60%_center] max-[520px]:[&:before]:[background:linear-gradient(90deg,_rgb(20_16_17_/_80%)_0%,_rgb(20_16_17_/_62%)_68%,_rgb(20_16_17_/_35%)_100%)] max-[520px]:[&_h1]:[font-size:clamp(29px,_8.5vw,_35px)] max-[520px]:[&_h1]:[line-height:1.12] max-[520px]:[&_h1]:[letter-spacing:-0.5px] motion-safe:[animation:hero-enter_850ms_cubic-bezier(0.2,_0.7,_0.2,_1)_both]"
        style={{ backgroundImage: "url(/images/asset-00.jpeg)" }}
      >
        <div className="hero-content [position:relative] [color:white] [margin-left:clamp(32px,_9vw,_150px)] [max-width:860px] max-[520px]:[margin:0_20px] [width:min(860px,_78%)] [padding:48px_0] [&_.btn]:[min-height:52px] [&_.btn]:[padding:16px_27px] [&_.btn]:[letter-spacing:1.4px] max-[1100px]:[width:min(740px,_82%)] max-[1100px]:[margin-left:clamp(28px,_7vw,_80px)] max-[850px]:[width:calc(100%_-_48px)] max-[850px]:[max-width:620px] max-[850px]:[min-width:0] max-[850px]:[margin:0_24px] max-[850px]:[padding:40px_0] max-[520px]:[width:calc(100%_-_40px)] max-[520px]:[&_.btn]:[min-height:48px] max-[520px]:[&_.btn]:[padding:14px_18px] max-[520px]:[&_.btn]:[font-size:10px] motion-safe:[&_>_*]:[animation:page-enter_650ms_cubic-bezier(0.2,_0.7,_0.2,_1)_both] motion-safe:[&_>_:nth-child(2)]:[animation-delay:100ms] motion-safe:[&_>_:nth-child(3)]:[animation-delay:180ms]">
          <p className="hero-eyebrow [margin:0_0_22px] [font-size:11px] [font-weight:600] [letter-spacing:3px] max-[520px]:[margin-bottom:18px] max-[520px]:[font-size:9px] max-[520px]:[letter-spacing:2px]">DIRNDL WEAR · NEW COLLECTION</p>
          <h1>
            {headline}
            <br />
            Timeless Elegance.
          </h1>
          <p className="hero-description [max-width:460px] [margin:22px_0_26px] [font-size:15px] [line-height:1.7] [letter-spacing:0.3px] max-[850px]:[max-width:390px] max-[850px]:[margin:18px_0_22px] max-[520px]:[max-width:330px] max-[520px]:[font-size:14px]">
            A modern expression of Alpine heritage, crafted for life&apos;s special
            moments.
          </p>
          <Link className="btn btn-light [display:inline-flex] [align-items:center] [justify-content:center] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)] [background:white] [color:#211c1d] [&:hover]:[background:#f6eeec]" href="/collections/women">
            EXPLORE THE COLLECTION
          </Link>
        </div>
      </section>

      <TrustBar />

      <section className="container section [max-width:1360px] [margin:0_auto] [padding-left:32px] [padding-right:32px] max-[520px]:[padding-left:17px] max-[520px]:[padding-right:17px] [padding-top:70px] [padding-bottom:70px] max-[520px]:[padding-top:45px] max-[520px]:[padding-bottom:45px]">
        <h2 className="section-title [text-align:center] [font:500_34px_var(--font-serif)] [letter-spacing:1px] [margin:0_0_14px] max-[520px]:[font-size:29px] [color:#781d2d]">Shop by Category</h2>
        <p className="subtitle [text-align:center] [color:#786565] [font-size:13px] [letter-spacing:1px] [margin-bottom:38px]">HERITAGE, CRAFTSMANSHIP &amp; ELEGANCE</p>
        <div className="category-grid [display:grid] [grid-template-columns:repeat(3,1fr)] [gap:22px] max-[850px]:[grid-template-columns:repeat(2,1fr)] max-[520px]:[gap:10px] motion-safe:[&_>_*]:[animation:page-enter_520ms_cubic-bezier(0.2,_0.7,_0.2,_1)_both] motion-safe:[&_>_:nth-child(2)]:[animation-delay:60ms] motion-safe:[&_>_:nth-child(3)]:[animation-delay:120ms]">
          {categories.map((category) => (
            <Link
              href={`/collections/${category.slug}`}
              className="category-card [position:relative] [height:450px] [overflow:hidden] [background:#eadfdc] [&_img]:[height:100%] [&_img]:[width:100%] [&_img]:[object-fit:cover] [&_img]:[transition:transform_.4s] [&:hover_img]:[transform:scale(1.05)] max-[520px]:[height:260px] motion-safe:[&_img]:[transition:transform_650ms_cubic-bezier(0.2,_0.7,_0.2,_1)] motion-safe:[&:hover_img]:[transform:scale(1.045)]"
              key={category.name}
            >
              <img src={category.image} alt={category.name} />
              <div className="category-overlay [position:absolute] [bottom:0] [left:0] [right:0] [padding:70px_20px_30px] [text-align:center] [color:white] [background:linear-gradient(transparent,#0009)] [&_h3]:[font:500_30px_var(--font-serif)] [&_span]:[border-bottom:1px_solid_white] [&_span]:[padding-bottom:5px] [&_span]:[font-size:12px] [&_span]:[letter-spacing:1px] max-[520px]:[&_h3]:[font-size:23px]">
                <h3>{category.name}</h3>
                <span>SHOP NOW</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section [max-width:1360px] [margin:0_auto] [padding-left:32px] [padding-right:32px] max-[520px]:[padding-left:17px] max-[520px]:[padding-right:17px] [padding-top:70px] [padding-bottom:70px] max-[520px]:[padding-top:45px] max-[520px]:[padding-bottom:45px]">
        <h2 className="section-title [text-align:center] [font:500_34px_var(--font-serif)] [letter-spacing:1px] [margin:0_0_14px] max-[520px]:[font-size:29px] [color:#781d2d]">Our Bestsellers</h2>
        <p className="subtitle [text-align:center] [color:#786565] [font-size:13px] [letter-spacing:1px] [margin-bottom:38px]">CUSTOMER FAVORITES</p>
        <ProductGrid items={products.slice(0, 8)} />
        <div className="text-center mt-10">
          <Link href="/collections/all" className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]">
            VIEW ALL PRODUCTS
          </Link>
        </div>
      </section>

      <section className="editorial [display:grid] [grid-template-columns:1fr_1fr] [min-height:500px] [background:#f5e9e5] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:cover] [&_img]:[max-height:550px] max-[520px]:[grid-template-columns:1fr] max-[850px]:[grid-template-columns:minmax(0,_1fr)] motion-safe:[&_img]:[transition:transform_650ms_cubic-bezier(0.2,_0.7,_0.2,_1)] motion-safe:[&_img:hover]:[transform:scale(1.045)]">
        <img src="/images/asset-02.jpeg" alt="Collection" />
        <div className="editorial-copy [display:flex] [flex-direction:column] [justify-content:center] [align-items:flex-start] [padding:12%] [&_h2]:[font:500_42px_var(--font-serif)] [&_p]:[line-height:1.9] [&_p]:[color:#786565] max-[520px]:[padding:40px_25px] [&_h2]:[color:#781d2d]">
          <span className="text-xs tracking-widest">
            TRADITIONAL DRESSES · TIMELESS ELEGANCE
          </span>
          <h2>Made for special moments</h2>
          <p>
            For festivals, weddings, and special celebrations: find a look that
            reflects your personality, with style and thoughtful details.
          </p>
          <Link className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" href="/collections/collections">
            EXPLORE COLLECTION
          </Link>
        </div>
      </section>

      <section className="container section [max-width:1360px] [margin:0_auto] [padding-left:32px] [padding-right:32px] max-[520px]:[padding-left:17px] max-[520px]:[padding-right:17px] [padding-top:70px] [padding-bottom:70px] max-[520px]:[padding-top:45px] max-[520px]:[padding-bottom:45px]">
        <h2 className="section-title [text-align:center] [font:500_34px_var(--font-serif)] [letter-spacing:1px] [margin:0_0_14px] max-[520px]:[font-size:29px] [color:#781d2d]">New Arrivals</h2>
        <p className="subtitle [text-align:center] [color:#786565] [font-size:13px] [letter-spacing:1px] [margin-bottom:38px]">YOUR NEW FAVORITES</p>
        <ProductGrid items={newArrivals} />
      </section>

      <section className="banner-small [background:#f1e2df] [padding:75px_20px] [text-align:center] [&_h1]:[font:500_45px_var(--font-serif)] [&_h1]:[color:#781d2d]">
        <h1>Discover Dirndl Wear</h1>
        <p className="mb-7">
          Exclusive benefits and inspiration for traditional fashion lovers.
        </p>
        <Link href="/club" className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]">
          LEARN MORE
        </Link>
      </section>
    </>
  );
}
