import React from "react";
import { ShotItem } from "../types/prompt";

interface StoryboardEditorProps {
  shotsCount: number;
  duration: number;
  shots: ShotItem[];
  placeholderCamera?: string;
  placeholderDesc?: string;
  onUpdateShot: (index: number, field: "camera" | "description", value: string) => void;
}

export const StoryboardEditor: React.FC<StoryboardEditorProps> = ({
  shotsCount,
  duration,
  shots,
  placeholderCamera,
  placeholderDesc,
  onUpdateShot,
}) => {
  if (shotsCount <= 1) return null;

  const safeDuration = duration > 0 ? duration : shotsCount * 2;
  const seg = safeDuration / shotsCount;

  return (
    <div className="mt-4 grid gap-3">
      {shots.slice(0, shotsCount).map((shot, idx) => {
        const start = (idx * seg).toFixed(1);
        const end = ((idx + 1) * seg).toFixed(1);
        return (
          <div
            key={shot.id}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-[#252A38] dark:bg-[#0E1118]"
          >
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-800 dark:text-[#E5B863]">
                Shot {idx + 1} · {shot.role}
              </span>
              <span className="text-xs text-slate-500 font-mono-code dark:text-slate-400">
                {start}s – {end}s
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <textarea
                rows={2}
                value={shot.camera}
                onChange={(e) => onUpdateShot(idx, "camera", e.target.value)}
                placeholder={placeholderCamera || `Camera for Shot ${idx + 1}`}
                className="min-h-[54px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-start text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-100 dark:focus:border-[#D4A34B]"
              />
              <textarea
                rows={2}
                value={shot.description}
                onChange={(e) => onUpdateShot(idx, "description", e.target.value)}
                placeholder={placeholderDesc || `Action for Shot ${idx + 1}`}
                className="sm:col-span-2 min-h-[54px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-start text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-100 dark:focus:border-[#D4A34B]"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
