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
    <main className="container">
      <section className="brand-story">
        <img
          src="/brand/dirndl-wear-logo1.png"
          alt="Dirndl Wear full brand logo"
        />
        <div>
          <p className="subtitle" style={{ textAlign: "left" }}>
            OUR STORY
          </p>
          <h1>Traditional Dresses. Timeless Elegance.</h1>
          <p>
            Dirndl Wear celebrates Bavarian and Alpine dress through a refined,
            contemporary fashion identity. We bring together heritage,
            thoughtful craftsmanship, and timeless styling.
          </p>
          <Link className="btn" href="/collections/all">
            Explore the Collection
          </Link>
        </div>
      </section>

      <div className="brand-values">
        {brandValues.map((value) => (
          <article className="brand-value" key={value.title}>
            <h3>{value.title}</h3>
            <p>{value.text}</p>
          </article>
        ))}
      </div>
    </main>
  );
}