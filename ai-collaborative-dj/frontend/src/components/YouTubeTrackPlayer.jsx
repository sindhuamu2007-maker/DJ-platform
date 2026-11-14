import React, { useEffect, useRef } from 'react';

let youtubeApiPromise;

const loadYouTubeApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve(window.YT);
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => reject(new Error('Could not load the YouTube player.'));
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
};

export const YouTubeTrackPlayer = ({
  videoId,
  isPlaying,
  currentTime,
  seekVersion,
  volume,
  onProgress,
  onDuration,
  onEnded,
  onError,
  onReady
}) => {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const callbacksRef = useRef({});
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);

  callbacksRef.current = { onProgress, onDuration, onEnded, onError, onReady };
  isPlayingRef.current = isPlaying;
  currentTimeRef.current = currentTime;

  useEffect(() => {
    let disposed = false;
    let progressTimer;
    let player;

    loadYouTubeApi().then(YT => {
      if (disposed || !mountRef.current) return;

      player = new YT.Player(mountRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          enablejsapi: 1,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: event => {
            if (disposed) return;
            playerRef.current = event.target;
            event.target.setVolume(Math.round(volume * 100));
            callbacksRef.current.onDuration?.(event.target.getDuration());
            if (currentTimeRef.current > 0) {
              event.target.seekTo(currentTimeRef.current, true);
            }
            callbacksRef.current.onReady?.(event.target);
            if (isPlayingRef.current) event.target.playVideo();
            progressTimer = setInterval(() => {
              if (event.target.getPlayerState() !== YT.PlayerState.PLAYING) return;
              callbacksRef.current.onProgress?.(event.target.getCurrentTime());
              callbacksRef.current.onDuration?.(event.target.getDuration());
            }, 1000);
          },
          onStateChange: event => {
            if (event.data === YT.PlayerState.ENDED) {
              callbacksRef.current.onEnded?.();
            }
          },
          onError: event => {
            callbacksRef.current.onError?.(`YouTube could not play this video (error ${event.data}).`);
          }
        }
      });
    }).catch(error => {
      if (!disposed) callbacksRef.current.onError?.(error.message);
    });

    return () => {
      disposed = true;
      clearInterval(progressTimer);
      callbacksRef.current.onReady?.(null);
      if (player) player.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isPlaying, videoId]);

  useEffect(() => {
    if (playerRef.current && seekVersion > 0) {
      playerRef.current.seekTo(currentTimeRef.current, true);
    }
  }, [seekVersion, videoId]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.setVolume(Math.round(volume * 100));
  }, [volume, videoId]);

  return <div ref={mountRef} className="w-full h-full" />;
};
