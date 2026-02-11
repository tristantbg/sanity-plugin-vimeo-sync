import { SyncIcon } from '@sanity/icons'
import { Button, Card, Flex, Spinner, Text } from '@sanity/ui'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

export function SyncActions({ status, onSync, disabled }) {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)

  return (
    <Flex gap={3}>
      {status.type !== 'loading' ? (
        <Button
          icon={SyncIcon}
          mode="ghost"
          text={t('sync.button-label')}
          onClick={onSync}
          disabled={disabled}
        />
      ) : (
        <Card tone="neutral" padding={3}>
          <Flex align={'center'} gap={3}>
            <Spinner />
            <Text size={1} weight="medium">
              {t('sync.loading')}
            </Text>
          </Flex>
        </Card>
      )}

      {(status.type === 'finished' || status.type === 'error') && (
        <Card
          padding={3}
          border={true}
          tone={status.type === 'error' ? 'critical' : 'positive'}
        >
          {status.type === 'error' && (
            <Text size={1}>
              {t('sync.error-prefix')}
              {status.message}
            </Text>
          )}
          {status.type === 'finished' && (
            <Text size={1}>{status.message}</Text>
          )}
        </Card>
      )}
    </Flex>
  )
}
