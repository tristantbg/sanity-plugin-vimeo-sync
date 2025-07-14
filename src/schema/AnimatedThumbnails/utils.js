import {getPluginConfig} from '../../helpers'

// You can find more info here:
// https://developer.vimeo.com/api/reference/videos/3.4.8#create_animated_thumbset
// Please note that you can't create more than four sets of animated thumbnails for the same video.
// check if the video has already animated thumbnails

export const getExistingVideoThumbnails = async (uri) => {
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
  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  if (apiResponse.total > 0) {
    return apiResponse.data
  }

  return
}

export const deleteExistingVideoThumbnails = async (thumb) => {
  const pluginConfig = getPluginConfig()
  const vimeoAccessToken = pluginConfig?.accessToken

  const thumbsetUri = thumb.uri
  if (thumbsetUri) {
    const res = await fetch(`https://api.vimeo.com${thumbsetUri}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${vimeoAccessToken}`,
      },
    })

    if (res.ok && res.status === 204) {
      return {success: true}
    } else {
      throw new Error('Error deleting animated thumbnails: ' + res.statusText)
    }
  } else {
    throw new Error('No thumbset URI provided')
  }
}

export const createSetOfAnimatedThumbnails = async (uri, startTime, duration) => {
  const pluginConfig = getPluginConfig()
  const vimeoAccessToken = pluginConfig?.accessToken

  const res = await fetch(`https://api.vimeo.com${uri}/animated_thumbsets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vimeoAccessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_time: startTime,
      duration,
    }),
  })

  return await res.json()
}
