import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";

import { getCurrentUser } from "@/lib/server/auth";
import { MESSAGE_IMAGE_BUCKET } from "@/lib/server/messages";
import { noteError, withMetrics } from "@/lib/server/metrics";
import { getDb } from "@/lib/server/mongodb";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

/**
 * A photo sent in a chat. Private: only the customer of that conversation and
 * admins can open it; everyone else gets 404, as if it didn't exist.
 */
async function handleGET(_request: Request, { params }: { params: { id: string } }) {
  if (!/^[a-f0-9]{24}$/i.test(params.id)) return notFound();
  try {
    const user = await getCurrentUser();
    if (!user) return notFound();

    const id = new ObjectId(params.id);
    const db = await getDb();
    const file = await db.collection(`${MESSAGE_IMAGE_BUCKET}.files`).findOne({ _id: id });
    const meta = file?.metadata as { contentType?: string; customerId?: ObjectId } | undefined;
    if (!file || !meta?.contentType?.startsWith("image/")) return notFound();
    if (user.role !== "admin" && !meta.customerId?.equals(user._id)) return notFound();

    const stream = new GridFSBucket(db, { bucketName: MESSAGE_IMAGE_BUCKET }).openDownloadStream(id);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": meta.contentType,
        "Content-Length": String(file.length),
        // Private to this browser; never stored by shared caches.
        "Cache-Control": "private, max-age=86400",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    noteError(error);
    console.error("Could not serve message photo:", error instanceof Error ? error.message : error);
    return notFound();
  }
}

export const GET = withMetrics("messages", handleGET);
