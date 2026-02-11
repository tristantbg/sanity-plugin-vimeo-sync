import { Flex, Heading, Text } from '@sanity/ui'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

export function MissingTokenBanner() {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)

  return (
    <Flex direction={'column'} gap={4}>
      <Heading as="h3" size={1}>
        {t('missing-token.heading')}
      </Heading>
      <Text>
        {t('missing-token.body')}
      </Text>
      <Text size={0}>
        {t('missing-token.help-prefix')}
        <a
          href="https://developer.vimeo.com/apps"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('missing-token.help-link')}
        </a>
        {t('missing-token.help-suffix')}
      </Text>
    </Flex>
  )
}
