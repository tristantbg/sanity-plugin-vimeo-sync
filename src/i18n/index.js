import { defineLocaleResourceBundle } from 'sanity'

/**
 * The locale namespace for sanity-plugin-vimeo-sync.
 * Used with `useTranslation(vimeoSyncLocaleNamespace)`.
 */
export const vimeoSyncLocaleNamespace = 'vimeo-sync' 

/**
 * The default (en-US) locale bundle.
 * Resources are lazy-loaded via dynamic import.
 */
export const vimeoSyncUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: vimeoSyncLocaleNamespace,
  resources: () => import('./resources'),
})
