"use client";

import { useEffect, useState } from "react";

export default function Content() {
  const [headline, setHeadline] = useState("Moments of Tradition");
  const [note, setNote] = useState("");

  useEffect(() => {
    setHeadline(localStorage.getItem("demo-banner") || "Moments of Tradition");
  }, []);

  return (
    <>
      <h1 className="text-3xl font-serif">Homepage &amp; Banner</h1>
      <div className="admin-card max-w-2xl">
        <p className="mb-5">
          Draft homepage content settings (demo storage; homepage is still statically designed).
        </p>
        <label className="block mb-2">Banner headline</label>
        <input
          className="field w-full"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
        />
        <button
          className="btn mt-5"
          onClick={() => {
            localStorage.setItem("demo-banner", headline);
            setNote("Draft saved locally");
          }}
        >
          SAVE DRAFT
        </button>
        <p className="mt-4">{note}</p>
      </div>
    </>
  );
}