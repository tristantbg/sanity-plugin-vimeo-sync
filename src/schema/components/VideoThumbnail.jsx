import { Box } from '@sanity/ui'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

export function VideoThumbnail({ video }) {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)

  return (
    <Box
      style={{
        aspectRatio: video.aspectRatio ? `${video.aspectRatio}` : '16 / 9',
        background: '#000',
      }}
    >
      <img
        src={video.thumbnail}
        alt={video.name || t('video-input.thumbnail-alt')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </Box>
  )
}
