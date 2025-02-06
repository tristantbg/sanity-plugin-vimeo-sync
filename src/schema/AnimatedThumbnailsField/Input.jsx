// MediaTipInput.tsx
import {Card, Flex, Grid, Text} from '@sanity/ui'
import {MemberField} from 'sanity'

export function MediaTipInput(props) {
  const {value, members, renderField, renderInput, renderItem} = props

  // find "mediaTitle" member
  const mediaTitleMember = members.find(
    (member) => member.kind === 'field' && member.name === 'mediaTitle',
  )
  // find "mediaType" member
  const mediaTypeMember = members.find(
    (member) => member.kind === 'field' && member.name === 'mediaType',
  )

  return (
    <>
      <Grid columns={2} gap={3}>
        {mediaTypeMember && (
          <MemberField
            member={mediaTypeMember}
            renderInput={renderInput}
            renderField={renderField}
            renderItem={renderItem}
          />
        )}
        {/* Only show the title input if media type is set */}
        {value?.mediaType ? (
          <MemberField
            member={mediaTitleMember}
            renderInput={renderInput}
            renderField={renderField}
            renderItem={renderItem}
          />
        ) : (
          <Card tone="caution" radius={4}>
            <Flex height="fill" direction="column" justify="center" align="center">
              <Text>Select media type first</Text>
            </Flex>
          </Card>
        )}
      </Grid>
    </>
  )
}
