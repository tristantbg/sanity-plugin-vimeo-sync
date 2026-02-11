import { SearchIcon } from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'sanity'
import { vimeoSyncLocaleNamespace } from '../../i18n'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function VideoList({ client }) {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)
  const [vimeoDocs, setVimeoDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchVimeoDocs = useCallback(async () => {
    setDocsLoading(true)
    try {
      const docs = await client.fetch(
        `*[_type == "vimeo"] | order(name asc) {
          _id,
          name,
          link,
          duration,
          width,
          height,
          "thumbnail": pictures[1].link
        }`
      )
      setVimeoDocs(docs || [])
    } catch (err) {
      console.error('Failed to fetch vimeo documents:', err)
    } finally {
      setDocsLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchVimeoDocs()
  }, [fetchVimeoDocs])

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
    <Stack borderTop space={3} style={{ width: '100%' }}>
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
        <Flex align="center" gap={2} paddingY={3}>
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
        <Stack
          space={0}
          style={{
            maxHeight: '480px',
            overflowY: 'auto',
            borderRadius: '3px',
          }}
        >
          {filteredDocs.map((doc) => (
            <Card
              key={doc._id}
              border
              padding={2}
              radius={0}
              style={{ marginTop: '-1px' }}
            >
              <Flex align="center" gap={3}>
                {doc.thumbnail ? (
                  <img
                    src={doc.thumbnail}
                    alt={doc.name || ''}
                    style={{
                      width: '80px',
                      height: '45px',
                      objectFit: 'cover',
                      borderRadius: '3px',
                      display: 'block',
                      flexShrink: 0,
                      background: '#000',
                    }}
                  />
                ) : (
                  <Box
                    style={{
                      width: '80px',
                      height: '45px',
                      borderRadius: '3px',
                      background: '#1a1a1a',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Stack space={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    size={1}
                    weight="medium"
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {doc.name || t('video-list.untitled')}
                  </Text>
                  <Flex align="center" gap={3}>
                    {doc.duration != null && (
                      <Text size={0} muted>
                        {formatDuration(doc.duration)}
                      </Text>
                    )}
                    {doc.width && doc.height && (
                      <Text size={0} muted>
                        {doc.width}×{doc.height}
                      </Text>
                    )}
                  </Flex>
                </Stack>
                {doc.link && (
                  <Button
                    as="a"
                    href={doc.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    mode="ghost"
                    fontSize={0}
                    padding={2}
                    text={t('video-list.open')}
                  />
                )}
              </Flex>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
