import {
  MediaController,
  MediaControlBar,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaVolumeRange,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaLoadingIndicator,
  MediaFullscreenButton,
} from 'media-chrome/react'
import 'hls-video-element'

export function VideoPlayer({ video }) {
  return (
    <MediaController
      style={{
        width: '100%',
        aspectRatio: '16/9',
      }}
    >
      <hls-video
        slot="media"
        src={video.hls || video.link}
        crossorigin
        playsinline
      />
      <MediaLoadingIndicator noAutohide slot="centered-chrome" />
      <MediaControlBar>
        <MediaPlayButton></MediaPlayButton>
        <MediaSeekBackwardButton></MediaSeekBackwardButton>
        <MediaSeekForwardButton></MediaSeekForwardButton>
        <MediaTimeRange></MediaTimeRange>
        <MediaTimeDisplay showDuration></MediaTimeDisplay>
        <MediaMuteButton></MediaMuteButton>
        <MediaVolumeRange></MediaVolumeRange>
        <MediaFullscreenButton></MediaFullscreenButton>
      </MediaControlBar>
    </MediaController>
  )
}
