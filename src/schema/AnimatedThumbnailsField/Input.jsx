// MediaTipInput.tsx
import {Button, Card, TextInput} from '@sanity/ui'

import {useFormValue} from 'sanity'
import {useAnimatedThumbs} from '../../thumbnails'
export function MediaTipInput(props) {
  const {value, members, renderField, renderInput, renderItem} = props
  const documentId = useFormValue(['_id']) // Gets the current document ID
  const videoUri = useFormValue(['uri']) // Gets the current video URI
  const duration = useFormValue(['duration']) // Gets the current video duration
  console.log(documentId)

  const {status, attempt, generateThumbs} = useAnimatedThumbs(videoUri)
  // const documentId = useDocumentId()
  // const values = useDocumentValues(documentId)
  // console.log(documentId)
  // console.log(values)

  // if (attempt == 1) {
  //   setStatus({
  //     type: 'loading',
  //     message: "We're still generating animated thumbnails, please wait...",
  //   })
  // }

  // if (attempt == 2) {
  //   setStatus({
  //     type: 'loading',
  //     message:
  //       "This is taking longer than expected. We'll let you know when it's done. Please don't close the window.",
  //   })
  // }

  // if (attempt == 3) {
  //   setStatus({
  //     type: 'loading',
  //     message: "Last attempt, if it doesn't work, please try again later.",
  //   })
  // }
  return (
    <>
      <Card tone="default">
        <TextInput placeholder="MaxDuration" />
        <Button
          text="Generate animated Thumbnail"
          onClick={async () => await generateThumbs(videoUri)}
        />
        {status.type}
        {attempt}
      </Card>
    </>
  )
}
