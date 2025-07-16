import {nanoid} from 'nanoid'

// config.js
let pluginConfig = {}

export const setPluginConfig = (config) => {
  pluginConfig = {...pluginConfig, ...config}
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
  readOnly = true,
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
