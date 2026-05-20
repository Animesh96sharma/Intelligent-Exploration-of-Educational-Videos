import { useEffect, useRef } from "react";

type VideoPlayerProps = {
  videoId: string;
  src: string;
  title: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
};

export default function VideoPlayer({
  videoId,
  src,
  title,
  currentTime,
  onTimeUpdate,
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.load();
  }, [src]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 1.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <div className="video-player">
      <video
        key={videoId}
        ref={ref}
        src={src}
        controls
        preload="metadata"
        className="video-element"
        onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
      >
        Your browser does not support the video tag for {title}.
      </video>
    </div>
  );
}