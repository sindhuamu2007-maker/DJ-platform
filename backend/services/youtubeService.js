const axios = require('axios');

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const searchVideos = async (query, { pageToken, maxResults = 25, relevanceLanguage } = {}) => {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error('YouTube search is not configured. Add YOUTUBE_API_KEY to backend/.env and restart the backend.');
    error.status = 503;
    throw error;
  }

  const response = await axios.get(YOUTUBE_SEARCH_URL, {
    params: {
      key: apiKey,
      part: 'snippet',
      type: 'video',
      maxResults,
      q: query,
      ...(relevanceLanguage ? { relevanceLanguage } : {}),
      ...(pageToken ? { pageToken } : {})
    },
    timeout: 10000
  });

  return {
    videos: (response.data.items || [])
      .filter(item => item.id?.videoId && VIDEO_ID_PATTERN.test(item.id.videoId))
      .map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
      })),
    nextPageToken: response.data.nextPageToken || null
  };
};

module.exports = { searchVideos, VIDEO_ID_PATTERN };
