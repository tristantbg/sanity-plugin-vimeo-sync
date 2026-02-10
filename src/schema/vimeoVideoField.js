import { defineType } from 'sanity'
import VimeoVideoInput from './VimeoVideoInput'

export default defineType({
  name: 'vimeo.video',
  title: 'Vimeo Video',
  type: 'object',
  fields: [
    {
      name: 'video',
      title: 'Video',
      type: 'reference',
      to: [{ type: 'vimeo' }],
    },
  ],
  components: {
    input: VimeoVideoInput,
  },
  preview: {
    select: {
      title: 'video.name',
      subtitle: 'video.link',
      media: 'video.pictures.2.link',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'No video selected',
        subtitle,
        media: media ? (
          <img
            src={media}
            alt={title || 'Vimeo thumbnail'}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        ) : undefined,
      }
    },
  },
})
