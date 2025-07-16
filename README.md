# sanity-plugin-vimeo-sync

> This is a **Sanity Studio v3** plugin.

## Installation

```sh
npm install sanity-plugin-vimeo-sync
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {vimeoSync} from 'sanity-plugin-vimeo-sync'

export default defineConfig({
  //...
  plugins: [
    vimeoSync({
      folderId: '', // optional
    }),
  ],
})
```

Then set the Vimeo access token with `private create delete video_files public` scopes inside the Sanity plug-in page.

## License

[MIT](LICENSE) © Tristan Bagot

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.
