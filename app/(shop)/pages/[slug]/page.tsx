import { notFound } from "next/navigation";
import type { Metadata } from "next";

import type { I18n } from "@/lib/i18n";
import { getI18n } from "@/lib/server/i18n";
import { paymentMethods, promiseText, storePolicy } from "@/lib/store-policy";

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

/**
 * The information pages, in the visitor's language. Text is written in
 * English here and translated with `t` (German versions in lib/i18n-de.ts).
 */
function infoPages(i18n: I18n): Record<string, InfoPage> {
  const { t } = i18n;
  const promises = promiseText(i18n);
  const days = storePolicy.exchangeDays;
  const paymentList = paymentMethods.map((method) => t(method.label)).join(", ");

  return {
    "shipping & delivery": {
      title: t("Shipping & Delivery"),
      intro: t("We deliver across Germany. {shipping}.", { shipping: promises.shippingCost }),
      notice: t("Shipping costs, courier partners and dispatch cut-off times will be confirmed before the store opens for orders."),
      sections: [
        {
          heading: t("Delivery cost and time"),
          bullets: [
            t("{shipping}; you'll see the amount before you place your order.", { shipping: promises.shippingCost }),
            t("{delivery} after your order is confirmed.", { delivery: promises.deliveryTime }),
          ],
        },
        {
          heading: t("Paying for your order"),
          paragraphs: [
            t("You pay by {methods}. After you place your order, transfer the total to our bank account with your order number as the reference. Your order ships as soon as the payment arrives.", { methods: i18n.locale === "en" ? paymentList.toLowerCase() : paymentList }),
          ],
        },
        {
          heading: t("Order confirmation"),
          paragraphs: [
            t("Check your confirmation and make sure the delivery address is correct. If anything is wrong, contact us promptly; an address change may not be possible once a parcel has shipped."),
          ],
        },
        {
          heading: t("When a parcel is delayed or arrives damaged"),
          bullets: [
            t("Check the latest tracking update and any delivery notice left by the courier."),
            t("Keep the packaging and take clear photos if the parcel or item is damaged."),
            t("Contact us with your order number."),
          ],
        },
      ],
    },
    returns: {
      title: t("Exchanges & Returns"),
      intro: t("Wrong size? You can exchange an item within {days} days of delivery.", { days }),
      notice: t("The return address and refund timing will be published before the store opens for orders."),
      sections: [
        {
          heading: t("{days}-day size exchange", { days }),
          bullets: [
            t("Contact us within {days} days of the day your order arrives.", { days }),
            t("Tell us your order number and the size you need."),
            t("Keep the item, labels and packaging until the exchange is complete."),
          ],
        },
        {
          heading: t("Choosing the right size first"),
          paragraphs: [
            t("Every product page has fit notes and a size guide with body measurements. Comparing your measurements before ordering is the quickest way to avoid an exchange."),
          ],
        },
        {
          heading: t("Something is wrong with your order?"),
          paragraphs: [
            t("If an item is damaged, incorrect, or missing, contact us promptly with your order number and clear photos where helpful. Keep all packaging until the issue is resolved."),
          ],
        },
      ],
    },
    faq: {
      title: t("Frequently Asked Questions"),
      intro: t("Quick guidance for finding a style, choosing a size, and understanding the information to check before you order."),
      sections: [
        {
          heading: t("How do I choose the right size?"),
          paragraphs: [
            t("Measure yourself using the instructions in the Size Guide, then compare your measurements with the chart on the individual product page. If you are between sizes, use the garment's fit notes or ask the retailer for advice."),
          ],
        },
        {
          heading: t("Where can I find delivery costs and timing?"),
          paragraphs: [
            t("{shipping}. Orders arrive in {time} anywhere in Germany.", { shipping: promises.shippingCost, time: t(storePolicy.deliveryTime) }),
          ],
        },
        {
          heading: t("Can I change or cancel an order?"),
          paragraphs: [
            t("Contact the retailer as soon as possible. Changes may not be possible after processing or dispatch, and the retailer's cancellation terms apply."),
          ],
        },
        {
          heading: t("How do I return an item?"),
          paragraphs: [
            t("You can exchange an item for another size within {days} days of delivery. Contact us with your order number before sending anything back.", { days }),
          ],
        },
        {
          heading: t("How should I care for my Dirndl?"),
          paragraphs: [
            t("Care instructions vary by fabric, trim, and construction. Follow the care label and the instructions on the product page; when in doubt, consult a professional cleaner before treating delicate materials."),
          ],
        },
        {
          heading: t("Is this a live store?"),
          paragraphs: [
            t("No. This website is an educational demo storefront and does not represent a live retailer or provide live customer-service and order fulfilment."),
          ],
        },
      ],
    },
    "size guide": {
      title: t("Size Guide"),
      intro: t("A careful measurement is the best place to start. Compare your measurements with the chart and fit notes listed for the specific garment."),
      sections: [
        {
          heading: t("How to measure"),
          bullets: [
            t("Bust: measure around the fullest part of your chest, keeping the tape level and comfortably snug."),
            t("Waist: measure around your natural waist, usually the narrowest part of your torso."),
            t("Hips: measure around the fullest part of your hips while standing with your feet together."),
            t("Length: compare the garment's stated length with a similar item you already own, measured from the same reference point."),
          ],
        },
        {
          heading: t("Get the most reliable fit"),
          bullets: [
            t("Use a flexible tape measure over light clothing and avoid pulling it tight."),
            t("Keep the tape level and ask someone to help if you are measuring hard-to-reach areas."),
            t("Check the product page: cut, fabric, lining, and fit can differ between styles."),
            t("If your measurements fall between sizes, follow the product's fit advice or ask the retailer before ordering."),
          ],
        },
        {
          heading: t("A note about size charts"),
          paragraphs: [
            t("Sizing can vary by brand and garment. This demo does not provide verified garment measurements, so use the actual product-specific chart supplied by the retailer rather than relying on a generic conversion."),
          ],
        },
      ],
    },
    "our story": {
      title: t("Our Story"),
      intro: t("Dirndl Wear celebrates Bavarian and Alpine dress through a refined, contemporary fashion identity."),
      sections: [
        {
          heading: t("Tradition, thoughtfully styled"),
          paragraphs: [
            t("A Dirndl is more than a silhouette: it brings together a fitted bodice, a full skirt, an apron, and details shaped by regional dress. We take inspiration from this heritage while presenting it in a way that feels considered and wearable today."),
            t("Our aim is to make it easier to explore traditional dress, understand the details that make each look distinctive, and find styling inspiration for celebrations and personal occasions."),
          ],
        },
        {
          heading: t("What guides us"),
          bullets: [
            t("Heritage: approach Alpine and Bavarian traditions with respect and curiosity."),
            t("Craftsmanship: pay attention to fabric, fit, finishing, and the small details."),
            t("Authenticity: present products and their characteristics clearly and honestly."),
            t("Personal style: make room for individual interpretation alongside tradition."),
          ],
        },
        {
          heading: t("A living tradition"),
          paragraphs: [
            t("Traditional clothing continues to evolve as people bring their own tastes and stories to it. Dirndl Wear is a place to appreciate that heritage, discover timeless styling ideas, and celebrate the confidence of wearing something meaningful."),
          ],
        },
      ],
    },
    "style journal": {
      title: t("Style Journal"),
      intro: t("A collection of ideas for wearing, caring for, and learning about Dirndl style—with tradition as a starting point and personal expression at the heart."),
      sections: [
        {
          heading: t("Build a look around the Dirndl"),
          paragraphs: [
            t("Begin with the dress and let its colour, fabric, and pattern set the mood. Keep accessories balanced: a simple blouse can complement a detailed bodice, while a more understated dress can make room for a statement layer or jewellery."),
            t("For a polished finish, consider proportion and comfort as well as appearance. Choose footwear suited to the occasion and the amount of time you will be on your feet."),
          ],
        },
        {
          heading: t("Details that make a difference"),
          paragraphs: [
            t("The blouse, apron, and finishing touches each change the character of a look. Try coordinating one colour across accessories, or keep the palette restrained and let a single detail stand out."),
            t("Apron ties have different regional and personal meanings. If you are wearing traditional dress for a cultural event, learn the local custom rather than assuming one interpretation applies everywhere."),
          ],
        },
        {
          heading: t("Care for pieces you love"),
          paragraphs: [
            t("Always follow the garment label and product-specific care advice. Delicate fabrics, embroidery, and trims may need special handling; store pieces clean, dry, and protected from direct sunlight."),
          ],
        },
        {
          heading: t("Coming soon"),
          paragraphs: [
            t("This demo journal is a starter guide. A live brand can expand it with original articles, interviews, regional history, and seasonal outfit inspiration."),
          ],
        },
      ],
    },
    careers: {
      title: t("Careers"),
      intro: t("We believe thoughtful design and respectful collaboration make better experiences for everyone who wears or discovers traditional dress."),
      notice: t("There are no verified job openings or recruitment contact details for this demo storefront."),
      sections: [
        {
          heading: t("The kind of work we value"),
          bullets: [
            t("Respectful storytelling that treats cultural heritage with care."),
            t("Clear, accurate product information and a considered customer experience."),
            t("Curiosity about design, materials, fit, and the people behind each craft."),
            t("Collaboration, reliability, and a willingness to keep learning."),
          ],
        },
        {
          heading: t("Interested in working with us?"),
          paragraphs: [
            t("A real employer should list current roles, the location and employment type, application instructions, and an official recruitment contact here. No applications are being accepted through this demo website."),
          ],
        },
      ],
    },
    "privacy policy": {
      title: t("Privacy Policy"),
      intro: t("Privacy information should explain clearly what personal data a real retailer collects, why it is used, how long it is kept, and what choices people have."),
      notice: t("This is an educational demo, not a complete or legally reviewed privacy notice. The operator, data collected, service providers, retention periods, and privacy contact have not been verified. Do not rely on this page as a legal policy."),
      sections: [
        {
          heading: t("Information a retailer may process"),
          paragraphs: [
            t("Depending on the services actually offered, a retailer may process details supplied during an enquiry, account registration, newsletter subscription, or purchase, as well as technical information needed to operate and protect its website. A published policy must identify the exact data collected rather than assume it."),
          ],
        },
        {
          heading: t("Purposes and sharing"),
          paragraphs: [
            t("A real notice should describe each purpose for using personal data and identify relevant recipients, such as payment, hosting, delivery, or email providers where applicable. It should also explain the lawful basis when required by applicable law."),
          ],
        },
        {
          heading: t("Retention, security, and your choices"),
          paragraphs: [
            t("The retailer should state how long it keeps each category of data, the safeguards it uses, and how people can exercise applicable access, correction, deletion, objection, or withdrawal rights. Provide a working privacy contact and any relevant supervisory-authority information."),
          ],
        },
        {
          heading: t("Before this shop goes live"),
          paragraphs: [
            t("Replace this educational overview with a notice based on the real site's data flows, integrations, operating locations, and applicable privacy law. Obtain qualified legal advice where needed."),
          ],
        },
      ],
    },
    "legal notice": {
      title: t("Legal Notice"),
      intro: t("A legal notice identifies the business responsible for a website and provides the disclosures required in the places where it operates."),
      notice: t("This demo does not provide verified company, registration, tax, address, or representative details. This page is not a substitute for a legally reviewed legal notice or imprint."),
      sections: [
        {
          heading: t("Business information to publish"),
          bullets: [
            t("The full legal name and legal form of the responsible business."),
            t("A valid postal address and a direct, usable way to contact the business."),
            t("Company or commercial-register details and the competent register, when applicable."),
            t("Tax or VAT identification details, where required."),
            t("The responsible representative and any regulated-profession disclosures, if applicable."),
          ],
        },
        {
          heading: t("Other important disclosures"),
          paragraphs: [
            t("Depending on the business location and audience, additional consumer, dispute-resolution, accessibility, or platform disclosures may be required. Confirm which requirements apply before publishing."),
          ],
        },
        {
          heading: t("Demo status"),
          paragraphs: [
            t("Dirndl Wear in this project is labelled as an unofficial educational frontend. Do not use this sample page to represent a real company until all responsible-party details have been verified and the notice reviewed for the relevant jurisdiction."),
          ],
        },
      ],
    },
  };
}

