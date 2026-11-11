"use client";

import { useRef, useState } from "react";
import { ImagePlus, Images, Loader2, Star, Trash2, UploadCloud } from "lucide-react";

import { Button } from "./ui";

type LibraryImage = { url: string; name: string };
type Uploading = { key: string; name: string; preview: string };

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Product photos: upload (stored in MongoDB via /api/admin/uploads), pick
 * from the library, reorder by choosing the main photo, remove.
 * `value[0]` is the main photo shown on product cards.
 */
export function ImagePicker({
  value,
  onChange,
  projectImages,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  /** Images already in the shop (e.g. /images/…), offered in the library. */
  projectImages: string[];
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryImage[] | null>(null);
  const [libraryError, setLibraryError] = useState("");
  // Keep the latest list for uploads that finish one after another.
  const latest = useRef(value);
  latest.current = value;

  async function upload(files: FileList | File[]) {
    setError("");
    const list = Array.from(files);
    for (const file of list) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`${file.name}: only JPEG, PNG and WebP photos are accepted.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: photos must be 5 MB or smaller.`);
        continue;
      }
      const key = `${file.name}-${file.size}-${Date.now()}`;
      const preview = URL.createObjectURL(file);
      setUploading((current) => [...current, { key, name: file.name, preview }]);
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/uploads", { method: "POST", body });
        const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!response.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
        onChange([...latest.current, data.url]);
        setLibrary((current) => (current ? [{ url: data.url!, name: file.name }, ...current] : current));
      } catch (uploadError) {
        setError(`${file.name}: ${uploadError instanceof Error ? uploadError.message : "upload failed."}`);
      } finally {
        URL.revokeObjectURL(preview);
        setUploading((current) => current.filter((item) => item.key !== key));
      }
    }
  }

  async function openLibrary() {
    setLibraryOpen((open) => !open);
    if (library) return;
    try {
      const response = await fetch("/api/admin/uploads", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as { images?: LibraryImage[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load uploaded photos.");
      setLibrary(data.images ?? []);
    } catch (loadError) {
      setLibrary([]);
      setLibraryError(loadError instanceof Error ? loadError.message : "Could not load uploaded photos.");
    }
  }

  const libraryItems = [
    ...(library ?? []),
    ...projectImages.map((url) => ({ url, name: url.split("/").pop() ?? url })),
  ].filter((item, index, all) => all.findIndex((other) => other.url === item.url) === index);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, index) => (
          <figure key={url} className="group relative m-0 overflow-hidden rounded-xl border border-[#eadfdc] bg-[#f6eeec]">
            <img src={url} alt={index === 0 ? "Main photo" : `Photo ${index + 1}`} className="aspect-[3/4] w-full object-cover" />
            {index === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-burgundy px-2 py-0.5 text-[11px] font-semibold text-white">Main</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/55 to-transparent p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              {index > 0 && (
                <button
                  type="button"
                  title="Make main photo"
                  aria-label={`Make photo ${index + 1} the main photo`}
                  onClick={() => onChange([url, ...value.filter((other) => other !== url)])}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-charcoal hover:text-burgundy"
                >
                  <Star size={15} />
                </button>
              )}
              <button
                type="button"
                title="Remove photo"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => onChange(value.filter((other) => other !== url))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-charcoal hover:text-[#9b1c2e]"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </figure>
        ))}

        {uploading.map((item) => (
          <figure key={item.key} className="relative m-0 overflow-hidden rounded-xl border border-[#eadfdc]">
            <img src={item.preview} alt="" className="aspect-[3/4] w-full object-cover opacity-50" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12px] font-medium text-charcoal">
              <Loader2 size={20} className="animate-spin text-burgundy" aria-hidden="true" />
              Uploading…
            </span>
          </figure>
        ))}

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (event.dataTransfer.files.length) upload(event.dataTransfer.files);
          }}
          className={
            "flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center text-[12px] transition-colors " +
            (dragging ? "border-burgundy bg-[#f6eeec] text-burgundy" : "border-[#dcd0cd] bg-white text-taupe hover:border-burgundy hover:text-burgundy")
          }
        >
          <UploadCloud size={24} strokeWidth={1.6} aria-hidden="true" />
          <span>
            <strong className="block font-medium">Add photos</strong>
            Drop or click
          </span>
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) upload(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[12px] text-taupe">JPEG, PNG or WebP, up to 5 MB each. Saved in MongoDB. The first photo is the main one.</p>
        <Button size="sm" variant="ghost" onClick={openLibrary} aria-expanded={libraryOpen}>
          <Images size={15} aria-hidden="true" />
          {libraryOpen ? "Hide library" : "Choose from library"}
        </Button>
      </div>
      {error && <p className="m-0 mt-2 text-[13px] text-[#9b1c2e]" role="alert">{error}</p>}

      {libraryOpen && (
        <div className="mt-3 rounded-xl border border-[#eadfdc] bg-white p-3">
          {library === null ? (
            <p className="m-0 flex items-center gap-2 p-2 text-[13px] text-taupe">
              <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Loading photos…
            </p>
          ) : (
            <>
              {libraryError && <p className="m-0 mb-2 text-[13px] text-[#9b1c2e]">{libraryError}</p>}
              <div className="grid max-h-[260px] grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
                {libraryItems.map((item) => {
                  const chosen = value.includes(item.url);
                  return (
                    <button
                      key={item.url}
                      type="button"
                      title={item.name}
                      aria-pressed={chosen}
                      onClick={() => onChange(chosen ? value.filter((url) => url !== item.url) : [...value, item.url])}
                      className={
                        "relative overflow-hidden rounded-lg border-2 transition-colors " +
                        (chosen ? "border-burgundy" : "border-transparent hover:border-[#cdbdb9]")
                      }
                    >
                      <img src={item.url} alt={item.name} className="aspect-[3/4] w-full object-cover" />
                      {chosen && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-burgundy text-white">
                          <ImagePlus size={11} aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
