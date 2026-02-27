/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORMSPREE_ENDPOINT?: string
  readonly VITE_TELEMETRY_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
