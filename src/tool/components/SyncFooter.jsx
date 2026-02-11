import { InfoOutlineIcon } from '@sanity/icons'
import { Box, Flex, Text, Tooltip } from '@sanity/ui'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

export function SyncFooter() {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)

  return (
    <Flex justify={'space-between'} align={'center'}>
      <Text size={0}>{t('tool.footer-license')}</Text>
      <Text>
        <Tooltip
          content={
            <Box padding={1} style={{ maxWidth: '300px' }}>
              <Flex gap={5} direction={'column'}>
                <Text muted size={1}>
                  {t('tool.tooltip-p1')}
                </Text>
                <Text muted size={1}>
                  {t('tool.tooltip-p2')}
                </Text>
                <Text muted size={1}>
                  {t('tool.tooltip-p3')}
                </Text>
              </Flex>
            </Box>
          }
          placement="top"
          portal
        >
          <InfoOutlineIcon />
        </Tooltip>
      </Text>
    </Flex>
  )
}
