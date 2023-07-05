import { definePlugin } from 'sanity'
import { MdSync } from 'react-icons/md'
import { VimeoSyncView } from './tool/VimeoSync'

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
    console.log(config)
    return {
      name: 'tristantbg/sanity-plugin-vimeo-sync',

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
          {
            type: 'document',
            name: 'vimeoVideo',
            title: 'Vimeo Video',
            fields: [
              {
                name: 'title',
                title: 'Title',
                type: 'string',
                readOnly: true
              },
              {
                name: 'name',
                title: 'Name',
                type: 'string',
                hidden: true
              },
              {
                name: 'slug',
                title: 'Slug',
                type: 'slug',
                readOnly: true,
                options: {
                  source: 'title',
                  maxLength: 96
                }
              },
              {
                title: 'Modified time',
                name: 'modifiedTime',
                type: 'datetime',
                readOnly: true
              },
              {
                title: 'Created time',
                name: 'createdTime',
                type: 'datetime',
                readOnly: true
              },
              {
                title: 'Files',
                name: 'files',
                type: 'array',
                readOnly: true,
                of: [
                  {
                    type: 'object',
                    fields: [
                      { name: 'height', type: 'number', title: 'Height' },
                      { name: 'width', type: 'number', title: 'Width' },
                      { name: 'link', type: 'url', title: 'Link' },
                      { name: 'quality', type: 'string', title: 'Quality' },
                      { name: 'size_short', type: 'string', title: 'Size' },
                      { name: 'created_time', type: 'string', title: '_', hidden: true }
                    ],
                    preview: {
                      select: {
                        title: 'quality'
                      }
                    }
                  }
                ]
              },
              {
                title: 'Thumbnails',
                name: 'pictures',
                type: 'array',
                readOnly: true,
                of: [
                  {
                    type: 'object',
                    fields: [
                      { name: 'height', type: 'number', title: 'Height' },
                      { name: 'width', type: 'number', title: 'Width' },
                      { name: 'link', type: 'url', title: 'Link' }
                    ],
                    preview: {
                      select: {
                        title: 'width'
                      }
                    }
                  }
                ]
              },
              {
                title: 'Link',
                name: 'link',
                type: 'url',
                readOnly: true
              },
              {
                title: 'Width',
                name: 'width',
                type: 'number',
                readOnly: true
              },
              {
                title: 'Height',
                name: 'height',
                type: 'number',
                readOnly: true
              },
              {
                title: 'Aspect ratio',
                name: 'aspectRatio',
                type: 'number',
                readOnly: true
              },
              {
                title: 'Duration',
                name: 'duration',
                type: 'number',
                readOnly: true
              },
              {
                title: 'Description',
                name: 'description',
                type: 'text',
                readOnly: true
              }
            ],
            preview: {
              select: {
                title: 'title',
                pictures: 'pictures'
              },
              prepare({ title, pictures }) {
                return {
                  title: title,
                  media: <img src={pictures[0].link} alt={title} />
                }
              }
            }
          }
        ]
      }
    }
  }
)
