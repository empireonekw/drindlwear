import ContactForm from "@/components/contact-form";

const sampleDetails = [
  {
    label: "Email",
    value: "hello@dirndlwear.example",
  },
  {
    label: "Phone",
    value: "+49 (0)30 0000 0000",
  },
  {
    label: "Example location",
    value: "Dirndl Wear Demo Studio, Musterstraße 12, 80331 Munich, Germany",
  },
  {
    label: "Example service hours",
    value: "Monday–Friday, 09:00–17:00 CET",
  },
];

export default function ContactPage() {
  return (
    <div className="container contact-page">
      <p className="info-eyebrow">DIRNDL WEAR · WE&apos;RE HERE TO HELP</p>
      <h1 className="page-heading">Contact Us</h1>
      <p className="info-intro">
        Have a question about a style, sizing, or an order? Send us a message or
        use the example contact details below.
      </p>
      <aside className="info-notice" role="note">
        Example details for this demo only. The email, phone number, address,
        and opening hours are sample data and are not real customer-service
        contacts.
      </aside>
      <div className="contact-layout">
        <section className="contact-panel">
          <h2>Send us a message</h2>
          <p>
            Fill in the form and choose the topic that best matches your
            question.
          </p>
          <ContactForm />
        </section>
        <aside className="contact-panel contact-details">
          <h2>Contact details</h2>
          <p>Sample information for a Dirndl Wear demo showroom.</p>
          <dl>
            {sampleDetails.map((detail) => (
              <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
          <p className="contact-location-note">
            The address is an example location, not a real shop or delivery
            address.
          </p>
        </aside>
      </div>
    </div>
  );
}
