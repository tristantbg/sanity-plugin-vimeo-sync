import { nanoid } from 'nanoid'

// config.js
let pluginConfig = {}

/**
 * Rate-limit-aware fetch wrapper for the Vimeo API.
 *
 * Key features:
 * - Shared rate-limit gate: concurrent callers wait on the same promise
 *   when the API signals throttling, so 5+ in-flight requests don't all
 *   independently overshoot the limit.
 * - On 429: honours `Retry-After` (seconds or HTTP-date); falls back to
 *   exponential backoff with jitter.
 * - On 5xx / network errors: retries with exponential backoff.
 * - On success: uses `X-RateLimit-Remaining` and `X-RateLimit-Reset` to
 *   schedule a cooldown that all subsequent callers respect.
 *
 * @param {string} url  Full Vimeo API URL
 * @param {RequestInit} options  Standard fetch options
 * @param {number} [maxRetries=6]  Maximum retry attempts
 * @returns {Promise<Response>}
 */

// Shared across all concurrent vimeoFetch calls.
let rateGate = Promise.resolve()

function waitForGate() {
  return rateGate
}

function setGate(ms) {
  if (ms <= 0) return
  const until = Date.now() + ms
  // Chain so later setGate calls extend (not shorten) the wait.
  rateGate = rateGate.then(
    () =>
      new Promise((r) => {
        const remaining = until - Date.now()
        if (remaining > 0) setTimeout(r, remaining)
        else r()
      })
  )
}

function parseRetryAfter(header) {
  if (!header) return null
  const asInt = parseInt(header, 10)
  if (!isNaN(asInt)) return asInt * 1000
  const asDate = Date.parse(header)
  if (!isNaN(asDate)) return Math.max(0, asDate - Date.now())
  return null
}

function backoffDelay(attempt) {
  // 500ms, 1s, 2s, 4s, 8s, capped at 15s, +/- 25% jitter.
  const base = Math.min(15000, 500 * 2 ** attempt)
  const jitter = base * 0.25 * (Math.random() * 2 - 1)
  return Math.round(base + jitter)
}

export async function vimeoFetch(url, options = {}, maxRetries = 6) {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Wait for any active cooldown before firing.
    await waitForGate()

    let res
    try {
      res = await fetch(url, options)
    } catch (err) {
      // Network error — retry with backoff.
      lastError = err
      if (attempt === maxRetries) throw err
      const delay = backoffDelay(attempt)
      console.warn(
        `Vimeo network error (attempt ${attempt + 1}/${maxRetries}): ${err.message}. Retrying in ${Math.round(delay / 1000)}s…`
      )
      setGate(delay)
      continue
    }

    // 429 — honour Retry-After or back off, and block all callers.
    if (res.status === 429) {
      if (attempt === maxRetries) {
        throw new Error('Vimeo API rate limit exceeded after multiple retries.')
      }
      const retryAfter =
        parseRetryAfter(res.headers.get('Retry-After')) ?? backoffDelay(attempt)
      console.warn(
        `Vimeo rate limit hit (attempt ${attempt + 1}/${maxRetries}). Pausing all requests for ${Math.round(retryAfter / 1000)}s…`
      )
      setGate(retryAfter)
      continue
    }

    // 5xx — transient server error, retry with backoff.
    if (res.status >= 500 && res.status < 600) {
      if (attempt === maxRetries) return res
      const delay = backoffDelay(attempt)
      console.warn(
        `Vimeo ${res.status} (attempt ${attempt + 1}/${maxRetries}). Retrying in ${Math.round(delay / 1000)}s…`
      )
      setGate(delay)
      continue
    }

    // Proactive cooldown based on remaining quota + reset window.
    const remaining = parseInt(res.headers.get('X-RateLimit-Remaining'), 10)
    if (!isNaN(remaining) && remaining < 25) {
      const resetMs = parseRetryAfter(res.headers.get('X-RateLimit-Reset'))
      let cooldown
      if (remaining <= 0 && resetMs && resetMs > 0) {
        // Quota fully consumed — wait until the bucket resets.
        cooldown = Math.min(resetMs, 60000)
      } else if (remaining < 5) {
        cooldown = 1500
      } else if (remaining < 15) {
        cooldown = 750
      } else {
        cooldown = 300
      }
      setGate(cooldown)
    }

    return res
  }

  // Should be unreachable, but satisfies all code paths.
  throw lastError || new Error('Vimeo API request failed.')
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
