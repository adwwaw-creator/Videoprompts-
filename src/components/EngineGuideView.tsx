import React from "react";
import { ArrowRight } from "lucide-react";
import { ENGINE_ORDER, ENGINES } from "../data/engines";
import { I18nCopy } from "../data/i18n";
import { EngineId, Language } from "../types/prompt";

interface EngineGuideViewProps {
  copy: I18nCopy;
  lang: Language;
  activeEngine: EngineId;
  onSelectEngineForStudio: (engine: EngineId) => void;
}

export const EngineGuideView: React.FC<EngineGuideViewProps> = ({
  copy,
  lang,
  activeEngine,
  onSelectEngineForStudio,
}) => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 border-b border-slate-200 pb-6 dark:border-[#222634]">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 text-balance">
          {copy.guideTitle}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {copy.guideSubtitle}
        </p>
      </div>

      {/* Spec Table */}
      <div className="mb-8 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-[#222634] dark:bg-[#13161F]">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:border-[#222634] dark:text-slate-400">
              <th className="px-4 py-3 text-start">Engine</th>
              <th className="px-4 py-3 text-start">Vendor</th>
              <th className="px-4 py-3 text-start">Text Encoder</th>
              <th className="px-4 py-3 text-end">Default CFG</th>
              <th className="px-4 py-3 text-end">Steps</th>
              <th className="px-4 py-3 text-end">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#222634]">
            {ENGINE_ORDER.map((id) => {
              const spec = ENGINES[id];
              const isSelected = activeEngine === id;
              return (
                <tr
                  key={id}
                  className="transition-colors hover:bg-slate-50/70 dark:hover:bg-[#181C28]"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {spec.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {spec.vendor}
                  </td>
                  <td className="px-4 py-3 font-mono-code text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {spec.encoder}
                  </td>
                  <td className="px-4 py-3 text-end font-mono-code text-slate-700 dark:text-slate-200">
                    {spec.defaultCfg.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-end font-mono-code text-slate-700 dark:text-slate-200">
                    {spec.defaultSteps}
                  </td>
                  <td className="px-4 py-3 text-end whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectEngineForStudio(id)}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-amber-700 text-white dark:bg-[#D4A34B] dark:text-[#110D05]"
                          : "border border-slate-200 text-slate-700 hover:border-amber-600 hover:text-amber-700 dark:border-[#262B3A] dark:text-slate-200 dark:hover:border-[#D4A34B]"
                      }`}
                    >
                      <span>{copy.goToStudio}</span>
                      <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Engine Breakdown */}
      <div className="grid gap-5 md:grid-cols-2">
        {ENGINE_ORDER.map((id) => {
          const spec = ENGINES[id];
          return (
            <article
              key={id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#222634] dark:bg-[#13161F]"
            >
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {spec.name}
                  </h2>
                  <span className="text-xs text-slate-500 font-mono-code dark:text-slate-400">
                    {spec.vendor} · {spec.kind.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {spec.recommendedSummary[lang]}
                </p>
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3.5 text-xs leading-relaxed text-slate-600 dark:border-[#222634] dark:text-slate-400">
                  {spec.bestPractices[lang].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-600 dark:bg-[#D4A34B]" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      {/* Original Editorial Guide: Cinematic Video Prompt Engineering Fundamentals & FAQ */}
      <section className="mt-10 space-y-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-[#222634] dark:bg-[#13161F]">
        <div className="border-b border-slate-200 pb-4 dark:border-[#222634]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {lang === "ar"
              ? "دليل أساسيات هندسة برومبت الفيديو السينمائي"
              : lang === "fr"
              ? "Guide fondamental d'ingénierie de prompts vidéo cinématiques"
              : "Cinematic Video Prompt Engineering Fundamentals"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {lang === "ar"
              ? "مبادئ عملية مجرّبة لرفع ثبات الهوية البصرية، واقعية الحركة، وجودة الإضاءة عبر محركات الفيديو الحديثة."
              : lang === "fr"
              ? "Principes pratiques pour améliorer la cohérence temporelle, la physique de caméra et la qualité de l'éclairage sur les moteurs vidéo IA."
              : "Practical production principles for improving temporal coherence, realistic camera physics, and lighting fidelity across modern generative video engines."}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="space-y-2">
            <h3 className="text-sm font-bold text-amber-800 dark:text-[#F0C775]">
              {lang === "ar"
                ? "1. بنية الجملة البصرية المتماسكة"
                : lang === "fr"
                ? "1. Structure d'une scène cohérente"
                : "1. Cohesive Shot Architecture"}
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {lang === "ar"
                ? "ابدأ دائماً بوصف واضح للموضوع الرئيسي وخاماته، ثم حدّد البيئة والعمق، ثم صف حركة جسدية واحدة منطقية تناسب مدة اللقطة (5 إلى 10 ثوانٍ). تكديس أكثر من حدثين معقدين في لقطة قصيرة يؤدي غالباً إلى تشوه الإطارات."
                : lang === "fr"
                ? "Commencez toujours par le sujet et ses textures, définissez l'environnement, puis décrivez une action physique réaliste adaptée à la durée du plan (5 à 10 secondes) pour éviter les artefacts temporels."
                : "Lead with the hero subject and tangible materials, anchor the environment depth, and specify one physically plausible action calibrated to clip length (5–10 seconds). Overcrowding actions in short clips causes temporal morphing."}
            </p>
          </article>

          <article className="space-y-2">
            <h3 className="text-sm font-bold text-amber-800 dark:text-[#F0C775]">
              {lang === "ar"
                ? "2. اختيار العدسة وحركة الكاميرا"
                : lang === "fr"
                ? "2. Optique et trajectoire caméra"
                : "2. Focal Length & Camera Inertia"}
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {lang === "ar"
                ? "العدسات الواسعة (24mm–35mm) مثالية للقطات التأسيسية وحركات التتبع، بينما تمنح عدسات 85mm عزلاً ناعماً للخلفية في اللقطات القريبة. في MiniMax Hailuo، استخدم أوامر الكاميرا الرسمية بين أقواس مربعة مثل [Push in] و [Truck left]."
                : lang === "fr"
                ? "Les focales 24mm–35mm excellent pour les plans larges et travellings, tandis que le 85mm sublime les gros plans. Sur MiniMax Hailuo, utilisez les directives entre crochets comme [Push in] et [Truck left]."
                : "Wide lenses (24mm–35mm) anchor establishing and tracking shots, whereas 85mm primes isolate portraits with shallow depth of field. For MiniMax Hailuo, use official bracketed cues like [Push in] and [Truck left]."}
            </p>
          </article>

          <article className="space-y-2">
            <h3 className="text-sm font-bold text-amber-800 dark:text-[#F0C775]">
              {lang === "ar"
                ? "3. استمرارية الأفلام متعددة المشاهد"
                : lang === "fr"
                ? "3. Continuité multi-scènes"
                : "3. Multi-Scene Film Continuity"}
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {lang === "ar"
                ? "لإنتاج فيلم متسلسل دون تغير ملامح الشخصية، ثبّت وصف الملابس والألوان والإضاءة في كل مشهد واستفد من تسليم الحالة البصرية (Continuity Handoff) بين كل مشهد والمشهد الذي يليه."
                : lang === "fr"
                ? "Pour produire une séquence cohérente, verrouillez la tenue, la palette chromatique et l'optique sur chaque scène en transmettant l'état visuel final d'une scène à la suivante."
                : "To maintain character identity across a 10-to-30 scene film, lock wardrobe, color palette, and lens notes across every prompt and pass the ending visual state as a continuity handoff into the next shot."}
            </p>
          </article>
        </div>

        {/* FAQ */}
        <div className="border-t border-slate-200 pt-5 dark:border-[#222634]">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === "ar"
              ? "الأسئلة الشائعة"
              : lang === "fr"
              ? "Questions fréquentes (FAQ)"
              : "Frequently Asked Questions"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 text-xs leading-relaxed">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-[#262B3A] dark:bg-[#0B0D12]">
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {lang === "ar"
                  ? "هل يدعم الاستوديو توليد برومبتات لأكثر من مشهد مترابط؟"
                  : lang === "fr"
                  ? "Le studio permet-il de créer des séquences de plusieurs scènes ?"
                  : "Does the studio support multi-scene film sequences?"}
              </p>
              <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                {lang === "ar"
                  ? "نعم، عبر تبويب مولّد الفيديو والأفلام يمكنك إنشاء 10 مشاهد أساسية مترابطة ثم توسيعها تدريجياً حتى 30 مشهداً مع الحفاظ على ثبات الشخصيات والألوان والعدسة."
                  : lang === "fr"
                  ? "Oui, le générateur vidéo permet de créer 10 scènes cohérentes puis d'étendre progressivement jusqu'à 30 scènes tout en conservant personnages, palette et optique."
                  : "Yes. Using the Video & Film Generator tab, you can generate 10 cohesive core scenes and incrementally expand up to 30 scenes while preserving character, palette, and lens consistency."}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-[#262B3A] dark:bg-[#0B0D12]">
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {lang === "ar"
                  ? "أين يتم حفظ البرومبتات والتسلسلات التي أنشئها؟"
                  : lang === "fr"
                  ? "Où sont enregistrés mes prompts et mes séquences ?"
                  : "Where are my prompts and saved sequences stored?"}
              </p>
              <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                {lang === "ar"
                  ? "يتم حفظ جميع مسوداتك وسجل البرومبتات والتسلسلات محلياً داخل متصفحك فقط، مع إمكانية التصدير بصيغ JSON أو TXT أو مسحها بالكامل في أي وقت."
                  : lang === "fr"
                  ? "Tous vos brouillons, historiques et séquences sont conservés localement dans votre navigateur avec export JSON/TXT et suppression libre à tout moment."
                  : "All drafts, prompt history, and saved film sequences are stored locally in your own browser storage, with full JSON/TXT export and one-click clearing anytime."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
