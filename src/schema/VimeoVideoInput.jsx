import { ClockIcon, LinkIcon } from '@sanity/icons'
import { Box, Button, Card, Flex, Spinner, Stack, Text } from '@sanity/ui'
import {
  MediaController,
  MediaControlBar,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaVolumeRange,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaLoadingIndicator,
} from 'media-chrome/react'
import 'vimeo-video-element'
import { useCallback, useMemo, useState } from 'react'
import { useClient } from 'sanity'

function formatDuration(seconds) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Custom input component for the `vimeo.video` schema type.
 * Resolves the referenced vimeo document and displays a
 * video player preview with metadata, using media-chrome for playback.
 */
export default function VimeoVideoInput(props) {
  const { value, renderDefault } = props
  const ref = value?._ref
  const client = useClient({ apiVersion: '2025-02-07' })
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch the referenced vimeo document
  useMemo(() => {
    if (!ref) {
      setVideo(null)
      return
    }
    setLoading(true)
    setError(null)
    client
      .fetch(
        `*[_id == $id][0]{
          name,
          link,
          uri,
          duration,
          width,
          height,
          aspectRatio,
          description,
          "thumbnail": pictures[2].link,
          "thumbnailSmall": pictures[1].link,
          "srcset": srcset[]{ link, width, height, quality }
        }`,
        { id: ref }
      )
      .then((doc) => {
        setVideo(doc)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [ref, client])

  const handleOpenVimeo = useCallback(() => {
    if (video?.link) window.open(video.link, '_blank')
  }, [video])

  return (
    <Stack space={3}>
      {/* Render the default reference input (search/select) */}
      {renderDefault(props)}

      {/* Video preview card */}
      {loading && (
        <Card border padding={4} radius={2} tone="transparent">
          <Flex align="center" justify="center" gap={3}>
            <Spinner />
            <Text size={1} muted>
              Loading video preview…
            </Text>
          </Flex>
        </Card>
      )}

      {error && (
        <Card border padding={3} radius={2} tone="critical">
          <Text size={1}>Error loading video: {error}</Text>
        </Card>
      )}

      {video && !loading && (
        <Card border radius={2} overflow="hidden" tone="transparent">
          {/* media-chrome player with vimeo-video-element */}
          {video.link ? (
            <MediaController
              style={{
                width: '100%',
                aspectRatio: '16/9',
              }}
            >
              <vimeo-video
                slot="media"
                src={video.link}
                crossorigin
                playsInline
              />
              <MediaLoadingIndicator noAutohide slot="centered-chrome" />
              <MediaControlBar>
                <MediaPlayButton></MediaPlayButton>
                <MediaSeekBackwardButton></MediaSeekBackwardButton>
                <MediaSeekForwardButton></MediaSeekForwardButton>
                <MediaTimeRange></MediaTimeRange>
                <MediaTimeDisplay showDuration></MediaTimeDisplay>
                <MediaMuteButton></MediaMuteButton>
                <MediaVolumeRange></MediaVolumeRange>
              </MediaControlBar>
            </MediaController>
          ) : video.thumbnail ? (
            <Box
              style={{
                aspectRatio: video.aspectRatio
                  ? `${video.aspectRatio}`
                  : '16 / 9',
                background: '#000',
              }}
            >
              <img
                src={video.thumbnail}
                alt={video.name || 'Video thumbnail'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </Box>
          ) : null}

          {/* Metadata */}
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
                  text="Open on Vimeo"
                  fontSize={1}
                  padding={2}
                  onClick={handleOpenVimeo}
                />
              )}
            </Flex>
          </Box>
        </Card>
      )}
    </Stack>
  )
}
