import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Box, Button, Flex, Stack, Text } from '@sanity/ui'
import { PlayIcon, PauseIcon } from '@sanity/icons'

const MAX_DURATION = 6
const MIN_DURATION = 1

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

function pickPreviewSrc(srcset) {
  if (!Array.isArray(srcset)) return null
  const mp4s = srcset.filter(
    (s) => s?.link && s?.quality !== 'hls' && typeof s?.width === 'number'
  )
  if (!mp4s.length) return null
  const sorted = [...mp4s].sort((a, b) => a.width - b.width)
  const target =
    sorted.find((s) => s.width >= 540) || sorted[sorted.length - 1]
  return target?.link || null
}

export function RangeSlider({
  srcset,
  poster,
  videoDuration,
  startTime,
  duration,
  onChange,
  disabled,
}) {
  const scopeId = useId().replace(/:/g, '')
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const cls = `vthumb-${scopeId}`

  const previewSrc = useMemo(() => pickPreviewSrc(srcset), [srcset])

  const start = Math.max(0, Math.min(startTime || 0, videoDuration || 0))
  const dur = Math.max(
    MIN_DURATION,
    Math.min(duration || MAX_DURATION, MAX_DURATION)
  )
  const end = Math.min(start + dur, videoDuration || start + dur)

  useEffect(() => {
    const v = videoRef.current
    if (!v || isPlaying) return
    if (Math.abs(v.currentTime - start) > 0.05) {
      try {
        v.currentTime = start
      } catch (e) {
        // pre-metadata
      }
    }
  }, [start, isPlaying, ready])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTimeUpdate = () => {
      if (v.currentTime >= end - 0.05) {
        try {
          v.currentTime = start
        } catch (e) {
          /* noop */
        }
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onLoaded = () => setReady(true)
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('loadedmetadata', onLoaded)
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('loadedmetadata', onLoaded)
    }
  }, [start, end])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      try {
        v.currentTime = start
      } catch (e) {
        /* noop */
      }
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [start])

  const commit = useCallback(
    (newStart, newDur) => {
      const sChanged = newStart !== start
      const dChanged = newDur !== dur
      if (sChanged || dChanged) {
        onChange({
          startTime: sChanged ? Math.round(newStart) : start,
          duration: dChanged ? Math.round(newDur) : dur,
        })
      }
    },
    [start, dur, onChange]
  )

  const handleStartInput = useCallback(
    (e) => {
      let newStart = Number(e.target.value)
      let newDur = dur
      if (newStart < 0) newStart = 0
      if (newStart > end - MIN_DURATION) newStart = end - MIN_DURATION
      if (end - newStart > MAX_DURATION) newDur = MAX_DURATION
      else newDur = end - newStart
      commit(newStart, newDur)
    },
    [end, dur, commit]
  )

  const handleEndInput = useCallback(
    (e) => {
      let newEnd = Number(e.target.value)
      if (newEnd < MIN_DURATION) newEnd = MIN_DURATION
      if (videoDuration && newEnd > videoDuration) newEnd = videoDuration
      let newStart = start
      let newDur = newEnd - newStart
      if (newDur > MAX_DURATION) {
        // Slide the window: keep duration at MAX, drag start along with end
        newStart = newEnd - MAX_DURATION
        newDur = MAX_DURATION
      } else if (newDur < MIN_DURATION) {
        newDur = MIN_DURATION
      }
      commit(newStart, newDur)
    },
    [start, videoDuration, commit]
  )

  if (!videoDuration) {
    return (
      <Box
        padding={3}
        style={{
          border: '1px dashed var(--card-border-color)',
          borderRadius: 4,
        }}
      >
        <Text size={1} muted>
          Video duration unavailable. Re-sync this Vimeo document to enable the
          time selector.
        </Text>
      </Box>
    )
  }

  const startPct = (start / videoDuration) * 100
  const endPct = (end / videoDuration) * 100

  return (
    <Stack space={3}>
      <Box
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          background: '#000',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {previewSrc ? (
          <video
            ref={videoRef}
            src={previewSrc}
            poster={poster}
            muted
            playsInline
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : poster ? (
          <img
            src={poster}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : null}

        {previewSrc && (
          <button
            type="button"
            onClick={togglePlay}
            disabled={disabled}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview loop'}
            style={{
              position: 'absolute',
              inset: 0,
              border: 0,
              background: 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <span
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isPlaying ? 0 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              {isPlaying ? (
                <PauseIcon style={{ fontSize: 28 }} />
              ) : (
                <PlayIcon style={{ fontSize: 28 }} />
              )}
            </span>
          </button>
        )}
      </Box>

      <style>{`
        .${cls} { position: relative; height: 28px; }
        .${cls} .vt-track {
          position: absolute; top: 50%; left: 0; right: 0;
          height: 4px; transform: translateY(-50%);
          background: var(--card-border-color);
          border-radius: 2px; pointer-events: none;
        }
        .${cls} .vt-active {
          position: absolute; top: 50%; height: 4px;
          transform: translateY(-50%);
          background: var(--card-accent-fg-color, #f97316);
          border-radius: 2px; pointer-events: none;
        }
        .${cls} input[type="range"] {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          margin: 0; padding: 0;
          background: none; pointer-events: none;
          -webkit-appearance: none; appearance: none;
        }
        .${cls} input[type="range"]:disabled { opacity: 0.5; }
        .${cls} input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px; width: 18px; border-radius: 50%;
          background: var(--card-accent-fg-color, #f97316);
          border: 2px solid var(--card-bg-color, #1a1a1a);
          cursor: pointer; pointer-events: all;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .${cls} input[type="range"]::-moz-range-thumb {
          height: 18px; width: 18px; border-radius: 50%;
          background: var(--card-accent-fg-color, #f97316);
          border: 2px solid var(--card-bg-color, #1a1a1a);
          cursor: pointer; pointer-events: all;
        }
        .${cls} input[type="range"]::-webkit-slider-runnable-track { background: transparent; }
        .${cls} input[type="range"]::-moz-range-track { background: transparent; }
      `}</style>

      <div className={cls}>
        <div className="vt-track" />
        <div
          className="vt-active"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />
        <input
          type="range"
          min={0}
          max={videoDuration}
          step={1}
          value={start}
          onChange={handleStartInput}
          disabled={disabled}
          style={{ zIndex: start === videoDuration ? 5 : 3 }}
        />
        <input
          type="range"
          min={0}
          max={videoDuration}
          step={1}
          value={end}
          onChange={handleEndInput}
          disabled={disabled}
          style={{ zIndex: 4 }}
        />
      </div>

      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        <Text
          size={1}
          weight="medium"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          From{' '}
          <span style={{ color: 'var(--card-accent-fg-color, #f97316)' }}>
            {formatTime(start)}
          </span>{' '}
          to{' '}
          <span style={{ color: 'var(--card-accent-fg-color, #f97316)' }}>
            {formatTime(end)}
          </span>{' '}
          <Text as="span" size={1} muted>
            ({dur}s · max {MAX_DURATION}s)
          </Text>
        </Text>
        <Text size={1} muted>
          Total: {formatTime(videoDuration)}
        </Text>
      </Flex>
    </Stack>
  )
}
