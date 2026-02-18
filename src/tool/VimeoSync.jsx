import { useSecrets } from '@sanity/studio-secrets'
import { Box, Card, Flex, Spinner, Text } from '@sanity/ui'
import { useCallback, useEffect, useState } from 'react'
import { useSource, useTranslation } from 'sanity'
import { namespace } from '../constants'
import { addKeys, setPluginConfig, vimeoFetch } from '../helpers'
import { vimeoSyncLocaleNamespace } from '../i18n'
import { getExistingVideoThumbnails } from '../schema/AnimatedThumbnails/utils'
import { InexistentWarning } from './components/InexistentWarning'
import { MissingTokenBanner } from './components/MissingTokenBanner'
import { SyncActions } from './components/SyncActions'
import { SyncFooter } from './components/SyncFooter'
import { SyncHeader } from './components/SyncHeader'
import { SyncLogs } from './components/SyncLogs'
import { SyncProgress } from './components/SyncProgress'
import { VideoList } from './components/VideoList'

export const VimeoSyncView = (options) => {
  const { t } = useTranslation(vimeoSyncLocaleNamespace)
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

  const [inexistent, setInexistent] = useState([])
  const [videosEntry, setVideosEntry] = useState([])
  const [logs, setLogs] = useState([])

  const { folderId } = options
  const [count, setCount] = useState(0)
  const [countPages, setCountPages] = useState(0)
  const [currentVideo, setCurrentVideo] = useState(0)
  const [status, setStatus] = useState({ type: 'idle' })

  const { getClient } = useSource()
  const client = getClient({ apiVersion: '2025-02-07' })
  const vimeoFolderId = folderId || process.env.SANITY_STUDIO_VIMEO_FOLDER_ID

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const addLog = (type, ...args) => {
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        )
        .join(' ')

      const timestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      setLogs((prev) => [...prev, { type, message, timestamp }])
    }

    console.log = (...args) => {
      originalLog.apply(console, args)
      addLog('log', ...args)
    }

    console.warn = (...args) => {
      originalWarn.apply(console, args)
      addLog('warn', ...args)
    }

    console.error = (...args) => {
      originalError.apply(console, args)
      addLog('error', ...args)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  const vimeoFetchUrlParams =
    '?fields=uri,modified_time,created_time,name,description,link,pictures,files,width,height,duration&per_page=100'
  const vimeoFetchUrl = vimeoFolderId
    ? `https://api.vimeo.com/me/projects/${vimeoFolderId}/videos${vimeoFetchUrlParams}`
    : `https://api.vimeo.com/me/videos${vimeoFetchUrlParams}`

  // Recursively fetch all subfolders within a folder
  async function fetchSubfolders(projectId) {
    const subfolders = []
    let nextPage = `/me/projects/${projectId}/items?per_page=100`

    try {
      while (nextPage) {
        const res = await vimeoFetch(`https://api.vimeo.com${nextPage}`, {
          headers: {
            Authorization: `Bearer ${vimeoAccessToken}`,
          },
        })
        const data = await res.json()

        // Filter for folders (type: folder)
        const folders = data.data.filter((item) => item.type === 'folder')
        subfolders.push(...folders)

        nextPage = data.paging?.next || null
      }

      console.log(
        `Found ${subfolders.length} subfolder(s) in project ${projectId}`
      )
      return subfolders
    } catch (error) {
      console.error(
        `Error fetching subfolders for project ${projectId}:`,
        error.message
      )
      return []
    }
  }

  // Count total videos across folder tree
  async function countVideosInFolderTree(projectId, depth = 0) {
    const indent = '  '.repeat(depth)
    let totalCount = 0

    try {
      // Count videos in current folder
      const videoUrl = `https://api.vimeo.com/me/projects/${projectId}/videos?per_page=1`
      const res = await vimeoFetch(videoUrl, {
        headers: {
          Authorization: `Bearer ${vimeoAccessToken}`,
        },
      })
      const data = await res.json()
      totalCount += data.total

      if (data.total > 0) {
        console.log(
          `${indent}Folder ${projectId} contains ${data.total} video(s)`
        )
      }

      // Count videos in subfolders
      const subfolders = await fetchSubfolders(projectId)

      for (const subfolder of subfolders) {
        const subfolderUri = subfolder.folder?.uri || subfolder.uri
        if (subfolderUri) {
          const subfolderId = subfolderUri.split('/').pop()

          // First check if subfolder has any videos
          const checkUrl = `https://api.vimeo.com/me/projects/${subfolderId}/videos?per_page=1`
          const checkRes = await vimeoFetch(checkUrl, {
            headers: {
              Authorization: `Bearer ${vimeoAccessToken}`,
            },
          })
          const checkData = await checkRes.json()

          // Only process subfolders that contain videos
          if (checkData.total > 0) {
            const subCount = await countVideosInFolderTree(
              subfolderId,
              depth + 1
            )
            totalCount += subCount
          }
        }
      }

      return totalCount
    } catch (error) {
      console.error(
        `Error counting videos in folder ${projectId}:`,
        error.message
      )
      return totalCount
    }
  }

  // Recursively fetch videos from a folder and its subfolders
  async function fetchVideosFromFolderTree(projectId, depth = 0) {
    const indent = '  '.repeat(depth)
    console.log(`${indent}Fetching videos from folder ${projectId}...`)

    // Fetch videos from current folder
    const videoUrl = `https://api.vimeo.com/me/projects/${projectId}/videos${vimeoFetchUrlParams}`
    const res = await vimeoFetch(videoUrl, {
      headers: {
        Authorization: `Bearer ${vimeoAccessToken}`,
      },
    })
    const data = await res.json()

    // Import videos from current folder
    if (data.total > 0) {
      console.log(
        `${indent}Processing ${data.total} video(s) from folder ${projectId}`
      )
      await importVimeo(data.paging.first)
    }

    // Fetch and process subfolders
    const subfolders = await fetchSubfolders(projectId)

    for (const subfolder of subfolders) {
      const subfolderUri = subfolder.folder?.uri || subfolder.uri
      if (subfolderUri) {
        const subfolderId = subfolderUri.split('/').pop()

        // First check if subfolder has any videos
        const checkUrl = `https://api.vimeo.com/me/projects/${subfolderId}/videos?per_page=1`
        const checkRes = await vimeoFetch(checkUrl, {
          headers: {
            Authorization: `Bearer ${vimeoAccessToken}`,
          },
        })
        const checkData = await checkRes.json()

        // Only process subfolders that contain videos or have subfolders
        if (checkData.total > 0) {
          console.log(
            `${indent}Processing subfolder: ${subfolder.folder?.name || subfolder.name || subfolderId}`
          )
          await fetchVideosFromFolderTree(subfolderId, depth + 1)
        } else {
          console.log(
            `${indent}Skipping empty subfolder: ${subfolder.folder?.name || subfolder.name || subfolderId}`
          )
        }
      }
    }
  }

  const handleSyncFinished = useCallback(
    (entryCount) => {
      setStatus({
        type: 'finished',
        message: t('sync.finished', {
          count: entryCount,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }),
      })
    },
    [t]
  )

  async function importVimeo(url) {
    let nextPage
    let perPage
    let page

    try {
      const res = await vimeoFetch(`https://api.vimeo.com${url}`, {
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

      const BATCH_SIZE = 5
      for (let i = 0; i < videos.length; i += BATCH_SIZE) {
        const batch = videos.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(
          batch.map(async (video) => {
            if (!video.files) {
              throw new Error(t('sync.error-missing-files'))
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
      }

      await transaction.commit()
      if (nextPage) {
        await importVimeo(nextPage)
      } else {
        await deleteIncompatibleVimeoDocuments(videosEntry)
        handleSyncFinished(videosEntry.length)
      }
    } catch (error) {
      console.error('Update failed: ', error.message)
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function deleteIncompatibleVimeoDocuments(videos) {
    setInexistent([])
    const inexistent = []
    const valid_ids = videos.map((v) => v._id)
    const query = '*[_type == "vimeo"] {_id}'

    try {
      const documents = await client.fetch(query)
      const documentsToDelete = documents.filter(
        (document) => !valid_ids.includes(document._id)
      )

      if (documentsToDelete.length === 0) {
        return
      }

      console.log(
        `Removing ${documentsToDelete.length} documents no longer in Vimeo import`
      )

      // Try individual deletion to handle reference constraints gracefully
      let successCount = 0
      for (const document of documentsToDelete) {
        try {
          await client.delete(document._id)
          successCount++
        } catch (e) {
          // Check if it's a reference constraint error
          if (
            e.message &&
            e.message.includes('cannot be deleted as there are references')
          ) {
            console.warn(
              `Cannot delete ${document._id}: still referenced by other documents`
            )
            inexistent.push(document._id)
          } else {
            console.error(`Failed to delete ${document._id}:`, e.message)
            inexistent.push(document._id)
          }
        }
      }

      if (successCount > 0) {
        console.log(
          `Successfully removed ${successCount} of ${documentsToDelete.length} obsolete documents`
        )
      }

      setInexistent(inexistent)
    } catch (error) {
      console.error('Error cleaning up obsolete documents:', error)
    }
  }

  async function fetchVimeo() {
    setStatus({ type: 'loading' })
    setVideosEntry([])
    setLogs([])
    try {
      if (vimeoFolderId) {
        // First, count total videos in folder tree
        console.log(
          `Counting videos in folder ${vimeoFolderId} and subfolders...`
        )
        const totalCount = await countVideosInFolderTree(vimeoFolderId)
        setCount(totalCount)
        setCountPages(Math.ceil(totalCount / 100))
        console.log(`Total videos to sync: ${totalCount}`)

        // Fetch videos from folder and all its subfolders recursively
        console.log(`Starting recursive sync from folder ${vimeoFolderId}...`)
        await fetchVideosFromFolderTree(vimeoFolderId)
        await deleteIncompatibleVimeoDocuments(videosEntry)
        handleSyncFinished(videosEntry.length)
      } else {
        // Fetch all user videos (not folder-specific)
        const res = await vimeoFetch(vimeoFetchUrl, {
          headers: {
            Authorization: `Bearer ${vimeoAccessToken}`,
          },
        })
        const data = await res.json()
        setCount(data.total)
        setCountPages(Math.ceil(data.total / data.per_page))
        await importVimeo(data.paging.first)
      }
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
            {t('tool.loading')}
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
          <SyncHeader />
        </Card>

        <Flex
          direction={'column'}
          gap={4}
          paddingX={3}
          paddingY={4}
          align={'flex-start'}
        >
          {!vimeoAccessToken && <MissingTokenBanner />}

          <SyncActions
            status={status}
            onSync={fetchVimeo}
            disabled={!vimeoAccessToken}
          />

          <InexistentWarning inexistent={inexistent} />
        </Flex>

        {status.type === 'loading' && count && currentVideo ? (
          <SyncProgress
            count={count}
            countPages={countPages}
            currentVideo={currentVideo}
          />
        ) : null}

        {status.type === 'loading' && <SyncLogs logs={logs} />}

        <VideoList />
      </Box>

      <Card as="footer" padding={3} borderTop>
        <SyncFooter />
      </Card>
    </Card>
  )
}
