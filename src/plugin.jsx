import {MdSync} from 'react-icons/md'
import {definePlugin} from 'sanity'
import VimeoObjectPictures from './schema/VimeoObjectPictures'
import VimeoObjectSrcset from './schema/VimeoObjectSrcset'
import VimeoSchema from './schema/VimeoSchema'

import {VimeoSyncView} from './tool/VimeoSync'
/**
 * Usage in `sanity.config.ts` (or .js)
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {VimeoSync} from 'sanity-plugin-vimeo-sync'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [VimeoSync()],
 * })
 * ```
 */
export const vimeoSync = definePlugin((config = {}) => {
  console.log('vimeo-plugin-test-updates-')

  return {
    name: 'sanity-plugin-vimeo-sync',

    tools: (prev) => {
      return [
        ...prev,
        {
          name: 'vimeo-sync',
          title: 'Vimeo Sync',
          icon: MdSync,
          component: function component() {
            return <VimeoSyncView {...config} />
          },
        },
      ]
    },
    schema: {
      types: [VimeoSchema, VimeoObjectSrcset, VimeoObjectPictures],
    },
  }
})
