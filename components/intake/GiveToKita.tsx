"use client";

import { useCallback, useRef, useState } from "react";
import type { IntakeDelegationResult } from "@/lib/types/intake";
import { KITA_LOADING_MESSAGES } from "@/lib/copy/kita-messages";
import { getIntakeErrorMessage, getIntakeSuccessToast } from "@/lib/intake/user-errors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";
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
        if (!response.ok) throw new Error(getIntakeErrorMessage(payload.error));
        setResult(payload);
        setToast(getIntakeSuccessToast(payload.needsClarification));
        setOpen(false);
        setUrl("");
        setPaste("");
        onDelegated?.();
      } catch (error) {
        setToast(error instanceof Error ? error.message : getIntakeErrorMessage(undefined));
      } finally {
        setBusy(false);
        window.setTimeout(() => setToast(null), 5000);
      }
    },
    [onDelegated],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      if (list.length > 1) {
        setToast("Kita will process the first file. Share others one at a time.");
        window.setTimeout(() => setToast(null), 5000);
      }
      const file = list[0];
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
      <Card className="kita-enter border-accent/15 bg-gradient-to-br from-surface to-accent-soft/30" padding="relaxed">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-accent">Give this to Kita</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
              Hand me anything — I&apos;ll take it from here.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Drop a file, paste a note, or share a link. Kita reads it, understands it, and
              remembers it in your Executive Brain.
            </p>
          </div>
          <Button
            variant={open ? "secondary" : "primary"}
            className="h-12 shrink-0 px-8 text-base"
            onClick={() => setOpen((value) => !value)}
            disabled={busy}
          >
            {open ? "Close" : "Give this to Kita"}
          </Button>
        </div>

        {busy && (
          <div className="mt-6 rounded-2xl border border-border/80 bg-background/60">
            <KitaWorking context="intake" compact message={KITA_LOADING_MESSAGES.intake[0]} />
          </div>
        )}

        {result && !busy && (
          <div className="mt-6 rounded-2xl border border-border/80 bg-background px-5 py-4 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {result.message}
          </div>
        )}

        {open && !busy && (
          <div className="mt-6 space-y-6 border-t border-border/80 pt-6">
            <div
              className={`rounded-3xl border-2 border-dashed p-10 text-center transition-colors duration-200 ${
                dragOver ? "border-accent bg-accent-soft/50" : "border-border bg-background/50"
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
              <p className="text-base font-medium text-foreground">Drop a file here</p>
              <p className="mt-2 text-sm text-muted">
                PDF, documents, images, notes — anything you&apos;d hand to a trusted assistant
              </p>
              <div className="mt-6">
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
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

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="kita-url" className="text-sm font-medium text-foreground">
                  Link
                </label>
                <input
                  id="kita-url"
                  className="mt-2.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="https://..."
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
                <Button variant="ghost" className="mt-3" onClick={() => void handleUrl()} disabled={!url.trim()}>
                  Share link with Kita
                </Button>
              </div>
              <div>
                <label htmlFor="kita-paste" className="text-sm font-medium text-foreground">
                  Paste
                </label>
                <textarea
                  id="kita-paste"
                  className="mt-2.5 min-h-28 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Paste text, notes, or an email..."
                  value={paste}
                  onChange={(event) => setPaste(event.target.value)}
                />
                <Button variant="ghost" className="mt-3" onClick={() => void handlePaste()} disabled={!paste.trim()}>
                  Share text with Kita
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {toast && <BrainToast message={toast} />}
    </>
  );
}
