"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-row">
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
      <div className="contact-form-row">
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
      <button className="btn" type="submit">
        Send message
      </button>
      <p className="contact-form-note" role="status" aria-live="polite">
        {submitted
          ? "This demo form is not connected, so your message has not been sent."
          : "Demo form only — do not enter personal or order information."}
      </p>
    </form>
  );
}
