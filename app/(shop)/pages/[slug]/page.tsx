import { notFound } from "next/navigation";

type InfoSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type InfoPage = {
  title: string;
  intro: string;
  notice?: string;
  sections: InfoSection[];
};

const infoPages: Record<string, InfoPage> = {
  "shipping & delivery": {
    title: "Shipping & Delivery",
    intro:
      "Delivery options can depend on the destination, the items in your order, and the shipping service selected at checkout.",
    notice:
      "This demo does not define shipping regions, delivery estimates, carriers, shipping charges, or dispatch cut-off times. Confirm those details at checkout with the actual retailer before ordering.",
    sections: [
      {
        heading: "Order confirmation",
        paragraphs: [
          "After placing an order with a live retailer, check the confirmation details and make sure the delivery address is correct. If anything is wrong, contact the retailer promptly; an address change may not be possible once a parcel has shipped.",
        ],
      },
      {
        heading: "Dispatch and delivery updates",
        paragraphs: [
          "If tracking is provided, use the carrier link in the dispatch notification for the latest scan and delivery information. Tracking availability and timing depend on the service used.",
          "Delivery dates are estimates unless the retailer explicitly confirms a guaranteed service. Weather, peak periods, customs checks, and carrier disruption can affect transit.",
        ],
      },
      {
        heading: "When a parcel is delayed or arrives damaged",
        bullets: [
          "Check the latest tracking update and any delivery notice left by the carrier.",
          "Keep the packaging and take clear photos if the parcel or item is damaged.",
          "Contact the retailer using its published support channel and include your order number.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns",
    intro:
      "We want you to feel confident choosing a piece. Always review the actual retailer's return terms before you place an order.",
    notice:
      "This demo does not set a return window, refund timeline, return address, shipping-fee policy, or product exclusions. These terms must be confirmed and published by the retailer before real sales begin.",
    sections: [
      {
        heading: "Before requesting a return",
        bullets: [
          "Check the order confirmation and the retailer's current return policy for eligibility and deadlines.",
          "Keep the item, labels, and packaging in the condition required by that policy.",
          "Contact the retailer first and follow its instructions; do not send a parcel to an unverified address.",
        ],
      },
      {
        heading: "Refunds and exchanges",
        paragraphs: [
          "Once an authorised return is received, the retailer should explain how it assesses the item and how it processes an eligible refund or exchange. The applicable method, timing, and any costs must be stated in the retailer's terms.",
          "If a refund is approved, ask the retailer which payment method will be credited and how to follow up if it does not appear within the stated timeframe.",
        ],
      },
      {
        heading: "Something is wrong with your order?",
        paragraphs: [
          "If an item is damaged, incorrect, or missing, contact the retailer promptly with your order number and clear photos where helpful. Keep all packaging until the issue is resolved.",
        ],
      },
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    intro:
      "Quick guidance for finding a style, choosing a size, and understanding the information to check before you order.",
    sections: [
      {
        heading: "How do I choose the right size?",
        paragraphs: [
          "Measure yourself using the instructions in the Size Guide, then compare your measurements with the chart on the individual product page. If you are between sizes, use the garment's fit notes or ask the retailer for advice.",
        ],
      },
      {
        heading: "Where can I find delivery costs and timing?",
        paragraphs: [
          "Delivery services, costs, and estimated arrival dates should be shown by the retailer before you confirm an order. They can vary by destination and service.",
        ],
      },
      {
        heading: "Can I change or cancel an order?",
        paragraphs: [
          "Contact the retailer as soon as possible. Changes may not be possible after processing or dispatch, and the retailer's cancellation terms apply.",
        ],
      },
      {
        heading: "How do I return an item?",
        paragraphs: [
          "Check the retailer's return policy and contact its support channel before shipping anything back. This demo does not define return eligibility or a return address.",
        ],
      },
      {
        heading: "How should I care for my Dirndl?",
        paragraphs: [
          "Care instructions vary by fabric, trim, and construction. Follow the care label and the instructions on the product page; when in doubt, consult a professional cleaner before treating delicate materials.",
        ],
      },
      {
        heading: "Is this a live store?",
        paragraphs: [
          "No. This website is an educational demo storefront and does not represent a live retailer or provide live customer-service and order fulfilment.",
        ],
      },
    ],
  },
  "size guide": {
    title: "Size Guide",
    intro:
      "A careful measurement is the best place to start. Compare your measurements with the chart and fit notes listed for the specific garment.",
    sections: [
      {
        heading: "How to measure",
        bullets: [
          "Bust: measure around the fullest part of your chest, keeping the tape level and comfortably snug.",
          "Waist: measure around your natural waist, usually the narrowest part of your torso.",
          "Hips: measure around the fullest part of your hips while standing with your feet together.",
          "Length: compare the garment's stated length with a similar item you already own, measured from the same reference point.",
        ],
      },
      {
        heading: "Get the most reliable fit",
        bullets: [
          "Use a flexible tape measure over light clothing and avoid pulling it tight.",
          "Keep the tape level and ask someone to help if you are measuring hard-to-reach areas.",
          "Check the product page: cut, fabric, lining, and fit can differ between styles.",
          "If your measurements fall between sizes, follow the product's fit advice or ask the retailer before ordering.",
        ],
      },
      {
        heading: "A note about size charts",
        paragraphs: [
          "Sizing can vary by brand and garment. This demo does not provide verified garment measurements, so use the actual product-specific chart supplied by the retailer rather than relying on a generic conversion.",
        ],
      },
    ],
  },
  "our story": {
    title: "Our Story",
    intro:
      "Dirndl Wear celebrates Bavarian and Alpine dress through a refined, contemporary fashion identity.",
    sections: [
      {
        heading: "Tradition, thoughtfully styled",
        paragraphs: [
          "A Dirndl is more than a silhouette: it brings together a fitted bodice, a full skirt, an apron, and details shaped by regional dress. We take inspiration from this heritage while presenting it in a way that feels considered and wearable today.",
          "Our aim is to make it easier to explore traditional dress, understand the details that make each look distinctive, and find styling inspiration for celebrations and personal occasions.",
        ],
      },
      {
        heading: "What guides us",
        bullets: [
          "Heritage: approach Alpine and Bavarian traditions with respect and curiosity.",
          "Craftsmanship: pay attention to fabric, fit, finishing, and the small details.",
          "Authenticity: present products and their characteristics clearly and honestly.",
          "Personal style: make room for individual interpretation alongside tradition.",
        ],
      },
      {
        heading: "A living tradition",
        paragraphs: [
          "Traditional clothing continues to evolve as people bring their own tastes and stories to it. Dirndl Wear is a place to appreciate that heritage, discover timeless styling ideas, and celebrate the confidence of wearing something meaningful.",
        ],
      },
    ],
  },
  "style journal": {
    title: "Style Journal",
    intro:
      "A collection of ideas for wearing, caring for, and learning about Dirndl style—with tradition as a starting point and personal expression at the heart.",
    sections: [
      {
        heading: "Build a look around the Dirndl",
        paragraphs: [
          "Begin with the dress and let its colour, fabric, and pattern set the mood. Keep accessories balanced: a simple blouse can complement a detailed bodice, while a more understated dress can make room for a statement layer or jewellery.",
          "For a polished finish, consider proportion and comfort as well as appearance. Choose footwear suited to the occasion and the amount of time you will be on your feet.",
        ],
      },
      {
        heading: "Details that make a difference",
        paragraphs: [
          "The blouse, apron, and finishing touches each change the character of a look. Try coordinating one colour across accessories, or keep the palette restrained and let a single detail stand out.",
          "Apron ties have different regional and personal meanings. If you are wearing traditional dress for a cultural event, learn the local custom rather than assuming one interpretation applies everywhere.",
        ],
      },
      {
        heading: "Care for pieces you love",
        paragraphs: [
          "Always follow the garment label and product-specific care advice. Delicate fabrics, embroidery, and trims may need special handling; store pieces clean, dry, and protected from direct sunlight.",
        ],
      },
      {
        heading: "Coming soon",
        paragraphs: [
          "This demo journal is a starter guide. A live brand can expand it with original articles, interviews, regional history, and seasonal outfit inspiration.",
        ],
      },
    ],
  },
  careers: {
    title: "Careers",
    intro:
      "We believe thoughtful design and respectful collaboration make better experiences for everyone who wears or discovers traditional dress.",
    notice:
      "There are no verified job openings or recruitment contact details for this demo storefront.",
    sections: [
      {
        heading: "The kind of work we value",
        bullets: [
          "Respectful storytelling that treats cultural heritage with care.",
          "Clear, accurate product information and a considered customer experience.",
          "Curiosity about design, materials, fit, and the people behind each craft.",
          "Collaboration, reliability, and a willingness to keep learning.",
        ],
      },
      {
        heading: "Interested in working with us?",
        paragraphs: [
          "A real employer should list current roles, the location and employment type, application instructions, and an official recruitment contact here. No applications are being accepted through this demo website.",
        ],
      },
    ],
  },
  "privacy policy": {
    title: "Privacy Policy",
    intro:
      "Privacy information should explain clearly what personal data a real retailer collects, why it is used, how long it is kept, and what choices people have.",
    notice:
      "This is an educational demo, not a complete or legally reviewed privacy notice. The operator, data collected, service providers, retention periods, and privacy contact have not been verified. Do not rely on this page as a legal policy.",
    sections: [
      {
        heading: "Information a retailer may process",
        paragraphs: [
          "Depending on the services actually offered, a retailer may process details supplied during an enquiry, account registration, newsletter subscription, or purchase, as well as technical information needed to operate and protect its website. A published policy must identify the exact data collected rather than assume it.",
        ],
      },
      {
        heading: "Purposes and sharing",
        paragraphs: [
          "A real notice should describe each purpose for using personal data and identify relevant recipients, such as payment, hosting, delivery, or email providers where applicable. It should also explain the lawful basis when required by applicable law.",
        ],
      },
      {
        heading: "Retention, security, and your choices",
        paragraphs: [
          "The retailer should state how long it keeps each category of data, the safeguards it uses, and how people can exercise applicable access, correction, deletion, objection, or withdrawal rights. Provide a working privacy contact and any relevant supervisory-authority information.",
        ],
      },
      {
        heading: "Before this shop goes live",
        paragraphs: [
          "Replace this educational overview with a notice based on the real site's data flows, integrations, operating locations, and applicable privacy law. Obtain qualified legal advice where needed.",
        ],
      },
    ],
  },
  "legal notice": {
    title: "Legal Notice",
    intro:
      "A legal notice identifies the business responsible for a website and provides the disclosures required in the places where it operates.",
    notice:
      "This demo does not provide verified company, registration, tax, address, or representative details. This page is not a substitute for a legally reviewed legal notice or imprint.",
    sections: [
      {
        heading: "Business information to publish",
        bullets: [
          "The full legal name and legal form of the responsible business.",
          "A valid postal address and a direct, usable way to contact the business.",
          "Company or commercial-register details and the competent register, when applicable.",
          "Tax or VAT identification details, where required.",
          "The responsible representative and any regulated-profession disclosures, if applicable.",
        ],
      },
      {
        heading: "Other important disclosures",
        paragraphs: [
          "Depending on the business location and audience, additional consumer, dispute-resolution, accessibility, or platform disclosures may be required. Confirm which requirements apply before publishing.",
        ],
      },
      {
        heading: "Demo status",
        paragraphs: [
          "Dirndl Wear in this project is labelled as an unofficial educational frontend. Do not use this sample page to represent a real company until all responsible-party details have been verified and the notice reviewed for the relevant jurisdiction.",
        ],
      },
    ],
  },
};

function normalizeSlug(slug: string) {
  return slug
    .toLowerCase()
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function InfoPageRoute({
  params,
}: {
  params: { slug: string };
}) {
  const page = infoPages[normalizeSlug(params.slug)];
  if (!page) notFound();

  return (
    <div className="container info-page [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px] [max-width:920px] [padding-top:54px] [padding-bottom:90px] [&_.page-heading]:[margin-top:14px] [&_.page-heading]:[margin-bottom:18px] max-[850px]:[padding-top:38px] max-[850px]:[padding-bottom:55px]">
      <p className="info-eyebrow [margin:0] [color:#786565] [text-align:center] [font-size:11px] [letter-spacing:2px]">DIRNDL WEAR · INFORMATION</p>
      <h1 className="page-heading [text-align:center] [font:42px_Georgia,serif] [margin:35px_0_14px] [color:#781d2d]">{page.title}</h1>
      <p className="info-intro [max-width:700px] [margin:0_auto_30px] [color:#786565] [text-align:center] [font:19px/1.8_Georgia,serif]">{page.intro}</p>
      {page.notice && (
        <aside className="info-notice [margin:0_auto_34px] [padding:18px_22px] [border-left:3px_solid_#781d2d] [background:#fff] [color:#5e4d4d] [font-size:14px] [line-height:1.8]" role="note">
          {page.notice}
        </aside>
      )}
      <div className="info-sections [display:grid] [gap:18px]">
        {page.sections.map((section) => (
          <section className="info-section [padding:24px_28px] [background:#fff] [border:1px_solid_#ead9d5] [&_h2]:[margin:0_0_12px] [&_h2]:[color:#781d2d] [&_h2]:[font:normal_25px_Georgia,serif] [&_p]:[color:#5f5553] [&_p]:[font-size:14px] [&_p]:[line-height:1.85] [&_li]:[color:#5f5553] [&_li]:[font-size:14px] [&_li]:[line-height:1.85] [&_p]:[margin:10px_0_0] [&_ul]:[margin:12px_0_0] [&_ul]:[padding-left:22px] [&_li_+_li]:[margin-top:7px] max-[850px]:[padding:21px]" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
