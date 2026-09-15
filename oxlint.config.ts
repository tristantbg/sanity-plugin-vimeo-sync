import sanityPluginKitOxlint from '@sanity/plugin-kit/oxlint'
import {defineConfig} from 'oxlint'

export default defineConfig({
  extends: [sanityPluginKitOxlint],
  rules: {
    // The sync tool mirrors console output into its log panel
    'no-console': 'off',
    // Vimeo polling, pagination and deletes run sequentially on purpose (rate limits)
    'no-await-in-loop': 'off',
    // Immutable spreads over API data are intentional
    'oxc/no-map-spread': 'off',
  },
})
