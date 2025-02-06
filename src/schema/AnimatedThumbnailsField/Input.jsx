// MediaTipInput.tsx
import {Button, Card, TextInput} from '@sanity/ui'

import {useFormValue} from 'sanity'
import {generateVideoAnimatedThumbnails} from '../../thumbnails'
export function MediaTipInput(props) {
  const {value, members, renderField, renderInput, renderItem} = props
  const documentId = useFormValue(['_id']) // Gets the current document ID
  const videoUri = useFormValue(['uri']) // Gets the current video URI
  const duration = useFormValue(['duration']) // Gets the current video duration
  console.log(documentId)

  // const documentId = useDocumentId()
  // const values = useDocumentValues(documentId)
  // console.log(documentId)
  // console.log(values)

  const generateThumbs = async () => {
    await generateVideoAnimatedThumbnails(videoUri)
  }
  return (
    <>
      <Card tone="default">
        <TextInput placeholder="MaxDuration" />
        <Button
          text="Generate animated Thumbnail"
          onClick={() => generateThumbs(videoUri)}
        ></Button>
      </Card>
    </>
  )
}
