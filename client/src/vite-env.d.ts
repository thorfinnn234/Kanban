// Tells TypeScript which VITE_ variables exist in .env, so
// import.meta.env.VITE_API_URL is typed as a string.
interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
