import { SyncIcon } from '@sanity/icons'
import { SettingsView, useSecrets } from '@sanity/studio-secrets'
import { Button, Flex, Heading } from '@sanity/ui'
import { useState } from 'react'
import { FaVimeoV } from 'react-icons/fa'
import { useTranslation } from 'sanity'
import { namespace } from '../../constants'
import { vimeoSyncLocaleNamespace } from '../../i18n'

const pluginConfigKeys = [
  {
    key: 'apiKey',
    title: 'API key',
  },
]

export function SyncHeader() {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <Flex justify={'space-between'} align={'center'}>
      <Flex paddingY={3} align={'center'} gap={3}>
        <FaVimeoV size={20} />
        <Heading as="h1" size={0}>
          {t('tool.title')}
        </Heading>
      </Flex>

      <Flex align={'center'} gap={1}>
        <Button
          fontSize={0}
          mode="bleed"
          onClick={() => setShowSettings(!showSettings)}
          text={
            showSettings ? t('settings.hide-token') : t('settings.show-token')
          }
        />
      </Flex>

      {showSettings && (
        <SettingsView
          title={t('settings.title')}
          namespace={namespace}
          keys={pluginConfigKeys}
          onClose={() => {
            setShowSettings(false)
          }}
        />
      )}
    </Flex>
  )
}
