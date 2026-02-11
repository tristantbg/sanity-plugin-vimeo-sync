import { Box, Card, Flex, Text } from '@sanity/ui'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

export function SyncProgress({ count, countPages, currentVideo }) {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)

  return (
    <Card paddingX={3}>
      <Box>
        <Flex direction={'column'} gap={3}>
          {countPages && (
            <Text size={2}>{t('sync.videos-found', { count })}</Text>
          )}
          <progress value={currentVideo} max={count} />
          <Flex direction={'column'} gap={1}>
            {count && currentVideo && (
              <Text size={1}>
                {t('sync.progress', { current: currentVideo, total: count })}
              </Text>
            )}
          </Flex>
        </Flex>
      </Box>
    </Card>
  )
}
