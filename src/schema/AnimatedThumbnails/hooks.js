import { useCallback, useEffect, useRef, useState } from 'react'
import { ps } from './messages'
import {
  createSetOfAnimatedThumbnails,
  deleteExistingVideoThumbnails,
  getExistingVideoThumbnails,
} from './utils'

const POLL_INTERVAL_MS = 8 * 1000
const TIMEOUT_MS = 6 * 60 * 1000

const isCompleted = (t) => t?.status === 'completed'
const isFailed = (t) => t?.status === 'failed' || t?.status === 'error'
const isPending = (t) => t?.status && !isCompleted(t) && !isFailed(t)

export const useAnimatedThumbs = (uri, field) => {
  const startThumbs = field?.thumbnails || []
  const allCompleted =
    startThumbs.length > 0 && startThumbs.every(isCompleted)

  const [status, setStatus] = useState(
    allCompleted
      ? ps('already-generated')
      : { type: 'idle', message: undefined }
  )
  const [attempt, setAttempt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [items, setItems] = useState(startThumbs)

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

  // Poll using the list endpoint — Vimeo's single-thumbset GET often returns
  // 404 ("The animated thumbset wasn't found.") for a short window after the
  // POST that created it. The list endpoint is consistent immediately.
  const pollThumbset = useCallback(
    async (thumbsetUri) => {
      const startedAt = Date.now()
      let tries = 0
      let missingCycles = 0

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (cancelRef.current) {
          throw new Error('Cancelled')
        }
        tries += 1
        setAttempt(tries)

        const list = await getExistingVideoThumbnails(uri)
        let data = null
        if (list?.length) {
          data =
            (thumbsetUri && list.find((t) => t?.uri === thumbsetUri)) || null
          if (!data) {
            // Fallback: newest thumbset by created_on
            data = [...list].sort(
              (a, b) => (b?.created_on || 0) - (a?.created_on || 0)
            )[0]
          }
        }

        if (data) {
          missingCycles = 0
          if (isCompleted(data)) return data
          if (isFailed(data)) {
            throw new Error(
              'Vimeo failed to generate this animated thumbnail. Try a different start time or duration.'
            )
          }
        } else {
          missingCycles += 1
          if (missingCycles > 5) {
            throw new Error(
              "The thumbnail set is no longer listed on Vimeo. It may have been deleted — refresh and try again."
            )
          }
        }

        if (Date.now() - startedAt > TIMEOUT_MS) {
          throw new Error(
            `Generation timed out after ${Math.round(TIMEOUT_MS / 60000)} minutes. Vimeo may still be processing — reopen this document in a few minutes.`
          )
        }

        setStatus(ps('loading', tries))
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      }
    },
    [uri]
  )

  // Polls any pending thumbset on Vimeo, then returns the final list.
  const drainPending = useCallback(async () => {
    const existing = await getExistingVideoThumbnails(uri)
    if (!existing?.length) return null

    const inProgress = existing.find(isPending)
    if (inProgress?.uri) {
      await pollThumbset(inProgress.uri)
      return await getExistingVideoThumbnails(uri)
    }
    return existing
  }, [uri, pollThumbset])

  // Reconnects to any in-progress Vimeo thumbset and resolves it to completion.
  // Returns the final items if successful, null if nothing to resume, throws on error.
  const resumeFromVimeo = useCallback(async () => {
    cancelRef.current = false
    setAttempt(0)
    setStatus(ps('loading', 0))
    startTicker()

    try {
      if (!uri) {
        throw new Error('This Vimeo document has no URI — re-sync it first.')
      }

      const finalItems = await drainPending()

      if (!finalItems?.length) {
        setStatus({ type: 'idle', message: undefined })
        return null
      }

      setItems(finalItems)

      if (finalItems.every(isCompleted)) {
        setStatus(ps('success'))
        return finalItems
      }

      if (finalItems.some(isFailed)) {
        setStatus({
          type: 'error',
          message:
            'Vimeo reported a failed thumbnail in this set. Delete it and regenerate.',
        })
      } else {
        setStatus({ type: 'idle', message: undefined })
      }
      return finalItems
    } catch (e) {
      if (e?.message === 'Cancelled') {
        setStatus({ type: 'idle', message: undefined })
        return null
      }
      console.error('Error resuming animated thumbnails', e)
      setStatus({ type: 'error', message: e.message })
      return null
    } finally {
      stopTicker()
    }
  }, [uri, drainPending, startTicker, stopTicker])

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
          // Orphan recovery: if Vimeo has thumbnails (possibly still in
          // progress) that weren't fully saved to Sanity, drain them instead
          // of starting a new generation.
          const inProgress = existing.find(isPending)
          if (inProgress?.uri) {
            await pollThumbset(inProgress.uri)
            const finalItems = await getExistingVideoThumbnails(uri)
            if (finalItems?.length && finalItems.every(isCompleted)) {
              setStatus(ps('success'))
              setItems(finalItems)
              return finalItems
            }
            if (finalItems?.some(isFailed)) {
              setItems(finalItems)
              setStatus({
                type: 'error',
                message:
                  'A thumbnail in the existing set failed. Delete it and try again.',
              })
              return finalItems
            }
            setItems(finalItems || [])
            return finalItems
          }

          if (existing.every(isCompleted)) {
            setStatus(ps('already-generated'))
            setItems(existing)
            return existing
          }

          // Has failed items but no in-progress — surface and let the user delete
          setItems(existing)
          setStatus({
            type: 'error',
            message:
              'Existing thumbnails are in a failed state. Delete them and try again.',
          })
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

      // Always reconcile with Vimeo so orphans are cleaned up too
      let toDelete = items
      try {
        const fromVimeo = await getExistingVideoThumbnails(uri)
        if (fromVimeo?.length) toDelete = fromVimeo
      } catch (e) {
        // Fall back to local items if Vimeo lookup fails
      }

      for (const item of toDelete) {
        await deleteExistingVideoThumbnails(item)
      }
      setStatus(ps('success', null, 'delete'))
      setItems([])
    } catch (e) {
      setStatus({ type: 'error', message: e.message })
    }
  }, [items, uri])

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
    resumeFromVimeo,
  }
}
