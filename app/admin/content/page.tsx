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
      <div className="admin-card max-w-2xl">
        <p className="mb-5">
          Update the headline displayed in the homepage hero.
        </p>
        {error && <p role="alert">{error}</p>}
        <label className="block mb-2">Banner headline</label>
        <input
          className="field w-full"
          value={headline}
          onChange={(event) => {
            edited.current = true;
            setHeadline(event.target.value);
          }}
        />
        <button
          className="btn mt-5"
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