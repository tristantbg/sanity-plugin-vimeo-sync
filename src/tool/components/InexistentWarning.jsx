import { Card, Flex, Text } from '@sanity/ui'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

export function InexistentWarning({ inexistent }) {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)

  if (!inexistent?.length) return null

  const messageKey =
    inexistent.length === 1
      ? 'inexistent.message_one'
      : 'inexistent.message_other'

  return (
    <Card padding={3} border={true} tone={'caution'}>
      <Flex direction={'column'} gap={3}>
        <Text size={2}>
          {t(messageKey, { count: inexistent.length })}
        </Text>
        {inexistent.map((id) => (
          <Text key={id} size={1}>
            {id}
          </Text>
        ))}
      </Flex>
    </Card>
  )
}
