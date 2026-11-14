let instance = null;
let configuredToken = '';
let configurePromise = null;

const getCatalogSongId = (track) =>
  String(track?.externalId || track?.id || '').replace(/^itunes-/, '');

export const configureAppleMusic = async (config) => {
  if (!config?.developerToken) {
    throw new Error('Apple Music full-track playback is not configured on the server.');
  }
  if (!window.MusicKit) {
    throw new Error('Apple Music player is still loading. Try again in a moment.');
  }

  if (instance && configuredToken === config.developerToken) return instance;
  if (!configurePromise) {
    configurePromise = window.MusicKit.configure({
      developerToken: config.developerToken,
      storefrontId: config.storefront,
      app: { name: 'AURA DJ', build: '1.0.0' }
    }).then(() => {
      instance = window.MusicKit.getInstance();
      configuredToken = config.developerToken;
      return instance;
    }).finally(() => {
      configurePromise = null;
    });
  }
  return configurePromise;
};

export const authorizeAppleMusic = async (config) => {
  const music = await configureAppleMusic(config);
  if (!music.isAuthorized) await music.authorize();
  return music.isAuthorized;
};

export const isAppleMusicAuthorized = () => Boolean(instance?.isAuthorized);

export const playAppleMusicTrack = async (track, config) => {
  const music = await configureAppleMusic(config);
  const songId = getCatalogSongId(track);
  if (!songId) throw new Error('This result does not have an Apple Music catalog ID.');
  if (!music.isAuthorized) {
    throw new Error('Connect and authorize Apple Music before starting full-track playback.');
  }

  await music.setQueue({ song: songId });
  await music.play();
};

export const pauseAppleMusic = () => {
  if (instance?.isAuthorized) instance.pause();
};

export const resumeAppleMusic = async () => {
  if (!instance?.isAuthorized) {
    throw new Error('Connect and authorize Apple Music before starting full-track playback.');
  }
  await instance.play();
};

export const seekAppleMusic = async (time) => {
  if (!instance?.isAuthorized) return;
  await instance.player.seekToTime(time);
};

export const readAppleMusicPlayback = () => ({
  currentTime: instance?.player?.currentPlaybackTime || 0,
  duration: instance?.player?.currentPlaybackDuration || 0,
  isPlaying: Boolean(instance?.isPlaying)
});
