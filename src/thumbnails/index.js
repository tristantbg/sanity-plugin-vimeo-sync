export async function generateVideoAnimatedThumbnails(video) {
  if (!video) return
  // You can find more info here:
  // https://developer.vimeo.com/api/reference/videos/3.4.8#create_animated_thumbset
  // Please note that you can't create more than four sets of animated thumbnails for the same video.
  try {
    // check if the video has already animated thumbnails
    let animatedThumbnails
    animatedThumbnails = await getExistingVideoThumbnails(video)
    if (animatedThumbnails?.length) {
      console.log('Video already has animated thumbnails')
      return animatedThumbnails
    }

    // Delay to prevent 429 error
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('Generating animated thumbnails for video:', video.uri)

    const maxGifDuration = Math.min(video.duration, 6)
    const res = await fetch(`https://api.vimeo.com/${video.uri}/animated_thumbsets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vimeoAccessToken}`,
      },
      body: JSON.stringify({
        duration: maxGifDuration,
      }),
    })
    const generatedThumbs = await res.json()
    console.log(generatedThumbs)
  } catch (e) {
    console.error('Vimeo generated thumb error', e)
  }
}

async function getExistingVideoThumbnails(video) {
  const res = await fetch(`https://api.vimeo.com/${video.uri}/animated_thumbsets`, {
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
