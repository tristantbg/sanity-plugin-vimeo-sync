import { ClockIcon, LinkIcon, PlayIcon } from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from '@sanity/ui'
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
 * video player preview with metadata, inspired by sanity-plugin-mux-input.
 */
export default function VimeoVideoInput(props) {
  const { value, renderDefault } = props
  const ref = value?.video?._ref
  const client = useClient({ apiVersion: '2025-02-07' })
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPlayer, setShowPlayer] = useState(false)

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

  const bestSource = useMemo(() => {
    if (!video?.srcset?.length) return null
    // Pick the HD source or the first available
    return (
      video.srcset.find((s) => s.height === 720) ||
      video.srcset.find((s) => s.height === 1080) ||
      video.srcset[0]
    )
  }, [video])

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
          {/* Thumbnail / Player */}
          <Box
            style={{
              position: 'relative',
              aspectRatio: video.aspectRatio
                ? `${video.aspectRatio}`
                : '16 / 9',
              background: '#000',
              cursor: bestSource && !showPlayer ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (bestSource && !showPlayer) setShowPlayer(true)
            }}
          >
            {showPlayer && bestSource ? (
              <video
                src={bestSource.link}
                controls
                autoPlay
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <>
                {video.thumbnail && (
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
                )}
                {bestSource && (
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      position: 'absolute',
                      inset: 0,
                    }}
                  >
                    <Card
                      padding={3}
                      radius={100}
                      style={{
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size={4} style={{ color: '#fff' }}>
                        <PlayIcon />
                      </Text>
                    </Card>
                  </Flex>
                )}
              </>
            )}
          </Box>

          {/* Metadata */}
          <Box padding={3}>
            <Stack space={3}>
              {video.name && (
                <Text size={1} weight="semibold">
                  {video.name}
                </Text>
              )}
              <Flex align="center" gap={4} wrap="wrap">
                {video.duration != null && (
                  <Flex align="center" gap={1}>
                    <Text size={1} muted>
                      <ClockIcon />
                    </Text>
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
              {video.link && (
                <Tooltip
                  content={
                    <Box padding={2}>
                      <Text size={1}>Open on Vimeo</Text>
                    </Box>
                  }
                  placement="top"
                  portal
                >
                  <Button
                    icon={LinkIcon}
                    mode="bleed"
                    tone="primary"
                    text="Open on Vimeo"
                    fontSize={1}
                    padding={2}
                    onClick={handleOpenVimeo}
                  />
                </Tooltip>
              )}
            </Stack>
          </Box>
        </Card>
      )}
    </Stack>
  )
}
