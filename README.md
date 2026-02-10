# sanity-plugin-vimeo-sync

> This is a **Sanity Studio v3** plugin.

Syncs your Vimeo video library into Sanity as structured documents. It fetches all videos (including files, metadata, and thumbnails) from your Vimeo account and creates or updates `vimeo` documents in your dataset. Videos removed from Vimeo are automatically cleaned up.

## Requirements

- **Vimeo PRO** (or higher) account — the plugin requires access to video files, which is only available on paid Vimeo plans.
- **Vimeo API access token** with the following scopes: `private`, `create`, `delete`, `video_files`, `public`.

You can generate an access token from the [Vimeo Developer Dashboard](https://developer.vimeo.com/apps).

## Installation

```sh
npm install sanity-plugin-vimeo-sync
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import { defineConfig } from 'sanity'
import { vimeoSync } from 'sanity-plugin-vimeo-sync'

export default defineConfig({
  // ...
  plugins: [
    vimeoSync({
      // Optional: restrict sync to a specific Vimeo folder/project.
      // Can also be set via the SANITY_STUDIO_VIMEO_FOLDER_ID env variable.
      folderId: '',
    }),
  ],
})
```

### Setting the Vimeo Access Token

The access token is stored securely using [@sanity/studio-secrets](https://github.com/sanity-io/sanity-studio-secrets).

1. Open your Sanity Studio.
2. Navigate to the **Vimeo Sync** tool in the Studio sidebar.
3. Click **Show/Edit Access Token** and paste your Vimeo API access token.

The token is saved per-dataset and is not committed to your codebase.

### Syncing videos

Once the access token is configured, click **Load Vimeo videos** in the Vimeo Sync tool. The plugin will:

1. Fetch all videos from your Vimeo account (or from a specific folder if `folderId` is set).
2. Create or update a `vimeo` document for each video in your Sanity dataset.
3. Remove any `vimeo` documents that no longer exist in your Vimeo account.

### Restricting to a Vimeo folder

If you only want to sync videos from a specific Vimeo folder (project), pass its ID via the plugin config:

```ts
vimeoSync({ folderId: '12345678' })
```

Or set the `SANITY_STUDIO_VIMEO_FOLDER_ID` environment variable in your Studio's `.env` file:

```env
SANITY_STUDIO_VIMEO_FOLDER_ID=12345678
```

You can find the folder ID in the URL when viewing a folder on vimeo.com (e.g. `https://vimeo.com/manage/folders/12345678`).

## Document schema

The plugin registers a `vimeo` document type with the following fields:

| Field                | Type   | Description                              |
| -------------------- | ------ | ---------------------------------------- |
| `name`               | string | Video title                              |
| `link`               | url    | Vimeo video URL                          |
| `description`        | text   | Video description                        |
| `uri`                | string | Vimeo API URI (e.g. `/videos/123456`)    |
| `duration`           | number | Duration in seconds                      |
| `width`              | number | Original width in pixels                 |
| `height`             | number | Original height in pixels                |
| `aspectRatio`        | number | Computed aspect ratio (`width / height`) |
| `srcset`             | array  | Available video source files             |
| `pictures`           | array  | Available thumbnail sizes                |
| `animatedThumbnails` | object | Animated thumbnail GIFs (see below)      |

### Animated thumbnails

The plugin supports generating animated thumbnail GIFs via the Vimeo API. In the Studio, open any synced `vimeo` document and use the **Animated Thumbnails** field to configure a start time and duration (max 6 seconds). Note: Vimeo limits each video to 4 animated thumbnail sets.

## Querying synced videos

Use GROQ to query synced videos in your front-end:

```groq
// Fetch all synced videos
*[_type == "vimeo"] {
  name,
  link,
  duration,
  aspectRatio,
  "thumbnail": pictures[2].link,
  "sources": srcset[] { link, width, height }
}
```

To reference a Vimeo video from another document, use the `vimeo.video` type provided by the plugin:

```ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'myDocument',
  type: 'document',
  fields: [
    defineField({
      name: 'video',
      title: 'Video',
      type: 'vimeo.video',
    }),
  ],
})
```

`vimeo.video` is a reference type that points to the `vimeo` document type. It includes:

- A **video player preview** — click the thumbnail to play the video inline in the Studio.
- **Video metadata** — title, duration, and resolution displayed below the player.
- A **link to Vimeo** — open the video directly on vimeo.com.
- **Thumbnail preview** — shown in document lists and reference previews.

To query a `vimeo.video` field, dereference it directly:

```groq
*[_type == "myDocument"] {
  video-> {
    name,
    link,
    duration,
    aspectRatio,
    "thumbnail": pictures[2].link,
    "sources": srcset[] { link, width, height }
  }
}
```

## License

[MIT](LICENSE) © Tristan Bagot

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.
