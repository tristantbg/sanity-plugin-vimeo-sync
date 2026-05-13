export const ps = (type, attempt, action) => {
  switch (type) {
    case 'success':
      if (action === 'delete') {
        return { type, message: 'Animated thumbnails deleted.' }
      }
      return { type, message: 'Animated thumbnails generated successfully.' }

    case 'already-generated':
      return {
        type,
        message:
          'Animated thumbnails already exist for this video. Delete them to regenerate.',
      }

    case 'loading':
      if (action === 'delete') {
        return { type: 'loading-delete', message: 'Deleting animated thumbnails…' }
      }
      if (attempt >= 20) {
        return {
          type,
          message:
            "Vimeo is taking longer than usual. We'll keep checking — don't close this tab.",
        }
      }
      if (attempt >= 8) {
        return {
          type,
          message:
            "Still generating — Vimeo's animated thumbnail builds usually take 1–3 minutes.",
        }
      }
      if (attempt >= 1) {
        return {
          type,
          message: 'Waiting for Vimeo to finish encoding the animated preview…',
        }
      }
      return { type, message: 'Requesting animated thumbnails from Vimeo…' }

    default:
      return { type, message: undefined }
  }
}
