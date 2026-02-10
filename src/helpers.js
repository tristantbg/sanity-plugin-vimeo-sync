import { nanoid } from 'nanoid'

// config.js
let pluginConfig = {}

/**
 * Rate-limit-aware fetch wrapper for the Vimeo API.
 *
 * - On 429 (Too Many Requests): reads the `Retry-After` header and waits
 *   before retrying, up to `maxRetries` attempts.
 * - On success: reads `X-RateLimit-Remaining` and adds a short cooldown
 *   only when the remaining quota is running low.
 *
 * This replaces fixed delays with adaptive throttling — requests go full
 * speed until the API signals it is time to slow down.
 *
 * @param {string} url  Full Vimeo API URL
 * @param {RequestInit} options  Standard fetch options
 * @param {number} [maxRetries=3]  Maximum retry attempts on 429
 * @returns {Promise<Response>}
 */
export async function vimeoFetch(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options)

    // Handle rate-limit responses with retry
    if (res.status === 429) {
      if (attempt === maxRetries) {
        throw new Error('Vimeo API rate limit exceeded after multiple retries.')
      }
      const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10)
      const delay = retryAfter * 1000
      console.warn(
        `Vimeo rate limit hit (attempt ${attempt + 1}/${maxRetries}). Retrying in ${retryAfter}s…`
      )
      await new Promise((r) => setTimeout(r, delay))
      continue
    }

    // Proactively slow down when nearing the rate limit
    const remaining = parseInt(res.headers.get('X-RateLimit-Remaining'), 10)
    if (!isNaN(remaining) && remaining < 10) {
      const cooldown = remaining < 3 ? 1000 : 500
      await new Promise((r) => setTimeout(r, cooldown))
    }

    return res
  }
}

export const setPluginConfig = (config) => {
  pluginConfig = { ...pluginConfig, ...config }
}

export const overridePluginConfig = (config) => {
  pluginConfig = config
}

export const getPluginConfig = () => {
  return pluginConfig
}

/**
 * Shorthand helper for writing Sanity fields
 *
 * @param {string} name Converts to first uppercase letter for title
 * @param {string} type Field type, defaults to 'string'
 * @param {array} arrayOf For 'array' and 'object' type fields, populates the field
 */
export function quickFields(
  name,
  type = 'string',
  arrayOf = [],
  preview = [],
  group = '',
  description,
  readOnly = true
) {
  const field = {
    readOnly,
    name,
    description,
    title: name.charAt(0).toUpperCase() + name.slice(1),
    type,
    group,
  }

  if (arrayOf.length) {
    if (type === 'array') field.of = arrayOf
    if (type === 'object') field.fields = arrayOf
  }

  if (preview.length) {
    if (type === 'object') {
      field.preview = {
        select: {
          title: preview[0] || '',
          subtitle: preview[1] || '',
          media: preview[2] || '',
        },
      }
    }
  }

  return field
}

/**
 * Arrays in Sanity need unique 'keys'
 * This function maps an existing key in the array to '_key'
 *
 * @param {arr} array The array to mutate
 * @param {string} uniqueArrayKey The key in this array to setup as the unique key
 */
export function addKeys(array, uniqueArrayKey) {
  return array.map((item, index) => {
    item._key = nanoid()

    return item
  })
}
