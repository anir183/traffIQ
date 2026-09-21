import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Hls, { Events } from "hls.js";
import type { ErrorData } from "hls.js";
import type { CameraMeta } from "../../types/contract/camera";

interface VideoFeedProps {
  camera: CameraMeta;
  controls?: boolean;
  className?: string;
  fallback?: ReactNode;
}

function supportsNativeHls(): boolean {
  if (typeof document === "undefined") return false;
  const video = document.createElement("video");
  return (
    typeof video.canPlayType === "function" &&
    video.canPlayType("application/vnd.apple.mpegurl") !== ""
  );
}

/**
 * Plays a camera's `hls` stream: native HLS where supported (Safari/iOS),
 * otherwise hls.js. Fatal stream errors render `fallback` (the simulated
 * canvas) so a flaky/manifest-less feed never shows a black box. `muted` +
 * autoplay is required by browser autoplay policy; controls can be used to
 * unmute manually.
 */
export function VideoFeed({
  camera,
  controls = false,
  className,
  fallback,
}: VideoFeedProps) {
  const url = camera.stream_url;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [failed, setFailed] = useState(false);
  const nativeHls = useMemo(() => supportsNativeHls(), []);
  const supported = useMemo(
    () => nativeHls || (typeof Hls !== "undefined" && Hls.isSupported()),
    [nativeHls],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!url || !video || !supported || failed) return;
    if (nativeHls) {
      video.src = url;
      video.play().catch(() => {
        // Autoplay can be deferred by the browser; play via controls.
      });
      return () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }
    const hls = new Hls();
    hlsRef.current = hls;
    hls.loadSource(url);
    hls.attachMedia(video);
    const onStreamError = (_event: Events.ERROR, data: ErrorData): void => {
      if (data.fatal) setFailed(true);
    };
    hls.on(Events.ERROR, onStreamError);
    return () => {
      hls.off(Events.ERROR, onStreamError);
      hls.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [url, nativeHls, supported, failed]);

  if (!url || failed || !supported) return fallback ?? null;

  return (
    <video
      ref={videoRef}
      className={className}
      src={nativeHls ? url : undefined}
      muted
      autoPlay
      playsInline
      controls={controls}
      aria-label={`${camera.name} live feed`}
    />
  );
}
