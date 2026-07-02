"use client";

import { useCallback, useRef, useState } from "react";
import type { IntakeDelegationResult } from "@/lib/types/intake";
import { Button } from "@/components/ui/Button";
import { BrainToast } from "@/components/executive-brain/BrainToast";

interface GiveToKitaProps {
  onDelegated?: () => void;
}

export function GiveToKita({ onDelegated }: GiveToKitaProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [url, setUrl] = useState("");
  const [paste, setPaste] = useState("");
  const [result, setResult] = useState<IntakeDelegationResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitFormData = useCallback(
    async (formData: FormData) => {
      setBusy(true);
      setResult(null);
      try {
        const response = await fetch("/api/intake", { method: "POST", body: formData });
        const payload = (await response.json()) as IntakeDelegationResult & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Delegation failed");
        setResult(payload);
        setToast("Added to your Executive Brain");
        setOpen(false);
        setUrl("");
        setPaste("");
        onDelegated?.();
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Could not delegate to Kita");
      } finally {
        setBusy(false);
        window.setTimeout(() => setToast(null), 5000);
      }
    },
    [onDelegated],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      await submitFormData(formData);
    },
    [submitFormData],
  );

  const handleUrl = useCallback(async () => {
    if (!url.trim()) return;
    const formData = new FormData();
    formData.append("url", url.trim());
    await submitFormData(formData);
  }, [submitFormData, url]);

  const handlePaste = useCallback(async () => {
    if (!paste.trim()) return;
    const formData = new FormData();
    formData.append("text", paste.trim());
    await submitFormData(formData);
  }, [paste, submitFormData]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button
          variant="primary"
          className="h-14 px-8 text-base"
          onClick={() => setOpen((value) => !value)}
        >
          📥 Give this to Kita
        </Button>

        {result && (
          <div className="rounded-2xl border border-border bg-surface p-5 whitespace-pre-line text-sm text-foreground">
            {result.message}
          </div>
        )}

        {open && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">
              Drop anything here — Kita will read, classify, and update your Executive Brain. No
              folders, tags, or categories required.
            </p>

            <div
              className={`mt-4 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? "border-accent bg-accent/5" : "border-border"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                void handleFiles(event.dataTransfer.files);
              }}
            >
              <p className="text-sm font-medium text-foreground">Drag & drop files here</p>
              <p className="mt-1 text-xs text-muted">
                PDF, Office docs, text, images, audio, video, CSV, Markdown
              </p>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                  Choose file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.pptx,.txt,.md,.csv,image/*,audio/*,video/*"
                  onChange={(event) => {
                    if (event.target.files) void handleFiles(event.target.files);
                  }}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted">URL</label>
                <input
                  className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder="https://..."
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
                <Button variant="ghost" className="mt-2" onClick={() => void handleUrl()} disabled={busy || !url.trim()}>
                  Delegate link
                </Button>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted">Paste</label>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Paste text, notes, or email content..."
                  value={paste}
                  onChange={(event) => setPaste(event.target.value)}
                />
                <Button variant="ghost" className="mt-2" onClick={() => void handlePaste()} disabled={busy || !paste.trim()}>
                  Delegate text
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <BrainToast message={toast} />}
    </>
  );
}
