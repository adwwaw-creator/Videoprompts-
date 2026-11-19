import React, { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  Mail,
  Send,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Language } from "../types/prompt";
import { safeFetchJson } from "../utils/safeFetchJson";

export type LegalSectionId = "about" | "privacy" | "terms" | "contact";

interface LegalPagesViewProps {
  lang: Language;
  section: LegalSectionId;
  onSelectSection: (section: LegalSectionId) => void;
  onOpenCookieSettings: () => void;
  onGoStudio: () => void;
}

const UPDATED_DATE = "2026-11-18";

export const LegalPagesView: React.FC<LegalPagesViewProps> = ({
  lang,
  section,
  onSelectSection,
  onOpenCookieSettings,
  onGoStudio,
}) => {
  const isAr = lang === "ar";
  const isFr = lang === "fr";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const navItems: { id: LegalSectionId; label: string; icon: React.ReactNode }[] = [
    {
      id: "about",
      label: isAr ? "من نحن" : isFr ? "À propos" : "About Us",
      icon: <Info className="h-3.5 w-3.5" />,
    },
    {
      id: "privacy",
      label: isAr
        ? "سياسة الخصوصية"
        : isFr
        ? "Politique de confidentialité"
        : "Privacy Policy",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
    },
    {
      id: "terms",
      label: isAr
        ? "شروط الاستخدام وسياسة المحتوى"
        : isFr
        ? "Conditions d'utilisation"
        : "Terms & Content Policy",
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      id: "contact",
      label: isAr ? "اتصل بنا" : isFr ? "Contact" : "Contact Us",
      icon: <Mail className="h-3.5 w-3.5" />,
    },
  ];

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    setSentOk(false);
    setSending(true);
    try {
      await safeFetchJson(
        "/api/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message }),
        },
        lang
      );
      setSentOk(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: unknown) {
      setFormErr(
        err instanceof Error
          ? err.message
          : isAr
          ? "تعذر إرسال الرسالة، يرجى التحقق من الحقول."
          : "Unable to send message. Please check all fields."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Sub-navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-[#222634]">
        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-amber-600 bg-amber-700 text-white dark:border-[#D4A34B] dark:bg-[#D4A34B] dark:text-[#110D05]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-600 dark:border-[#262B3A] dark:bg-[#13161F] dark:text-slate-300"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <span className="font-mono-code text-[11px] text-slate-500 dark:text-slate-400">
          {isAr ? "آخر تحديث" : isFr ? "Dernière mise à jour" : "Last updated"}:{" "}
          {UPDATED_DATE}
        </span>
      </div>

      {/* SECTION: PRIVACY POLICY */}
      {section === "privacy" && (
        <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-8 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-300">
          <header className="border-b border-slate-200 pb-4 dark:border-[#222634]">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {isAr
                ? "سياسة الخصوصية وملفات تعريف الارتباط (Google AdSense)"
                : isFr
                ? "Politique de confidentialité et cookies (Google AdSense)"
                : "Privacy Policy & Cookie Disclosures (Google AdSense)"}
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              VideoPrompts Studio — videoprompts.ai.studio
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? "1. إعلانات Google AdSense وملفات تعريف الارتباط للجهات الخارجية"
                : isFr
                ? "1. Annonces Google AdSense et cookies tiers"
                : "1. Google AdSense Advertising & Third-Party Cookies"}
            </h2>
            <p>
              {isAr
                ? "يستخدم موقع VideoPrompts Studio خدمة Google AdSense لعرض الإعلانات. يستخدم الموردون الخارجيون، بما في ذلك شركة Google، ملفات تعريف الارتباط (Cookies) وإشارات الويب وتقنيات مشابهة لعرض الإعلانات استناداً إلى زياراتك السابقة لهذا الموقع أو لمواقع أخرى على الإنترنت."
                : isFr
                ? "VideoPrompts Studio utilise Google AdSense pour diffuser des annonces. Des fournisseurs tiers, y compris Google, utilisent des cookies, des balises Web et des technologies similaires pour diffuser des annonces en fonction de vos visites antérieures sur ce site ou sur d'autres sites Web."
                : "VideoPrompts Studio uses Google AdSense to display advertisements. Third-party vendors, including Google, use cookies, web beacons, and similar technologies to serve ads based on a user's prior visits to this website or other websites across the Internet."}
            </p>
            <p>
              {isAr
                ? "يتيح استخدام Google لملفات تعريف الارتباط الإعلانية لها ولشركائها عرض إعلانات للمستخدمين استناداً إلى زياراتهم لموقعنا و/أو مواقع أخرى على الإنترنت. يمكنك تعطيل الإعلانات المخصصة في أي وقت عبر الروابط الرسمية التالية:"
                : isFr
                ? "L'utilisation des cookies publicitaires par Google lui permet, ainsi qu'à ses partenaires, de diffuser des annonces adaptées en fonction de votre navigation. Vous pouvez désactiver la publicité personnalisée à tout moment via les liens officiels suivants :"
                : "Google's use of advertising cookies enables it and its partners to serve ads based on your visits to this site and/or other sites on the Internet. You may opt out of personalized advertising at any time through the official links below:"}
            </p>
            <ul className="list-disc space-y-1.5 ps-5 text-xs">
              <li>
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 underline underline-offset-4 dark:text-[#F0C775]"
                >
                  <span>Google Ads Settings (adssettings.google.com)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 underline underline-offset-4 dark:text-[#F0C775]"
                >
                  <span>
                    How Google uses data when you use our partners&apos; sites or apps
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 underline underline-offset-4 dark:text-[#F0C775]"
                >
                  <span>Digital Advertising Alliance (aboutads.info)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.youronlinechoices.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 underline underline-offset-4 dark:text-[#F0C775]"
                >
                  <span>European Interactive Digital Advertising Alliance (youronlinechoices.eu)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? "2. سياسة موافقة المستخدمين في الاتحاد الأوروبي (GDPR / EEA / UK / Switzerland)"
                : isFr
                ? "2. Règles relatives au consentement de l'utilisateur dans l'UE (RGPD / EEE / Royaume-Uni)"
                : "2. EU User Consent Policy (GDPR / EEA / UK / Switzerland)"}
            </h2>
            <p>
              {isAr
                ? "نلتزم بسياسة موافقة المستخدمين في الاتحاد الأوروبي الصادرة عن Google وبنظام Google Consent Mode v2. قبل تفعيل ملفات تعريف الارتباط غير الضرورية أو الإعلانات المخصصة، نطلب موافقتك الصريحة مع خيار واضح ومتكافئ للرفض أو التخصيص. يمكنك تعديل أو سحب موافقتك في أي لحظة."
                : isFr
                ? "Nous respectons les règles de Google relatives au consentement de l'utilisateur dans l'UE et Google Consent Mode v2. Votre consentement explicite est demandé avant d'activer les cookies non essentiels ou les annonces personnalisées, avec un choix équivalent de refus ou de personnalisation."
                : "We comply with Google's EU User Consent Policy and Google Consent Mode v2. Prior to enabling non-essential analytics or personalized ad storage, we ask for explicit consent with equally prominent Accept, Reject, and Customize choices. You can modify or withdraw your consent at any time."}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenCookieSettings}
                className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-amber-600/60 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 dark:border-[#D4A34B]/60 dark:bg-[#1D1910] dark:text-[#F0C775]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>
                  {isAr
                    ? "إدارة تفضيلات الكوكيز والإعلانات"
                    : isFr
                    ? "Gérer mes préférences de cookies et annonces"
                    : "Manage Cookie & Ad Preferences"}
                </span>
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? "3. البيانات التي نجمعها والتخزين المحلي"
                : isFr
                ? "3. Données collectées et stockage local"
                : "3. Data We Collect & Local Browser Storage"}
            </h2>
            <ul className="list-disc space-y-1.5 ps-5">
              <li>
                {isAr
                  ? "التخزين المحلي (localStorage): يتم حفظ إعدادات النموذج، المخرجات، سجل البرومبتات، التسلسلات المحفوظة، واللغة والمظهر محلياً على متصفحك فقط، ويمكنك مسحها في أي وقت بضغطة واحدة."
                  : isFr
                  ? "Stockage local (localStorage) : vos brouillons, historique, séquences sauvegardées, langue et thème sont enregistrés uniquement sur votre navigateur et supprimables à tout moment."
                  : "Local storage (localStorage): your form drafts, outputs, prompt history, saved sequences, language, and theme are stored locally in your browser and can be cleared at any time."}
              </li>
              <li>
                {isAr
                  ? "معالجة البرومبتات بالذكاء الاصطناعي: عند استخدام ميزات التوليد الذكي، يتم إرسال وصف المشهد عبر خادم آمن لتوليد البرومبت وإرجاعه مباشرة دون بيع بياناتك لأي طرف ثالث."
                  : isFr
                  ? "Traitement IA des prompts : lorsque vous utilisez les outils IA, votre idée est traitée via un serveur sécurisé uniquement pour produire le prompt demandé, sans revente de données."
                  : "AI prompt processing: when using AI-assisted generation, your scene text is processed through our server solely to compile your requested prompt and is never sold to third parties."}
              </li>
              <li>
                {isAr
                  ? "إحصائيات الزيارات المجمّعة: نستخدم عدّاد زيارات مجهول الهوية لأغراض الصيانة وقياس استقرار الخدمة دون تخزين معلومات شخصية حساسة."
                  : isFr
                  ? "Statistiques agrégées : des compteurs de visites anonymisés peuvent être utilisés pour la maintenance et la stabilité du service."
                  : "Aggregated traffic telemetry: anonymous session visit counts may be recorded solely for infrastructure reliability and site administration."}
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? "4. حقوق المستخدم والتواصل بشأن الخصوصية"
                : isFr
                ? "4. Vos droits et contact confidentialité"
                : "4. User Rights & Privacy Inquiries"}
            </h2>
            <p>
              {isAr
                ? "بموجب أنظمة حماية البيانات (مثل GDPR و CCPA)، يحق لك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها أو سحب موافقتك على التتبع الإعلاني. لأي استفسار يتعلق بالخصوصية يرجى التواصل عبر صفحة اتصل بنا."
                : isFr
                ? "Conformément au RGPD et aux lois applicables, vous disposez d'un droit d'accès, de rectification, de suppression et de retrait du consentement. Contactez-nous via la page Contact pour toute demande."
                : "Under applicable privacy laws (including GDPR and CCPA/CPRA), you have the right to request access, deletion, or withdrawal of consent for personalized advertising. Reach us anytime via our Contact page."}
            </p>
          </section>
        </article>
      )}

      {/* SECTION: TERMS OF SERVICE & CONTENT POLICY */}
      {section === "terms" && (
        <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-8 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-300">
          <header className="border-b border-slate-200 pb-4 dark:border-[#222634]">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {isAr
                ? "شروط الاستخدام وسياسة المحتوى الآمن"
                : isFr
                ? "Conditions d'utilisation et politique de contenu"
                : "Terms of Service & Safe Content Policy"}
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? "متوافقة مع سياسات ناشر Google AdSense وإرشادات الاستخدام المسؤول"
                : isFr
                ? "Alignées sur le Règlement du programme Google AdSense et les règles pour les éditeurs"
                : "Aligned with Google AdSense Program Policies & Google Publisher Restrictions"}
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? "1. سياسة المحتوى المحظور والاستخدام المسؤول"
                : isFr
                ? "1. Contenu interdit et utilisation responsable"
                : "1. Prohibited Content & Responsible Creation"}
            </h2>
            <p>
              {isAr
                ? "يُمنع منعاً باتاً استخدام أدوات VideoPrompts Studio لإنشاء أو طلب أو ترويج أي محتوى ينتهك القوانين أو سياسات ناشري Google، بما في ذلك:"
                : isFr
                ? "Il est strictement interdit d'utiliser VideoPrompts Studio pour générer ou promouvoir des contenus contraires aux lois ou aux règles Google pour les éditeurs, notamment :"
                : "Users are strictly prohibited from using VideoPrompts Studio to author, generate, or promote content violating applicable law or Google Publisher Policies, including:"}
            </p>
            <ul className="list-disc space-y-1.5 ps-5">
              <li>
                {isAr
                  ? "المحتوى الإباحي أو الجنسي الصريح أو استغلال القاصرين."
                  : isFr
                  ? "Contenu sexuellement explicite, pornographique ou portant atteinte aux mineurs."
                  : "Sexually explicit/adult material or any content harming or exploiting minors."}
              </li>
              <li>
                {isAr
                  ? "خطاب الكراهية، العنف الدموي، التحريض على الإرهاب أو إيذاء النفس أو الأنشطة الخطرة وغير القانونية."
                  : isFr
                  ? "Discours de haine, violence graphique, incitation à la violence, automutilation ou activités dangereuses/illégales."
                  : "Hate speech, graphic violence, harassment, self-harm promotion, or illegal/dangerous acts."}
              </li>
              <li>
                {isAr
                  ? "انتهاك حقوق الملكية الفكرية أو العلامات التجارية أو انتحال هوية أشخاص حقيقيين بشكل مضلل."
                  : isFr
                  ? "Atteinte aux droits d'auteur, contrefaçon ou usurpation d'identité trompeuse."
                  : "Copyright infringement, counterfeit goods, or deceptive impersonation of real individuals."}
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? "2. سلامة الزيارات وعدم التشجيع على النقر على الإعلانات"
                : isFr
                ? "2. Intégrité du trafic et interaction avec les annonces"
                : "2. Invalid Traffic & Ad Interaction Integrity"}
            </h2>
            <p>
              {isAr
                ? "يلتزم الموقع التزاماً كاملاً بسياسات Google AdSense ضد النقرات أو الزيارات غير الصالحة. لا يُطلب من المستخدمين أبداً النقر على أي إعلان ولا تُمنح أي مكافآت مقابل مشاهدة الإعلانات أو التفاعل معها، كما يُحظر استخدام البوتات أو أدوات التصفح الآلي لإحداث زيارات مصطنعة."
                : isFr
                ? "Ce site respecte strictement les règles AdSense contre le trafic non valide. Les utilisateurs ne sont jamais incités à cliquer sur des annonces, aucune récompense n'est offerte pour interagir avec des annonces, et l'usage de robots ou de trafic automatisé est interdit."
                : "This platform strictly adheres to Google AdSense invalid traffic policies. Users are never asked or incentivized to click advertisements, and automated bots, scraping tools, or artificial click/impression generators are strictly prohibited."}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isAr
                ? "3. الملكية الفكرية وإخلاء المسؤولية"
                : isFr
                ? "3. Propriété intellectuelle et clause de non-responsabilité"
                : "3. Intellectual Property & Disclaimer"}
            </h2>
            <p>
              {isAr
                ? "تحتفظ أنت بكامل حقوق الأفكار والبرومبتات التي تقوم بتأليفها داخل الاستوديو. جميع العلامات التجارية الخاصة بمحركات الفيديو المذكورة (مثل WAN 2.2 و MiniMax Hailuo و Google Veo و FLUX.1 و HunyuanVideo) مملوكة لأصحابها وتُذكر لأغراض التوافق التقني والتعليمي فقط."
                : isFr
                ? "Vous conservez l'entière propriété des prompts que vous créez. Les marques citées (WAN 2.2, MiniMax Hailuo, Google Veo, FLUX.1, HunyuanVideo) appartiennent à leurs propriétaires respectifs et sont mentionnées uniquement à des fins techniques et éducatives."
                : "You retain full ownership of the creative ideas and prompts you author in the studio. Third-party model names (WAN 2.2, MiniMax Hailuo, Google Veo, FLUX.1, HunyuanVideo) belong to their respective owners and are referenced strictly for technical compatibility and educational documentation."}
            </p>
          </section>
        </article>
      )}

      {/* SECTION: ABOUT US */}
      {section === "about" && (
        <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-8 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-300">
          <header className="border-b border-slate-200 pb-4 dark:border-[#222634]">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {isAr
                ? "من نحن — VideoPrompts Studio"
                : isFr
                ? "À propos de VideoPrompts Studio"
                : "About VideoPrompts Studio"}
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? "منصة مستقلة لهندسة برومبتات الفيديو والسينما بالذكاء الاصطناعي وتوثيق محركات التوليد الحديثة"
                : isFr
                ? "Plateforme indépendante dédiée à l'ingénierie de prompts vidéo cinématiques et à la documentation des moteurs IA"
                : "Independent cinematic AI video prompt engineering workbench and technical documentation resource"}
            </p>
          </header>

          <p>
            {isAr
              ? "أُنشئ موقع VideoPrompts Studio لمساعدة صناع الأفلام، المصممين، ومهندسي الإبداع على تحويل الأفكار السردية بالعربية والفرنسية والإنجليزية إلى برومبتات تصوير سينمائي دقيقة ومنظمة تناسب أحدث محركات الفيديو والصور مثل WAN 2.2 و MiniMax Hailuo 02 و Google Veo 3.1 و HunyuanVideo و FLUX.1."
              : isFr
              ? "VideoPrompts Studio a été conçu pour aider les réalisateurs, créateurs et designers à transformer leurs idées en prompts cinématiques précis, structurés et compatibles avec les moteurs vidéo et image de référence tels que WAN 2.2, MiniMax Hailuo 02, Google Veo 3.1, HunyuanVideo et FLUX.1."
              : "VideoPrompts Studio was built to help filmmakers, motion designers, and creative directors translate narrative ideas in Arabic, French, and English into structured, production-ready prompts tailored for leading generative video and image models including WAN 2.2, MiniMax Hailuo 02, Google Veo 3.1, HunyuanVideo, and FLUX.1."}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-[#262B3A] dark:bg-[#0B0D12]">
              <h2 className="text-xs font-bold text-amber-800 dark:text-[#F0C775]">
                {isAr ? "محتوى تقني وتعليمي أصلي" : isFr ? "Guides techniques originaux" : "Original Technical Guides"}
              </h2>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                {isAr
                  ? "نقدم جداول مقارنة وأفضل ممارسات حقيقية لطول اللقطات، العدسات، الفيزياء، والتحكم بحركة الكاميرا لكل محرك."
                  : isFr
                  ? "Comparatifs d'encodeurs, réglages CFG, physique de caméra et bonnes pratiques dédiées à chaque moteur."
                  : "In-depth encoder specs, CFG tuning, camera physics, and best-practice guides written for each generative engine."}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-[#262B3A] dark:bg-[#0B0D12]">
              <h2 className="text-xs font-bold text-amber-800 dark:text-[#F0C775]">
                {isAr ? "استمرارية المشاهد والأفلام" : isFr ? "Continuité multi-scènes" : "Multi-Scene Film Continuity"}
              </h2>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                {isAr
                  ? "أدوات لبناء تسلسلات أفلام متماسكة من 10 إلى 30 مشهداً مع توحيد الهوية البصرية والعدسة والإضاءة."
                  : isFr
                  ? "Outils dédiés aux séquences de 10 à 30 scènes avec cohérence de personnage, palette et optique."
                  : "Workflows for building 10-to-30 scene film sequences with consistent character identity, palette, and lens language."}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-[#262B3A] dark:bg-[#0B0D12]">
              <h2 className="text-xs font-bold text-amber-800 dark:text-[#F0C775]">
                {isAr ? "خصوصية وشفافية كاملة" : isFr ? "Transparence & confidentialité" : "Privacy-First Architecture"}
              </h2>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                {isAr
                  ? "تُحفظ مسوداتك وسجلك محلياً على جهازك، مع تحكم كامل في تفضيلات ملفات تعريف الارتباط والإعلانات."
                  : isFr
                  ? "Vos brouillons restent stockés localement sur votre navigateur, avec contrôle complet de vos préférences de confidentialité."
                  : "Your drafts and history stay in local browser storage with full user control over cookie and advertising preferences."}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onGoStudio}
              className="rounded-lg bg-amber-700 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-amber-800 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
            >
              {isAr ? "الانتقال إلى استوديو البرومبت" : isFr ? "Ouvrir le studio" : "Open Prompt Studio"}
            </button>
          </div>
        </article>
      )}

      {/* SECTION: CONTACT US */}
      {section === "contact" && (
        <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-8 dark:border-[#222634] dark:bg-[#13161F] dark:text-slate-300">
          <header className="border-b border-slate-200 pb-4 dark:border-[#222634]">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {isAr ? "اتصل بنا" : isFr ? "Contactez-nous" : "Contact Us"}
            </h1>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? "للاستفسارات التقنية، طلبات الخصوصية (GDPR)، حقوق النشر، أو الاقتراحات"
                : isFr
                ? "Pour le support technique, les demandes RGPD, les droits d'auteur ou vos suggestions"
                : "For technical support, GDPR/privacy inquiries, copyright notices, or editorial feedback"}
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="space-y-3 md:col-span-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-[#262B3A] dark:bg-[#0B0D12]">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? "البريد الإلكتروني للدعم والامتثال" : isFr ? "E-mail support & conformité" : "Support & Compliance Email"}
                </p>
                <a
                  href="mailto:support@videoprompts.ai.studio"
                  dir="ltr"
                  className="mt-1 inline-block font-mono-code text-xs font-semibold text-amber-800 underline underline-offset-4 dark:text-[#F0C775]"
                >
                  support@videoprompts.ai.studio
                </a>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? "نرد عادةً خلال 24 إلى 48 ساعة عمل لطلبات الدعم الفني أو الخصوصية أو الإبلاغ عن محتوى."
                    : isFr
                    ? "Réponse habituelle sous 24 à 48 heures ouvrées pour toute demande de support ou confidentialité."
                    : "Typical response window is 24–48 business hours for support, privacy, or content notices."}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => void handleSubmitContact(e)}
              className="space-y-3 md:col-span-7"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? "الاسم" : isFr ? "Nom" : "Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? "البريد الإلكتروني" : isFr ? "E-mail" : "Email"}
                  </label>
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? "الموضوع" : isFr ? "Sujet" : "Subject"}
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  <option value="General">
                    {isAr ? "استفسار عام" : isFr ? "Question générale" : "General Inquiry"}
                  </option>
                  <option value="Privacy / GDPR">
                    {isAr ? "الخصوصية وملفات تعريف الارتباط (GDPR)" : isFr ? "Confidentialité / RGPD" : "Privacy / GDPR Request"}
                  </option>
                  <option value="Copyright / Content">
                    {isAr ? "حقوق النشر أو الإبلاغ عن محتوى" : isFr ? "Droits d'auteur / Signalement" : "Copyright / Content Notice"}
                  </option>
                  <option value="Technical Support">
                    {isAr ? "الدعم الفني" : isFr ? "Support technique" : "Technical Support"}
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? "الرسالة" : isFr ? "Message" : "Message"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-[#262B3A] dark:bg-[#0B0D12] dark:text-slate-100"
                />
              </div>

              {formErr && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  {formErr}
                </p>
              )}

              {sentOk && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    {isAr
                      ? "تم استلام رسالتك بنجاح، سنقوم بمراجعتها والرد عليك قريباً."
                      : isFr
                      ? "Votre message a bien été reçu. Nous vous répondrons rapidement."
                      : "Your message has been received. Our team will review and respond promptly."}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-amber-700 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-800 disabled:opacity-60 dark:bg-[#D4A34B] dark:text-[#110D05] dark:hover:bg-[#E0B566]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {sending
                    ? isAr
                      ? "جارٍ الإرسال..."
                      : "Sending..."
                    : isAr
                    ? "إرسال الرسالة"
                    : isFr
                    ? "Envoyer le message"
                    : "Send Message"}
                </span>
              </button>
            </form>
          </div>
        </article>
      )}
    </div>
  );
};
