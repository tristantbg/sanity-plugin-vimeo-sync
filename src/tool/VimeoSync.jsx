import { MdSync } from 'react-icons/md'
import { getVideos } from './vimeoConnector'
// import styles from './VimeoSync.css'

export function VimeoSyncView(config) {
  console.log(config)
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
      onClick={getVideos(config)}
    >
      <h1 style={{ lineHeight: 0.8 }}>
        <MdSync />
      </h1>
    </div>
  )
}
