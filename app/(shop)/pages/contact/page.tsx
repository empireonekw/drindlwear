import ContactForm from "@/components/contact-form";
import { getI18n } from "@/lib/server/i18n";

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
  const { t } = getI18n();
  return (
    <div className="container contact-page [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px] [max-width:1160px] [padding-top:54px] [padding-bottom:90px] max-[850px]:[padding-top:38px] max-[850px]:[padding-bottom:55px]">
      <p className="info-eyebrow [margin:0] [color:#786565] [text-align:center] [font-size:11px] [letter-spacing:2px]">{t("DIRNDL WEAR · WE'RE HERE TO HELP")}</p>
      <h1 className="page-heading [text-align:center] [font:500_42px_var(--font-serif)] [margin:35px_0_14px] [color:#781d2d]">{t("Contact Us")}</h1>
      <p className="info-intro [max-width:700px] [margin:0_auto_30px] [color:#786565] [text-align:center] [font:500_19px/1.8_var(--font-serif)]">
        {t("Have a question about a style, sizing, or an order? Send us a message or use the example contact details below.")}
      </p>
      <aside className="info-notice [margin:0_auto_34px] [padding:18px_22px] [border-left:3px_solid_#781d2d] [background:#fff] [color:#786565] [font-size:14px] [line-height:1.8]" role="note">
        {t("Example details for this demo only. The email, phone number, address, and opening hours are sample data and are not real customer-service contacts.")}
      </aside>
      <div className="contact-layout [display:grid] [grid-template-columns:minmax(0,_1.5fr)_minmax(280px,_1fr)] [gap:24px] [align-items:start] max-[850px]:[grid-template-columns:1fr]">
        <section className="contact-panel [padding:28px] [background:#fff] [border:1px_solid_#ead9d5] [&_h2]:[margin:0_0_10px] [&_h2]:[color:#781d2d] [&_h2]:[font:500_27px_var(--font-serif)] [&_>_p]:[color:#786565] [&_>_p]:[font-size:14px] [&_>_p]:[line-height:1.8] max-[580px]:[padding:21px]">
          <h2>{t("Send us a message")}</h2>
          <p>
            {t("Fill in the form and choose the topic that best matches your question.")}
          </p>
          <ContactForm />
        </section>
        <aside className="contact-panel contact-details [padding:28px] [background:#fff] [border:1px_solid_#ead9d5] [&_h2]:[margin:0_0_10px] [&_h2]:[color:#781d2d] [&_h2]:[font:500_27px_var(--font-serif)] [&_>_p]:[color:#786565] [&_>_p]:[font-size:14px] [&_>_p]:[line-height:1.8] max-[580px]:[padding:21px] [&_dl]:[margin:24px_0] [&_dl_>_div]:[padding:16px_0] [&_dl_>_div]:[border-bottom:1px_solid_#ead9d5] [&_dt]:[margin-bottom:6px] [&_dt]:[color:#781d2d] [&_dt]:[font-size:12px] [&_dt]:[font-weight:700] [&_dt]:[letter-spacing:1px] [&_dt]:[text-transform:uppercase] [&_dd]:[margin:0] [&_dd]:[color:#786565] [&_dd]:[font-size:14px] [&_dd]:[line-height:1.7] [&_dd]:[overflow-wrap:anywhere]">
          <h2>{t("Contact details")}</h2>
          <p>{t("Sample information for a Dirndl Wear demo showroom.")}</p>
          <dl>
            {sampleDetails.map((detail) => (
              <div key={detail.label}>
                <dt>{t(detail.label)}</dt>
                <dd>{t(detail.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="contact-location-note [margin:0] [color:#786565] [font-size:12px] [line-height:1.7]">
            {t("The address is an example location, not a real shop or delivery address.")}
          </p>
        </aside>
      </div>
    </div>
  );
}
