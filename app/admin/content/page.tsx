"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { notifyDataChanged, useAutoRefresh } from "@/lib/use-auto-refresh";

export default function Content() {
  const [headline, setHeadline] = useState("Moments of Tradition");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const edited = useRef(false);

  const loadContent = useCallback(async () => {
    if (edited.current) return;
    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "Could not load homepage content.",
        );
      }
      if (
        typeof payload === "object" &&
        payload !== null &&
        "content" in payload &&
        typeof payload.content === "object" &&
        payload.content !== null &&
        "headline" in payload.content &&
        typeof payload.content.headline === "string"
      ) {
        setHeadline(payload.content.headline);
      }
      setError("");
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load homepage content.",
      );
    }
  }, []);

  useAutoRefresh(loadContent);
  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  async function saveContent() {
    setError("");
    setNote("");
    setSaving(true);
    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "Could not save homepage content.",
        );
      }
      edited.current = false;
      setNote("Headline saved.");
      notifyDataChanged();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save homepage content.",
      );
    } finally {
      setSaving(false);
    }
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
          onChange={(event) => {
            edited.current = true;
            setHeadline(event.target.value);
          }}
        />
        <button
          className="btn mt-5 [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]"
          disabled={saving}
          onClick={saveContent}
        >
          {saving ? "SAVING..." : "SAVE HEADLINE"}
        </button>
        {note && <p className="mt-4" role="status">{note}</p>}
      </div>
    </>
  );
}