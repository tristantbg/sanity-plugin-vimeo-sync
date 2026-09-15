import {Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useClient, useTranslation} from 'sanity'

import {vimeoSyncLocaleNamespace} from '../i18n'
import {VideoMetadata} from './components/VideoMetadata'
import {VideoPlayer} from './components/VideoPlayer'
import {VideoThumbnail} from './components/VideoThumbnail'

/**
 * Custom input component for the `vimeo.video` schema type.
 * Resolves the referenced vimeo document and displays a
 * video player preview with metadata, using media-chrome for playback.
 */
export default function VimeoVideoInput(props) {
  const {value, renderDefault} = props
  const ref = value?._ref
  const client = useClient({apiVersion: '2025-02-07'})
  const {t} = useTranslation(vimeoSyncLocaleNamespace)
  // Result is tagged with the ref it was fetched for, so loading and stale
  // results can be derived during render instead of set inside the effect.
  const [result, setResult] = useState({ref: null, video: null, error: null})

  // Fetch the referenced vimeo document
  useEffect(() => {
    if (!ref) return undefined
    let cancelled = false
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
          "hls": srcset[quality == "hls"][0].link,
          "mp4": srcset[quality != "hls"] | order(width desc)[0].link,
          "srcset": srcset[]{ link, width, height, quality }
        }`,
        {id: ref},
      )
      .then((doc) => {
        if (!cancelled) setResult({ref, video: doc, error: null})
        return doc
      })
      .catch((err) => {
        if (!cancelled) setResult({ref, video: null, error: err.message})
      })
    return () => {
      cancelled = true
    }
  }, [ref, client])

  const isCurrent = Boolean(ref) && result.ref === ref
  const loading = Boolean(ref) && !isCurrent
  const video = isCurrent ? result.video : null
  const error = isCurrent ? result.error : null

  return (
    <Stack gap={3}>
      {renderDefault(props)}

      {loading && (
        <Card border padding={4} radius={2} tone="transparent">
          <Flex align="center" justify="center" gap={3}>
            <Spinner />
            <Text size={1} muted>
              {t('video-input.loading')}
            </Text>
          </Flex>
        </Card>
      )}

      {error && (
        <Card border padding={3} radius={2} tone="critical">
          <Text size={1}>{t('video-input.error', {message: error})}</Text>
        </Card>
      )}

      {video && !loading && (
        <Card border radius={2} overflow="hidden" tone="transparent">
          {video.hls || video.mp4 ? (
            <VideoPlayer video={video} />
          ) : video.thumbnail ? (
            <VideoThumbnail video={video} />
          ) : null}

          <VideoMetadata video={video} />
        </Card>
      )}
    </Stack>
  )
}
