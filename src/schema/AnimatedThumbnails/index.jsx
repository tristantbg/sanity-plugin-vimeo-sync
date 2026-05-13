import { defineField } from 'sanity'
import { quickFields } from '../../helpers'
import { input } from './Input'
import { field } from './field'

export default defineField({
  type: 'object',
  name: 'animatedThumbnails',
  title: 'Animated Thumbnails',
  description:
    'Generate a short animated preview from this video, or reference another Vimeo document as a loop. Generation may take a few minutes — keep the window open.',
  components: {
    input,
    field,
  },
  group: 'content',
  fields: [
    {
      name: 'startTime',
      type: 'number',
      title: 'Start Time',
      description: 'Start time in seconds',
      validation: (Rule) => Rule.min(0).integer(),
      initialValue: 0,
    },
    {
      name: 'duration',
      type: 'number',
      title: 'Duration',
      description: 'Loop duration in seconds (max 6)',
      validation: (Rule) => Rule.min(1).max(6).integer(),
      initialValue: 6,
    },
    {
      name: 'loopVideo',
      type: 'vimeo.video',
      title: 'Loop Video',
      description:
        'Optional. When set, use this other Vimeo video as the loop instead of generating animated thumbnails from the current one.',
    },
    quickFields('thumbnails', 'array', [
      {
        type: 'object',
        name: 'item',
        fields: [
          quickFields('status', 'string'),
          quickFields('clip_uri', 'string'),
          quickFields('created_on', 'number'),
          quickFields('sizes', 'array', [
            {
              type: 'object',
              name: 'size',
              fields: [
                quickFields('duration', 'number'),
                quickFields('file_format', 'string'),
                quickFields('file_size', 'number'),
                quickFields('height', 'number'),
                quickFields('width', 'number'),
                quickFields('is_downloadable', 'boolean'),
                quickFields('link', 'string'),
                quickFields('link_with_play_button', 'string'),
                quickFields('start_time', 'number'),
                quickFields('uuid', 'string'),
                quickFields('profile_id', 'string'),
              ],
            },
          ]),
          quickFields('uri', 'string'),
        ],
      },
    ]),
  ],
})
