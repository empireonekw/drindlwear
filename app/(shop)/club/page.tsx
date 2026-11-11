import Link from "next/link";

export default function Club() {
  return (
    <>
      <div className="banner-small [background:#f1e2df] [padding:75px_20px] [text-align:center] [&_h1]:[font:500_45px_var(--font-serif)] [&_h1]:[color:#781d2d]">
        <h1>Dirndl Wear Club</h1>
        <p>Your world of traditional fashion.</p>
      </div>
      <div className="container section text-center [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px] [padding:70px_0] max-[520px]:[padding:45px_0]">
        <h2 className="section-title [text-align:center] [font:500_34px_var(--font-serif)] [letter-spacing:1px] [margin:0_0_14px] max-[520px]:[font-size:29px] [color:#781d2d]">Exclusive Benefits</h2>
        <p className="mb-8">
          Discover inspiration, trends, and new collections.
        </p>
        <Link href="/account" className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]">
          JOIN NOW
        </Link>
      </div>
    </>
  );
}