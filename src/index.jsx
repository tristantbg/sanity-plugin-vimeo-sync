import { definePlugin } from 'sanity'
import { MdSync } from 'react-icons/md'
import { VimeoSyncView } from './tool/VimeoSync'
import VimeoSchema from './schema/VimeoSchema'
import VimeoObjectSrcset from './schema/VimeoObjectSrcset'
import VimeoObjectPictures from './schema/VimeoObjectPictures'

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
export const VimeoSync = definePlugin(
  (
    
      config = {}
    
  ) => {
    
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
            }
          }
        ]
      },
      schema: {
        types: [
          VimeoSchema,
          VimeoObjectSrcset,
          VimeoObjectPictures,
        ]
      }
    }
  }
)
