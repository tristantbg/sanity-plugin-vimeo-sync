import { MdSync } from 'react-icons/md'
import { getVideos } from './vimeoConnector'
// import styles from './VimeoSync.css'

export function VimeoSyncView({ config }) {
  const vimeoOptions = { accessToken: process.env.SANITY_VIMEO_ACCESS_TOKEN, folderId: process.env.SANITY_VIMEO_FOLDER_ID }
  return (
    <div
      style={{
        textAlign: 'center',
        cursor: 'pointer',
        background: 'black',
        color: 'white',
        padding: '0.1em',
        margin: '1em'
      }}
      onClick={getVideos(vimeoOptions)}
    >
      <h1 style={{ lineHeight: 0.8 }}>
        <MdSync />
      </h1>
    </div>
  )
}
