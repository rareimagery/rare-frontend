"use client";

import { buildPreviewDocument } from "@/components/builder/previewDocument";

export default function OpenPreviewWindowButton({ code }: { code: string }) {
  const openPreviewWindow = () => {
    if (!code.trim()) return;

    const popup = window.open("", "ri-builder-preview", "width=1200,height=850");
    if (!popup) {
      window.alert("Preview window was blocked. Allow pop-ups for RareImagery and try again.");
      return;
    }

    popup.document.open();
    popup.document.write(buildPreviewDocument(code));
    popup.document.close();
    popup.focus();
  };

  return (
    <button
      onClick={openPreviewWindow}
      disabled={!code.trim()}
      className="inline-flex min-h-9 items-center rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      Open Preview Window
    </button>
  );
}
