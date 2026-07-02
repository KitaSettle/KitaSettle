import type { IntakeSourceType } from "@/lib/types/intake";
import {
  INTAKE_ACCEPTED_EXTENSIONS,
  INTAKE_ACCEPTED_MIME_PREFIXES,
  INTAKE_MAX_FILE_BYTES,
} from "@/lib/types/intake";

export interface ExtractedIntakeContent {
  sourceType: IntakeSourceType;
  sourceLabel: string;
  mimeType: string | null;
  text: string;
  isImage: boolean;
  imageBase64: string | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export function isAcceptedIntakeFile(name: string, mimeType: string | null, size: number): boolean {
  if (size > INTAKE_MAX_FILE_BYTES) return false;
  const ext = extensionOf(name);
  if (INTAKE_ACCEPTED_EXTENSIONS.some((allowed) => allowed === ext)) return true;
  if (mimeType && INTAKE_ACCEPTED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
    return true;
  }
  return false;
}

export async function extractFromUrl(url: string): Promise<ExtractedIntakeContent> {
  const response = await fetch(url, {
    headers: { "User-Agent": "KitaSettle-Intake/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`Could not fetch URL (${response.status}).`);
  }

  const contentType = response.headers.get("content-type");
  const mimeType = contentType?.split(";")[0]?.trim() ?? null;
  const buffer = Buffer.from(await response.arrayBuffer());
  const raw = buffer.toString("utf-8");
  const text = mimeType?.includes("html") ? stripHtml(raw) : raw;

  return {
    sourceType: "url",
    sourceLabel: url,
    mimeType,
    text: text.slice(0, 20_000),
    isImage: Boolean(mimeType?.startsWith("image/")),
    imageBase64: mimeType?.startsWith("image/") ? buffer.toString("base64") : null,
  };
}

export async function extractFromFile(file: File): Promise<ExtractedIntakeContent> {
  if (!isAcceptedIntakeFile(file.name, file.type || null, file.size)) {
    throw new Error("That file type is not supported for delegation.");
  }

  const mimeType = file.type || null;
  const isImage = Boolean(mimeType?.startsWith("image/"));
  const textLike =
    mimeType?.startsWith("text/") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".txt");

  if (textLike) {
    const text = await file.text();
    return {
      sourceType: "file",
      sourceLabel: file.name,
      mimeType,
      text: text.slice(0, 20_000),
      isImage: false,
      imageBase64: null,
    };
  }

  if (isImage) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return {
      sourceType: "file",
      sourceLabel: file.name,
      mimeType,
      text: `Delegated image: ${file.name}`,
      isImage: true,
      imageBase64: buffer.toString("base64"),
    };
  }

  return {
    sourceType: "file",
    sourceLabel: file.name,
    mimeType,
    text: `Delegated file "${file.name}" (${mimeType ?? "unknown type"}, ${Math.round(file.size / 1024)} KB).`,
    isImage: false,
    imageBase64: null,
  };
}

export async function extractFromText(
  text: string,
  sourceType: "text" | "paste",
  label = "Pasted content",
): Promise<ExtractedIntakeContent> {
  return {
    sourceType,
    sourceLabel: label,
    mimeType: "text/plain",
    text: text.trim().slice(0, 20_000),
    isImage: false,
    imageBase64: null,
  };
}
