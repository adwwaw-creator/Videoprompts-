import { Language } from "../types/prompt";

export interface I18nCopy {
  brand: string;
  navPortal: string;
  navStudio: string;
  navGuide: string;
  navHistory: string;
  ctaBuild: string;
  sidebarEngines: string;
  sidebarPresets: string;
  sidebarSettings: string;
  btnReset: string;
  btnBackupStudio: string;
  btnRestoreBackup: string;
  okStudioBackupSaved: string;
  okStudioBackupRestored: string;
  errStudioBackupInvalid: string;
  themeDark: string;
  themeLight: string;
  directorTitle: string;
  directorSubtitle: string;
  directorPlaceholder: string;
  directorBtn: string;
  directorRunning: string;
  directorExamplesLabel: string;
  wanVariantLabel: string;
  secBasic: string;
  secVisual: string;
  secCameraStudio: string;
  secLightingDesigner: string;
  secAudioStudio: string;
  secEngineOptions: string;
  secTechnicalParams: string;
  secStoryboard: string;
  secNegativeAndAi: string;
  autoModeTitle: string;
  autoModeSub: string;
  autoResetAll: string;
  expandAll: string;
  collapseAll: string;
  autoTag: string;
  secOutput: string;
  secAnalyzer: string;
  secHistory: string;
  lblMode: string;
  lblPromptFormat: string;
  formatOfficial: string;
  formatStructured: string;
  lblCategory: string;
  lblSubject: string;
  hintSubject: string;
  lblEnvironment: string;
  lblAction: string;
  lblActionImage: string;
  lblCamera: string;
  lblCameraMovement: string;
  lblCameraLens: string;
  lblLight: string;
  lblStyle: string;
  lblExtra: string;
  lblAspect: string;
  lblDuration: string;
  lblMotion: string;
  lblShots: string;
  lblCfg: string;
  lblSteps: string;
  lblLora: string;
  lblSeed: string;
  seedLock: string;
  seedUnlock: string;
  seedRandomize: string;
  lblPhysics: string;
  lblAudioToggle: string;
  lblAudioCustom: string;
  lblNegative: string;
  btnRegenNeg: string;
  confirmRegenNeg: string;
  cancelAction: string;
  aiBridgeTitle: string;
  aiProviderLabel: string;
  aiGeminiLabel: string;
  aiOllamaLabel: string;
  aiOllamaModelPlaceholder: string;
  aiEnhanceHint: string;
  btnTestConnection: string;
  btnTestingConnection: string;
  btnAiEnhance: string;
  btnAiEnhancing: string;
  btnGenerate: string;
  btnCopyFull: string;
  btnCopyPositive: string;
  btnSavePrompt: string;
  btnSavedPrompt: string;
  btnExportJson: string;
  btnExportPython: string;
  btnDownloadTxt: string;
  btnClearHistory: string;
  btnRestore: string;
  btnFitLength: string;
  btnFittingLength: string;
  btnConvertHailuo: string;
  btnConvertVeo: string;
  btnVeoCode: string;
  convertingFormat: string;
  filterAll: string;
  filterFavorites: string;
  dropTitle: string;
  dropSub: string;
  endDropTitle: string;
  endDropSub: string;
  btnAnalyzeImg: string;
  btnAnalyzingImg: string;
  btnAnalyzeTransition: string;
  btnAnalyzingTransition: string;
  removeImg: string;
  statWords: string;
  statChars: string;
  statTokens: string;
  statShots: string;
  statSteps: string;
  analyzerScoreLabel: string;
  analyzerNoIssues: string;
  analyzerClarity: string;
  analyzerContinuity: string;
  analyzerPacing: string;
  analyzerMotion: string;
  outputPlaceholder: string;
  emptyHistoryTitle: string;
  emptyHistoryDesc: string;
  noSearchResultsTitle: string;
  noSearchResultsDesc: string;
  clearSearchBtn: string;
  clearFiltersBtn: string;
  filterEngineLabel: string;
  filterAllEngines: string;
  historySavedLabel: string;
  goToStudio: string;
  searchHistoryPlaceholder: string;
  errSubject: string;
  errAction: string;
  errEnv: string;
  errEmptyOutput: string;
  errDirectorEmpty: string;
  errNeedBothFrames: string;
  okGenerated: string;
  okDirectorDone: string;
  okCopiedFull: string;
  okCopiedPositive: string;
  okPromptSaved: string;
  okExportedJson: string;
  okExportedPython: string;
  okRestored: string;
  okReset: string;
  okImageLoaded: string;
  okEndImageLoaded: string;
  okImageAnalyzed: string;
  okTransitionAnalyzed: string;
  okLengthFitted: string;
  okConvertedHailuo: string;
  okConvertedVeo: string;
  okAiEnhanced: string;
  okConnectionTest: string;
  tipWanDuration: string;
  tipS2vMode: string;
  fluxNoNegNote: string;
  minimaxNoNegNote: string;
  guideTitle: string;
  guideSubtitle: string;
  portalBrand: string;
  portalBadge: string;
  portalKicker: string;
  portalHeadline: string;
  portalDescription: string;
  portalCardTitle: string;
  portalCardSub: string;
  portalEnterStudio: string;
  portalLaunchMiniMax: string;
  portalLaunchWan: string;
  portalPalette: string;
  portalFooter: string;
  btnLaunchMinimax: string;
  minimaxPanelTitle: string;
  minimaxPanelSub: string;
  minimaxCameraBracketsLbl: string;
  minimaxCameraBracketsHint: string;
  minimaxCustomDirectiveLbl: string;
  minimaxCustomDirectivePlaceholder: string;
  minimaxDurationResLbl: string;
  minimaxOptimizerLbl: string;
  minimaxFramesLbl: string;
  minimaxModeT2V: string;
  minimaxModeI2V: string;
  minimaxModeFLF2V: string;
  minimaxDur6_1080: string;
  minimaxDur6_768: string;
  minimaxDur10_768: string;
  minimaxLaunchReadyTitle: string;
  minimaxLaunchCopiedNote: string;
  minimaxLaunchOpenApp: string;
  minimaxLaunchGenerating: string;
  minimaxLaunchPolling: string;
  minimaxLaunchSuccess: string;
  minimaxLaunchDownloadVideo: string;
  minimaxClosePanel: string;
  portalLaunchVeo: string;
  veoPanelTitle: string;
  veoPanelSub: string;
  veoModelLbl: string;
  veoModelFull: string;
  veoModelFast: string;
  veoResolutionLbl: string;
  veoDurationLbl: string;
  veoDetailLbl: string;
  veoDetailShort: string;
  veoDetailBalanced: string;
  veoDetailProfessional: string;
  veoLanguageLbl: string;
  veoDialogueLbl: string;
  veoDialoguePlaceholder: string;
  veoSoundEffectsLbl: string;
  veoSoundEffectsPlaceholder: string;
  veoAudioLbl: string;
  veoFastAudioNote: string;
  veoCharsLimitLbl: string;
  veoWarningsLbl: string;
  veoQuickPresetsLbl: string;
  veoAutoFillBtn: string;
  veoAutoFillRunning: string;
  veoCameraLbl: string;
  veoLightingLbl: string;
  veoStyleLbl: string;
  veoNegativeLbl: string;
  emptyFieldTag: string;
  selectOptionalAuto: string;
  placeholderSubject: string;
  placeholderEnvironment: string;
  placeholderAction: string;
  placeholderActionImage: string;
  placeholderCamera: string;
  placeholderLight: string;
  placeholderExtra: string;
  placeholderAudio: string;
  placeholderNegative: string;
  placeholderShotCamera: string;
  placeholderShotDesc: string;
  smartKeywordsLbl: string;
  secSceneDetails: string;
  secExportTools: string;
  secEngineNotes: string;
  adminCounterTitle: string;
  adminOnlyBadge: string;
  adminTotalVisits: string;
  adminTodayVisits: string;
  adminUniqueVisitors: string;
  adminRefreshStats: string;
  adminSignIn: string;
  adminSignOut: string;
  adminAccessBtn: string;
  adminNotAuthorized: string;
  btnSignInRegister: string;
  btnSignOutAccount: string;
  accountSignedInLabel: string;
  accountCloudSyncActive: string;
  accountCloudSyncGuestTitle: string;
  accountCloudSyncGuestDesc: string;
  accountSyncLocalBtn: string;
  accountSyncLocalDone: string;
  okSignedInAccount: string;
  okSignedOutAccount: string;
  chainSaveSequenceBtn: string;
  chainSequenceSavedBtn: string;
  okChainSequenceSaved: string;
  okPromptSavedCloud: string;
  okSequenceSavedCloud: string;
  chainSectionTitle: string;
  chainAddBtn: string;
  chainAddingBtn: string;
  chainPlaceholder: string;
  chainSceneLabel: string;
  chainCopyBtn: string;
  chainLoadBtn: string;
  chainExportBtn: string;
  chainClearBtn: string;
  chainSeedLocked: string;
  chainHint: string;
  chainOkAdded: string;
  chainCopyAllBtn: string;
  chainConfirmReset: string;
  chainTotalScenes: string;
  chainStyleLbl: string;
  chainCharacterLbl: string;
  chainEnvLbl: string;
  chainCameraLbl: string;
  chainFirstIdeaLbl: string;
  chainStartBtn: string;
  chainImportBtn: string;
  chainExportJsonBtn: string;
  chainImportedOk: string;
  chainImportErr: string;
  smartGuardTitle: string;
  smartGuardOn: string;
  smartGuardOff: string;
  smartGuardHint: string;
  chainContinuityLabel: string;
  navGenerator: string;
  navDirector: string;
  portalGeneratorShortcut: string;
  portalDirectorShortcut: string;
  genTitle: string;
  genSubtitle: string;
  genIdeaLabel: string;
  genIdeaPlaceholder: string;
  genModelLabel: string;
  genModeLabel: string;
  genModeNormal: string;
  genModeFilm10: string;
  genModeFilm: string;
  genScenesLabel: string;
  genShotLenLabel: string;
  genStyleLabel: string;
  genLangLabel: string;
  genMinimaxMergeLabel: string;
  genGenerateBtn: string;
  genGenerating: string;
  genSampleNormal: string;
  genSampleFilm: string;
  genOutputTitle: string;
  genCopyAll: string;
  genCopied: string;
  genCopyScene: string;
  genOpenInStudio: string;
  genSaveHistory: string;
  genSavePrompt: string;
  genPromptSaved: string;
  genSavedPromptsTitle: string;
  genSavedPromptsEmpty: string;
  genLoadPrompt: string;
  genSaveSequence: string;
  genSequenceSaved: string;
  genSavedSequencesTitle: string;
  genSavedSequencesEmpty: string;
  genLoadSequence: string;
  genExportSequence: string;
  genConsistencyTitle: string;
  genEmptyTitle: string;
  genEmptyDesc: string;
  historyTabAll: string;
  historyTabSequences: string;
  historyFirstScenePreview: string;
  historyShowFullOutput: string;
  historyHideFullOutput: string;
  historyPromptPropsTitle: string;
  historyApplyProps: string;
  historyPropsApplied: string;
  propModel: string;
  propMode: string;
  propStyle: string;
  propDuration: string;
  propAspect: string;
  propLanguage: string;
  propCamera: string;
  propLighting: string;
  propWords: string;
  propScenes: string;
  propFps: string;
  propGenre: string;
  propShotType: string;
  propMood: string;
  propGrading: string;
  modeLabels: Record<string, string>;
}

