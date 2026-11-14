import unittest

from recommendation.hybrid_recommender import HybridRecommender


class HybridRecommenderTests(unittest.TestCase):
    def setUp(self):
        genres = [
            ('Pop', 0.7),
            ('Acoustic', 0.2),
            ('EDM', 0.9),
            ('Jazz', 0.3),
            ('Rock', 0.8)
        ]
        self.catalog = [
            {
                'id': f'track-{index}',
                'title': f'Track {index}',
                'artist': f'Artist {index}',
                'genre': genres[index // 3][0],
                'energy': genres[index // 3][1],
                'popularity': 70
            }
            for index in range(15)
        ]
        self.recommender = HybridRecommender()

    def test_shelves_are_unique_and_match_user_and_room_mood(self):
        recommendations = self.recommender.get_recommendations(
            user={'preferredGenres': ['Pop']},
            catalog=self.catalog,
            room_participants=[{'preferredGenres': ['Pop']}],
            room_mood={'collectiveEnergy': 0.2, 'dominantEmotion': 'relaxed'},
            dj_personality={
                'preferred_genres': ['Acoustic', 'Jazz'],
                'target_energy': 0.35
            }
        )

        shelf_names = [
            'recommended_for_you',
            'based_on_mood',
            'group_compatible',
            'popular_in_room',
            'discover_new'
        ]
        selected_ids = [
            track['id']
            for shelf in shelf_names
            for track in recommendations[shelf]
        ]

        self.assertEqual(len(selected_ids), len(set(selected_ids)))
        self.assertTrue(all(track['genre'] == 'Pop'
                            for track in recommendations['recommended_for_you']))
        self.assertTrue(all(track['genre'] == 'Acoustic'
                            for track in recommendations['based_on_mood']))


if __name__ == '__main__':
    unittest.main()
