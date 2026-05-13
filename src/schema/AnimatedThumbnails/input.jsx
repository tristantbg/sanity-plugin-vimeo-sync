import {
  CloseIcon,
  GenerateIcon,
  ResetIcon,
  TrashIcon,
} from '@sanity/icons'
import { useSecrets } from '@sanity/studio-secrets'
import {
  Box,
  Button,
  Card,
  Flex,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
} from '@sanity/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MemberField, set, unset, useClient, useFormValue } from 'sanity'
import { namespace } from '../../constants'
import { setPluginConfig } from '../../helpers'
import { RangeSlider } from './RangeSlider'
import { useAnimatedThumbs } from './hooks'

function formatElapsed(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

function ProgressBar({ value }) {
  return (
    <Box
      style={{
        position: 'relative',
        height: 4,
        borderRadius: 2,
        background: 'var(--card-border-color)',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: 'var(--card-accent-fg-color, #f97316)',
          transition: 'width 500ms linear',
        }}
      />
    </Box>
  )
}

export function input(props) {
  const {
    value,
    members,
    renderField,
    renderInput,
    renderItem,
    onChange,
    renderPreview,
  } = props

  const { secrets, loading: secretsLoading } = useSecrets(namespace)

  useEffect(() => {
    if (!secrets?.apiKey && !secretsLoading) {
      console.error(
        'Vimeo access token is not set. Please set it in the Studio Secrets.'
      )
    } else if (secrets?.apiKey) {
      setPluginConfig({ accessToken: secrets.apiKey })
    }
  }, [secrets, secretsLoading])

  const videoUri = useFormValue(['uri'])
  const parentSrcset = useFormValue(['srcset'])
  const parentDuration = useFormValue(['duration'])
  const parentPictures = useFormValue(['pictures'])
  const parentPoster =
    parentPictures?.[2]?.link || parentPictures?.[1]?.link || null

  const startTime = value?.startTime ?? 0
  const duration = value?.duration ?? 6
  const loopVideoRef = value?.loopVideo?._ref
  const existingThumbnails = value?.thumbnails

  const [mode, setMode] = useState(loopVideoRef ? 'loop' : 'animated')

  const client = useClient({ apiVersion: '2025-02-19' })
  const [loopVideo, setLoopVideo] = useState(null)
  const [loopVideoLoading, setLoopVideoLoading] = useState(false)
  const [loopVideoError, setLoopVideoError] = useState(null)

  useEffect(() => {
    if (!loopVideoRef) {
      setLoopVideo(null)
      setLoopVideoError(null)
      return
    }
    setLoopVideoLoading(true)
    client
      .fetch(
        `*[_id == $id][0]{
          name,
          duration,
          srcset[]{ link, width, height, quality },
          "poster": pictures[2].link
        }`,
        { id: loopVideoRef }
      )
      .then((doc) => {
        setLoopVideo(doc)
        setLoopVideoError(null)
      })
      .catch((err) => setLoopVideoError(err.message))
      .finally(() => setLoopVideoLoading(false))
  }, [loopVideoRef, client])

  const {
    status,
    attempt,
    elapsed,
    items,
    generateThumbs,
    deleteThumbs,
    cancel,
  } = useAnimatedThumbs(videoUri, value)

  const isBusy =
    status.type === 'loading' || status.type === 'loading-delete'

  useEffect(() => {
    if (mode !== 'animated') return
    if (!items?.length) return
    const firstItem = items[0]
    if (!firstItem?.sizes?.length) return
    const t = firstItem.sizes[0].start_time
    const d = firstItem.sizes[0].duration
    if (t !== startTime || d !== duration) {
      onChange([set(t, ['startTime']), set(d, ['duration'])])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const loopVideoMember = members.find(
    (m) => m.kind === 'field' && m.name === 'loopVideo'
  )

  const handleRangeChange = useCallback(
    ({ startTime: newStart, duration: newDur }) => {
      onChange([set(newStart, ['startTime']), set(newDur, ['duration'])])
    },
    [onChange]
  )

  const handleGenerate = useCallback(async () => {
    onChange(unset(['thumbnails']))

    const generatedItems = await generateThumbs(startTime, duration)
    if (!generatedItems) return

    const itemsWithKeys = generatedItems.map((item) => ({
      ...item,
      _key: `thumb-${item.clip_uri}`,
      sizes: item.sizes.map((size) => ({
        ...size,
        _key: `size-${size.width}`,
      })),
    }))

    const t = itemsWithKeys[0]?.sizes?.[0]?.start_time
    const d = itemsWithKeys[0]?.sizes?.[0]?.duration

    const patches = [set(itemsWithKeys, ['thumbnails'])]
    if (typeof t === 'number') patches.push(set(t, ['startTime']))
    if (typeof d === 'number') patches.push(set(d, ['duration']))
    onChange(patches)
  }, [generateThumbs, startTime, duration, onChange])

  const handleDelete = useCallback(async () => {
    await deleteThumbs()
    onChange(unset(['thumbnails']))
  }, [deleteThumbs, onChange])

  const handleClearLoopVideo = useCallback(() => {
    onChange(unset(['loopVideo']))
  }, [onChange])

  const generatedPreviewUrl = useMemo(() => {
    const sizes = items?.[0]?.sizes
    if (!sizes?.length) return null
    const sorted = [...sizes].sort((a, b) => (b.width || 0) - (a.width || 0))
    return sorted[0]?.link || null
  }, [items])

  const hasThumbnails =
    existingThumbnails?.length > 0 &&
    existingThumbnails?.[0]?.status === 'completed'

  // Estimate generation progress: typical Vimeo build is ~2 minutes
  const estimatedProgress = Math.min(
    95,
    (elapsed / (2 * 60)) * 100
  )

  if (secretsLoading) {
    return (
      <Card padding={3} tone="caution" radius={2}>
        <Flex align="center" gap={3}>
          <Spinner />
          <Text size={1} weight="medium">
            Loading…
          </Text>
        </Flex>
      </Card>
    )
  }

  return (
    <Stack space={3}>
      <Card>
        <TabList space={1}>
          <Tab
            id="tab-animated"
            aria-controls="panel-animated"
            label="Animated thumbnails"
            onClick={() => setMode('animated')}
            selected={mode === 'animated'}
          />
          <Tab
            id="tab-loop"
            aria-controls="panel-loop"
            label="Loop video"
            onClick={() => setMode('loop')}
            selected={mode === 'loop'}
          />
        </TabList>

        <TabPanel
          id="panel-animated"
          aria-labelledby="tab-animated"
          hidden={mode !== 'animated'}
        >
          <Card paddingTop={3}>
            <Stack space={4}>
              <Stack space={2}>
                <Text size={1} muted>
                  Generated by Vimeo from this video. Pick a start time and a
                  duration up to 6 seconds.
                </Text>
              </Stack>

              <RangeSlider
                srcset={parentSrcset}
                poster={parentPoster}
                videoDuration={parentDuration}
                startTime={startTime}
                duration={duration}
                onChange={handleRangeChange}
                disabled={isBusy || hasThumbnails}
              />

              <Flex gap={3} align="center" wrap="wrap">
                {status.type === 'loading' ? (
                  <Button
                    icon={CloseIcon}
                    tone="critical"
                    mode="ghost"
                    text="Cancel"
                    onClick={cancel}
                  />
                ) : status.type === 'loading-delete' ? (
                  <Button
                    icon={CloseIcon}
                    mode="ghost"
                    text="Deleting…"
                    disabled
                  />
                ) : hasThumbnails ? (
                  <Button
                    icon={TrashIcon}
                    tone="critical"
                    text="Delete existing thumbnails"
                    onClick={handleDelete}
                  />
                ) : (
                  <Button
                    icon={GenerateIcon}
                    tone="primary"
                    text="Generate animated thumbnails"
                    onClick={handleGenerate}
                    disabled={!videoUri || !parentDuration}
                  />
                )}
                {!isBusy && hasThumbnails && (
                  <Text size={1} muted>
                    Existing thumbnails are locked in. Delete them to pick a new
                    time range.
                  </Text>
                )}
              </Flex>

              {status.type === 'loading' && (
                <Card padding={3} radius={2} tone="primary" border>
                  <Stack space={3}>
                    <Flex align="center" gap={3} wrap="wrap">
                      <Spinner />
                      <Stack space={2} style={{ flex: 1, minWidth: 200 }}>
                        <Text size={1} weight="semibold">
                          {status.message}
                        </Text>
                        <Text
                          size={1}
                          muted
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          Elapsed {formatElapsed(elapsed)} · attempt{' '}
                          {Math.max(1, attempt)}
                        </Text>
                      </Stack>
                    </Flex>
                    <ProgressBar value={estimatedProgress} />
                  </Stack>
                </Card>
              )}

              {status.type === 'loading-delete' && (
                <Card padding={3} radius={2} tone="caution" border>
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text size={1}>{status.message}</Text>
                  </Flex>
                </Card>
              )}

              {status.type === 'error' && (
                <Card padding={3} radius={2} tone="critical" border>
                  <Stack space={3}>
                    <Text size={1} weight="semibold">
                      Generation failed
                    </Text>
                    <Text size={1}>{status.message}</Text>
                    <Flex>
                      <Button
                        icon={ResetIcon}
                        mode="ghost"
                        fontSize={1}
                        padding={2}
                        text="Try again"
                        onClick={handleGenerate}
                      />
                    </Flex>
                  </Stack>
                </Card>
              )}

              {status.type === 'success' && (
                <Card padding={3} radius={2} tone="positive" border>
                  <Text size={1}>{status.message}</Text>
                </Card>
              )}

              {status.type === 'already-generated' && (
                <Card padding={3} radius={2} tone="caution" border>
                  <Text size={1}>{status.message}</Text>
                </Card>
              )}

              {generatedPreviewUrl && (
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Preview
                  </Text>
                  <Box
                    style={{
                      border: '1px solid var(--card-border-color)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      maxWidth: 320,
                    }}
                  >
                    <img
                      src={generatedPreviewUrl}
                      alt="Animated thumbnail preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                  </Box>
                </Stack>
              )}
            </Stack>
          </Card>
        </TabPanel>

        <TabPanel
          id="panel-loop"
          aria-labelledby="tab-loop"
          hidden={mode !== 'loop'}
        >
          <Card paddingTop={3}>
            <Stack space={4}>
              <Text size={1} muted>
                Reuse another Vimeo video as the loop instead of generating one.
                Pick a start time and duration within the selected video.
              </Text>

              {loopVideoMember && (
                <MemberField
                  member={loopVideoMember}
                  renderInput={renderInput}
                  renderField={renderField}
                  renderItem={renderItem}
                  renderPreview={renderPreview}
                />
              )}

              {loopVideoRef && (
                <>
                  {loopVideoLoading && (
                    <Flex align="center" gap={3}>
                      <Spinner />
                      <Text size={1} muted>
                        Loading loop video…
                      </Text>
                    </Flex>
                  )}

                  {loopVideoError && (
                    <Card padding={3} radius={2} tone="critical" border>
                      <Text size={1}>
                        Couldn't load the selected video: {loopVideoError}
                      </Text>
                    </Card>
                  )}

                  {loopVideo && (
                    <Stack space={3}>
                      <RangeSlider
                        srcset={loopVideo.srcset}
                        poster={loopVideo.poster}
                        videoDuration={loopVideo.duration}
                        startTime={startTime}
                        duration={duration}
                        onChange={handleRangeChange}
                      />
                      <Flex>
                        <Button
                          icon={ResetIcon}
                          mode="ghost"
                          tone="critical"
                          fontSize={1}
                          padding={2}
                          text="Clear loop video"
                          onClick={handleClearLoopVideo}
                        />
                      </Flex>
                    </Stack>
                  )}
                </>
              )}
            </Stack>
          </Card>
        </TabPanel>
      </Card>
    </Stack>
  )
}
