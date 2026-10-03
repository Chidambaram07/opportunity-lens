/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute backend URL, e.g. https://api.example.com (no trailing slash). Empty = use the dev proxy. */
  readonly VITE_API_URL?: string
}
