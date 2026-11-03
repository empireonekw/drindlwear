import Link from "next/link";

const brandValues = [
  {
    title: "Heritage",
    text: "Respect for Bavarian and Alpine traditions.",
  },
  {
    title: "Craftsmanship",
    text: "Attention to fabric, fit, and thoughtful details.",
  },
  {
    title: "Authenticity",
    text: "Accurate presentation and a premium shopping experience.",
  },
];

export default function Story() {
  return (
    <main className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px] motion-safe:[&>*]:animate-page-enter motion-safe:[&>:nth-child(2)]:[animation-delay:70ms] motion-safe:[&>:nth-child(3)]:[animation-delay:120ms]">
      <section className="brand-story [display:grid] [grid-template-columns:1fr_1fr] [gap:45px] [align-items:center] [padding:75px_0] [&_img]:[max-width:360px] [&_img]:[width:100%] [&_img]:[margin:auto] [&_h1]:[font:normal_52px_Georgia,serif] [&_h1]:[color:#781d2d] [&_p]:[line-height:1.9] [&_p]:[color:#786565] max-[850px]:[grid-template-columns:1fr]">
        <img
          src="/brand/dirndl-wear-logo1.png"
          alt="Dirndl Wear full brand logo"
        />
        <div>
          <p className="subtitle [text-align:center] [color:#777] [font-size:13px] [letter-spacing:1px] [margin-bottom:38px]" style={{ textAlign: "left" }}>
            OUR STORY
          </p>
          <h1>Traditional Dresses. Timeless Elegance.</h1>
          <p>
            Dirndl Wear celebrates Bavarian and Alpine dress through a refined,
            contemporary fashion identity. We bring together heritage,
            thoughtful craftsmanship, and timeless styling.
          </p>
          <p>
            A Dirndl brings together distinctive pieces—a fitted bodice, a full
            skirt, an apron, and a blouse—in a silhouette shaped by generations
            of regional dress. We admire the care and character behind those
            details, and the many ways people make the look their own today.
          </p>
          <p>
            Our purpose is to make traditional style feel approachable without
            losing sight of its roots. We want every collection and story to
            invite discovery, thoughtful styling, and a deeper appreciation of
            the craft behind the clothes.
          </p>
          <Link className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" href="/collections/all">
            Explore the Collection
          </Link>
        </div>
      </section>

      <div className="brand-values [display:grid] [grid-template-columns:repeat(3,1fr)] [gap:20px] [padding-bottom:80px] max-[850px]:[grid-template-columns:1fr]">
        {brandValues.map((value) => (
          <article className="brand-value [padding:28px] [background:white] [border:1px_solid_#ead9d5] [&_h3]:[font:25px_Georgia,serif] [&_h3]:[color:#781d2d]" key={value.title}>
            <h3>{value.title}</h3>
            <p>{value.text}</p>
          </article>
        ))}
      </div>
      <section className="brand-story-details [max-width:860px] [margin:0_auto] [padding:0_0_75px] [&_h2]:[margin:34px_0_10px] [&_h2]:[color:#781d2d] [&_h2]:[font:normal_30px_Georgia,serif] [&_p]:[color:#786565] [&_p]:[line-height:1.9]">
        <h2>Tradition with room for personal style</h2>
        <p>
          There is no single way to wear a Dirndl. Colour, fabric, blouse, and
          accessories can give each outfit a different character. We celebrate
          that individuality while approaching Bavarian and Alpine traditions
          with respect and curiosity.
        </p>
        <h2>Made to be remembered</h2>
        <p>
          Whether dressing for a celebration or simply exploring a style you
          love, the pieces we choose should feel considered and meaningful.
          Dirndl Wear is here to share inspiration, explain the details, and
          help make every look your own.
        </p>
      </section>
    </main>
  );
}