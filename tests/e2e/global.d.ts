// What `visit()` reads to wait for hydration (set by Nuxt on the client).
declare global {
  interface Window {
    useNuxtApp?: () => { isHydrating?: boolean }
  }
}

export {}
