import { useCallback, useEffect, useRef, useState } from 'react'
import { ps } from './messages'
import {
  createSetOfAnimatedThumbnails,
  deleteExistingVideoThumbnails,
  getAnimatedThumbset,
  getExistingVideoThumbnails,
} from './utils'

const POLL_INTERVAL_MS = 8 * 1000
const TIMEOUT_MS = 6 * 60 * 1000

export const useAnimatedThumbs = (uri, field) => {
  const hasThumbnails =
    field?.thumbnails?.length && field?.thumbnails?.[0]?.status === 'completed'

  const [status, setStatus] = useState(
    hasThumbnails
      ? ps('already-generated')
      : { type: 'idle', message: undefined }
  )
  const [attempt, setAttempt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [items, setItems] = useState(hasThumbnails ? field.thumbnails : [])

  const cancelRef = useRef(false)
  const startedAtRef = useRef(0)
  const tickerRef = useRef(null)

  useEffect(() => {
    return () => {
      cancelRef.current = true
      if (tickerRef.current) clearInterval(tickerRef.current)
    }
  }, [])

  const startTicker = useCallback(() => {
    if (tickerRef.current) clearInterval(tickerRef.current)
    startedAtRef.current = Date.now()
    setElapsed(0)
    tickerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 1000)
  }, [])

  const stopTicker = useCallback(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current)
      tickerRef.current = null
    }
  }, [])

  const pollThumbset = useCallback(async (thumbsetUri) => {
    const startedAt = Date.now()
    let tries = 0

    while (true) {
      if (cancelRef.current) {
        throw new Error('Cancelled')
      }
      tries += 1
      setAttempt(tries)

      const data = await getAnimatedThumbset(thumbsetUri)

      if (data?.status === 'completed') return data
      if (data?.status === 'failed' || data?.status === 'error') {
        throw new Error(
          'Vimeo failed to generate this animated thumbnail. Try a different start time or duration.'
        )
      }

      if (Date.now() - startedAt > TIMEOUT_MS) {
        throw new Error(
          `Generation timed out after ${Math.round(TIMEOUT_MS / 60000)} minutes. Vimeo may still be processing — reopen this document in a few minutes.`
        )
      }

      setStatus(ps('loading', tries))
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }, [])

  const generateThumbs = useCallback(
    async (startTime, duration) => {
      cancelRef.current = false
      setAttempt(0)
      setStatus(ps('loading', 0))
      startTicker()

      try {
        if (!uri) {
          throw new Error('This Vimeo document has no URI — re-sync it first.')
        }

        const existing = await getExistingVideoThumbnails(uri)
        if (existing?.length) {
          setStatus(ps('already-generated'))
          setItems(existing)
          return existing
        }

        const created = await createSetOfAnimatedThumbnails(
          uri,
          startTime,
          duration
        )

        const thumbsetUri = created?.uri
        if (!thumbsetUri) {
          throw new Error(
            'Vimeo did not return a thumbnail set. Please try again.'
          )
        }

        await pollThumbset(thumbsetUri)
        const finalItems = await getExistingVideoThumbnails(uri)

        if (finalItems?.length) {
          setStatus(ps('success'))
          setItems(finalItems)
          return finalItems
        }

        throw new Error(
          'Generation finished but no thumbnails were returned. Please try again.'
        )
      } catch (e) {
        if (e?.message === 'Cancelled') {
          setStatus({ type: 'idle', message: undefined })
          return
        }
        console.error('Error generating animated thumbnails', e)
        setStatus({ type: 'error', message: e.message })
        return
      } finally {
        stopTicker()
      }
    },
    [uri, pollThumbset, startTicker, stopTicker]
  )

  const cancel = useCallback(() => {
    cancelRef.current = true
  }, [])

  const deleteThumbs = useCallback(async () => {
    try {
      setStatus(ps('loading', null, 'delete'))
      for (const item of items) {
        await deleteExistingVideoThumbnails(item)
      }
      setStatus(ps('success', null, 'delete'))
      setItems([])
    } catch (e) {
      setStatus({ type: 'error', message: e.message })
    }
  }, [items])

  const reset = useCallback(() => {
    setStatus({ type: 'idle', message: undefined })
    setAttempt(0)
    setElapsed(0)
  }, [])

  return {
    status,
    attempt,
    elapsed,
    items,
    generateThumbs,
    deleteThumbs,
    cancel,
    reset,
  }
}
