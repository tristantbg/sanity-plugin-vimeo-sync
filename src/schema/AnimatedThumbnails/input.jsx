import {GenerateIcon} from '@sanity/icons'
import {useSecrets} from '@sanity/studio-secrets'
import {Button, Card, Flex, Grid, Spinner, Text} from '@sanity/ui'
import {useEffect} from 'react'
import {MemberField, set, useClient, useFormValue} from 'sanity'
import {namespace} from '../../constants'
import {setPluginConfig} from '../../helpers'
import {useAnimatedThumbs} from './hooks'

export function input(props) {
  const {
    value,
    members,
    renderField,
    renderInput,
    renderItem,
    onChange,
    renderPreview,
    renderDefault,
  } = props

  const {secrets, loading} = useSecrets(namespace)

  useEffect(() => {
    if (!secrets?.apiKey && !loading) {
      console.error('Vimeo access token is not set. Please set it in the Studio Secrets.')
    } else if (secrets?.apiKey) {
      setPluginConfig({
        accessToken: secrets.apiKey,
      })
    }
  }, [secrets, loading])

  const videoUri = useFormValue(['uri'])
  const documentId = useFormValue(['_id'])
  const client = useClient({apiVersion: '1'})
  const thumbnails = useFormValue(['animatedThumbnails'])

  const {status, items, generateThumbs, deleteThumbs} = useAnimatedThumbs(videoUri, thumbnails)

  const startTimeMember = members.find(
    (member) => member.kind === 'field' && member.name === 'startTime',
  )
  const durationMember = members.find(
    (member) => member.kind === 'field' && member.name === 'duration',
  )

  const handleGenerate = async () => {
    onChange([set([], ['thumbnails'])])

    const generatedItems = await generateThumbs(
      startTimeMember?.field?.value || 0,
      durationMember?.field?.value || 6,
    )

    const itemsWithKeys = generatedItems.map((item) => {
      const sizesWithKey = item.sizes.map((size) => ({...size, _key: `size-${size.width}`}))
      return {...item, sizes: sizesWithKey, _key: `thumb-${item.clip_uri}`}
    })

    const duration = itemsWithKeys[0]?.sizes[0]?.duration
    const startTime = itemsWithKeys[0]?.sizes[0]?.startTime
    onChange([
      set(itemsWithKeys, ['thumbnails']),
      set(duration, ['duration']),
      set(startTime, ['startTime']),
    ])
  }

  const handleDelete = async () => {
    await deleteThumbs()
    onChange([set([], ['thumbnails'])])
  }

  const renderButton = () => {
    switch (status.type) {
      case 'loading':
      case 'loading-delete':
        return (
          <Card tone="neutral" padding={3}>
            <Flex align={'center'} gap={3}>
              <Spinner />
              <Text size={1} weight="medium">
                Processing...
              </Text>
            </Flex>
          </Card>
        )
      case 'success':
      case 'already-generated':
        return (
          <Button
            icon={GenerateIcon}
            tone="critical"
            text="Delete existing Thumbnails"
            onClick={handleDelete}
            disabled={status.type === 'loading'}
          />
        )
      default:
        const isInvalid =
          startTimeMember?.field?.validation?.length > 0 ||
          durationMember?.field?.validation?.length > 0

        return (
          <Button
            icon={GenerateIcon}
            text="Generate animated Thumbnails"
            onClick={handleGenerate}
            disabled={status.type === 'loading' || status.type === 'error' || isInvalid}
          />
        )
    }
  }

  if (loading) {
    return (
      <Card padding={3} tone="caution">
        <Flex align={'center'} gap={3}>
          <Spinner />
          <Text size={1} weight="medium">
            Loading...
          </Text>
        </Flex>
      </Card>
    )
  }
  return (
    <>
      <Card>
        <Grid columns={2} gap={3} paddingBottom={3}>
          {startTimeMember && (
            <MemberField
              member={startTimeMember}
              renderInput={renderInput}
              renderField={renderField}
              renderItem={renderItem}
            />
          )}
          {durationMember && (
            <MemberField
              member={durationMember}
              renderInput={renderInput}
              renderField={renderField}
              renderItem={renderItem}
            />
          )}
        </Grid>
        <Flex align={'center'} wrap gap={3} paddingBottom={3}>
          {renderButton()}
        </Flex>

        {status.message && (
          <Card
            padding={3}
            tone={
              status.type === 'error'
                ? 'critical'
                : status.type === 'already-generated'
                  ? 'caution'
                  : status.type === 'success'
                    ? 'positive'
                    : 'neutral'
            }
          >
            <Text size={1}>{status.message}</Text>
          </Card>
        )}
      </Card>

      <Card marginTop={3}>
        {members.map((member) => {
          return (
            member.kind === 'field' &&
            !['startTime', 'duration'].includes(member.name) && (
              <MemberField
                key={member.name}
                member={member}
                renderInput={renderInput}
                renderField={renderField}
                renderItem={renderItem}
                renderPreview={renderPreview}
              />
            )
          )
        })}
      </Card>
    </>
  )
}