export const I18N: Record<Language, I18nCopy> = {
  ar: {
    brand: "VideoPrompts Studio",
    navPortal: "البوابة الفاخرة",
    navStudio: "استوديو البرومبت",
    navGuide: "دليل المحركات",
    navHistory: "مكتبة السجل",
    ctaBuild: "توليد البرومبت",
    sidebarEngines: "الأدوات مفتوحة المصدر",
    sidebarPresets: "مكتبة قوالب الإعلانات",
    sidebarSettings: "اللغة والمظهر",
    btnReset: "إعادة ضبط الحقول",
    btnBackupStudio: "نسخة احتياطية (JSON)",
    btnRestoreBackup: "استعادة نسخة (JSON)",
    okStudioBackupSaved: "تم تحميل نسخة احتياطية من إعدادات الاستوديو الحالية (JSON).",
    okStudioBackupRestored: "تمت استعادة إعدادات الاستوديو من ملف النسخة الاحتياطية بنجاح.",
    errStudioBackupInvalid: "ملف النسخة الاحتياطية غير صالح أو تالف. يرجى اختيار ملف JSON صحيح.",
    themeDark: "الوضع الداكن",
    themeLight: "الوضع الفاتح",
    directorTitle: "وضع المخرج الذكي (AI Director Mode)",
    directorSubtitle:
      "اكتب فكرتك في جملة واحدة فقط ليصمم الذكاء الاصطناعي المشهد، الإضاءة، 3 لقطات متتابعة، الصوت، والـ Negative Prompt تلقائياً.",
    directorPlaceholder: "مثال: أريد إعلاناً سينمائياً لعطر فاخر مدته 8 ثوانٍ...",
    directorBtn: "إخراج المشهد بالكامل",
    directorRunning: "جاري الإخراج السينمائي...",
    directorExamplesLabel: "أفكار سريعة:",
    wanVariantLabel: "إصدار نموذج WAN 2.2",
    secBasic: "الإعدادات الأساسية والمرجع البصري",
    secVisual: "الإخراج البصري ومعاملات المحرك",
    secCameraStudio: "استوديو حركة الكاميرا والعدسة",
    secLightingDesigner: "مصمم الإضاءة والألوان والخامات",
    secAudioStudio: "مولّد المؤثرات الصوتية المتزامنة (Audio & Foley)",
    secEngineOptions: "النمط، التصنيف، وإصدار المحرك",
    secTechnicalParams: "الأبعاد، المدة، الشدة والفيزياء",
    secStoryboard: "تقطيع اللقطات (Storyboard)",
    secNegativeAndAi: "البرومبت السلبي ومزود الذكاء الاصطناعي",
    autoModeTitle: "الضبط التلقائي والذكي نشط",
    autoModeSub: "الخيارات التفصيلية مخفية لإخلاء المساحة وتُضبط تلقائياً أو بالذكاء — اضغط على أي خيار للتعديل.",
    autoResetAll: "إعادة الضبط التلقائي",
    expandAll: "إظهار الكل",
    collapseAll: "إخفاء الكل",
    autoTag: "تلقائي · AI",
    secOutput: "المخرجات النهائية والأتمتة",
    secAnalyzer: "محلل جودة البرومبت (من 100)",
    secHistory: "مكتبة البرومبتات والمفضلة",
    lblMode: "نمط التوليد",
    lblPromptFormat: "صيغة البرومبت",
    formatOfficial: "فقرة طبيعية (صيغة Wan الرسمية)",
    formatStructured: "هيكل تفصيلي مقسم (Studio)",
    lblCategory: "التصنيف السينمائي",
    lblSubject: "الفكرة / الموضوع الرئيسي",
    hintSubject: "اكتب فكرتك فقط واترك الحقول فارغة ليملأها الذكاء، أو املأ كل حقل بنفسك",
    lblEnvironment: "البيئة والفضاء المحيط",
    lblAction: "الحركة الفيزيائية الرئيسية",
    lblActionImage: "الوضعية والتفاصيل الديناميكية",
    lblCamera: "صياغة الكاميرا المجمعة",
    lblCameraMovement: "حركة الكاميرا",
    lblCameraLens: "البعد البؤري والعدسة",
    lblLight: "هندسة الإضاءة والألوان",
    lblStyle: "البصمة البصرية والخامة",
    lblExtra: "تفاصيل فيزيائية إضافية",
    lblAspect: "نسبة الأبعاد",
    lblDuration: "المدة ومعدل الإطارات",
    lblMotion: "شدة الحركة",
    lblShots: "تقطيع المشاهد",
    lblCfg: "توجيه CFG",
    lblSteps: "خطوات الاستدلال",
    lblLora: "كلمات تفعيل LoRA (اختياري)",
    lblSeed: "البذرة (Seed)",
    seedLock: "مقفل",
    seedUnlock: "غير مقفل",
    seedRandomize: "عشوائي",
    lblPhysics: "موجهات الفيزياء الدقيقة (Physics Hints)",
    lblAudioToggle: "تضمين طبقة التصميم الصوتي في البرومبت والتصدير",
    lblAudioCustom: "وصف الصوت والموسيقى المتزامنة",
    lblNegative: "Negative Prompt الذكي",
    btnRegenNeg: "توليد ذكي",
    confirmRegenNeg: "تأكيد الاستبدال؟",
    cancelAction: "إلغاء",
    aiBridgeTitle: "المحسن والترجمة الذكية بالذكاء الاصطناعي",
    aiProviderLabel: "مزود التحسين",
    aiGeminiLabel: "Gemini (مفعل تلقائياً على الخادم)",
    aiOllamaLabel: "Ollama المحلي (localhost:11434)",
    aiOllamaModelPlaceholder: "اسم نموذج Ollama (مثال: llama3.1)",
    aiEnhanceHint:
      "اكتب فكرتك بالعربية أو الدارجة أو الفرنسية ثم اضغط تحسين ذكي لصياغتها بالإنجليزية الهندسية المناسبة للمحرك المختار.",
    btnTestConnection: "اختبار الاتصال",
    btnTestingConnection: "جاري الاختبار...",
    btnAiEnhance: "تحسين وترجمة ذكية",
    btnAiEnhancing: "جاري الهندسة...",
    btnGenerate: "إنشاء البرومبت الهندسي القياسي",
    btnCopyFull: "نسخ البرومبت الكامل",
    btnCopyPositive: "نسخ Positive فقط",
    btnSavePrompt: "حفظ البرومبت المولد",
    btnSavedPrompt: "تم الحفظ في المكتبة",
    btnExportJson: "تصدير ComfyUI JSON",
    btnExportPython: "تصدير Python (.py)",
    btnDownloadTxt: "تحميل ملف TXT",
    btnClearHistory: "مسح السجل",
    btnRestore: "استعادة",
    btnFitLength: "ضبط الطول (80–120)",
    btnFittingLength: "جاري الضبط...",
    btnConvertHailuo: "تحويل إلى Hailuo 02",
    btnConvertVeo: "تحويل إلى Veo 3.1",
    btnVeoCode: "كود Veo API",
    convertingFormat: "جاري التحويل...",
    filterAll: "الكل",
    filterFavorites: "المفضلة",
    dropTitle: "اسحب الصورة المرجعية (الإطار الأول) هنا أو اضغط للرفع",
    dropSub: "يضغط الصور الكبيرة تلقائياً إلى 1024px ويدعم التحليل البصري الذكي",
    endDropTitle: "الإطار الأخير (End Frame) لوضع FLF2V",
    endDropSub: "ارفع صورة النهاية ليقترح الذكاء الاصطناعي حركة الانتقال بين الإطارين",
    btnAnalyzeImg: "تحليل الصورة وتوليد الحركة",
    btnAnalyzingImg: "جاري تحليل الصورة...",
    btnAnalyzeTransition: "اقترح الانتقال بين الإطارين",
    btnAnalyzingTransition: "جاري تحليل الانتقال...",
    removeImg: "إزالة الصورة",
    statWords: "كلمة",
    statChars: "حرف",
    statTokens: "توكن تقديري",
    statShots: "لقطات",
    statSteps: "خطوة",
    analyzerScoreLabel: "تقييم الجودة الهندسية",
    analyzerNoIssues: "ممتاز: لا توجد تعارضات حركة أو تكرار كلمات أو مشاكل في التوقيت.",
    analyzerClarity: "وضوح المشهد",
    analyzerContinuity: "الاستمرارية",
    analyzerPacing: "تناسب المدة",
    analyzerMotion: "تناسق الحركة",
    outputPlaceholder:
      "سيظهر هنا البرومبت الهندسي المهيكل والجاهز للتشغيل في ComfyUI أو واجهات التوليد...",
    emptyHistoryTitle: "لا توجد برومبتات محفوظة بعد",
    emptyHistoryDesc:
      "قم ببناء أول برومبت في الاستوديو ليتم حفظه تلقائياً هنا للرجوع إليه وتصديره لاحقاً.",
    noSearchResultsTitle: "لا توجد نتائج مطابقة",
    noSearchResultsDesc: "لم يتم العثور على برومبتات تطابق المحرك أو الكلمات المفتاحية التي تبحث عنها.",
    clearSearchBtn: "مسح البحث",
    clearFiltersBtn: "إعادة ضبط الفلاتر",
    filterEngineLabel: "تصفية حسب المحرك",
    filterAllEngines: "كل المحركات",
    historySavedLabel: "محفوظ",
    goToStudio: "العودة للاستوديو",
    searchHistoryPlaceholder: "ابحث باسم المحرك أو كلمات العنوان...",
    errSubject: "يرجى إدخال الموضوع الرئيسي أولاً.",
    errAction: "يرجى وصف الحركة أو الوضعية المطلوبة.",
    errEnv: "وصف البيئة مطلوب لبناء المشهد بدقة في هذا النمط.",
    errEmptyOutput: "قم بتوليد البرومبت أولاً قبل النسخ أو التصدير.",
    errDirectorEmpty: "اكتب وصفاً موجزاً للمشهد المطلوب في المخرج الذكي.",
    errNeedBothFrames: "ارفع الإطار الأول والإطار الأخير معاً لتحليل الانتقال.",
    okGenerated: "تم بناء البرومبت الهندسي وحفظه في السجل.",
    okDirectorDone: "تم تصميم المشهد واللقطات الثلاث والصوت والعناصر المستبعدة بالكامل.",
    okCopiedFull: "تم نسخ البرومبت الكامل إلى الحافظة.",
    okCopiedPositive: "تم نسخ Positive Prompt فقط (جاهز لعقدة CLIPTextEncode).",
    okPromptSaved: "تم حفظ البرومبت المولد في المكتبة والمفضلة.",
    okExportedJson: "تم تصدير ملف JSON المتوافق مع أنابيب ComfyUI.",
    okExportedPython: "تم تصدير سكربت Python الجاهز للتشغيل عبر Diffusers.",
    okRestored: "تمت استعادة البرومبت والإعدادات من السجل.",
    okReset: "تمت إعادة ضبط جميع الحقول.",
    okImageLoaded: "تمت قراءة الصورة وضغطها تلقائياً مع ضبط الأبعاد.",
    okEndImageLoaded: "تمت قراءة صورة الإطار الأخير بنجاح.",
    okImageAnalyzed: "تم تحليل الصورة المرجعية وتوليد البرومبت.",
    okTransitionAnalyzed: "تم تحليل الإطارين وصياغة حركة الانتقال بينهما.",
    okLengthFitted: "تم ضبط طول البرومبت بالذكاء الاصطناعي إلى النطاق المثالي (80–120 كلمة).",
    okConvertedHailuo: "تم تحويل البرومبت إلى صيغة MiniMax Hailuo 02.",
    okConvertedVeo: "تم تحويل البرومبت إلى صيغة Google Veo 3.1 (مع وصف الصوت والتزامن).",
    okAiEnhanced: "تم تحسين الحقول وتوليد البرومبت بالذكاء الاصطناعي.",
    okConnectionTest: "تم التحقق من الاتصال بنجاح والخدمة جاهزة.",
    tipWanDuration:
      "معلومة: نموذج Wan 2.2 مُدرّب أساساً على ~5 ثوانٍ؛ في المدد الأطول يفضّل تقسيم الحركة على عدة لقطات (Storyboard) للحفاظ على الثبات.",
    tipS2vMode:
      "وضع الغناء والصوت (S2V): ارفع صورة الشخصية + ملف الصوت MP3/WAV في Wan2.2-S2V-14B لتحريك الشفاه وتعبيرات الوجه.",
    fluxNoNegNote:
      "محرك FLUX.1 يعتمد على الوصف الإيجابي الصريح ولا يتطلب Negative Prompt تقليدي.",
    minimaxNoNegNote:
      "محرك MiniMax Hailuo 02 لا يستخدم Negative Prompt؛ يعتمد على الأوصاف الإيجابية الصريحة وأوامر الكاميرا بين أقواس مثل [Push in].",
    guideTitle: "مرجع هندسة البرومبت للأدوات مفتوحة المصدر",
    guideSubtitle:
      "الخصائص التقنية، المشفرات النصية، وأفضل الممارسات لكل محرك مدعوم في الاستوديو.",
    portalBrand: "VIDEOPROMPTS.AI.STUDIO",
    portalBadge: "تجربة ذكاء اصطناعي فاخرة",
    portalKicker: "مستقبل الذكاء الإبداعي وهندسة الفيديو",
    portalHeadline: "حيث يلتقي الذكاء الاصطناعي بالفخامة",
    portalDescription:
      "اختبر فن هندسة البرومبت لـ WAN 2.2 و MiniMax Hailuo 02 و HunyuanVideo و FLUX.1 بدقة سينمائية وأناقة بصرية فائقة.",
    portalCardTitle: "VIDEOPROMPTS",
    portalCardSub: "استوديو الإبداع الاحترافي للبرومبت والسينما",
    portalEnterStudio: "دخول الاستوديو",
    portalLaunchMiniMax: "تشغيل MiniMax Hailuo 02",
    portalLaunchWan: "تشغيل WAN 2.2 A14B",
    portalPalette: "أسود أوبسيديان · ذهب شامبانيا · سيان",
    portalFooter: "VIDEOPROMPTS.AI.STUDIO — ذكاء إبداعي فاخر",
    btnLaunchMinimax: "توليد في MiniMax",
    minimaxPanelTitle: "استوديو MiniMax Hailuo 02 المخصص",
    minimaxPanelSub: "حقول موجهة لنموذج Hailuo 02 مع أوامر الكاميرا بالأقواس، المدة والدقة، وإطاري البداية والنهاية.",
    minimaxCameraBracketsLbl: "أوامر الكاميرا الرسمية [Camera] (اختر حتى 3)",
    minimaxCameraBracketsHint: "يُدمج تلقائياً في مقدمة البرومبت",
    minimaxCustomDirectiveLbl: "حقل التوجيه الفيزيائي والمؤثرات الخاصة لـ Hailuo 02",
    minimaxCustomDirectivePlaceholder: "مثال: micro water droplets suspended mid-air, crisp glass caustics, smooth fabric inertia...",
    minimaxDurationResLbl: "المدة والدقة (Hailuo 02)",
    minimaxOptimizerLbl: "تفعيل مُحسّن البرومبت التلقائي (prompt_optimizer)",
    minimaxFramesLbl: "وضع الإطارات (نص / بداية / بداية ونهاية)",
    minimaxModeT2V: "نص → فيديو",
    minimaxModeI2V: "الإطار الأول (I2V)",
    minimaxModeFLF2V: "الإطار الأول + الأخير",
    minimaxDur6_1080: "6 ثوانٍ · 1080P فائق الدقة",
    minimaxDur6_768: "6 ثوانٍ · 768P سريع",
    minimaxDur10_768: "10 ثوانٍ · 768P ممتد",
    minimaxLaunchReadyTitle: "بوابة التوليد في MiniMax Hailuo 02",
    minimaxLaunchCopiedNote: "تم بناء البرومبت بصيغة Hailuo 02 ونسخه تلقائياً إلى الحافظة مع إرفاق إعداداتك.",
    minimaxLaunchOpenApp: "فتح MiniMax Hailuo الآن",
    minimaxLaunchGenerating: "جاري الإرسال إلى MiniMax...",
    minimaxLaunchPolling: "جاري توليد الفيديو في Hailuo 02...",
    minimaxLaunchSuccess: "تم إنشاء الفيديو في MiniMax.",
    minimaxLaunchDownloadVideo: "تحميل الفيديو MP4",
    minimaxClosePanel: "إغلاق",
    portalLaunchVeo: "تشغيل Google Veo 3.1",
    veoPanelTitle: "استوديو Google Veo 3.1 الاحترافي",
    veoPanelSub: "إعدادات Veo 3.1 و Veo 3.1 Fast مع التحقق التلقائي من الحدود والمدة والدقة والصوت المتزامن.",
    veoModelLbl: "إصدار نموذج Google Veo",
    veoModelFull: "Veo 3.1 الكامل (جودة سينمائية + صوت)",
    veoModelFast: "Veo 3.1 Fast السريع (1200 حرف كحد أقصى)",
    veoResolutionLbl: "الدقة (Resolution)",
    veoDurationLbl: "المدة (Duration)",
    veoDetailLbl: "مستوى التفاصيل",
    veoDetailShort: "مختصر",
    veoDetailBalanced: "متوازن",
    veoDetailProfessional: "احترافي",
    veoLanguageLbl: "لغة المخرج (Output Language)",
    veoDialogueLbl: "الحوار المنطوق (Dialogue) — اختياري",
    veoDialoguePlaceholder: "اتركه فارغاً أو أدخل الحوار المطلوب بين الشخصيات...",
    veoSoundEffectsLbl: "المؤثرات الصوتية الخاصة (SFX) — اختياري",
    veoSoundEffectsPlaceholder: "اتركه فارغاً للصوت الطبيعي، أو حدد المؤثرات الصوتية...",
    veoAudioLbl: "تفعيل الصوت المتزامن (Native Synchronized Audio)",
    veoFastAudioNote: "تنبيه: موديل Veo 3.1 Fast لا يدعم الصوت المركب بموثوقية — سيتم تعطيل توجيه الصوت تلقائياً أو استخدم Veo 3.1 الكامل.",
    veoCharsLimitLbl: "طول برومبت Veo",
    veoWarningsLbl: "تنبيهات التوافق والسلامة",
    veoQuickPresetsLbl: "قوالب Google Veo السريعة (اضغط لملء جميع الحقول)",
    veoAutoFillBtn: "ملء الحقول ذكياً من الفكرة",
    veoAutoFillRunning: "جاري تعبئة حقول Veo...",
    veoCameraLbl: "الكاميرا والعدسة (Camera)",
    veoLightingLbl: "الإضاءة (Lighting)",
    veoStyleLbl: "النمط البصري (Style)",
    veoNegativeLbl: "العناصر المستبعدة (Negative Prompt)",
    emptyFieldTag: "فارغ · يملؤه العميل أو الذكاء",
    selectOptionalAuto: "— فارغ (يختاره العميل أو الذكاء) —",
    placeholderSubject: "اكتب فكرتك أو الموضوع الرئيسي هنا (بالعربية أو الدارجة أو الإنجليزية)...",
    placeholderEnvironment: "اتركه فارغاً ليملأه الذكاء من الفكرة، أو صف البيئة بنفسك...",
    placeholderAction: "اتركه فارغاً ليملأه الذكاء من الفكرة، أو صف الحركة المطلوبة...",
    placeholderActionImage: "اتركه فارغاً ليملأه الذكاء، أو صف الوضعية والتفاصيل...",
    placeholderCamera: "فارغ — اختر من الأزرار أو اكتب الكاميرا، أو اتركه للذكاء...",
    placeholderLight: "فارغ — اختر لوحة إضاءة أو اكتبها، أو اتركها للذكاء...",
    placeholderExtra: "فارغ — تفاصيل فيزيائية أو خامات إضافية (اختياري)...",
    placeholderAudio: "فارغ — وصف المؤثرات الصوتية والموسيقى (اختياري أو بالذكاء)...",
    placeholderNegative: "فارغ — اكتب عناصر مستبعدة أو اضغط توليد ذكي أو اتركه للذكاء...",
    placeholderShotCamera: "كاميرا اللقطة (فارغ = يملؤها الذكاء)",
    placeholderShotDesc: "وصف اللقطة (فارغ = يملؤها الذكاء)",
    smartKeywordsLbl: "كلمات مفتاحية ذكية:",
    secSceneDetails: "تفاصيل البيئة والحركة (اختياري)",
    secExportTools: "أدوات التصدير والتحويل (JSON · Python · Veo · MiniMax)",
    secEngineNotes: "ملاحظات وأفضل ممارسات المحرك",
    adminCounterTitle: "عداد الزوار المباشر",
    adminOnlyBadge: "للمسؤول فقط",
    adminTotalVisits: "إجمالي الزيارات",
    adminTodayVisits: "زوار اليوم",
    adminUniqueVisitors: "زوار فريدون (آخر 200)",
    adminRefreshStats: "تحديث",
    adminSignIn: "دخول المسؤول (Google)",
    adminSignOut: "خروج",
    adminAccessBtn: "إدارة المسؤول",
    adminNotAuthorized: "هذا الحساب غير مخوّل لعرض إحصائيات المسؤول.",
    btnSignInRegister: "تسجيل الدخول / إنشاء حساب",
    btnSignOutAccount: "تسجيل الخروج",
    accountSignedInLabel: "حسابي",
    accountCloudSyncActive: "المزامنة السحابية مفعّلة — جميع برومبتاتك وسلاسلك محفوظة في حسابك.",
    accountCloudSyncGuestTitle: "سجّل دخولك لحفظ البرومبتات والسلاسل سحابياً",
    accountCloudSyncGuestDesc: "أنشئ حسابك أو سجّل الدخول بحساب Google لحفظ جميع برومبتاتك وسلاسل الأفلام والوصول إليها من أي جهاز.",
    accountSyncLocalBtn: "مزامنة المحفوظات المحلية لحسابي",
    accountSyncLocalDone: "تمت مزامنة برومبتاتك وسلاسلك المحلية مع حسابك بنجاح.",
    okSignedInAccount: "مرحباً بك! تم تسجيل الدخول وتفعيل الحفظ السحابي للبرومبتات والسلاسل.",
    okSignedOutAccount: "تم تسجيل الخروج من حسابك.",
    chainSaveSequenceBtn: "حفظ السلسلة",
    chainSequenceSavedBtn: "تم حفظ السلسلة",
    okChainSequenceSaved: "تم حفظ سلسلة المشاهد في السجل بنجاح.",
    okPromptSavedCloud: "تم حفظ البرومبت في سجل حسابك السحابي.",
    okSequenceSavedCloud: "تم حفظ السلسلة في حسابك السحابي بنجاح.",
    chainSectionTitle: "سلسلة المشاهد المتتابعة",
    chainAddBtn: "أضف برومبت تالي",
    chainAddingBtn: "جاري توليد المشهد التالي...",
    chainPlaceholder: "اكتب فكرة المشهد التالي (مع الحفاظ على نفس الشخصية والأسلوب)...",
    chainSceneLabel: "المشهد",
    chainCopyBtn: "نسخ",
    chainLoadBtn: "عرض في المحرر",
    chainExportBtn: "تصدير السلسلة (.txt)",
    chainClearBtn: "بدء سلسلة جديدة",
    chainSeedLocked: "Seed ثابت للاستمرارية",
    chainHint: "يتم تثبيت الشخصية والأسلوب البصري والبيئة والـ Seed تلقائياً من المشهد الأول.",
    chainOkAdded: "تم توليد المشهد التالي وإضافته إلى السلسلة مع الحفاظ على الاستمرارية.",
    chainCopyAllBtn: "نسخ الكل",
    chainConfirmReset: "تأكيد الحذف؟",
    chainTotalScenes: "إجمالي المشاهد",
    chainStyleLbl: "الأسلوب البصري",
    chainCharacterLbl: "الشخصية",
    chainEnvLbl: "البيئة",
    chainCameraLbl: "الكاميرا",
    chainFirstIdeaLbl: "فكرة المشهد الأول",
    chainStartBtn: "ابدأ السلسلة",
    chainImportBtn: "استيراد (.txt / .json)",
    chainExportJsonBtn: "تصدير JSON",
    chainImportedOk: "تم استيراد سلسلة المشاهد وتنسيقها.",
    chainImportErr: "تعذر العثور على مشاهد صالحة داخل الملف.",
    smartGuardTitle: "SMART SCENE GUARD",
    smartGuardOn: "مفعّل",
    smartGuardOff: "متوقف",
    smartGuardHint: "يمنع تداخل المشاهد ودمج الشخصيات والخلفيات تلقائياً لـ Wan 2.2 وMiniMax وVeo",
    chainContinuityLabel: "حالة التمرير للمشهد التالي",
    navGenerator: "المولّد v1.0",
    navDirector: "المخرج v2.0",
    portalGeneratorShortcut: "مولّد الأفلام v1.0 (10 إلى 30 مشهداً)",
    portalDirectorShortcut: "محرك المخرج السينمائي v2.0",
    genTitle: "مولّد برومبتات الفيديو والأفلام — الإصدار 1.0",
    genSubtitle:
      "حوّل فكرتك بالعربية أو الإنجليزية إلى برومبت منفرد أو تسلسل فيلمي متسق (10 مشاهد أساسية قابلة للتوسيع +20 حتى 30 مشهداً) جاهز للصق في Wan 2.2 و MiniMax Hailuo و Google Veo.",
    genIdeaLabel: "IDEA — فكرة الفيديو",
    genIdeaPlaceholder: "مثال: مهندس يبحث عن مدينة مفقودة في الصحراء عند الغروب...",
    genModelLabel: "MODEL — محرك التوليد",
    genModeLabel: "MODE — النمط",
    genModeNormal: "برومبت عادي",
    genModeFilm10: "فيلم (10 مشاهد)",
    genModeFilm: "فيلم (حتى 30)",
    genScenesLabel: "SCENES — عدد المشاهد",
    genShotLenLabel: "SHOT_LEN — مدة المشهد (ثوانٍ)",
    genStyleLabel: "STYLE — الأسلوب البصري",
    genLangLabel: "LANG — لغة المخرجات",
    genMinimaxMergeLabel: "السماح بدمج لقطتين في MiniMax (≤ 15 ثانية)",
    genGenerateBtn: "توليد البرومبت الجاهز",
    genGenerating: "جارٍ هندسة البرومبت...",
    genSampleNormal: "تجربة مثال Wan العادي",
    genSampleFilm: "تجربة فيلم 10 مشاهد",
    genOutputTitle: "المخرجات النهائية الجاهزة للصق",
    genCopyAll: "نسخ المخرجات كاملة",
    genCopied: "تم النسخ",
    genCopyScene: "نسخ المشهد",
    genOpenInStudio: "فتح في الاستوديو",
    genSaveHistory: "حفظ في السجل",
    genSavePrompt: "حفظ البرومبت",
    genPromptSaved: "تم حفظ البرومبت",
    genSavedPromptsTitle: "البرومبتات المولدة المحفوظة",
    genSavedPromptsEmpty: "لا توجد برومبتات مولدة محفوظة بعد. يتم حفظ كل برومبت تولّده تلقائياً للعودة إليه لاحقاً.",
    genLoadPrompt: "العودة للبرومبت",
    genSaveSequence: "حفظ السلسلة",
    genSequenceSaved: "تم حفظ السلسلة",
    genSavedSequencesTitle: "السلاسل المحفوظة",
    genSavedSequencesEmpty: "لا توجد سلاسل فيلمية محفوظة بعد.",
    genLoadSequence: "فتح السلسلة",
    genExportSequence: "تصدير JSON",
    genConsistencyTitle: "ملاحظات الاتساق الثابت (Consistency Notes)",
    genEmptyTitle: "جاهز لهندسة برومبت الفيديو والأفلام",
    genEmptyDesc:
      "أدخل فكرة الفيديو، اختر المحرك (Wan 2.2 أو MiniMax أو Google Veo) والنمط (عادي أو فيلم 10 مشاهد قابل للتوسيع حتى 30)، ثم اضغط توليد للحصول على برومبت دقيق بدون مقدمات زائدة.",
    historyTabAll: "كل البرومبتات",
    historyTabSequences: "السلاسل المحفوظة",
    historyFirstScenePreview: "معاينة المشهد الأول",
    historyShowFullOutput: "عرض السلسلة كاملة",
    historyHideFullOutput: "إخفاء السلسلة",
    historyPromptPropsTitle: "خصائص البرومبت",
    historyApplyProps: "استخدام الخصائص",
    historyPropsApplied: "تم تطبيق خصائص البرومبت بنجاح.",
    propModel: "المحرك",
    propMode: "النمط",
    propStyle: "الأسلوب",
    propDuration: "المدة",
    propAspect: "الأبعاد",
    propLanguage: "اللغة",
    propCamera: "الكاميرا والعدسة",
    propLighting: "الإضاءة",
    propWords: "الكلمات",
    propScenes: "المشاهد",
    propFps: "الإطارات",
    propGenre: "النوع",
    propShotType: "اللقطة",
    propMood: "المزاج",
    propGrading: "التلوين",
    modeLabels: {
      t2v: "نص إلى فيديو (T2V)",
      i2v: "صورة إلى فيديو (I2V)",
      flf2v: "إطار بداية ونهاية (FLF2V)",
      s2v: "صوت ومغني إلى فيديو (S2V)",
      film: "فيلم سينمائي (FILM)",
      t2i: "نص إلى صورة (T2I)",
      img2img: "صورة إلى صورة (Img2Img)",
    },
  },
  fr: {
    brand: "VideoPrompts Studio",
    navPortal: "Portail Luxe",
    navStudio: "Studio Prompt",
    navGuide: "Guide Moteurs",
    navHistory: "Bibliothèque",
    ctaBuild: "Générer",
    sidebarEngines: "Outils Open-Source",
    sidebarPresets: "Modèles Publicitaires",
    sidebarSettings: "Langue & Apparence",
    btnReset: "Réinitialiser",
    btnBackupStudio: "Sauvegarde (JSON)",
    btnRestoreBackup: "Restaurer (JSON)",
    okStudioBackupSaved: "Sauvegarde JSON de l'état actuel du studio téléchargée.",
    okStudioBackupRestored: "État du studio restauré depuis le fichier JSON de sauvegarde.",
    errStudioBackupInvalid: "Fichier de sauvegarde JSON invalide ou corrompu.",
    themeDark: "Mode Sombre",
    themeLight: "Mode Clair",
    directorTitle: "Mode Réalisateur IA (AI Director)",
    directorSubtitle:
      "Décrivez votre idée en une phrase : l'IA conçoit le décor, l'éclairage, 3 plans séquencés, le son et le prompt négatif.",
    directorPlaceholder: "Ex: Une publicité cinématographique pour un parfum de luxe de 8 secondes...",
    directorBtn: "Réaliser la scène complète",
    directorRunning: "Réalisation en cours...",
    directorExamplesLabel: "Idées rapides :",
    wanVariantLabel: "Variante WAN 2.2",
    secBasic: "Paramètres de base & Référence",
    secVisual: "Direction Visuelle & Paramètres Moteur",
    secCameraStudio: "Studio Mouvements Caméra & Objectifs",
    secLightingDesigner: "Design Éclairage, Couleurs & Textures",
    secAudioStudio: "Design Sonore Synchronisé (Audio & Foley)",
    secEngineOptions: "Mode, Catégorie & Variante Moteur",
    secTechnicalParams: "Format, Durée, Mouvement & Physique",
    secStoryboard: "Découpage Multi-Plans (Storyboard)",
    secNegativeAndAi: "Prompt Négatif & Fournisseur IA",
    autoModeTitle: "Configuration Automatique & IA Active",
    autoModeSub: "Les options avancées restent masquées pour libérer l'espace et s'ajustent par IA — cliquez pour personnaliser.",
    autoResetAll: "Mode Auto",
    expandAll: "Tout ouvrir",
    collapseAll: "Tout masquer",
    autoTag: "Auto · IA",
    secOutput: "Sortie Finale & Exportation",
    secAnalyzer: "Analyseur de Qualité (/100)",
    secHistory: "Bibliothèque & Favoris",
    lblMode: "Mode de génération",
    lblPromptFormat: "Format du prompt",
    formatOfficial: "Prose naturelle (Formule Wan officielle)",
    formatStructured: "Structure détaillée (Studio)",
    lblCategory: "Catégorie cinématographique",
    lblSubject: "Sujet principal / Produit",
    hintSubject: "Supporte le français, l'arabe ou la darija via l'optimiseur IA",
    lblEnvironment: "Environnement & Décor",
    lblAction: "Mouvement physique principal",
    lblActionImage: "Pose & Détails dynamiques",
    lblCamera: "Directive caméra combinée",
    lblCameraMovement: "Mouvement caméra",
    lblCameraLens: "Focale / Objectif",
    lblLight: "Éclairage & Étalonnage",
    lblStyle: "Style visuel & Texture",
    lblExtra: "Micro-physique & Détails",
    lblAspect: "Format d'image",
    lblDuration: "Durée & Cadence",
    lblMotion: "Intensité du mouvement",
    lblShots: "Découpage (Plans)",
    lblCfg: "Échelle CFG",
    lblSteps: "Étapes (Steps)",
    lblLora: "Mots-clés LoRA (optionnel)",
    lblSeed: "Seed",
    seedLock: "Verrouillé",
    seedUnlock: "Libre",
    seedRandomize: "Aléatoire",
    lblPhysics: "Indices Micro-Physiques (Physics Hints)",
    lblAudioToggle: "Inclure le design sonore synchronisé",
    lblAudioCustom: "Description audio & musique",
    lblNegative: "Prompt Négatif Intelligent",
    btnRegenNeg: "Régénérer",
    confirmRegenNeg: "Confirmer le remplacement ?",
    cancelAction: "Annuler",
    aiBridgeTitle: "Optimiseur & Traduction IA",
    aiProviderLabel: "Fournisseur IA",
    aiGeminiLabel: "Gemini (Intégré côté serveur)",
    aiOllamaLabel: "Ollama Local (localhost:11434)",
    aiOllamaModelPlaceholder: "Nom du modèle Ollama (ex: llama3.1)",
    aiEnhanceHint:
      "Saisissez votre idée en arabe, français ou anglais puis cliquez sur Optimiser avec l'IA pour obtenir un prompt calibré.",
    btnTestConnection: "Tester la connexion",
    btnTestingConnection: "Test en cours...",
    btnAiEnhance: "Optimiser avec l'IA",
    btnAiEnhancing: "Ingénierie en cours...",
    btnGenerate: "Générer le Prompt Structuré",
    btnCopyFull: "Copier tout le prompt",
    btnCopyPositive: "Copier Positive seul",
    btnSavePrompt: "Enregistrer le prompt",
    btnSavedPrompt: "Enregistré",
    btnExportJson: "Exporter JSON ComfyUI",
    btnExportPython: "Exporter Python (.py)",
    btnDownloadTxt: "Télécharger TXT",
    btnClearHistory: "Effacer",
    btnRestore: "Restaurer",
    btnFitLength: "Ajuster (80–120 mots)",
    btnFittingLength: "Ajustement...",
    btnConvertHailuo: "Convertir → Hailuo 02",
    btnConvertVeo: "Convertir → Veo 3.1",
    btnVeoCode: "Code API Veo",
    convertingFormat: "Conversion...",
    filterAll: "Tout",
    filterFavorites: "Favoris",
    dropTitle: "Glissez l'image de référence (1re image) ici ou cliquez",
    dropSub: "Redimensionne automatiquement à 1024px max et analyse via Vision IA",
    endDropTitle: "Dernière image (End Frame) pour FLF2V",
    endDropSub: "Importez l'image finale pour que l'IA propose la transition entre les deux",
    btnAnalyzeImg: "Analyser l'image & Mouvement",
    btnAnalyzingImg: "Analyse en cours...",
    btnAnalyzeTransition: "Suggérer la transition",
    btnAnalyzingTransition: "Analyse de transition...",
    removeImg: "Retirer",
    statWords: "mots",
    statChars: "caractères",
    statTokens: "tokens est.",
    statShots: "plans",
    statSteps: "étapes",
    analyzerScoreLabel: "Score d'ingénierie",
    analyzerNoIssues: "Excellent : aucun conflit de mouvement, répétition ou défaut de rythme détecté.",
    analyzerClarity: "Clarté",
    analyzerContinuity: "Continuité",
    analyzerPacing: "Rythme",
    analyzerMotion: "Mouvement",
    outputPlaceholder: "Votre prompt professionnel prêt pour ComfyUI apparaîtra ici...",
    emptyHistoryTitle: "Aucun prompt enregistré",
    emptyHistoryDesc: "Générez un prompt dans le studio pour le retrouver et l'exporter ici.",
    noSearchResultsTitle: "Aucun résultat correspondant",
    noSearchResultsDesc: "Aucun prompt enregistré ne correspond à ce moteur ou à ces mots-clés.",
    clearSearchBtn: "Effacer la recherche",
    clearFiltersBtn: "Réinitialiser les filtres",
    filterEngineLabel: "Filtrer par moteur",
    filterAllEngines: "Tous les moteurs",
    historySavedLabel: "enregistrés",
    goToStudio: "Retour au Studio",
    searchHistoryPlaceholder: "Rechercher par moteur ou mots-clés du titre...",
    errSubject: "Veuillez saisir le sujet principal.",
    errAction: "Veuillez décrire le mouvement ou la pose.",
    errEnv: "L'environnement est requis dans ce mode.",
    errEmptyOutput: "Générez d'abord un prompt.",
    errDirectorEmpty: "Veuillez saisir une brève idée pour le Réalisateur IA.",
    errNeedBothFrames: "Importez la première et la dernière image pour analyser la transition.",
    okGenerated: "Prompt structuré généré et enregistré.",
    okDirectorDone: "Scène, 3 plans, audio et prompt négatif générés par le Réalisateur IA.",
    okCopiedFull: "Prompt complet copié dans le presse-papiers.",
    okCopiedPositive: "Prompt positif copié (prêt pour CLIPTextEncode).",
    okPromptSaved: "Prompt enregistré dans votre bibliothèque et vos favoris.",
    okExportedJson: "Fichier JSON ComfyUI exporté.",
    okExportedPython: "Script Python Pipeline exporté.",
    okRestored: "Prompt restauré depuis la bibliothèque.",
    okReset: "Tous les champs ont été réinitialisés.",
    okImageLoaded: "Image optimisée (≤1024px) et format détecté automatiquement.",
    okEndImageLoaded: "Dernière image chargée avec succès.",
    okImageAnalyzed: "Image analysée et prompt généré.",
    okTransitionAnalyzed: "Transition entre les deux images générée par l'IA.",
    okLengthFitted: "Longueur calibrée dans la zone idéale (80–120 mots).",
    okConvertedHailuo: "Prompt converti au format MiniMax Hailuo 02.",
    okConvertedVeo: "Prompt converti au format Google Veo 3.1.",
    okAiEnhanced: "Champs optimisés et prompt généré par l'IA.",
    okConnectionTest: "Connexion vérifiée avec succès.",
    tipWanDuration:
      "Info : Wan 2.2 est calibré sur ~5 secondes ; pour plus long, répartissez l'action en plusieurs plans (Storyboard).",
    tipS2vMode:
      "Mode Chant / Audio S2V : importez portrait + piste MP3/WAV dans Wan2.2-S2V-14B pour la synchro labiale.",
    fluxNoNegNote: "FLUX.1 repose sur une description positive explicite sans prompt négatif traditionnel.",
    minimaxNoNegNote:
      "MiniMax Hailuo 02 n'utilise pas de prompt négatif ; utilisez des descriptions positives et des commandes caméra [Push in].",
    guideTitle: "Référence Technique des Moteurs Open-Source",
    guideSubtitle: "Encodeurs texte, paramètres recommandés et bonnes pratiques par moteur.",
    portalBrand: "VIDEOPROMPTS.AI.STUDIO",
    portalBadge: "EXPÉRIENCE IA DE LUXE",
    portalKicker: "L'AVENIR DE L'INTELLIGENCE CRÉATIVE",
    portalHeadline: "Là où l'IA rencontre le Luxe",
    portalDescription:
      "Maîtrisez l'art de l'ingénierie de prompts pour WAN 2.2, MiniMax Hailuo 02, HunyuanVideo et FLUX.1 avec précision et élégance.",
    portalCardTitle: "VIDEOPROMPTS",
    portalCardSub: "Studio Créatif Premium d'Ingénierie IA",
    portalEnterStudio: "ENTRER DANS LE STUDIO",
    portalLaunchMiniMax: "Lancer MiniMax Hailuo 02",
    portalLaunchWan: "Lancer WAN 2.2 A14B",
    portalPalette: "NOIR OBSIDIENNE · OR CHAMPAGNE · CYAN",
    portalFooter: "VIDEOPROMPTS.AI.STUDIO — INTELLIGENCE CRÉATIVE DE LUXE",
    btnLaunchMinimax: "Générer dans MiniMax",
    minimaxPanelTitle: "Studio MiniMax Hailuo 02 Dédié",
    minimaxPanelSub: "Champs calibrés Hailuo 02 : directives caméra [Camera], durée/résolution et images début/fin.",
    minimaxCameraBracketsLbl: "Directives Caméra [Camera] (jusqu'à 3)",
    minimaxCameraBracketsHint: "Injecté automatiquement en tête du prompt",
    minimaxCustomDirectiveLbl: "Directives physiques & nuances visuelles Hailuo 02",
    minimaxCustomDirectivePlaceholder: "Ex: micro water droplets suspended mid-air, crisp glass caustics, smooth fabric inertia...",
    minimaxDurationResLbl: "Durée & Résolution (Hailuo 02)",
    minimaxOptimizerLbl: "Activer l'optimiseur de prompt natif (prompt_optimizer)",
    minimaxFramesLbl: "Mode Images Clés (Texte / Début / Début + Fin)",
    minimaxModeT2V: "Texte → Vidéo",
    minimaxModeI2V: "1re Image (I2V)",
    minimaxModeFLF2V: "1re + Dernière Image",
    minimaxDur6_1080: "6s · 1080P Full HD",
    minimaxDur6_768: "6s · 768P Rapide",
    minimaxDur10_768: "10s · 768P Étendu",
    minimaxLaunchReadyTitle: "Console de Génération MiniMax Hailuo 02",
    minimaxLaunchCopiedNote: "Le prompt calibré Hailuo 02 a été compilé et copié dans le presse-papiers avec vos paramètres.",
    minimaxLaunchOpenApp: "Ouvrir MiniMax Hailuo",
    minimaxLaunchGenerating: "Envoi vers MiniMax...",
    minimaxLaunchPolling: "Rendu vidéo Hailuo 02 en cours...",
    minimaxLaunchSuccess: "Vidéo générée sur MiniMax.",
    minimaxLaunchDownloadVideo: "Télécharger la vidéo MP4",
    minimaxClosePanel: "Fermer",
    portalLaunchVeo: "Lancer Google Veo 3.1",
    veoPanelTitle: "Studio Google Veo 3.1 Dédié",
    veoPanelSub: "Contrôles Veo 3.1 & Veo 3.1 Fast avec validation des limites, résolution, découpage et audio synchronisé.",
    veoModelLbl: "Modèle Google Veo",
    veoModelFull: "Veo 3.1 Complet (Cinéma + Audio natif)",
    veoModelFast: "Veo 3.1 Fast (Compact ≤ 1200 car.)",
    veoResolutionLbl: "Résolution",
    veoDurationLbl: "Durée",
    veoDetailLbl: "Niveau de détail",
    veoDetailShort: "Court",
    veoDetailBalanced: "Équilibré",
    veoDetailProfessional: "Professionnel",
    veoLanguageLbl: "Langue du prompt",
    veoDialogueLbl: "Dialogue parlé (Optionnel)",
    veoDialoguePlaceholder: "Laissez vide ou saisissez le dialogue exact...",
    veoSoundEffectsLbl: "Effets sonores / SFX (Optionnel)",
    veoSoundEffectsPlaceholder: "Laissez vide pour l'ambiance naturelle ou précisez les SFX...",
    veoAudioLbl: "Générer l'audio synchronisé natif",
    veoFastAudioNote: "Note : veo-3.1-fast n'honore pas l'audio complexe de façon fiable — passez à Veo 3.1 Complet pour l'audio.",
    veoCharsLimitLbl: "Limite Veo",
    veoWarningsLbl: "Avertissements Veo",
    veoQuickPresetsLbl: "Modèles rapides Google Veo (1 clic pour remplir)",
    veoAutoFillBtn: "Remplir les champs via IA",
    veoAutoFillRunning: "Remplissage Veo...",
    veoCameraLbl: "Caméra & Objectif",
    veoLightingLbl: "Éclairage",
    veoStyleLbl: "Style visuel",
    veoNegativeLbl: "Contraintes négatives",
    emptyFieldTag: "Vide · Client ou IA",
    selectOptionalAuto: "— Vide (Client ou IA) —",
    placeholderSubject: "Décrivez votre idée ou sujet principal (arabe, darija, français ou anglais)...",
    placeholderEnvironment: "Laissez vide pour remplissage IA depuis l'idée, ou décrivez le décor...",
    placeholderAction: "Laissez vide pour remplissage IA depuis l'idée, ou décrivez le mouvement...",
    placeholderActionImage: "Laissez vide pour l'IA, ou décrivez la pose et les détails...",
    placeholderCamera: "Vide — sélectionnez un préréglage, saisissez ou laissez l'IA remplir...",
    placeholderLight: "Vide — choisissez un éclairage ou laissez l'IA décider...",
    placeholderExtra: "Vide — micro-physique et textures (optionnel)...",
    placeholderAudio: "Vide — description audio / musique (optionnel ou par IA)...",
    placeholderNegative: "Vide — éléments exclus, Régénérer ou remplissage IA...",
    placeholderShotCamera: "Caméra du plan (vide = IA)",
    placeholderShotDesc: "Action du plan (vide = IA)",
    smartKeywordsLbl: "Mots-clés intelligents :",
    secSceneDetails: "Décor & Mouvement (optionnel)",
    secExportTools: "Exportation & Conversion (JSON · Python · Veo · MiniMax)",
    secEngineNotes: "Notes & Bonnes Pratiques Moteur",
    adminCounterTitle: "Compteur de Visiteurs en Direct",
    adminOnlyBadge: "Admin uniquement",
    adminTotalVisits: "Total visites",
    adminTodayVisits: "Visites du jour",
    adminUniqueVisitors: "Visiteurs uniques",
    adminRefreshStats: "Actualiser",
    adminSignIn: "Connexion Admin (Google)",
    adminSignOut: "Déconnexion",
    adminAccessBtn: "Accès Admin",
    adminNotAuthorized: "Ce compte n'est pas autorisé à voir le compteur admin.",
    btnSignInRegister: "Connexion / Inscription",
    btnSignOutAccount: "Déconnexion",
    accountSignedInLabel: "Mon compte",
    accountCloudSyncActive: "Synchronisation cloud active — vos prompts et séquences sont sauvegardés sur votre compte.",
    accountCloudSyncGuestTitle: "Connectez-vous pour sauvegarder vos prompts et séquences",
    accountCloudSyncGuestDesc: "Inscrivez-vous ou connectez-vous avec Google pour conserver votre bibliothèque de prompts et de séquences sur tous vos appareils.",
    accountSyncLocalBtn: "Synchroniser l'historique local",
    accountSyncLocalDone: "Vos prompts et séquences locaux ont été synchronisés avec votre compte.",
    okSignedInAccount: "Bienvenue ! Compte connecté et sauvegarde cloud activée.",
    okSignedOutAccount: "Vous êtes déconnecté de votre compte.",
    chainSaveSequenceBtn: "Enregistrer la séquence",
    chainSequenceSavedBtn: "Séquence enregistrée",
    okChainSequenceSaved: "Séquence enregistrée dans votre bibliothèque.",
    okPromptSavedCloud: "Prompt enregistré sur votre compte cloud.",
    okSequenceSavedCloud: "Séquence enregistrée sur votre compte cloud.",
    chainSectionTitle: "Séquence de Scènes Continues",
    chainAddBtn: "Ajouter scène suivante",
    chainAddingBtn: "Génération de la scène...",
    chainPlaceholder: "Idée de la scène suivante (même personnage et style conservés)...",
    chainSceneLabel: "Scène",
    chainCopyBtn: "Copier",
    chainLoadBtn: "Charger",
    chainExportBtn: "Exporter séquence (.txt)",
    chainClearBtn: "Réinitialiser séquence",
    chainSeedLocked: "Seed verrouillé",
    chainHint: "Le personnage, le style, le décor et le Seed restent verrouillés pour la continuité.",
    chainOkAdded: "Scène suivante générée avec continuité visuelle.",
    chainCopyAllBtn: "Tout copier",
    chainConfirmReset: "Confirmer ?",
    chainTotalScenes: "Total scènes",
    chainStyleLbl: "Style visuel",
    chainCharacterLbl: "Personnage",
    chainEnvLbl: "Environnement",
    chainCameraLbl: "Caméra",
    chainFirstIdeaLbl: "Idée de la 1re scène",
    chainStartBtn: "Démarrer la séquence",
    chainImportBtn: "Importer (.txt / .json)",
    chainExportJsonBtn: "Exporter JSON",
    chainImportedOk: "Séquence importée et formatée.",
    chainImportErr: "Aucune scène valide trouvée dans le fichier.",
    smartGuardTitle: "SMART SCENE GUARD",
    smartGuardOn: "Activé",
    smartGuardOff: "Désactivé",
    smartGuardHint: "Isole chaque scène et bloque le mélange des décors/personnages (Wan 2.2, MiniMax & Veo)",
    chainContinuityLabel: "État transmis à la scène suivante",
    navGenerator: "Générateur v1.0",
    navDirector: "Réalisateur v2.0",
    portalGeneratorShortcut: "Générateur Film v1.0 (10 à 30 scènes)",
    portalDirectorShortcut: "Moteur Réalisateur Cinéma v2.0",
    genTitle: "Générateur de Prompts Vidéo & Films — v1.0",
    genSubtitle:
      "Transformez votre idée en prompt unique ou en séquence film cohérente (10 scènes de base extensibles +20 jusqu'à 30 scènes) pour Wan 2.2, MiniMax Hailuo et Google Veo.",
    genIdeaLabel: "IDEA — Idée de la vidéo",
    genIdeaPlaceholder: "Ex : Un ingénieur cherche une cité perdue dans le désert au crépuscule...",
    genModelLabel: "MODEL — Moteur cible",
    genModeLabel: "MODE — Format",
    genModeNormal: "Prompt normal",
    genModeFilm10: "Film (10 scènes)",
    genModeFilm: "Film (jusqu'à 30)",
    genScenesLabel: "SCENES — Nombre de scènes",
    genShotLenLabel: "SHOT_LEN — Durée (secondes)",
    genStyleLabel: "STYLE — Style visuel",
    genLangLabel: "LANG — Langue de sortie",
    genMinimaxMergeLabel: "Autoriser la fusion de 2 plans MiniMax (≤ 15s)",
    genGenerateBtn: "Générer le prompt",
    genGenerating: "Génération en cours...",
    genSampleNormal: "Exemple Wan normal",
    genSampleFilm: "Exemple Film 10 scènes",
    genOutputTitle: "Sortie prête à coller",
    genCopyAll: "Tout copier",
    genCopied: "Copié",
    genCopyScene: "Copier la scène",
    genOpenInStudio: "Ouvrir dans Studio",
    genSaveHistory: "Enregistrer",
    genSavePrompt: "Enregistrer le prompt",
    genPromptSaved: "Prompt enregistré",
    genSavedPromptsTitle: "Prompts générés sauvegardés",
    genSavedPromptsEmpty: "Aucun prompt généré enregistré. Chaque prompt créé est sauvegardé pour y revenir plus tard.",
    genLoadPrompt: "Rouvrir le prompt",
    genSaveSequence: "Enregistrer la séquence",
    genSequenceSaved: "Séquence enregistrée",
    genSavedSequencesTitle: "Séquences enregistrées",
    genSavedSequencesEmpty: "Aucune séquence film enregistrée pour le moment.",
    genLoadSequence: "Charger la séquence",
    genExportSequence: "Exporter JSON",
    genConsistencyTitle: "Notes de cohérence (Consistency Notes)",
    genEmptyTitle: "Prêt pour l'ingénierie vidéo",
    genEmptyDesc:
      "Saisissez votre idée, choisissez Wan 2.2, MiniMax ou Google Veo ainsi que le mode normal ou film 10 à 30 scènes, puis lancez la génération.",
    historyTabAll: "Tous les prompts",
    historyTabSequences: "Séquences film",
    historyFirstScenePreview: "Aperçu de la première scène",
    historyShowFullOutput: "Voir toute la séquence",
    historyHideFullOutput: "Masquer",
    historyPromptPropsTitle: "Propriétés du prompt",
    historyApplyProps: "Appliquer les propriétés",
    historyPropsApplied: "Propriétés du prompt appliquées.",
    propModel: "Moteur",
    propMode: "Mode",
    propStyle: "Style",
    propDuration: "Durée",
    propAspect: "Ratio",
    propLanguage: "Langue",
    propCamera: "Caméra & Optique",
    propLighting: "Éclairage",
    propWords: "Mots",
    propScenes: "Scènes",
    propFps: "FPS",
    propGenre: "Genre",
    propShotType: "Plan",
    propMood: "Ambiance",
    propGrading: "Étalonnage",
    modeLabels: {
      t2v: "Texte → Vidéo (T2V)",
      i2v: "Image → Vidéo (I2V)",
      flf2v: "Première-Dernière Image (FLF2V)",
      s2v: "Audio / Chant → Vidéo (S2V)",
      film: "Cinéma / Film (FILM)",
      t2i: "Texte → Image (T2I)",
      img2img: "Image → Image (Img2Img)",
    },
  },
  en: {
    brand: "VideoPrompts Studio",
    navPortal: "Luxury Portal",
    navStudio: "Prompt Studio",
    navGuide: "Engine Guide",
    navHistory: "Library",
    ctaBuild: "Build Prompt",
    sidebarEngines: "Open-Source Engines",
    sidebarPresets: "Ad Templates Library",
    sidebarSettings: "Language & Theme",
    btnReset: "Reset Fields",
    btnBackupStudio: "Backup State (JSON)",
    btnRestoreBackup: "Restore Backup",
    okStudioBackupSaved: "Studio state backup JSON downloaded.",
    okStudioBackupRestored: "Studio state restored from backup JSON.",
    errStudioBackupInvalid: "Invalid or corrupted studio backup JSON file.",
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    directorTitle: "AI Director Mode",
    directorSubtitle:
      "Describe your concept in one sentence—AI automatically designs the scene, lighting, 3 storyboard cuts, sound design, and negative prompt.",
    directorPlaceholder: "Example: A cinematic 8-second luxury perfume commercial...",
    directorBtn: "Direct Full Scene",
    directorRunning: "Directing scene...",
    directorExamplesLabel: "Quick briefs:",
    wanVariantLabel: "WAN 2.2 Model Variant",
    secBasic: "Core Scene & Visual Reference",
    secVisual: "Visual Direction & Engine Parameters",
    secCameraStudio: "Camera Movement & Lens Studio",
    secLightingDesigner: "Lighting, Color & Texture Designer",
    secAudioStudio: "Synchronized Audio & Sound Design",
    secEngineOptions: "Mode, Category & Model Variant",
    secTechnicalParams: "Aspect Ratio, Duration, Motion & Physics",
    secStoryboard: "Multi-Shot Storyboard Cuts",
    secNegativeAndAi: "Negative Prompt & AI Provider",
    autoModeTitle: "Auto & AI Configuration Active",
    autoModeSub: "Advanced options stay hidden to keep the workspace spacious and auto-adapt via AI—click any row to customize.",
    autoResetAll: "Auto Reset",
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    autoTag: "Auto · AI",
    secOutput: "Engineered Output & Automation",
    secAnalyzer: "Prompt Quality Analyzer (/100)",
    secHistory: "Prompt Library & Favorites",
    lblMode: "Generation Mode",
    lblPromptFormat: "Prompt Format",
    formatOfficial: "Official Natural Prose (80–120 words)",
    formatStructured: "Structured Production Spec",
    lblCategory: "Cinematic Category",
    lblSubject: "Main Subject / Hero Object",
    hintSubject: "Supports Arabic, Darija, French, or English input via AI Enhance",
    lblEnvironment: "Environment & Scene Architecture",
    lblAction: "Primary Physical Motion",
    lblActionImage: "Pose & Dynamic Action",
    lblCamera: "Combined Camera Directive",
    lblCameraMovement: "Camera Movement",
    lblCameraLens: "Focal Length & Lens",
    lblLight: "Lighting & Color Grade",
    lblStyle: "Visual Aesthetic & Sensor",
    lblExtra: "Micro-Physics & Atmospheric Details",
    lblAspect: "Aspect Ratio",
    lblDuration: "Duration & Frame Rate",
    lblMotion: "Motion Scale",
    lblShots: "Storyboard Cuts",
    lblCfg: "CFG Guidance",
    lblSteps: "Sampling Steps",
    lblLora: "LoRA Triggers (Optional)",
    lblSeed: "Seed",
    seedLock: "Locked",
    seedUnlock: "Unlocked",
    seedRandomize: "Randomize",
    lblPhysics: "Micro-Physics Hints",
    lblAudioToggle: "Include synchronized audio & foley block",
    lblAudioCustom: "Synchronized sound & music notes",
    lblNegative: "Smart Negative Prompt",
    btnRegenNeg: "Smart Regen",
    confirmRegenNeg: "Overwrite custom edits?",
    cancelAction: "Cancel",
    aiBridgeTitle: "AI Prompt Enhancer & Translator",
    aiProviderLabel: "AI Provider",
    aiGeminiLabel: "Gemini (Server-Integrated)",
    aiOllamaLabel: "Ollama Local (localhost:11434)",
    aiOllamaModelPlaceholder: "Ollama model name (e.g. llama3.1)",
    aiEnhanceHint:
      "Write your rough idea in Arabic, Darija, French, or English and click AI Enhance to engineer a calibrated English prompt.",
    btnTestConnection: "Test Connection",
    btnTestingConnection: "Testing...",
    btnAiEnhance: "AI Enhance & Translate",
    btnAiEnhancing: "Engineering...",
    btnGenerate: "Build Engineered Prompt",
    btnCopyFull: "Copy Full Prompt",
    btnCopyPositive: "Copy Positive Only",
    btnSavePrompt: "Save Generated Prompt",
    btnSavedPrompt: "Saved to Library",
    btnExportJson: "Export ComfyUI JSON",
    btnExportPython: "Export Python (.py)",
    btnDownloadTxt: "Download TXT",
    btnClearHistory: "Clear History",
    btnRestore: "Restore",
    btnFitLength: "Fit Length (80–120)",
    btnFittingLength: "Fitting...",
    btnConvertHailuo: "Convert → Hailuo 02",
    btnConvertVeo: "Convert → Veo 3.1",
    btnVeoCode: "Veo API Snippet",
    convertingFormat: "Converting...",
    filterAll: "All",
    filterFavorites: "Favorites",
    dropTitle: "Drop reference image (First Frame) here or click",
    dropSub: "Auto-resizes large 4K images to ≤1024px & supports AI Vision analysis",
    endDropTitle: "End Frame (FLF2V Target)",
    endDropSub: "Upload target end frame so AI can engineer the transition motion between frames",
    btnAnalyzeImg: "Analyze Frame & Generate Motion",
    btnAnalyzingImg: "Analyzing image...",
    btnAnalyzeTransition: "Suggest Transition Motion",
    btnAnalyzingTransition: "Analyzing transition...",
    removeImg: "Remove",
    statWords: "words",
    statChars: "chars",
    statTokens: "est. tokens",
    statShots: "shots",
    statSteps: "steps",
    analyzerScoreLabel: "Engineering Quality Score",
    analyzerNoIssues: "Optimal: no motion conflicts, keyword repetition, or pacing bottlenecks found.",
    analyzerClarity: "Clarity",
    analyzerContinuity: "Continuity",
    analyzerPacing: "Pacing",
    analyzerMotion: "Motion",
    outputPlaceholder: "Your engineered open-source prompt ready for ComfyUI will appear here...",
    emptyHistoryTitle: "No saved prompts yet",
    emptyHistoryDesc: "Build your first prompt in the studio to automatically archive and export it here.",
    noSearchResultsTitle: "No matching prompts",
    noSearchResultsDesc: "No saved prompts match that engine or title keywords.",
    clearSearchBtn: "Clear search",
    clearFiltersBtn: "Reset Filters",
    filterEngineLabel: "Filter by engine",
    filterAllEngines: "All Engines",
    historySavedLabel: "saved",
    goToStudio: "Open Studio",
    searchHistoryPlaceholder: "Search by engine name or title keywords...",
    errSubject: "Please enter a main subject first.",
    errAction: "Please describe the primary motion or pose.",
    errEnv: "Environment description is required for this mode.",
    errEmptyOutput: "Build a prompt first before copying or exporting.",
    errDirectorEmpty: "Please enter a short creative brief for AI Director Mode.",
    errNeedBothFrames: "Upload both First Frame and End Frame to analyze transition.",
    okGenerated: "Engineered prompt built and archived to library.",
    okDirectorDone: "AI Director designed scene, 3 storyboard cuts, audio, and negative prompt.",
    okCopiedFull: "Full prompt copied to clipboard.",
    okCopiedPositive: "Positive prompt copied (ready for CLIPTextEncode).",
    okPromptSaved: "Generated prompt saved to your library and favorites.",
    okExportedJson: "ComfyUI-compatible JSON workflow exported.",
    okExportedPython: "Python Diffusers / Pipeline script exported.",
    okRestored: "Prompt restored from library.",
    okReset: "All studio fields reset.",
    okImageLoaded: "Reference image resized (≤1024px) & aspect ratio updated.",
    okEndImageLoaded: "End frame loaded & resized cleanly.",
    okImageAnalyzed: "Reference frame analyzed and prompt built.",
    okTransitionAnalyzed: "Transition motion between first and last frame generated.",
    okLengthFitted: "Prompt calibrated to optimal 80–120 word window.",
    okConvertedHailuo: "Prompt converted to MiniMax Hailuo 02 syntax.",
    okConvertedVeo: "Prompt converted to Google Veo 3.1 syntax.",
    okAiEnhanced: "Fields enhanced and prompt engineered with AI.",
    okConnectionTest: "Connection verified and ready.",
    tipWanDuration:
      "Tip: Wan 2.2 is natively tuned for ~5s clips; for longer runs, split action across multiple storyboard cuts.",
    tipS2vMode:
      "Speech/Singer Mode (S2V): pair a character portrait + MP3/WAV audio in Wan2.2-S2V-14B for synchronized lip movement.",
    fluxNoNegNote: "FLUX.1 relies on affirmative natural prose and does not use a traditional negative prompt.",
    minimaxNoNegNote:
      "MiniMax Hailuo 02 ignores negative prompts—rely on affirmative descriptions and [Camera] bracket commands.",
    guideTitle: "Open-Source Engine Prompting Reference",
    guideSubtitle: "Text encoders, recommended parameters, and engineering guidelines for each supported tool.",
    portalBrand: "VIDEOPROMPTS.AI.STUDIO",
    portalBadge: "LUXURY AI EXPERIENCE",
    portalKicker: "THE FUTURE OF CREATIVE INTELLIGENCE",
    portalHeadline: "Where AI Meets Luxury",
    portalDescription:
      "Experience the art of artificial intelligence across WAN 2.2, MiniMax Hailuo 02, HunyuanVideo, and FLUX.1—crafted with elegance, precision, and innovation.",
    portalCardTitle: "VIDEOPROMPTS",
    portalCardSub: "Premium AI Creative Studio",
    portalEnterStudio: "ENTER THE STUDIO",
    portalLaunchMiniMax: "Launch MiniMax Hailuo 02",
    portalLaunchWan: "Launch WAN 2.2 A14B",
    portalPalette: "OBSIDIAN BLACK · CHAMPAGNE GOLD · CYAN",
    portalFooter: "VIDEOPROMPTS.AI.STUDIO — LUXURY CREATIVE INTELLIGENCE",
    btnLaunchMinimax: "Generate in MiniMax",
    minimaxPanelTitle: "MiniMax Hailuo 02 Dedicated Integration",
    minimaxPanelSub: "Tailored Hailuo 02 prompt fields, bracketed camera commands, duration presets, and First/Last frame uploads.",
    minimaxCameraBracketsLbl: "Bracketed Camera Commands [Camera] (up to 3)",
    minimaxCameraBracketsHint: "Automatically prepended to prompt",
    minimaxCustomDirectiveLbl: "Hailuo 02 Custom Physics & Motion Nuance Field",
    minimaxCustomDirectivePlaceholder: "e.g., micro water droplets suspended mid-air, crisp glass caustics, smooth fabric inertia...",
    minimaxDurationResLbl: "Duration & Resolution (Hailuo 02)",
    minimaxOptimizerLbl: "Enable native prompt optimizer (prompt_optimizer)",
    minimaxFramesLbl: "Frame Workflow (Text / First / First + Last)",
    minimaxModeT2V: "Text → Video",
    minimaxModeI2V: "First Frame (I2V)",
    minimaxModeFLF2V: "First + Last Frame",
    minimaxDur6_1080: "6s · 1080P Full HD",
    minimaxDur6_768: "6s · 768P Standard",
    minimaxDur10_768: "10s · 768P Extended",
    minimaxLaunchReadyTitle: "MiniMax Hailuo 02 Execution Console",
    minimaxLaunchCopiedNote: "Your engineered Hailuo 02 prompt has been compiled and auto-copied to your clipboard.",
    minimaxLaunchOpenApp: "Open MiniMax Hailuo",
    minimaxLaunchGenerating: "Submitting to MiniMax...",
    minimaxLaunchPolling: "Rendering video in Hailuo 02...",
    minimaxLaunchSuccess: "MiniMax Hailuo 02 video rendered.",
    minimaxLaunchDownloadVideo: "Download MP4 Video",
    minimaxClosePanel: "Close",
    portalLaunchVeo: "Launch Google Veo 3.1",
    veoPanelTitle: "Google Veo 3.1 Dedicated Studio",
    veoPanelSub: "Veo 3.1 & Veo 3.1 Fast controls with automatic capability clamping, safety checks, and native audio direction.",
    veoModelLbl: "Google Veo Model",
    veoModelFull: "Veo 3.1 Full (Cinematic + Native Audio)",
    veoModelFast: "Veo 3.1 Fast (Compact ≤ 1200 chars)",
    veoResolutionLbl: "Resolution",
    veoDurationLbl: "Duration",
    veoDetailLbl: "Detail Level",
    veoDetailShort: "Short",
    veoDetailBalanced: "Balanced",
    veoDetailProfessional: "Professional",
    veoLanguageLbl: "Prompt Output Language",
    veoDialogueLbl: "Spoken Dialogue (Optional)",
    veoDialoguePlaceholder: "Leave empty or enter specific character dialogue...",
    veoSoundEffectsLbl: "Sound Effects / SFX (Optional)",
    veoSoundEffectsPlaceholder: "Leave empty for natural SFX or specify exact sound cues...",
    veoAudioLbl: "Generate native synchronized audio",
    veoFastAudioNote: "Note: veo-3.1-fast does not reliably honor complex audio direction — switch to Veo 3.1 Full for audio.",
    veoCharsLimitLbl: "Veo Character Budget",
    veoWarningsLbl: "Veo Compatibility & Safety Checks",
    veoQuickPresetsLbl: "Quick Veo Templates (1-click fill all fields)",
    veoAutoFillBtn: "Smart AI Fill Veo Fields",
    veoAutoFillRunning: "Filling Veo fields...",
    veoCameraLbl: "Camera & Lens",
    veoLightingLbl: "Lighting",
    veoStyleLbl: "Visual Style",
    veoNegativeLbl: "Negative Prompt",
    emptyFieldTag: "Empty · Client or AI",
    selectOptionalAuto: "— Empty (Client or AI) —",
    placeholderSubject: "Enter your main idea or subject here (Arabic, Darija, French, or English)...",
    placeholderEnvironment: "Leave empty for AI to design from your idea, or describe the setting...",
    placeholderAction: "Leave empty for AI to design from your idea, or describe the motion...",
    placeholderActionImage: "Leave empty for AI, or describe the pose and dynamic details...",
    placeholderCamera: "Empty — pick a preset, type manually, or leave for AI...",
    placeholderLight: "Empty — choose lighting or type manually, or leave for AI...",
    placeholderExtra: "Empty — optional micro-physics or surface details...",
    placeholderAudio: "Empty — optional sound design / music notes (or AI-filled)...",
    placeholderNegative: "Empty — enter excluded elements, click Smart Regen, or leave for AI...",
    placeholderShotCamera: "Shot camera (empty = AI)",
    placeholderShotDesc: "Shot description (empty = AI)",
    smartKeywordsLbl: "Smart Keywords:",
    secSceneDetails: "Environment & Motion (Optional)",
    secExportTools: "Export & Format Converters (JSON · Python · Veo · MiniMax)",
    secEngineNotes: "Engine Tips & Best Practices",
    adminCounterTitle: "Live Visitor Counter",
    adminOnlyBadge: "Admin Only",
    adminTotalVisits: "Total Visits",
    adminTodayVisits: "Today's Visits",
    adminUniqueVisitors: "Unique Visitors",
    adminRefreshStats: "Refresh",
    adminSignIn: "Admin Sign-In (Google)",
    adminSignOut: "Sign Out",
    adminAccessBtn: "Admin Access",
    adminNotAuthorized: "This account is not authorized to view admin visitor analytics.",
    btnSignInRegister: "Sign In / Register",
    btnSignOutAccount: "Sign Out",
    accountSignedInLabel: "My Account",
    accountCloudSyncActive: "Cloud sync active — your prompts and film sequences are saved to your account.",
    accountCloudSyncGuestTitle: "Sign in to save prompts & sequences to your account",
    accountCloudSyncGuestDesc: "Register or sign in with Google to sync your saved prompts and multi-scene film sequences across sessions and devices.",
    accountSyncLocalBtn: "Sync local items to account",
    accountSyncLocalDone: "Your local prompts and sequences have been synced to your cloud account.",
    okSignedInAccount: "Welcome! Signed in with cloud saving enabled for prompts and sequences.",
    okSignedOutAccount: "Signed out of your account.",
    chainSaveSequenceBtn: "Save Sequence",
    chainSequenceSavedBtn: "Sequence Saved",
    okChainSequenceSaved: "Scene chain saved to Saved Sequences.",
    okPromptSavedCloud: "Prompt saved to your cloud account.",
    okSequenceSavedCloud: "Sequence saved to your cloud account.",
    chainSectionTitle: "Sequential Scene Chain",
    chainAddBtn: "Add Next Scene Prompt",
    chainAddingBtn: "Generating next scene...",
    chainPlaceholder: "Write the next scene idea (keeps same character, style & seed)...",
    chainSceneLabel: "Scene",
    chainCopyBtn: "Copy",
    chainLoadBtn: "Load",
    chainExportBtn: "Export Chain (.txt)",
    chainClearBtn: "New Chain",
    chainSeedLocked: "Seed Locked",
    chainHint: "Character, visual style, environment, and Seed stay locked for continuity.",
    chainOkAdded: "Next continuous scene prompt generated and added to the chain.",
    chainCopyAllBtn: "Copy All",
    chainConfirmReset: "Confirm Delete?",
    chainTotalScenes: "Total scenes",
    chainStyleLbl: "Visual Style",
    chainCharacterLbl: "Character",
    chainEnvLbl: "Environment",
    chainCameraLbl: "Camera",
    chainFirstIdeaLbl: "Opening Scene Idea",
    chainStartBtn: "Start Scene Chain",
    chainImportBtn: "Import (.txt / .json)",
    chainExportJsonBtn: "Export JSON",
    chainImportedOk: "Scene chain imported and formatted.",
    chainImportErr: "Could not find valid scenes in the file.",
    smartGuardTitle: "SMART SCENE GUARD",
    smartGuardOn: "ON",
    smartGuardOff: "OFF",
    smartGuardHint: "Isolates each shot and prevents cross-scene blending for Wan 2.2, MiniMax & Veo",
    chainContinuityLabel: "Continuity handoff for next scene",
    navGenerator: "Generator v1.0",
    navDirector: "Director v2.0",
    portalGeneratorShortcut: "Film Generator v1.0 (10–30 Scenes)",
    portalDirectorShortcut: "Cinematic Director Engine v2.0",
    genTitle: "Video & Film Prompt Generator — v1.0",
    genSubtitle:
      "Turn any Arabic or English concept into a single prompt or consistent multi-scene film sequence (10 base scenes expandable +20 up to 30) for Wan 2.2, MiniMax Hailuo, and Google Veo.",
    genIdeaLabel: "IDEA — Video Concept",
    genIdeaPlaceholder: "Example: A lone engineer searching for a lost desert city at dusk...",
    genModelLabel: "MODEL — Target Engine",
    genModeLabel: "MODE — Output Mode",
    genModeNormal: "Normal",
    genModeFilm10: "Film (10 Scenes)",
    genModeFilm: "Film (Up to 30)",
    genScenesLabel: "SCENES — Scene Count",
    genShotLenLabel: "SHOT_LEN — Shot Duration (sec)",
    genStyleLabel: "STYLE — Visual Aesthetic",
    genLangLabel: "LANG — Output Language",
    genMinimaxMergeLabel: "Allow merging up to 2 shots in MiniMax (≤ 15s)",
    genGenerateBtn: "Generate Ready Prompt",
    genGenerating: "Engineering prompt...",
    genSampleNormal: "Load Wan Normal Example",
    genSampleFilm: "Load 10-Scene Film Example",
    genOutputTitle: "Ready-to-Paste Output",
    genCopyAll: "Copy Full Output",
    genCopied: "Copied",
    genCopyScene: "Copy Scene",
    genOpenInStudio: "Open in Pro Studio",
    genSaveHistory: "Save to History",
    genSavePrompt: "Save Prompt",
    genPromptSaved: "Prompt Saved",
    genSavedPromptsTitle: "Saved Generated Prompts",
    genSavedPromptsEmpty: "No saved generated prompts yet. Prompts you generate are saved here so you can return to them anytime.",
    genLoadPrompt: "Reopen Prompt",
    genSaveSequence: "Save Sequence",
    genSequenceSaved: "Sequence Saved",
    genSavedSequencesTitle: "Saved Sequences",
    genSavedSequencesEmpty: "No saved film sequences yet.",
    genLoadSequence: "Load Sequence",
    genExportSequence: "Export JSON",
    genConsistencyTitle: "Consistency Notes",
    genEmptyTitle: "Ready to Engineer Video & Film Prompts",
    genEmptyDesc:
      "Enter your idea, choose Wan 2.2, MiniMax, or Google Veo with Normal or 10–30 Scene Film mode, and generate clean ready-to-paste prompts with zero filler.",
    historyTabAll: "All Prompts",
    historyTabSequences: "Saved Sequences",
    historyFirstScenePreview: "First Scene Preview",
    historyShowFullOutput: "Show Full Sequence",
    historyHideFullOutput: "Hide Full Sequence",
    historyPromptPropsTitle: "Prompt Properties",
    historyApplyProps: "Reuse Properties",
    historyPropsApplied: "Prompt properties applied.",
    propModel: "Engine",
    propMode: "Mode",
    propStyle: "Style",
    propDuration: "Duration",
    propAspect: "Aspect",
    propLanguage: "Language",
    propCamera: "Camera & Lens",
    propLighting: "Lighting",
    propWords: "Words",
    propScenes: "Scenes",
    propFps: "FPS",
    propGenre: "Genre",
    propShotType: "Shot Type",
    propMood: "Mood",
    propGrading: "Color Grading",
    modeLabels: {
      t2v: "Text → Video (T2V)",
      i2v: "Image → Video (I2V)",
      flf2v: "First-Last Frame (FLF2V)",
      s2v: "Audio / Singer → Video (S2V)",
      film: "Cinematic Film (FILM)",
      t2i: "Text → Image (T2I)",
      img2img: "Image → Image (Img2Img)",
    },
  },
};
