import { defineType } from 'sanity'
import VimeoVideoInput from './VimeoVideoInput'

export default defineType({
  name: 'vimeo.video',
  title: 'Vimeo Video',
  type: 'reference',
  to: [{ type: 'vimeo' }],
  components: {
    input: VimeoVideoInput,
  },
})
