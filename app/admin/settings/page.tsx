"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { notifyDataChanged, useAutoRefresh } from "@/lib/use-auto-refresh";

export default function Settings() {
  const [name, setName] = useState("Dirndl Wear");
  const [currency, setCurrency] = useState("PKR");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const edited = useRef(false);

  const loadSettings = useCallback(async () => {
    if (edited.current) return;
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "Could not load settings.",
        );
      }
      if (
        typeof payload === "object" &&
        payload !== null &&
        "settings" in payload &&
        typeof payload.settings === "object" &&
        payload.settings !== null
      ) {
        if (
          "shopName" in payload.settings &&
          typeof payload.settings.shopName === "string"
        ) {
          setName(payload.settings.shopName);
        }
        if (
          "currency" in payload.settings &&
          typeof payload.settings.currency === "string"
        ) {
          setCurrency(payload.settings.currency);
        }
      }
      setError("");
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load settings.",
      );
    }
  }, []);

  useAutoRefresh(loadSettings);
  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveSettings() {
    setError("");
    setNote("");
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName: name, currency }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "Could not save settings.",
        );
      }
      edited.current = false;
      setNote("Settings saved.");
      notifyDataChanged();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-serif">Settings</h1>
      <div className="admin-card max-w-2xl">
        <label className="block mb-2">Shop Name</label>
        <input
          className="field w-full mb-5"
          value={name}
          onChange={(event) => {
            edited.current = true;
            setName(event.target.value);
          }}
        />

        <label className="block mb-2">Currency</label>
        <select
          className="field w-full"
          value={currency}
          onChange={(event) => {
            edited.current = true;
            setCurrency(event.target.value);
          }}
        >
          <option>PKR</option>
        </select>

        {error && <p role="alert" className="mt-4">{error}</p>}
        {note && <p className="mt-4" role="status">{note}</p>}
        <button className="btn mt-5" disabled={saving} onClick={saveSettings}>
          {saving ? "SAVING..." : "SAVE SETTINGS"}
        </button>
      </div>
    </>
  );
}