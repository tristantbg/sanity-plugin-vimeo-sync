import { LinkIcon } from '@sanity/icons'
import { Box, Button, Flex, Stack, Text } from '@sanity/ui'
import { useCallback } from 'react'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

function formatDuration(seconds) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoMetadata({ video }) {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)

  const handleOpenVimeo = useCallback(() => {
    if (video?.link) window.open(video.link, '_blank')
  }, [video])

  return (
    <Box padding={3}>
      <Flex align="center" gap={3}>
        <Stack space={2} style={{ flex: 1 }}>
          {video.name && (
            <Text size={1} weight="semibold">
              {video.name}
            </Text>
          )}
          <Flex align="center" gap={4} wrap="wrap">
            {video.duration != null && (
              <Flex align="center" gap={1}>
                <Text size={1} muted>
                  {formatDuration(video.duration)}
                </Text>
              </Flex>
            )}
            {video.width && video.height && (
              <Text size={1} muted>
                {video.width}×{video.height}
              </Text>
            )}
          </Flex>
        </Stack>
        {video.link && (
          <Button
            icon={LinkIcon}
            mode="ghost"
            tone="primary"
            text={t('video-input.open-on-vimeo')}
            fontSize={1}
            padding={2}
            onClick={handleOpenVimeo}
          />
        )}
      </Flex>
    </Box>
  )
}
