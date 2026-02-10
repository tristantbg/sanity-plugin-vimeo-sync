import { InfoOutlineIcon, SyncIcon } from '@sanity/icons'
import { SettingsView, useSecrets } from '@sanity/studio-secrets'
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Spinner,
  Text,
  Tooltip,
} from '@sanity/ui'
import { useEffect, useState } from 'react'
import { FaVimeoV } from 'react-icons/fa'
import { useSource } from 'sanity'
import { namespace } from '../constants'
import { addKeys, setPluginConfig } from '../helpers'
import { getExistingVideoThumbnails } from '../schema/AnimatedThumbnails/utils'

const pluginConfigKeys = [
  {
    key: 'apiKey',
    title: 'API key',
  },
]

export const VimeoSyncView = (options) => {
  const { secrets, loading } = useSecrets(namespace)
  useEffect(() => {
    if (!secrets?.apiKey && !loading) {
      console.error(
        'Vimeo access token is not set. Open the Vimeo Sync tool and click "Show/Edit Access Token" to configure it.'
      )
    } else if (secrets?.apiKey) {
      setPluginConfig({
        accessToken: secrets.apiKey,
      })
    }
  }, [secrets, loading])

  const { apiKey: vimeoAccessToken } = secrets || {}

  const [showSettings, setShowSettings] = useState(false)
  const [inexistent, setInexistent] = useState([])
  const [videosEntry, setVideosEntry] = useState([])

  const { folderId } = options
  const [count, setCount] = useState(0)
  const [countPages, setCountPages] = useState(0)
  const [currentVideo, setCurrentVideo] = useState(0)
  const [status, setStatus] = useState({ type: 'idle' })

  const { getClient } = useSource()
  const client = getClient({ apiVersion: '2025-02-07' })
  const vimeoFolderId = folderId || process.env.SANITY_STUDIO_VIMEO_FOLDER_ID
  const vimeoFetchUrlParams =
    '?fields=uri,modified_time,created_time,name,description,link,pictures,files,width,height,duration&per_page=100'
  const vimeoFetchUrl = vimeoFolderId
    ? `https://api.vimeo.com/me/projects/${vimeoFolderId}/videos${vimeoFetchUrlParams}`
    : `https://api.vimeo.com/me/videos${vimeoFetchUrlParams}`

  async function importVimeo(url) {
    let nextPage
    let perPage
    let page

    try {
      const res = await fetch(`https://api.vimeo.com${url}`, {
        headers: {
          Authorization: `Bearer ${vimeoAccessToken}`,
        },
      })
      const apiResponse = await res.json()
      nextPage = apiResponse.paging.next
      page = apiResponse.page

      perPage = apiResponse.per_page

      const transaction = client.transaction()
      const videos = apiResponse.data

      // Process videos in parallel batches to speed up sync
      const BATCH_SIZE = 5
      for (let i = 0; i < videos.length; i += BATCH_SIZE) {
        const batch = videos.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(
          batch.map(async (video) => {
            if (!video.files) {
              throw new Error(
                'Missing video files. Ensure your token has the "video_files" scope and your Vimeo account is on a PRO plan or higher.'
              )
            }

            const videoObject = {
              _id: `vimeo-${video.uri.split('/').pop()}`,
              _type: 'vimeo',
              aspectRatio: video.width / video.height,
              uri: video.uri,
              description: video.description || '',
              duration: video.duration,
              height: video.height,
              link: video.link,
              name: video.name,
              pictures: addKeys(video.pictures?.sizes || [], 'link'),
              srcset: addKeys(video.files || [], 'md5'),
              width: video.width,
            }

            const existingThumbnails = await getExistingVideoThumbnails(
              video.uri
            )
            if (existingThumbnails?.length) {
              const itemsWithKeys = existingThumbnails.map((item) => {
                const sizesWithKey = item.sizes.map((size) => ({
                  ...size,
                  _key: `size-${size.width}`,
                }))
                return {
                  ...item,
                  sizes: sizesWithKey,
                  _key: `thumb-${item.clip_uri}`,
                }
              })

              const duration = itemsWithKeys[0]?.sizes[0]?.duration
              const startTime = itemsWithKeys[0]?.sizes[0]?.startTime

              videoObject.animatedThumbnails = {
                thumbnails: itemsWithKeys,
                startTime,
                duration,
              }
            }

            return videoObject
          })
        )

        results.forEach((videoObject) => {
          transaction.createOrReplace(videoObject)
          videosEntry.push(videoObject)
        })

        setCurrentVideo(
          Math.min(i + BATCH_SIZE, videos.length) + (page - 1) * perPage
        )

        // Small delay between batches to respect Vimeo rate limits
        if (i + BATCH_SIZE < videos.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      await transaction.commit()
      if (nextPage) {
        await importVimeo(nextPage)
      } else {
        await deleteIncompatibleVimeoDocuments(videosEntry)
        setStatus({
          type: 'finished',
          message: `Finished syncing ${videosEntry.length} videos at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        })
      }
    } catch (error) {
      console.error('Update failed: ', error.message)

      setStatus({
        type: 'error',
        message: error.message,
      })
    }
  }

  async function deleteIncompatibleVimeoDocuments(videos) {
    setInexistent([])
    const inexistent = []
    const valid_ids = videos.map((v) => v._id)
    const query = '*[_type == "vimeo"] {_id}'
    try {
      const documents = await client.fetch(query)
      let transaction = client.transaction()
      documents.forEach(async (document) => {
        if (!valid_ids.includes(document._id)) {
          transaction.delete(document._id)
          try {
            await transaction.commit()
          } catch (e) {
            inexistent.push(document._id)
          }
        }
      })
      setInexistent(inexistent)
    } catch (error) {
      console.error('Sanity error:', error)
    }
  }

  async function fetchVimeo() {
    setStatus({ type: 'loading' })
    setVideosEntry([])
    try {
      const res = await fetch(vimeoFetchUrl, {
        headers: {
          Authorization: `Bearer ${vimeoAccessToken}`,
        },
      })
      const data = await res.json()
      setCount(data.total)
      setCountPages(Math.ceil(data.total / data.per_page))
      await importVimeo(data.paging.first)
    } catch (error) {
      console.error('Fetch Vimeo failed: ', error.message)
      setStatus({ type: 'error', message: error.message })
      setCurrentVideo(0)
    }
  }

  if (loading) {
    return (
      <Card padding={4} tone="default">
        <Flex align="center" gap={3}>
          <Spinner />
          <Text size={2} weight="medium">
            Loading Vimeo Sync plugin...
          </Text>
        </Flex>
      </Card>
    )
  }
  return (
    <Card
      tone={
        !vimeoAccessToken || status.type === 'error' ? 'critical' : 'default'
      }
      height={'stretch'}
      display={'grid'}
      style={{ minHeight: '100%', gridTemplateRows: '1fr auto' }}
    >
      <Box>
        <Card borderBottom padding={3} tone={'inherit'}>
          <Flex justify={'space-between'} align={'center'}>
            <Flex paddingY={3} align={'center'} gap={3}>
              <FaVimeoV size={20} />
              <Heading as="h1" size={0}>
                Sanity Vimeo Sync
              </Heading>
            </Flex>

            <Flex align={'center'} gap={1}>
              <Button
                fontSize={0}
                mode="bleed"
                onClick={() => setShowSettings(!showSettings)}
                text={
                  showSettings ? 'Hide Access Token' : 'Show/Edit Access Token'
                }
              />
            </Flex>

            {!showSettings ? null : (
              <SettingsView
                title={'Vimeo Sync Settings'}
                namespace={namespace}
                keys={pluginConfigKeys}
                onClose={() => {
                  setShowSettings(false)
                }}
              />
            )}
          </Flex>
        </Card>

        <Flex
          direction={'column'}
          gap={4}
          paddingX={3}
          paddingY={4}
          align={'flex-start'}
        >
          {!vimeoAccessToken && (
            <Flex direction={'column'} gap={4}>
              <Heading as="h3" size={1}>
                Missing Vimeo Access Token
              </Heading>
              <Text>
                No access token found. Click "Show/Edit Access Token" above to
                configure it. Without a valid token, the tool cannot connect to
                your Vimeo account to fetch or sync videos.
              </Text>
              <Text size={0}>
                You can generate an access token from the{' '}
                <a
                  href="https://developer.vimeo.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vimeo Developer Dashboard
                </a>
                . Required scopes: private, create, delete, video_files, public.
              </Text>
            </Flex>
          )}

          <Flex gap={3}>
            {status.type !== 'loading' ? (
              <Button
                icon={SyncIcon}
                mode="ghost"
                text={'Load Vimeo videos'}
                onClick={() => fetchVimeo()}
                disabled={!vimeoAccessToken}
              />
            ) : (
              <Card tone="neutral" padding={3}>
                <Flex align={'center'} gap={3}>
                  <Spinner />
                  <Text size={1} weight="medium">
                    Loading...
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
                  <Text size={1}>Error: {status.message}</Text>
                )}
                {status.type === 'finished' && (
                  <Text size={1}>{status.message}</Text>
                )}
              </Card>
            )}
          </Flex>

          {inexistent?.length > 0 && (
            <Card padding={3} border={true} tone={'caution'}>
              <Flex direction={'column'} gap={3}>
                <Text size={2}>
                  Found {inexistent.length} removed video
                  {inexistent.length > 1 ? 's' : ''} that could not be deleted
                  because {inexistent.length > 1 ? 'they are' : 'it is'} still
                  referenced by other documents:
                </Text>
                {inexistent.map((id) => (
                  <Text key={id} size={1}>
                    {id}
                  </Text>
                ))}
              </Flex>
            </Card>
          )}
        </Flex>

        {status.type === 'loading' && count && currentVideo ? (
          <Card paddingX={3}>
            <Box>
              <Flex direction={'column'} gap={3}>
                {countPages && <Text size={2}>{count} videos found!</Text>}
                <progress value={currentVideo} max={count} />
                <Flex direction={'column'} gap={1}>
                  {count && currentVideo && (
                    <Text size={1}>
                      Processing {currentVideo} of {count}
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Box>
          </Card>
        ) : null}
      </Box>

      <Card as="footer" padding={3} borderTop>
        <Flex justify={'space-between'} align={'center'}>
          <Text size={0}>License MIT © Tristan Bagot + Daniele Polacco</Text>
          <Text>
            <Tooltip
              content={
                <Box padding={1} style={{ maxWidth: '300px' }}>
                  <Flex gap={5} direction={'column'}>
                    <Text muted size={1}>
                      This tool seamlessly integrates your Vimeo account with
                      Sanity by fetching all available videos and importing them
                      into your Sanity project.
                    </Text>
                    <Text muted size={1}>
                      It ensures your content stays up to date by automatically
                      detecting and removing any videos that have been deleted
                      or are no longer accessible in your Vimeo account.
                    </Text>
                    <Text muted size={1}>
                      This helps maintain a clean and accurate video library
                      within Sanity without the need for manual updates.
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
      </Card>
    </Card>
  )
}
