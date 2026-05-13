import { getPluginConfig, vimeoFetch } from '../../helpers'

// You can find more info here:
// https://developer.vimeo.com/api/reference/videos/3.4.8#create_animated_thumbset
// Please note that you can't create more than four sets of animated thumbnails for the same video.

function authHeaders() {
  const { accessToken } = getPluginConfig() || {}
  if (!accessToken) {
    throw new Error(
      'Vimeo access token is missing. Set it in the plugin secrets before generating thumbnails.'
    )
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

function extractError(payload, fallback) {
  if (!payload) return fallback
  if (typeof payload === 'string') return payload
  return (
    payload.developer_message ||
    payload.error_code ||
    payload.error ||
    fallback
  )
}

export const getExistingVideoThumbnails = async (uri) => {
  if (!uri) return

  const res = await vimeoFetch(
    `https://api.vimeo.com${uri}/animated_thumbsets`,
    {
      method: 'GET',
      headers: authHeaders(),
    }
  )

  const apiResponse = await res.json()
  if (!res.ok) {
    throw new Error(extractError(apiResponse, `Vimeo error (${res.status})`))
  }

  if (apiResponse.total > 0) {
    return apiResponse.data
  }
  return
}

export const deleteExistingVideoThumbnails = async (thumb) => {
  const thumbsetUri = thumb?.uri
  if (!thumbsetUri) {
    throw new Error('No thumbset URI provided')
  }

  const res = await vimeoFetch(`https://api.vimeo.com${thumbsetUri}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (res.ok && res.status === 204) {
    return { success: true }
  }

  let detail = res.statusText
  try {
    const body = await res.json()
    detail = extractError(body, detail)
  } catch (e) {
    /* response had no JSON body */
  }
  throw new Error(`Couldn't delete animated thumbnails: ${detail}`)
}

export const createSetOfAnimatedThumbnails = async (
  uri,
  startTime,
  duration
) => {
  const res = await vimeoFetch(
    `https://api.vimeo.com${uri}/animated_thumbsets`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_time: startTime,
        duration,
      }),
    }
  )

  const data = await res.json()
  if (!res.ok) {
    throw new Error(extractError(data, `Vimeo error (${res.status})`))
  }
  return data
}
