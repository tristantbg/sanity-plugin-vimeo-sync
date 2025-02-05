import {useState} from 'react'
import {MdSync} from 'react-icons/md'
import {useClient} from 'sanity'
import {addKeys} from '../helpers'

export const VimeoSyncView = ({accessToken, folderId}) => {
  const [count, setCount] = useState(false)
  const [countPages, setCountPages] = useState(false)
  const [doingPage, setDoingPage] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

    try {
      const res = await fetch(`https://api.vimeo.com${url}`, {
        headers: {
          Authorization: `Bearer ${vimeoAccessToken}`,
        },
      })
      const apiResponse = await res.json()
      nextPage = apiResponse.paging.next
      setDoingPage(
        `Importing Page ${apiResponse.page} of ${Math.ceil(apiResponse.total / apiResponse.per_page)}…`,
      )
      const transaction = client.transaction()
      const videos = apiResponse.data

      for (let [index, video] of videos?.entries?.()) {
        setCurrentVideo(index + 1)
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
        } else {
          setDoingPage(
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
        setDoingPage(`Finished`)
        await deleteIncompatibleVimeoDocuments(videos)
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
    <div className="container">
      {vimeoAccessToken && (
        <div>
          <button style={{marginBottom: '1rem'}} onClick={() => fetchVimeo()}>
            <span className="icon">
              {!doingPage || doingPage === 'Finished' ? (
                <MdSync />
              ) : (
                <MdSync style={{opacity: 0}} />
              )}
            </span>
            <span>{!doingPage || doingPage === 'Finished' ? 'Load Vimeo videos' : doingPage}</span>
          </button>

          {count && countPages && (
            <p>
              <strong>
                Found {countPages} pages with {count} total Videos
              </strong>
            </p>
          )}

          {isLoading && (
            <div>
              <h3>Loading...</h3>
              {count && currentVideo ? (
                <p>
                  processing {currentVideo} of {count}
                </p>
              ) : null}
            </div>
          )}

          {doingPage && doingPage === 'Finished' && <p>{doingPage}</p>}
        </div>
      )}

      {!vimeoAccessToken && <p>No Access Token found. Please check your .env</p>}
    </div>
  )
}
