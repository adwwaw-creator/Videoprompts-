import React, { useRef, useState } from "react";
import { ArrowLeftRight, Flag, ImagePlus, ScanSearch, Trash2 } from "lucide-react";
import { I18nCopy } from "../data/i18n";
import { ReferenceImageState } from "../types/prompt";

interface ImageReferenceDropzoneProps {
  copy: I18nCopy;
  aspectOptions: string[];
  imageState: ReferenceImageState | null;
  analyzing: boolean;
  onImageLoaded: (img: ReferenceImageState) => void;
  onClearImage: () => void;
  onAnalyzeImage: () => void;
  showEndFrame?: boolean;
  endImageState?: ReferenceImageState | null;
  analyzingTransition?: boolean;
  onEndImageLoaded?: (img: ReferenceImageState) => void;
  onClearEndImage?: () => void;
  onAnalyzeTransition?: () => void;
}

function matchClosestAspect(
  width: number,
  height: number,
  aspectOptions: string[]
): string {
  const ratio = width / height;
  if (ratio > 1.9) {
    return aspectOptions.find((a) => a.startsWith("21:9")) || aspectOptions[0];
  }
  if (ratio > 1.35) {
    return aspectOptions.find((a) => a.startsWith("16:9")) || aspectOptions[0];
  }
  if (ratio > 1.1) {
    return (
      aspectOptions.find((a) => a.startsWith("4:3") || a.startsWith("3:2")) ||
      aspectOptions[0]
    );
  }
  if (ratio < 0.72) {
    return aspectOptions.find((a) => a.startsWith("9:16")) || aspectOptions[0];
  }
  if (ratio < 0.9) {
    return aspectOptions.find((a) => a.startsWith("3:4")) || aspectOptions[0];
  }
  return aspectOptions.find((a) => a.startsWith("1:1")) || aspectOptions[0];
}

function processImageFile(
  file: File,
  aspectOptions: string[],
  onLoaded: (img: ReferenceImageState) => void
) {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const originalDataUrl = String(ev.target?.result || "");
    const img = new Image();
    img.onerror = () => {
      // Ignore unreadable or corrupted image files cleanly
    };
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      if (origW <= 0 || origH <= 0) return;
      const detectedAspect = matchClosestAspect(origW, origH, aspectOptions);

      const MAX_DIM = 1024;
      let targetW = origW;
      let targetH = origH;
      if (origW > MAX_DIM || origH > MAX_DIM) {
        const scale = Math.min(MAX_DIM / origW, MAX_DIM / origH);
        targetW = Math.round(origW * scale);
        targetH = Math.round(origH * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      let finalDataUrl = originalDataUrl;
      let finalMime = file.type;

      if (ctx) {
        ctx.drawImage(img, 0, 0, targetW, targetH);
        finalDataUrl = canvas.toDataURL("image/jpeg", 0.86);
        finalMime = "image/jpeg";
      }

      const base64 = finalDataUrl.split(",")[1] || "";
      onLoaded({
        dataUrl: finalDataUrl,
        base64,
        mimeType: finalMime,
        fileName: file.name,
        width: origW,
        height: origH,
        detectedAspect,
      });
    };
    img.src = originalDataUrl;
  };
  reader.readAsDataURL(file);
}

