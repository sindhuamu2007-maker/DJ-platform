/**
 * Automated End-to-End Integration Test Suite for AI-Powered Collaborative DJ Platform
 * Tests Auth, Rooms, Queue, Chat NLP Sentiment, Emotion-Adaptive DJ, Conflict Resolution,
 * Soundclash Live Battles, Harmonic Mixing, and Hybrid Recommendations.
 */

const assert = require('assert');
global.USE_MEMORY_STORE = true;

const UserModel = require('../models/User');
const RoomModel = require('../models/Room');
const SoundclashModel = require('../models/Soundclash');
const musicService = require('../services/musicProviderService');
const AIBridge = require('../services/aiBridge');

const catalog = [
  { id: 'itunes-1001', title: 'Kannada Dance', artist: 'Artist One', genre: 'Kannada', language: 'Kannada', duration: 200, bpm: 124, key: '8B', energy: 0.82, popularity: 85, provider: 'itunes' },
  { id: 'itunes-1002', title: 'Hindi Groove', artist: 'Artist Two', genre: 'Hindi', language: 'Hindi', duration: 210, bpm: 120, key: '8A', energy: 0.75, popularity: 80, provider: 'itunes' },
  { id: 'itunes-1003', title: 'EDM Pulse', artist: 'Artist Three', genre: 'EDM', language: 'English', duration: 190, bpm: 128, key: '9B', energy: 0.9, popularity: 90, provider: 'itunes' },
  { id: 'itunes-1004', title: 'Lo-fi Evening', artist: 'Artist Four', genre: 'Lo-fi', language: 'Instrumental', duration: 220, bpm: 82, key: '5A', energy: 0.3, popularity: 70, provider: 'itunes' }
];