function normalizeSlug(slug: string) {
  // Next passes the segment still URL-encoded ("shipping-%26-delivery").
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // Malformed encoding: fall back to the raw segment.
  }
  return decoded
    .toLowerCase()
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = infoPages(getI18n())[normalizeSlug(params.slug)];
  return page ? { title: `${page.title} | Dirndl Wear` } : {};
}

export default function InfoPageRoute({
  params,
}: {
  params: { slug: string };
}) {
  const i18n = getI18n();
  const page = infoPages(i18n)[normalizeSlug(params.slug)];
  if (!page) notFound();

  return (
    <div className="container info-page [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px] [max-width:920px] [padding-top:54px] [padding-bottom:90px] [&_.page-heading]:[margin-top:14px] [&_.page-heading]:[margin-bottom:18px] max-[850px]:[padding-top:38px] max-[850px]:[padding-bottom:55px]">
      <p className="info-eyebrow [margin:0] [color:#786565] [text-align:center] [font-size:11px] [letter-spacing:2px]">{i18n.t("DIRNDL WEAR · INFORMATION")}</p>
      <h1 className="page-heading [text-align:center] [font:500_42px_var(--font-serif)] [margin:35px_0_14px] [color:#781d2d]">{page.title}</h1>
      <p className="info-intro [max-width:700px] [margin:0_auto_30px] [color:#786565] [text-align:center] [font:500_19px/1.8_var(--font-serif)]">{page.intro}</p>
      {page.notice && (
        <aside className="info-notice [margin:0_auto_34px] [padding:18px_22px] [border-left:3px_solid_#781d2d] [background:#fff] [color:#786565] [font-size:14px] [line-height:1.8]" role="note">
          {page.notice}
        </aside>
      )}
      <div className="info-sections [display:grid] [gap:18px]">
        {page.sections.map((section) => (
          <section className="info-section [padding:24px_28px] [background:#fff] [border:1px_solid_#ead9d5] [&_h2]:[margin:0_0_12px] [&_h2]:[color:#781d2d] [&_h2]:[font:500_25px_var(--font-serif)] [&_p]:[color:#786565] [&_p]:[font-size:14px] [&_p]:[line-height:1.85] [&_li]:[color:#786565] [&_li]:[font-size:14px] [&_li]:[line-height:1.85] [&_p]:[margin:10px_0_0] [&_ul]:[margin:12px_0_0] [&_ul]:[padding-left:22px] [&_li_+_li]:[margin-top:7px] max-[850px]:[padding:21px]" key={section.heading}>
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
