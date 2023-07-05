# sanity-plugin-vimeo-sync
Sync Vimeo PRO videos into Sanity



## Usage
Assuming you already have a functional Dashboard in your Sanity Content Studio.

1. Install this widget in your Studio folder like so:

```
sanity install sanity-plugin-vimeo-sync
```

2. Update your `src/dashboardConfig.js` file by adding `{name: 'vimeo-sync'}` to the `widgets` array
3. Restart your Studio


There are some options required:

```js
{
  name: 'vimeo-sync',
  options: {
    accessToken: 'xxx',
    folderId: 'xxx' // optional
  }
}
```
