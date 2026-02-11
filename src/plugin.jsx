import { SyncIcon } from '@sanity/icons'
import { definePlugin } from 'sanity'
import { vimeoSyncUsEnglishLocaleBundle } from './i18n'
import VimeoObjectPictures from './schema/VimeoObjectPictures'
import VimeoObjectSrcset from './schema/VimeoObjectSrcset'
import VimeoSchema from './schema/VimeoSchema'
import VimeoVideoField from './schema/vimeoVideoField'

import { setPluginConfig } from './helpers'
import { VimeoSyncView } from './tool/VimeoSync'

/**
 * Usage in `sanity.config.ts` (or .js)
 *
 * ```ts
 * import { defineConfig } from 'sanity'
 * import { vimeoSync } from 'sanity-plugin-vimeo-sync'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [
 *     vimeoSync({
 *       folderId: '', // optional — restrict sync to a specific Vimeo folder
 *     }),
 *   ],
 * })
 * ```
 */

export const vimeoSync = definePlugin((config = {}) => {
  setPluginConfig(config)

  return {
    name: 'sanity-plugin-vimeo-sync',

    tools: (prev) => {
      return [
        ...prev,
        {
          name: 'vimeo-sync',
          title: 'Vimeo Sync',
          icon: SyncIcon,
          component: () => <VimeoSyncView {...config} />,
        },
      ]
    },
    schema: {
      types: [
        VimeoSchema,
        VimeoObjectSrcset,
        VimeoObjectPictures,
        VimeoVideoField,
      ],
    },

    i18n: {
      bundles: [vimeoSyncUsEnglishLocaleBundle],
    },
  }
})
