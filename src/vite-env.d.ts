/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSENSE_CLIENT_ID?: string;
  readonly VITE_ADSENSE_SIDEBAR_SLOT?: string;
  readonly VITE_ADSENSE_STUDIO_SLOT?: string;
  readonly VITE_ADSENSE_NPA_CHANNEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
