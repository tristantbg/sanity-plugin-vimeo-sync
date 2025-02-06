import {getPluginConfig} from '../helpers'

export async function generateVideoAnimatedThumbnails(uri) {
  if (!uri) return

  const pluginConfig = getPluginConfig()
  const vimeoAccessToken = pluginConfig?.accessToken

  // You can find more info here:
  // https://developer.vimeo.com/api/reference/videos/3.4.8#create_animated_thumbset
  // Please note that you can't create more than four sets of animated thumbnails for the same video.
  try {
    // check if the video has already animated thumbnails
    let animatedThumbnails
    animatedThumbnails = await getExistingVideoThumbnails(uri)
    if (animatedThumbnails?.length) {
      console.log('Video already has animated thumbnails')
      return animatedThumbnails
    }

    // Delay to prevent 429 error
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('Generating animated thumbnails for video:', uri)

    const res = await fetch(`https://api.vimeo.com/${uri}/animated_thumbsets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vimeoAccessToken}`,
      },
      body: JSON.stringify({
        duration: 6,
      }),
    })
    const generatedThumbs = await res.json()
    console.log(generatedThumbs)
  } catch (e) {
    console.error('Vimeo generated thumb error', e)
  }
}

async function getExistingVideoThumbnails(uri) {
  if (!uri) return
  const pluginConfig = getPluginConfig()
  const vimeoAccessToken = pluginConfig?.accessToken

  const res = await fetch(`https://api.vimeo.com/${uri}/animated_thumbsets`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${vimeoAccessToken}`,
    },
  })

  const apiResponse = await res.json()

  console.log(apiResponse)
  if (apiResponse.total > 0) {
    return apiResponse.data
  }

  return
}
