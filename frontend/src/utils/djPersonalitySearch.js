export const PERSONALITY_YOUTUBE_SEARCHES = {
  party: { query: 'party dance hits EDM pop', label: 'Party DJ' },
  chill: { query: 'chill lo-fi acoustic relaxing songs', label: 'Chill DJ' },
  retro: { query: 'retro disco 80s 90s classic hits', label: 'Retro DJ' },
  romantic: { query: 'romantic love songs acoustic ballads', label: 'Romantic DJ' },
  workout: { query: 'workout music high energy EDM rock', label: 'Workout DJ' },
  explorer: { query: 'world music global regional fusion songs', label: 'Explorer DJ' }
};

export const YOUTUBE_SEARCH_LANGUAGES = [
  { code: '', label: 'Any language', searchTerm: '' },
  { code: 'en', label: 'English', searchTerm: 'English' },
  { code: 'hi', label: 'Hindi', searchTerm: 'Hindi' },
  { code: 'kn', label: 'Kannada', searchTerm: 'Kannada' },
  { code: 'ml', label: 'Malayalam', searchTerm: 'Malayalam' },
  { code: 'ta', label: 'Tamil', searchTerm: 'Tamil' },
  { code: 'te', label: 'Telugu', searchTerm: 'Telugu' },
  { code: 'bn', label: 'Bengali', searchTerm: 'Bengali' },
  { code: 'gu', label: 'Gujarati', searchTerm: 'Gujarati' },
  { code: 'mr', label: 'Marathi', searchTerm: 'Marathi' },
  { code: 'pa', label: 'Punjabi', searchTerm: 'Punjabi' },
  { code: 'ur', label: 'Urdu', searchTerm: 'Urdu' },
  { code: 'es', label: 'Spanish', searchTerm: 'Spanish' },
  { code: 'fr', label: 'French', searchTerm: 'French' },
  { code: 'ja', label: 'Japanese', searchTerm: 'Japanese' },
  { code: 'ko', label: 'Korean', searchTerm: 'Korean' },
  { code: 'ar', label: 'Arabic', searchTerm: 'Arabic' }
];

export const getPersonalityYouTubeSearchQuery = (personalityId, languageCode = '') => {
  const search = PERSONALITY_YOUTUBE_SEARCHES[personalityId] || PERSONALITY_YOUTUBE_SEARCHES.party;
  const language = YOUTUBE_SEARCH_LANGUAGES.find(option => option.code === languageCode);
  return [search.query, language?.searchTerm].filter(Boolean).join(' ');
};

export const getPersonalityYouTubeSearchUrl = (personalityId, languageCode = '') => {
  const query = getPersonalityYouTubeSearchQuery(personalityId, languageCode);
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
};
