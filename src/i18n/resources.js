/**
 * Default (en-US) locale strings for sanity-plugin-vimeo-sync.
 *
 * Keys follow the pattern: area.element-name
 * Values support i18next interpolation: {{variable}}
 */
const vimeoSyncLocaleStrings = {
  /* -------------------------------------------------- */
  /*  Plugin / tool chrome                              */
  /* -------------------------------------------------- */

  /** Tool title shown in the sidebar */
  'tool.title': 'Sanity Vimeo Sync',

  /** Loading state when the plugin initialises */
  'tool.loading': 'Loading Vimeo Sync plugin...',

  /** Footer license notice */
  'tool.footer-license': 'License MIT © Tristan Bagot + Daniele Polacco',

  /** Tooltip – paragraph 1 */
  'tool.tooltip-p1':
    'This tool seamlessly integrates your Vimeo account with Sanity by fetching all available videos and importing them into your Sanity project.',

  /** Tooltip – paragraph 2 */
  'tool.tooltip-p2':
    'It ensures your content stays up to date by automatically detecting and removing any videos that have been deleted or are no longer accessible in your Vimeo account.',

  /** Tooltip – paragraph 3 */
  'tool.tooltip-p3':
    'This helps maintain a clean and accurate video library within Sanity without the need for manual updates.',

  /* -------------------------------------------------- */
  /*  Settings / access-token                           */
  /* -------------------------------------------------- */

  /** Settings dialog title */
  'settings.title': 'Vimeo Sync Settings',

  /** Button to reveal the token field */
  'settings.show-token': 'Show/Edit Access Token',

  /** Button to hide the token field */
  'settings.hide-token': 'Hide Access Token',

  /* -------------------------------------------------- */
  /*  Missing token banner                              */
  /* -------------------------------------------------- */

  /** Heading when no token is configured */
  'missing-token.heading': 'Missing Vimeo Access Token',

  /** Body text when no token is configured */
  'missing-token.body':
    'No access token found. Click "Show/Edit Access Token" above to configure it. Without a valid token, the tool cannot connect to your Vimeo account to fetch or sync videos.',

  /** Helper text with link to Vimeo dashboard */
  'missing-token.help-prefix': 'You can generate an access token from the ',

  /** Link label inside the helper text */
  'missing-token.help-link': 'Vimeo Developer Dashboard',

  /** Suffix after the link */
  'missing-token.help-suffix':
    '. Required scopes: private, create, delete, video_files, public.',

  /* -------------------------------------------------- */
  /*  Sync actions                                      */
  /* -------------------------------------------------- */

  /** Label on the sync button */
  'sync.button-label': 'Load Vimeo videos',

  /** Shown while syncing */
  'sync.loading': 'Loading...',

  /** Shown when the count of videos is known. {{count}} = total */
  'sync.videos-found': '{{count}} videos found!',

  /** Progress indicator. {{current}} / {{total}} */
  'sync.progress': 'Processing {{current}} of {{total}}',

  /** Sync complete message. {{count}} = number synced, {{time}} = timestamp */
  'sync.finished':
    'Finished syncing {{count}} videos at {{time}}',

  /** Generic error prefix */
  'sync.error-prefix': 'Error: ',

  /** Error when video files are missing from the API response */
  'sync.error-missing-files':
    'Missing video files. Ensure your token has the "video_files" scope and your Vimeo account is on a PRO plan or higher.',

  /* -------------------------------------------------- */
  /*  Inexistent / orphaned documents warning           */
  /* -------------------------------------------------- */

  /** Singular form */
  'inexistent.message_one':
    'Found {{count}} removed video that could not be deleted because it is still referenced by other documents:',

  /** Plural form */
  'inexistent.message_other':
    'Found {{count}} removed videos that could not be deleted because they are still referenced by other documents:',

  /* -------------------------------------------------- */
  /*  Video document list                               */
  /* -------------------------------------------------- */

  /** Search placeholder */
  'video-list.search-placeholder': 'Search videos…',

  /** Video count label – singular */
  'video-list.count_one': '{{count}} video',

  /** Video count label – plural */
  'video-list.count_other': '{{count}} videos',

  /** Shown while loading documents from Sanity */
  'video-list.loading': 'Loading documents…',

  /** Empty state – no documents at all */
  'video-list.empty':
    'No videos synced yet. Click "Load Vimeo videos" to import.',

  /** Empty state – search yielded no results */
  'video-list.no-match': 'No videos match your search.',

  /** Fallback title for untitled videos */
  'video-list.untitled': 'Untitled',

  /** Open link button */
  'video-list.open': 'Open',

  /* -------------------------------------------------- */
  /*  Video input (reference field)                     */
  /* -------------------------------------------------- */

  /** Loading state in the video preview */
  'video-input.loading': 'Loading video preview…',

  /** Error loading referenced video */
  'video-input.error': 'Error loading video: {{message}}',

  /** Thumbnail alt text fallback */
  'video-input.thumbnail-alt': 'Video thumbnail',

  /** Button to open the video on Vimeo */
  'video-input.open-on-vimeo': 'Open on Vimeo',
}

export default vimeoSyncLocaleStrings
