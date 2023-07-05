import { useClient } from 'sanity'
import Axios from 'axios'
import speakingurl from 'speakingurl'
import { nanoid } from 'nanoid'

export function getVideos(pluginOptions = {}) {
  const sanityClient = useClient({ apiVersion: '2023-01-01' })
  const client = Axios.create({
    baseURL: 'https://api.vimeo.com'
  })

  const defaultOptions = {
    accessToken: null,
    folderId: null
  }
  let hasVideoFiles = false
  const params =
    '?fields=uri,modified_time,created_time,name,description,link,pictures,files,width,height,duration&per_page=100'
  const options = { ...defaultOptions, ...pluginOptions }
  const { folderId, accessToken } = options

  const url = folderId ? `/me/projects/${folderId}/videos${params}` : `/me/videos${params}`

  const formatVideos = (videos) => {
    const createVideos = (videos) => {
      console.log(videos)

      let transaction = sanityClient.transaction()

      // videos.forEach(video => {
      //   uploadVideo(video)
      // })
      videos.forEach((video) => {
        transaction.createIfNotExists(video).patch(video._id, (patch) => patch.set(video))
      })

      transaction
        .commit()
        .then((res) => {
          console.log(res)
        })
        .catch((error) => {
          console.error('Sanity error:', error)
          // return {
          //     statusCode: 500,
          //     body: JSON.stringify({
          //         error: 'An internal server error has occurred',
          //     })
          // };
        })
      console.log(transaction)
    }

    const deleteOldVideos = (videos) => {
      const valid_ids = videos.map((v) => v._id)
      const query = '*[_type == "vimeoVideo"] {_id}'

      sanityClient.fetch(query).then((documents) => {
        let transaction = sanityClient.transaction()
        documents.forEach((document) => {
          if (!valid_ids.includes(document._id)) {
            transaction.delete(document._id)
          }
        })
        transaction
          .commit()
          .then((res) => {
            console.log(res)
          })
          .catch((error) => {
            console.error('Sanity error:', error)
            // return {
            //     statusCode: 500,
            //     body: JSON.stringify({
            //         error: 'An internal server error has occurred',
            //     })
            // };
          })
      })
    }

    const videoFiles = videos && videos.filter((video) => video.files)

    const hasVideoFiles = videoFiles.length !== 0
    if (!hasVideoFiles) {
      console.info(
        'Can\'t access video files through Vimeo API on this account. Won\'t create "VimeoSrcset" fragment.'
      )
      console.info(
        'Please make sure that you\'re on a Pro plan and that "private" and "video_files" are in the scope of your token.'
      )
    }
    let allVideos = videos.map((video) => {
      return {
        _type: 'vimeoVideo',
        _id: video.uri.replace('/videos/', ''),
        slug: {
          _type: 'slug',
          current: speakingurl(video.name, { truncate: 200, symbols: true })
        },
        modifiedTime: video.modified_time,
        createdTime: video.created_time,
        title: video.name,
        name: video.name,
        width: video.width,
        height: video.height,
        aspectRatio: video.width / video.height,
        description: video.description ? video.description : '',
        files: hasVideoFiles
          ? video.files.map((f, i) => Object.assign(f, { _key: nanoid() }))
          : false,
        pictures: video.pictures.sizes.map((p, i) => Object.assign(p, { _key: nanoid() })),
        link: video.link,
        duration: video.duration
      }
      // createVideo(videoData)
    })
    createVideos(allVideos)
    deleteOldVideos(allVideos)
  }

  client
    .get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    .then((response) => {
      // console.log(response)
      let videos = response.data.data
      const paging = response.data.paging

      if (paging.next) {
        client
          .get(paging.next, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })
          .then((response) => {
            // console.log(response)
            const allVideos = videos.concat(response.data.data)
            // console.log(allVideos)

            formatVideos(allVideos)
          })
          .catch(function (error) {
            console.log(error)
          })
      } else {
        formatVideos(videos)
      }
    })
    .catch(function (error) {
      console.log(error)
    })
}
