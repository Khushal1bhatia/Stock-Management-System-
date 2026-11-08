import { readFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findReferenceDocument } from "@/lib/documents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Serves reference PDFs from the private library. Files are addressed by the
 * database's fileName, never by a raw path, and require a signed-in session.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { file } = await params;
  const document = await findReferenceDocument(file);
  if (!document) {
    return new Response("Document not found.", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "private", "documents", document.fileName);

  try {
    const data = await readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${document.fileName}"`,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch {
    return new Response("Document file is missing.", { status: 404 });
  }
}
