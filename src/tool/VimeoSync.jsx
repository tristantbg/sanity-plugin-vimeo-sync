import {InfoOutlineIcon} from '@sanity/icons'
import {useSecrets} from '@sanity/studio-secrets'
import {Box, Button, Card, Flex, Heading, Spinner, Text, Tooltip} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {FaVimeoV} from 'react-icons/fa'
import {MdSync} from 'react-icons/md'
import {useClient} from 'sanity'
import {addKeys} from '../helpers'
import {getExistingVideoThumbnails} from '../schema/AnimatedThumbnails/utils'

const namespace = 'vs-plgugin'

const pluginConfigKeys = [
  {
    key: 'apiKey',
    title: 'Your secret API key',
  },
]

export const VimeoSyncView = (options) => {
  const {secrets} = useSecrets(namespace)
  const [showSettings, setShowSettings] = useState(false)
  const [inexistent, setInexistent] = useState([])
  const [videosEntry, setVideosEntry] = useState([])
  useEffect(() => {
    if (!secrets) {
      setShowSettings(true)
    }
  }, [secrets])

  const {accessToken, folderId} = options
  const [count, setCount] = useState(0)
  const [countPages, setCountPages] = useState(0)
  const [currentVideo, setCurrentVideo] = useState(0)
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [status, setStatus] = useState({type: 'idle'})

  const client = useClient({apiVersion: '2023-05-03'})
  const vimeoAccessToken = accessToken || process.env.SANITY_STUDIO_VIMEO_ACCESS_TOKEN
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

      for (let [index, video] of videos?.entries?.()) {
        // every page can have at least 100 results
        setCurrentVideo(index + 1 + (page - 1) * perPage)
        if (video.files) {
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
          const existingThumbnails = await getExistingVideoThumbnails(video.uri)
          if (existingThumbnails?.length) {
            const itemsWithKeys = existingThumbnails.map((item) => {
              const sizesWithKey = item.sizes.map((size) => ({...size, _key: `size-${size.width}`}))
              return {...item, sizes: sizesWithKey, _key: `thumb-${item.clip_uri}`}
            })

            const duration = itemsWithKeys[0]?.sizes[0]?.duration
            const startTime = itemsWithKeys[0]?.sizes[0]?.startTime

            videoObject.animatedThumbnails = {
              thumbnails: itemsWithKeys,
              startTime,
              duration,
            }
          }

          transaction.createOrReplace(videoObject)
          videosEntry.push(videoObject)
          // @tristan: 300ms delay to prevent 429 error
          await new Promise((resolve) => setTimeout(resolve, 300))
        } else {
          throw new Error(
            'This token doesn’t have the "files" scope or this account is not a PRO account',
          )
        }
      }

      await transaction.commit()
      if (nextPage) {
        await importVimeo(nextPage)
      } else {
        await deleteIncompatibleVimeoDocuments(videosEntry)
        setStatus({
          type: 'finished',
          message: `Finished syncing ${videosEntry.length} videos at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`,
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
    setStatus({type: 'loading'})
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
      setStatus({type: 'error', message: error.message})
      setCurrentVideo(0)
    }
  }

  return (
    <Card
      tone={!vimeoAccessToken || status.type === 'error' ? 'critical' : 'default'}
      height={'stretch'}
      display={'grid'}
      style={{minHeight: '100%', gridTemplateRows: '1fr auto'}}
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

            {/* {vimeoAccessToken && (
              <Flex align={'center'} gap={1}>
                <Button
                  fontSize={0}
                  mode="bleed"
                  onClick={() => setShowAccessToken(!showAccessToken)}
                  text={showAccessToken ? 'Hide Access Token' : 'Show Access Token'}
                />
                <Card
                  display={'inline-block'}
                  tone={!showAccessToken ? 'neutral' : 'critical'}
                  padding={3}
                  radius={2}
                >
                  <Text size={0} weight="bold">
                    {showAccessToken ? vimeoAccessToken : vimeoAccessToken.replace(/./g, '•')}
                  </Text>
                </Card>
              </Flex>
            )} */}

            {/* {!showSettings ? null : (
              <SettingsView
                title={'Alert'}
                namespace={namespace}
                keys={pluginConfigKeys}
                onClose={() => {
                  setShowSettings(false)
                }}
              />
            )} */}
          </Flex>
        </Card>

        <Flex direction={'column'} gap={4} paddingX={3} paddingY={4} align={'flex-start'}>
          {!vimeoAccessToken && (
            <Flex direction={'column'} gap={4}>
              <Heading as="h3" size={1}>
                Error: Missing Vimeo Access Token
              </Heading>
              <Text>
                No access token found. Please check your .env file to ensure the token is correctly
                set or review your VimeoSync configuration in the Sanity settings. Without a valid
                token, the tool cannot connect to your Vimeo account to fetch or sync videos.
              </Text>
              <Text size={0}>
                Missing your Vimeo Access Token? You can find it in your Vimeo account settings
                under
              </Text>
            </Flex>
          )}

          <Flex gap={3}>
            {status.type !== 'loading' ? (
              <Button
                icon={MdSync}
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
                {status.type === 'error' && <Text size={1}>Error: {status.message}</Text>}
                {status.type === 'finished' && <Text size={1}>{status.message}</Text>}
              </Card>
            )}
          </Flex>

          {inexistent?.length > 0 && (
            <Card padding={3} border={true} tone={'caution'}>
              <Flex direction={'column'} gap={3}>
                <Text size={2}>
                  Found {inexistent.length} inexisting video{inexistent.length > 1 ? 's' : ''} that
                  can't be deleted because they are referenced in other documents:
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
                <Box padding={1} style={{maxWidth: '300px'}}>
                  <Flex gap={5} direction={'column'}>
                    <Text muted size={1}>
                      This tool seamlessly integrates your Vimeo account with Sanity by fetching all
                      available videos and importing them into your Sanity project.
                    </Text>
                    <Text muted size={1}>
                      It ensures your content stays up to date by automatically detecting and
                      removing any videos that have been deleted or are no longer accessible in your
                      Vimeo account.
                    </Text>
                    <Text muted size={1}>
                      This helps maintain a clean and accurate video library within Sanity without
                      the need for manual updates.
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
