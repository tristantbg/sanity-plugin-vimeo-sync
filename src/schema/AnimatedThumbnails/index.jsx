import {defineField} from 'sanity'
import {quickFields} from '../../helpers'
import {input} from './Input'
import {field} from './field'

export default defineField({
  type: 'object',
  name: 'animatedThumbnails',
  title: 'Animated Thumbnails',
  description:
    'Animated thumbnails for videos, if you would like to generate them. Please note that the generation process can take a few minutes.',
  components: {
    input,
    field,
  },
  group: 'content',
  // Even though we are making a custom input,
  // it is necessary to define the fields of our object
  fields: [
    {
      name: 'startTime',
      type: 'number',
      title: 'Start Time',
      description: 'Start time in seconds',
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          if (value + context.parent.duration > context.document?.duration) {
            return 'Start time exceeds video length'
          }
          return true
        }),
      initialValue: 0,
    },
    {
      name: 'duration',
      type: 'number',
      title: 'Duration',
      description: 'Maximum duration in seconds',
      validation: (Rule) =>
        Rule.min(0)
          .max(6)
          .custom((value, context) => {
            const startTime = context.parent.startTime
            if (startTime + value > context.document?.duration) {
              return 'Duration exceeds video length'
            }
            return true
          }),
      initialValue: 6,
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
