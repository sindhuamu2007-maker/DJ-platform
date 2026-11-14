const assert = require('node:assert/strict');
const AIBridge = require('../services/aiBridge');

const genres = [
  ['Pop', 0.7],
  ['Acoustic', 0.2],
  ['EDM', 0.9],
  ['Jazz', 0.3],
  ['Rock', 0.8]
];
const catalog = Array.from({ length: 15 }, (_, index) => {
  const [genre, energy] = genres[Math.floor(index / 3)];
  return {
    id: `track-${index}`,
    title: `Track ${index}`,
    artist: `Artist ${index}`,
    genre,
    energy,
    popularity: 70
  };
});

const recommendations = AIBridge._fallbackRecommendations({
  catalog,
  user: { preferredGenres: ['Pop'] },
  participants: [{ preferredGenres: ['Pop'] }],
  roomMood: { collectiveEnergy: 0.2, dominantEmotion: 'relaxed' },
  personalityId: 'chill'
});
const shelfNames = [
  'recommended_for_you',
  'based_on_mood',
  'group_compatible',
  'popular_in_room',
  'discover_new'
];
const selectedIds = shelfNames.flatMap(shelf =>
  recommendations[shelf].map(track => track.id)
);

assert.equal(selectedIds.length, new Set(selectedIds).size, 'recommendation shelves should not repeat tracks');
assert(recommendations.recommended_for_you.every(track => track.genre === 'Pop'));
assert(recommendations.based_on_mood.every(track => track.genre === 'Acoustic'));
console.log('Recommendation fallback tests passed.');
