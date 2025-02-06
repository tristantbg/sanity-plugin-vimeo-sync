import {InfoOutlineIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Heading, Spinner, Text, Tooltip} from '@sanity/ui'
import {useState} from 'react'
import {FaVimeoV} from 'react-icons/fa'
import {MdSync} from 'react-icons/md'
import {useClient} from 'sanity'
import {addKeys} from '../helpers'

// @todo add status ( error, finished, last sync, etc )

export const VimeoSyncView = ({accessToken, folderId}) => {
  const [count, setCount] = useState(false)
  const [countPages, setCountPages] = useState(false)
  const [doingMessage, setDoingMessage] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAccessToken, setShowAccessToken] = useState(false)

  const client = useClient({apiVersion: '2023-05-03'})
  const vimeoAccessToken = accessToken || process.env.SANITY_STUDIO_VIMEO_ACCESS_TOKEN
  const vimeoFolderId = folderId || process.env.SANITY_STUDIO_VIMEO_FOLDER_ID
  const vimeoFetchUrlParams =
    '?fields=uri,modified_time,created_time,name,description,link,pictures,files,width,height,duration&per_page=100'
  const vimeoFetchUrl = vimeoFolderId
    ? `https://api.vimeo.com/me/projects/${vimeoFolderId}/videos${vimeoFetchUrlParams}`
    : `https://api.vimeo.com/me/videos${vimeoFetchUrlParams}`

  async function importVimeo(url) {
    let currentPage
    let nextPage
    let perPage
    const videosEntry = []

    try {
      const res = await fetch(`https://api.vimeo.com${url}`, {
        headers: {
          Authorization: `Bearer ${vimeoAccessToken}`,
        },
      })
      const apiResponse = await res.json()
      nextPage = apiResponse.paging.next
      currentPage = apiResponse.page
      perPage = apiResponse.per_page

      setDoingMessage(
        `Importing Page ${apiResponse.page} of ${Math.ceil(apiResponse.total / apiResponse.per_page)}…`,
      )
      const transaction = client.transaction()
      const videos = apiResponse.data

      for (let [index, video] of videos?.entries?.()) {
        // every page can have at least 100 results
        setCurrentVideo(index + 1 + (currentPage - 1) * perPage)
        if (video.files) {
          const videoObject = {
            _id: `vimeo-${video.uri.split('/').pop()}`,
            _type: 'vimeo',
            aspectRatio: video.width / video.height,
            description: video.description || '',
            duration: video.duration,
            height: video.height,
            link: video.link,
            name: video.name,
            pictures: addKeys(video.pictures.sizes, 'link'),
            srcset: addKeys(video.files, 'md5'),
            width: video.width,
          }
          // await generateVideoAnimatedThumbnails(video)
          // @todo: generate animated thumbnails inside the schema
          transaction.createOrReplace(videoObject)
          videosEntry.push(videoObject)
          await new Promise((resolve) => setTimeout(resolve, 30))
        } else {
          setDoingMessage(
            `This token doesn’t have the "files" scope or this account is not a PRO account`,
          )
          throw new Error(
            'This token doesn’t have the "files" scope or this account is not a PRO account',
          )
        }
      }

      await transaction.commit()
      if (nextPage) {
        await importVimeo(nextPage)
      } else {
        setDoingMessage(`Finished`)
        await deleteIncompatibleVimeoDocuments(videosEntry)
      }
    } catch (error) {
      console.error('Update failed: ', error.message)
    }
  }

  async function deleteIncompatibleVimeoDocuments(videos) {
    const valid_ids = videos.map((v) => v._id)
    const query = '*[_type == "vimeo"] {_id}'
    try {
      const documents = await client.fetch(query)
      let transaction = client.transaction()
      documents.forEach((document) => {
        if (!valid_ids.includes(document._id)) {
          transaction.delete(document._id)
        }
      })
      await transaction.commit()
    } catch (error) {
      console.error('Sanity error:', error)
    }
  }

  async function fetchVimeo() {
    setIsLoading(true)
    try {
      const res = await fetch(vimeoFetchUrl, {
        headers: {
          Authorization: `Bearer ${vimeoAccessToken}`,
        },
      })
      const data = await res.json()
      setCount(data.total)
      setCountPages(Math.ceil(data.total / data.per_page))

      await importVimeo(data.paging.first, 'first')
      setIsLoading(false)
      setCurrentVideo(0)
    } catch (error) {
      setIsLoading(false)
      setCurrentVideo(0)
      console.error('Fetch Vimeo failed: ', error.message)
    }
  }

  return (
    <Card
      tone={!vimeoAccessToken ? 'critical' : 'default'}
      height={'stretch'}
      display={'grid'}
      style={{height: '100%', gridTemplateRows: '1fr auto'}}
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

            {vimeoAccessToken && (
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
            )}
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

          <Box>
            {!isLoading ? (
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
          </Box>
        </Flex>

        {isLoading && count && currentVideo && (
          <Card paddingX={3}>
            <Box>
              <Flex direction={'column'} gap={3}>
                <progress value={currentVideo} max={count} />
                <Flex direction={'column'} gap={1}>
                  {countPages && (
                    <Text size={1}>
                      Found {countPages} pages with {count} total Videos
                    </Text>
                  )}
                  {count && currentVideo && (
                    <Text size={1}>
                      Processing {currentVideo} of {count}
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Box>
          </Card>
        )}
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
