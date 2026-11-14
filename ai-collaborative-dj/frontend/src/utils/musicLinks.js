export const getFullSongSearchUrl = (track) => {
  const search = [track?.artist, track?.title].filter(Boolean).join(' ');
  return `https://music.youtube.com/search?q=${encodeURIComponent(search)}`;
};
