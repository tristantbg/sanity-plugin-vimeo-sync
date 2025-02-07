import {useState} from 'react'
import {getPluginConfig} from '../helpers'

const getExistingVideoThumbnails = async (uri) => {
  if (!uri) return
  const pluginConfig = getPluginConfig()
  const vimeoAccessToken = pluginConfig?.accessToken

  const res = await fetch(`https://api.vimeo.com${uri}/animated_thumbsets`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${vimeoAccessToken}`,
    },
  })

  const apiResponse = await res.json()

  if (apiResponse.total > 0) {
    return apiResponse.data
  }

  return
}

export const useAnimatedThumbs = (uri) => {
  const [status, setStatus] = useState('idle')
  const [attempt, setAttempt] = useState(0)

  const checkStatus = async (uri, opts) => {
    const defaultOpts = {startTime: Date.now(), loop: true}
    const options = {...defaultOpts, ...opts}
    const {startTime, loop} = options
    console.log('Check status')

    const timeout = 5 * 60 * 1000 // 5 minutes

    const updatedThumbnails = await getExistingVideoThumbnails(uri)
    const status = updatedThumbnails?.[0]?.status

    if (status === 'completed') {
      console.log('Animated thumbnails generation completed for video:', uri)
      return updatedThumbnails
    } else if (Date.now() - startTime > timeout) {
      console.error(
        'Timeout: Animated thumbnails generation took longer than 5 minutes for video:',
        uri,
      )
      return
    } else if (loop) {
      console.log('Waiting for animated thumbnails generation to complete for video')
      setAttempt(attempt + 1)
      await new Promise((resolve) => setTimeout(resolve, 60000)) // wait for 1 minute
      return await checkStatus(uri, options)
    }
  }

  const generateThumbs = async () => {
    setStatus({type: 'loading', message: 'We are generating animated thumbnails...'})
    try {
      if (!uri) return
      const pluginConfig = getPluginConfig()
      const vimeoAccessToken = pluginConfig?.accessToken

      // You can find more info here:
      // https://developer.vimeo.com/api/reference/videos/3.4.8#create_animated_thumbset
      // Please note that you can't create more than four sets of animated thumbnails for the same video.
      // check if the video has already animated thumbnails
      let animatedThumbnails
      animatedThumbnails = await getExistingVideoThumbnails(uri)
      if (animatedThumbnails?.length) {
        console.log('Video already has animated thumbnails')
        setStatus({type: 'success', message: 'Animated thumbnails already generated'})
        return animatedThumbnails
      }

      // Delay to prevent 429 error
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Generating animated thumbnails for video:', uri)

      const res = await fetch(`https://api.vimeo.com${uri}/animated_thumbsets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vimeoAccessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: '6',
        }),
      })
      const generatedThumbs = await res.json()
      console.log(generatedThumbs)

      if (generatedThumbs.status !== 'completed') {
        console.log('Animated thumbnails generated for video:', uri)
        console.log('Waiting for animated thumbnails generation to complete for video')

        const finalThumbnails = await checkStatus(uri)
        if (finalThumbnails) {
          return finalThumbnails
        }

        console.log('Animated thumbnails generation completed for video:', uri)
        return generatedThumbs.data
      }

      clearTimeout(timeoutFn)
    } catch (e) {
      console.error('Error generating thumbnails', e)
      setStatus({type: 'error', message: e.message})
      return
    }

    setStatus({type: 'success', message: 'Animated thumbnails generated successfully'})
  }

  return {status, attempt, generateThumbs}
}