export const ImageReferenceDropzone: React.FC<ImageReferenceDropzoneProps> = ({
  copy,
  aspectOptions,
  imageState,
  analyzing,
  onImageLoaded,
  onClearImage,
  onAnalyzeImage,
  showEndFrame = false,
  endImageState = null,
  analyzingTransition = false,
  onEndImageLoaded,
  onClearEndImage,
  onAnalyzeTransition,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [endDragOver, setEndDragOver] = useState(false);

  return (
    <div
      className={`mt-4 flex flex-col gap-3.5 ${
        showEndFrame ? "md:grid md:grid-cols-2 md:items-start" : ""
      }`}
    >
      {/* First / Primary Reference Frame */}
      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processImageFile(file, aspectOptions, onImageLoaded);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) processImageFile(file, aspectOptions, onImageLoaded);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex min-h-[116px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            dragOver
              ? "border-amber-600 bg-amber-50/40 dark:border-[#D4A34B] dark:bg-[#1B1E2A]"
              : "border-slate-300 bg-slate-50/70 hover:border-amber-600/60 dark:border-[#2C3245] dark:bg-[#0E1118] dark:hover:border-[#D4A34B]/60"
          }`}
        >
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-amber-700 dark:border-[#252A38] dark:bg-[#151923] dark:text-[#D4A34B]">
            <ImagePlus className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {copy.dropTitle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {copy.dropSub}
          </p>
        </button>

        {imageState && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#252A38] dark:bg-[#13161F]">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={imageState.dataUrl}
                alt={imageState.fileName}
                referrerPolicy="no-referrer"
                className="h-16 w-16 shrink-0 rounded-lg border border-slate-300 object-cover dark:border-[#2E3548]"
              />
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                  {imageState.fileName}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 font-mono-code dark:text-slate-400">
                  {imageState.width}×{imageState.height}px · {imageState.detectedAspect}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                disabled={analyzing}
                onClick={onAnalyzeImage}
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-center text-xs font-semibold leading-snug text-white transition-colors hover:bg-amber-800 disabled:opacity-50 whitespace-normal dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
              >
                <ScanSearch className="h-4 w-4 shrink-0" />
                <span>{analyzing ? copy.btnAnalyzingImg : copy.btnAnalyzeImg}</span>
              </button>
              <button
                type="button"
                onClick={onClearImage}
                aria-label={copy.removeImg}
                className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-red-400 hover:text-red-600 dark:border-[#262B3A] dark:bg-[#181C28] dark:text-slate-300 dark:hover:border-red-500/60 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                <span>{copy.removeImg}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* End Frame Dropzone (FLF2V Mode) */}
      {showEndFrame && onEndImageLoaded && (
        <div className="flex flex-col gap-3">
          <input
            ref={endInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processImageFile(file, aspectOptions, onEndImageLoaded);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault();
              setEndDragOver(true);
            }}
            onDragLeave={() => setEndDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setEndDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processImageFile(file, aspectOptions, onEndImageLoaded);
            }}
            onClick={() => endInputRef.current?.click()}
            className={`flex min-h-[116px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
              endDragOver
                ? "border-amber-600 bg-amber-50/40 dark:border-[#D4A34B] dark:bg-[#1B1E2A]"
                : "border-slate-300 bg-slate-50/70 hover:border-amber-600/60 dark:border-[#2C3245] dark:bg-[#0E1118] dark:hover:border-[#D4A34B]/60"
            }`}
          >
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-amber-700 dark:border-[#252A38] dark:bg-[#151923] dark:text-[#D4A34B]">
              <Flag className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
              {copy.endDropTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {copy.endDropSub}
            </p>
          </button>

          {endImageState && (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#252A38] dark:bg-[#13161F]">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={endImageState.dataUrl}
                  alt={endImageState.fileName}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 shrink-0 rounded-lg border border-slate-300 object-cover dark:border-[#2E3548]"
                />
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                    {endImageState.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 font-mono-code dark:text-slate-400">
                    {endImageState.width}×{endImageState.height}px
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {imageState && onAnalyzeTransition && (
                  <button
                    type="button"
                    disabled={analyzingTransition}
                    onClick={onAnalyzeTransition}
                    className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-center text-xs font-semibold leading-snug text-white transition-colors hover:bg-amber-800 disabled:opacity-50 whitespace-normal dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
                  >
                    <ArrowLeftRight className="h-4 w-4 shrink-0" />
                    <span>
                      {analyzingTransition
                        ? copy.btnAnalyzingTransition
                        : copy.btnAnalyzeTransition}
                    </span>
                  </button>
                )}
                {onClearEndImage && (
                  <button
                    type="button"
                    onClick={onClearEndImage}
                    aria-label={copy.removeImg}
                    className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-red-400 hover:text-red-600 dark:border-[#262B3A] dark:bg-[#181C28] dark:text-slate-300 dark:hover:border-red-500/60 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{copy.removeImg}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
