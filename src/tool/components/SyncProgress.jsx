import { Box, Card, Flex, Text } from '@sanity/ui'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

export function SyncProgress({ count, countPages, currentVideo }) {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)

  return (
    <Card paddingX={3} paddingBottom={3}>
      <Card
        padding={3}
        tone="transparent"
        border
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <Flex direction={'column'} gap={3}>
          {countPages && (
            <Text size={1}>{t('sync.videos-found', { count })}</Text>
          )}
          <div
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--card-border-color)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(currentVideo / count) * 100}%`,
                height: '100%',
                borderRadius: '2px',
                backgroundColor: 'var(--card-focus-ring-color)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {count && currentVideo && (
            <Text size={1}>
              {t('sync.progress', { current: currentVideo, total: count })}
            </Text>
          )}
        </Flex>
      </Card>
    </Card>
  )
}
