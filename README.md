# sanity-plugin-vimeo-sync
Sync Vimeo PRO videos into Sanity

## Usage
Assuming you already have a functional Dashboard in your Sanity Content Studio.

1. Install this widget in your Studio folder like so:

```
sanity install sanity-plugin-vimeo-sync
```

There are some options required:

```js
import { vimeoSync } from 'sanity-plugin-vimeo-sync'

export default defineConfig({
  plugins: [
    vimeoSync(),
  ]
})

```

.env.development
.env.production

```
SANITY_STUDIO_VIMEO_ACCESS_TOKEN=xxx
SANITY_STUDIO_VIMEO_FOLDER_ID=xxx
```

⚠️ Environment variables will be bundled with the application code