import {useState} from 'react'
import {ps} from './messages'
import {
  createSetOfAnimatedThumbnails,
  deleteExistingVideoThumbnails,
  getExistingVideoThumbnails,
} from './utils'

export const useAnimatedThumbs = (uri) => {
  const [status, setStatus] = useState({type: 'idle', message: undefined})
  const [attempt, setAttempt] = useState(0)
  const [items, setItems] = useState([])
  const checkStatus = async (opts) => {
    const defaultOpts = {
      startTime: Date.now(),
      loop: true,
      timeout: 5 * 60 * 1000, // 5 * 60 * 1000 5 minutes
      pollInterval: 1 * 60 * 1000, // 1 * 60 * 1000 1 minute
    }

    const options = {...defaultOpts, ...opts}
    const {startTime, loop, timeout, pollInterval} = options
    console.log('Check status')

    if (timeout < pollInterval) {
      throw new Error('Poll interval is greater than timeout')
    }

    const updatedThumbnails = await getExistingVideoThumbnails(uri)
    const status = updatedThumbnails?.[0]?.status

    if (status === 'completed') {
      console.log('Animated thumbnails generation completed for video:', uri)
      return updatedThumbnails
    } else if (Date.now() - startTime > timeout) {
      throw new Error(
        `Timeout: Animated thumbnails generation took longer than ${timeout / pollInterval} minutes for video:`,
        uri,
      )
    } else if (loop) {
      console.log('Waiting for animated thumbnails generation to complete for video')
      setAttempt((prev) => {
        const curr = prev + 1
        setStatus(ps('loading', curr))
        return curr
      })

      await new Promise((resolve) => setTimeout(resolve, pollInterval)) // wait for 1 minute
      return await checkStatus({startTime})
    }
  }

  const generateThumbs = async () => {
    setAttempt(0)
    setStatus(ps('loading', attempt))

    try {
      if (!uri) {
        throw new Error('No video URI provided')
      }

      const animatedThumbnails = await getExistingVideoThumbnails(uri)
      if (animatedThumbnails?.length) {
        setStatus(ps('already-generated'))
        setItems(animatedThumbnails)
        return animatedThumbnails
      }

      await createSetOfAnimatedThumbnails(uri, 6)
      const items = await checkStatus()
      if (items.length) {
        setStatus(ps('success'))
        setItems(items)
        return items
      }

      setStatus({type: 'error', message: 'Unkown error. No items found. Please report this issue.'})
      // Delay to prevent 429 error
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (e) {
      console.error('Error generating thumbnails', e)
      setStatus({type: 'error', message: e.message})
      return
    }
  }

  const deleteThumbs = async () => {
    setStatus(ps('loading', null, 'delete'))
    for (const item of items) {
      const res = await deleteExistingVideoThumbnails(item)
      if (res.error) {
        setStatus({type: 'error', message: res.error})
        return
      }
    }
    setStatus(ps('success-delete'))
  }

  return {status, attempt, items, generateThumbs, deleteThumbs}
}