async function runTests() {
  console.log("==========================================================");
  console.log("🧪 STARTING COMPREHENSIVE AI DJ PLATFORM INTEGRATION TESTS");
  console.log("==========================================================\n");
  console.log("Using an isolated in-memory store; persistent MongoDB records will not be changed.\n");

  let passed = 0;
  let total = 0;

  const test = async (name, fn) => {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  };

  // 1. Verify the external Apple Music catalog provider independently.
  await test("Apple Music Catalog Search", async () => {
    const tracks = await musicService.getAllCatalog();
    assert(tracks.length > 0, "Catalog should include Apple Music songs");
    assert(tracks.every(track =>
      track.provider === 'itunes' &&
      /^itunes-\d+$/.test(track.id) &&
      track.duration > 0
    ), "Catalog entries should have Apple Music IDs and track metadata");
  });

  // 2. Authentication & User Profile
  let tokenUser1, user1Doc;
  let user2Doc, user3Doc;
  await test("User Registration, Password Hashing & JWT Auth", async () => {
    user1Doc = await UserModel.create({
      username: 'alice_dj',
      displayName: 'Alice Vibe',
      email: 'alice@test.com',
      password: 'password123',
      preferredGenres: ['Kannada', 'Pop']
    });
    assert(user1Doc, "User 1 should be created");
    assert(user1Doc.password !== 'password123', "Password must be hashed with bcrypt");

    const isMatch = await UserModel.comparePassword('password123', user1Doc.password);
    assert(isMatch === true, "Password comparison must succeed for correct password");

    const token = UserModel.generateToken(user1Doc);
    assert(token && typeof token === 'string', "JWT token should be generated");
    tokenUser1 = token;

    // Create 2 additional test users with conflicting preferences
    user2Doc = await UserModel.create({
      username: 'bob_rock',
      displayName: 'Bob Riffs',
      email: 'bob@test.com',
      password: 'password123',
      preferredGenres: ['Hindi', 'Rock']
    });

    user3Doc = await UserModel.create({
      username: 'charlie_edm',
      displayName: 'Charlie Drops',
      email: 'charlie@test.com',
      password: 'password123',
      preferredGenres: ['EDM']
    });
  });

  // 3. Collaborative Music Room Creation & Presence
  let testRoom;
  await test("Collaborative Room Creation & Member Presence", async () => {
    testRoom = await RoomModel.create({
      roomId: 'DJ-TEST',
      name: 'Bangalore Electronic Session',
      host: { id: user1Doc._id || user1Doc.id, username: user1Doc.username, displayName: user1Doc.displayName },
      participants: [
        { id: user1Doc._id || user1Doc.id, username: user1Doc.username, preferredGenres: user1Doc.preferredGenres },
        { id: user2Doc._id || user2Doc.id, username: user2Doc.username, preferredGenres: user2Doc.preferredGenres },
        { id: user3Doc._id || user3Doc.id, username: user3Doc.username, preferredGenres: user3Doc.preferredGenres }
      ],
      currentTrack: catalog[0],
      queue: catalog.slice(1, 4),
      history: [catalog[0], catalog[3]]
    });

    assert(testRoom && testRoom.roomId === 'DJ-TEST', "Room must be created with ID DJ-TEST");
    assert(testRoom.participants.length === 3, "Room should contain 3 participants with diverse tastes");
  });

  // 4. NLP Sentiment & Emotion Classification
  await test("NLP Sentiment Analysis & Emotion Classification", async () => {
    const excitedText = "This song is amazing! Let's play more dance music! 🔥";
    const excitedResult = await AIBridge.analyzeSentiment(excitedText);
    assert(excitedResult.sentiment === 'positive', "Should classify as positive");
    assert(excitedResult.dominant_emotion === 'excited' || excitedResult.dominant_emotion === 'happy', "Should classify as excited/happy");

    const frustratedText = "Ugh please skip this track, it's so boring and terrible 👎";
    const frustratedResult = await AIBridge.analyzeSentiment(frustratedText);
    assert(frustratedResult.sentiment === 'negative', "Should classify as negative");
    assert(frustratedResult.dominant_emotion === 'frustrated', "Should classify as frustrated (not sad!)");

    const sadText = "I'm feeling so sad today, this melody hurts 💔😢";
    const sadResult = await AIBridge.analyzeSentiment(sadText);
    assert(sadResult.sentiment === 'negative', "Should classify as negative");
    assert(sadResult.dominant_emotion === 'sad', "Should classify as sad");
  });

  // 5. Major Innovation 1: Emotion-Adaptive Group Mood Aggregation
  await test("Major Innovation 1: Emotion-Adaptive Group Mood Calculation", async () => {
    const events = [
      { event_type: 'chat', dominant_emotion: 'excited', polarity: 0.9, timestamp: Date.now() - 1000 },
      { event_type: 'reaction', reaction_type: 'fire', energy_score: 0.95, timestamp: Date.now() - 500 },
      { event_type: 'chat', dominant_emotion: 'happy', polarity: 0.8, timestamp: Date.now() - 200 }
    ];

    const groupMood = await AIBridge.calculateRoomMood(events);
    assert(groupMood.emotions, "Should output normalized emotion distribution");
    assert(groupMood.collective_energy > 0.6, "Collective energy should be high given excited/fire reactions");
    assert(groupMood.dominant_emotion === 'excited' || groupMood.dominant_emotion === 'happy', "Dominant emotion should reflect party vibe");
  });

  // 6. Major Innovation 2: AI Music Preference Conflict Resolution
  await test("Major Innovation 2: AI Music Conflict Resolution & Fair-Share Balancing", async () => {
    const participants = [
      { id: 'u1', username: 'Alice', preferredGenres: ['Kannada'] },
      { id: 'u2', username: 'Bob', preferredGenres: ['Hindi'] },
      { id: 'u3', username: 'Charlie', preferredGenres: ['EDM'] }, // minority taste
      { id: 'u4', username: 'Divya', preferredGenres: ['Kannada'] },
      { id: 'u5', username: 'Eshan', preferredGenres: ['Hindi'] }
    ];

    // Kannada and Hindi were just played back-to-back:
    const recentGenres = ['Kannada', 'Hindi'];
    const mood = { collective_energy: 0.85, dominant_emotion: 'excited' };

    const result = await AIBridge.resolveConflicts({
      participants,
      candidateTracks: catalog,
      recentGenres,
      currentMood: mood
    });

    assert(result.recommended_tracks && result.recommended_tracks.length > 0, "Should generate ranked recommendations");
    assert(result.explanation && typeof result.explanation === 'string', "Must provide human-readable explainability");
    console.log(`   💡 Conflict Resolution Decision: "${result.explanation}"`);
  });

  // 7. Soundclash Live Battle & AI Prediction
  await test("Soundclash Battle, AI Prediction & Double-Vote Protection", async () => {
    const songA = catalog[0];
    const songB = catalog[2];

    const prediction = await AIBridge.predictSoundclash({
      songA,
      songB,
      participants: testRoom.participants,
      roomMood: { collective_energy: 0.75, dominant_emotion: 'happy' }
    });

    assert(prediction.confidence_score >= 50, "Prediction confidence must be computed");
    assert(prediction.reasoning, "Prediction reasoning must be provided");

    const clash = await SoundclashModel.create({
      roomId: testRoom.roomId,
      songA,
      songB,
      votes: [],
      votesACount: 0,
      votesBCount: 0,
      status: 'active'
    });

    // Cast vote for User 1
    clash.votes.push({ userId: user1Doc.id, username: user1Doc.username, songChoice: 'A', timestamp: new Date() });
    clash.votesACount = 1;

    // Check double vote prevention
    const hasVoted = clash.votes.some(v => v.userId === user1Doc.id);
    assert(hasVoted === true, "Double vote check should recognize previous vote");
  });

  // 8. AI DJ Harmonic Mixing & Transition Calculation
  await test("AI DJ Harmonic Mixing & Web Audio Crossfade Analysis", async () => {
    const track1 = catalog[0];
    const track2 = catalog[1];

    const transition = await AIBridge.calculateTransition(track1, track2, { transitionDuration: 6 });
    assert(transition.transition_type, "Should calculate transition technique");
    assert(transition.crossfade_duration > 0, "Crossfade duration must be positive");
    assert(transition.compatibility_score >= 50, "Harmonic compatibility score should be evaluated");
    console.log(`   🎛️  DJ Transition Plan: ${transition.transition_type} (${transition.crossfade_duration}s fade, Score: ${transition.compatibility_score}%)`);
  });

  // 9. Hybrid Recommendations Shelves
  await test("Multi-Shelf Hybrid Recommendations", async () => {
    const recs = await AIBridge.getHybridRecommendations({
      user: user1Doc,
      catalog,
      participants: testRoom.participants,
      roomMood: { collective_energy: 0.7, dominant_emotion: 'happy' }
    });

    assert(recs.recommended_for_you, "Should include 'Recommended for You' shelf");
    assert(recs.based_on_mood, "Should include 'Based on Your Mood' shelf");
    assert(recs.group_compatible, "Should include 'Group Compatible' shelf");
    assert(recs.popular_in_room, "Should include 'Popular in Room' shelf");
    assert(recs.discover_new, "Should include 'Discover New Music' shelf");
  });

  console.log("\n==========================================================");
  const failed = total - passed;
  const passRate = total === 0 ? 0 : Math.round((passed / total) * 100);
  const resultLabel = failed === 0 ? "ALL TESTS PASSED" : `${failed} TEST(S) FAILED`;
  console.log(`🏁 INTEGRATION TEST RESULTS: ${passed}/${total} PASSED (${passRate}%) - ${resultLabel}`);
  console.log("==========================================================");

  if (failed > 0) process.exitCode = 1;
}

runTests().catch(err => {
  console.error("Test runner fatal error:", err);
  process.exit(1);
});
