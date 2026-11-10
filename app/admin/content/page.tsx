"use client";

import { useState } from "react";

import { useStore } from "@/components/store";

export default function Content() {
  const store = useStore();
  const [headline, setHeadline] = useState(store.headline);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function saveContent() {
    setNote("");
    if (!headline.trim()) {
      setError("Enter a headline.");
      return;
    }
    setError("");
    store.setHeadline(headline.trim());
    setNote("Headline saved in this browser.");
  }

  return (
    <>
      <h1 className="text-3xl font-serif">Homepage &amp; Banner</h1>
      <div className="admin-card max-w-2xl [background:white] [border:1px_solid_#eee] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
        <p className="mb-5">
          Update the headline displayed in the homepage hero.
        </p>
        {error && <p role="alert">{error}</p>}
        <label className="block mb-2">Banner headline</label>
        <input
          className="field w-full [padding:12px] [border:1px_solid_#ddd] [background:white]"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
        />
        <button
          className="btn mt-5 [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]"
          onClick={saveContent}
        >
          SAVE HEADLINE
        </button>
        {note && <p className="mt-4" role="status">{note}</p>}
      </div>
    </>
  );
}