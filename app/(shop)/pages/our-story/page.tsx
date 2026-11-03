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
      <section className="brand-story-details">
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