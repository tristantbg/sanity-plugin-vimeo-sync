import { SearchIcon } from '@sanity/icons'
import { Box, Card, Flex, Spinner, Stack, Text, TextInput } from '@sanity/ui'
import { useEffect, useMemo, useState } from 'react'
import { Preview, useDocumentStore, useSchema, useTranslation } from 'sanity'
import { IntentLink } from 'sanity/router'
import { vimeoSyncLocaleNamespace } from '../../i18n'

export function VideoList() {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)
  const documentStore = useDocumentStore()
  const schema = useSchema()
  const vimeoType = schema.get('vimeo')

  const [vimeoDocs, setVimeoDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setDocsLoading(true)
    const subscription = documentStore
      .listenQuery(`*[_type == "vimeo"] | order(name asc)`, {}, {})
      .subscribe({
        next: (docs) => {
          setVimeoDocs(docs || [])
          setDocsLoading(false)
        },
        error: (err) => {
          console.error('Failed to fetch vimeo documents:', err)
          setDocsLoading(false)
        },
      })

    return () => subscription.unsubscribe()
  }, [documentStore])

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return vimeoDocs
    const q = searchQuery.toLowerCase()
    return vimeoDocs.filter(
      (doc) =>
        doc.name?.toLowerCase().includes(q) ||
        doc._id?.toLowerCase().includes(q) ||
        doc.link?.toLowerCase().includes(q)
    )
  }, [vimeoDocs, searchQuery])

  const countLabel =
    filteredDocs.length === 1
      ? t('video-list.count_one', { count: filteredDocs.length })
      : t('video-list.count_other', { count: filteredDocs.length })

  return (
    <Flex paddingX={3}>
      <Stack space={3} style={{ width: '100%' }}>
        <Flex align="center" gap={3}>
          <Box style={{ flex: 1 }}>
            <TextInput
              icon={SearchIcon}
              placeholder={t('video-list.search-placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              fontSize={1}
            />
          </Box>
          <Text size={1} muted>
            {countLabel}
          </Text>
        </Flex>

        {docsLoading ? (
          <Flex
            align="center"
            justify="center"
            gap={2}
            paddingY={3}
            style={{ width: '100%' }}
          >
            <Spinner />
            <Text size={1} muted>
              {t('video-list.loading')}
            </Text>
          </Flex>
        ) : filteredDocs.length === 0 ? (
          <Card padding={4} border radius={2} tone="transparent">
            <Text size={1} muted align="center">
              {vimeoDocs.length === 0
                ? t('video-list.empty')
                : t('video-list.no-match')}
            </Text>
          </Card>
        ) : (
          <Stack space={1}>
            {filteredDocs.map((doc) => (
              <Card
                key={doc._id}
                as={IntentLink}
                intent="edit"
                params={{ id: doc._id, type: 'vimeo' }}
                radius={2}
                data-as="a"
                style={{ textDecoration: 'none' }}
              >
                <Preview schemaType={vimeoType} value={doc} layout="default" />
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Flex>
  )
}
