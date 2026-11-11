import "server-only";

import { GridFSBucket, ObjectId } from "mongodb";

import { getDb } from "./mongodb";

/**
 * Product photos are stored in MongoDB with GridFS (bucket "product_images",
 * i.e. the product_images.files and product_images.chunks collections).
 * Each photo is served at /api/images/<id>.
 */
export const IMAGE_BUCKET = "product_images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageMeta = {
  contentType: string;
  uploadedBy: string;
  originalName: string;
};

export async function imageBucket() {
  return new GridFSBucket(await getDb(), { bucketName: IMAGE_BUCKET });
}

export const imageUrl = (id: ObjectId | string) => `/api/images/${String(id)}`;

/**
 * The real type of an image from its first bytes, so a renamed file can't
 * pretend to be a photo. Only JPEG, PNG and WebP are accepted.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Keeps a readable, harmless version of the uploaded file name. */
export function cleanFileName(name: string) {
  const cleaned = name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80);
  return cleaned || "photo";
}
