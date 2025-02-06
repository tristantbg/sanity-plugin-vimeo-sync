import {MdVideocam} from 'react-icons/md'
import {defineType, isDev} from 'sanity'
import {quickFields} from '../helpers'
import AnimatedThumbnailsField from './AnimatedThumbnailsField'

export default defineType({
  name: 'vimeo',
  title: 'Vimeo',
  description: 'Vimeo videos',
  icon: MdVideocam,
  type: 'document',
  __experimental_omnisearch_visibility: false,
  groups: [
    {
      name: 'content',
      title: 'Content',
      default: true,
    },
    {
      name: 'dev-info',
      title: 'Dev Info',
      hidden: !isDev,
    },
  ],
  fields: [
    quickFields('name', 'string', [], [], 'content'),
    quickFields('link', 'url', [], [], 'content'),
    AnimatedThumbnailsField,
    quickFields('duration', 'number', [], [], 'dev-info'),
    quickFields('description', 'text', [], [], 'dev-info'),
    quickFields('uri', 'string', [], [], 'dev-info'),
    quickFields('width', 'number', [], [], 'dev-info'),
    quickFields('height', 'number', [], [], 'dev-info'),
    quickFields('aspectRatio', 'number', [], [], 'dev-info'),
    quickFields('srcset', 'array', [quickFields('vimeoSrcset', 'vimeoSrcset')], [], 'dev-info'),
    quickFields(
      'pictures',
      'array',
      [quickFields('vimeoPictures', 'vimeoPictures')],
      [],
      'dev-info',
    ),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'link',
      description: 'description',
      media: 'pictures.2.link',
    },
    prepare(selection) {
      const {title, subtitle, media} = selection
      return {
        title,
        subtitle,
        media: <img style={{objectFit: 'cover'}} src={media} alt={`${title}`} />,
      }
    },
  },
})
