/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  // 추가 환경 변수들...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}