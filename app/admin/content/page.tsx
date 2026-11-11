"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button, Card, Field, inputClass, PageHeader, useToast } from "@/components/admin/ui";
import { useStore } from "@/components/store";

const DEFAULT_HEADLINE = "Traditional Dresses.";

export default function Content() {
  const store = useStore();
  const toast = useToast();
  const [headline, setHeadline] = useState(store.headline);
  const [error, setError] = useState("");
  const changed = headline.trim() !== store.headline;

  function save() {
    if (!headline.trim()) {
      setError("Enter a headline.");
      return;
    }
    if (headline.trim().length > 60) {
      setError("Keep the headline to 60 characters so it fits on phones.");
      return;
    }
    setError("");
    store.setHeadline(headline.trim());
    toast("Homepage headline saved.");
  }

  return (
    <>
      <PageHeader
        title="Homepage"
        description="Change the headline in the big banner at the top of the homepage."
        actions={
          <>
            <Button onClick={() => setHeadline(DEFAULT_HEADLINE)} disabled={headline === DEFAULT_HEADLINE}>
              <RotateCcw size={15} /> Reset
            </Button>
            <Button variant="primary" onClick={save} disabled={!changed}>
              Save headline
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card title="Banner text">
          <Field
            label="Headline"
            htmlFor="hero-headline"
            error={error}
            hint={`${headline.trim().length}/60 characters. “Timeless Elegance.” is always shown on the second line.`}
          >
            <input
              id="hero-headline"
              className={inputClass}
              value={headline}
              maxLength={80}
              onChange={(event) => {
                setHeadline(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => event.key === "Enter" && save()}
            />
          </Field>
        </Card>

        <Card title="Live preview" description="How the banner looks on the homepage.">
          <div
            className="relative flex min-h-[300px] items-center overflow-hidden rounded-xl bg-cover bg-center"
            style={{ backgroundImage: "url(/images/asset-00.jpeg)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" aria-hidden="true" />
            <div className="relative max-w-[78%] p-8 text-white">
              <p className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[2px]">Dirndl Wear · New collection</p>
              <p className="m-0 font-serif text-[clamp(28px,3.4vw,44px)] leading-[1.05]">
                {headline.trim() || "Your headline"}
                <br />
                Timeless Elegance.
              </p>
              <span className="mt-6 inline-block bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[1.5px] text-charcoal">
                Explore the collection
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
