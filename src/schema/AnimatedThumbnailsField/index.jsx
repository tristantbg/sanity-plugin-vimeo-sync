import {defineField} from 'sanity'
import {MediaTipInput} from './Input'

export default defineField({
  type: 'object',
  name: 'animatedThumbnails',
  title: 'Animated Thumbnails',
  description: 'Animated thumbnails for videos, if you would like to generate them',
  components: {
    input: MediaTipInput,
  },
  // Even though we are making a custom input,
  // it is necessary to define the fields of our object
  fields: [
    {
      type: 'string',
      name: 'mediaTitle',
      title: 'Title',
    },
    {
      type: 'string',
      name: 'mediaType',
      title: 'Media Type',
      options: {
        list: ['Movie', 'Book', 'TV Show', 'Album', 'Podcast', 'Video Game'],
      },
    },
  ],
})
