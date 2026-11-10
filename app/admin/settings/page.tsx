"use client";

import { useState } from "react";

import { useStore } from "@/components/store";

export default function Settings() {
  const store = useStore();
  const [name, setName] = useState(store.shopName);
  const [currency, setCurrency] = useState("PKR");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function saveSettings() {
    setNote("");
    if (!name.trim()) {
      setError("Enter a shop name.");
      return;
    }
    setError("");
    store.setShopName(name.trim());
    setNote("Settings saved in this browser.");
  }

  return (
    <>
      <h1 className="text-3xl font-serif">Settings</h1>
      <div className="admin-card max-w-2xl [background:white] [border:1px_solid_#eee] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
        <label className="block mb-2">Shop Name</label>
        <input
          className="field w-full mb-5 [padding:12px] [border:1px_solid_#ddd] [background:white]"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <label className="block mb-2">Currency</label>
        <select
          className="field w-full [padding:12px] [border:1px_solid_#ddd] [background:white]"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
        >
          <option>PKR</option>
        </select>

        {error && <p role="alert" className="mt-4">{error}</p>}
        {note && <p className="mt-4" role="status">{note}</p>}
        <button className="btn mt-5 [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" onClick={saveSettings}>
          SAVE SETTINGS
        </button>
      </div>
    </>
  );
}