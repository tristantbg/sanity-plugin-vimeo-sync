export const ps = (type, attempt, action) => {
  switch (type) {
    case 'success':
      if (action === 'delete') {
        return { type, message: 'Animated thumbnails deleted successfully' }
      }
      return { type, message: 'Animated thumbnails generated successfully' }

    case 'already-generated':
      return {
        type,
        message:
          'Animated thumbnails already generated. If you want to regenerate, please delete the existing ones.',
      }

    case 'loading':
    default:
      if (action === 'delete') {
        return { type, message: 'Deleting animated thumbnails...' }
      }
      switch (attempt) {
        case 3:
          return {
            type,
            message:
              "We're still generating animated thumbnails, please wait...",
          }
        case 4:
          return {
            type,
            message:
              "This is taking longer than expected. We'll let you know when it's done. Please don't close the window.",
          }
        case 5:
          return {
            type,
            message:
              "Last attempt, if it doesn't work, please try again later.",
          }
        case 0:
        default:
          return { type, message: 'We are generating animated thumbnails...' }
      }
  }
}
