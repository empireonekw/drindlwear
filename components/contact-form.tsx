"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className="contact-form [display:grid] [gap:17px] [margin-top:24px] [&_label]:[display:grid] [&_label]:[gap:8px] [&_label]:[color:#781d2d] [&_label]:[font-size:13px] [&_label]:[font-weight:600] [&_label_span]:[display:inline] [&_label_span]:[color:#786565] [&_label_span]:[font-weight:400] [&_input]:[width:100%] [&_input]:[min-height:46px] [&_input]:[padding:11px_12px] [&_input]:[border:1px_solid_#d9c9c5] [&_input]:[border-radius:0] [&_input]:[background:#fbf5f2] [&_input]:[color:#211c1d] [&_input]:[font:14px_var(--font-sans)] [&_select]:[width:100%] [&_select]:[min-height:46px] [&_select]:[padding:11px_12px] [&_select]:[border:1px_solid_#d9c9c5] [&_select]:[border-radius:0] [&_select]:[background:#fbf5f2] [&_select]:[color:#211c1d] [&_select]:[font:14px_var(--font-sans)] [&_textarea]:[width:100%] [&_textarea]:[min-height:150px] [&_textarea]:[padding:11px_12px] [&_textarea]:[border:1px_solid_#d9c9c5] [&_textarea]:[border-radius:0] [&_textarea]:[background:#fbf5f2] [&_textarea]:[color:#211c1d] [&_textarea]:[font:14px_var(--font-sans)] [&_textarea]:[resize:vertical] [&_input:focus]:[outline:2px_solid_#781d2d] [&_input:focus]:[outline-offset:1px] [&_select:focus]:[outline:2px_solid_#781d2d] [&_select:focus]:[outline-offset:1px] [&_textarea:focus]:[outline:2px_solid_#781d2d] [&_textarea:focus]:[outline-offset:1px] [&_.btn]:[justify-self:start]" onSubmit={handleSubmit}>
      <div className="contact-form-row [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:16px] max-[580px]:[grid-template-columns:1fr]">
        <label>
          Full name
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
      </div>
      <div className="contact-form-row [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:16px] max-[580px]:[grid-template-columns:1fr]">
        <label>
          Topic
          <select name="topic" defaultValue="" required>
            <option value="" disabled>
              Select a topic
            </option>
            <option value="product">Product question</option>
            <option value="size">Sizing and fit</option>
            <option value="order">Order question</option>
            <option value="shipping">Shipping and delivery</option>
            <option value="returns">Returns</option>
            <option value="other">Something else</option>
          </select>
        </label>
        <label>
          Order number <span>(optional)</span>
          <input name="orderNumber" autoComplete="off" />
        </label>
      </div>
      <label>
        Your message
        <textarea name="message" rows={6} required />
      </label>
      <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" type="submit">
        Send message
      </button>
      <p className="contact-form-note [margin:0] [color:#786565] [font-size:12px] [line-height:1.7]" role="status" aria-live="polite">
        {submitted
          ? "This demo form is not connected, so your message has not been sent."
          : "Demo form only — do not enter personal or order information."}
      </p>
    </form>
  );
}
