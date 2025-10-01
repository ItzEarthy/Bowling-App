/**
 * Comprehensive Achievement System
 * 100+ achievements covering all aspects of bowling
 */

export const ACHIEVEMENT_CATEGORIES = {
  SCORING: 'scoring',
  CONSISTENCY: 'consistency',
  SPECIAL: 'special',
  SOCIAL: 'social',
  EQUIPMENT: 'equipment',
  STREAKS: 'streaks',
  MILESTONES: 'milestones',
  MASTERY: 'mastery',
  DEDICATION: 'dedication',
  PERFECTION: 'perfection'
};

export const ACHIEVEMENT_RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

export const ACHIEVEMENTS = [
  // SCORING Achievements (20)
  {
    id: 'first_strike',
    name: 'First Strike',
    description: 'Roll your first strike',
    category: ACHIEVEMENT_CATEGORIES.SCORING,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    icon: '🎯',
    points: 10,
    condition: { type: 'strike_count', value: 1 }
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Score 100 or higher',
    category: ACHIEVEMENT_CATEGORIES.SCORING,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    icon: '💯',
    points: 25,
    condition: { type: 'single_game_score', value: 100 }
  },
  {
    id: 'sesquicentennial',
    name: 'Sesquicentennial',
    description: 'Score 150 or higher',
    category: ACHIEVEMENT_CATEGORIES.SCORING,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🎯',
    points: 50,
    condition: { type: 'single_game_score', value: 150 }
  },
  {
    id: 'double_century',
    name: 'Double Century',
    description: 'Score 200 or higher',
    category: ACHIEVEMENT_CATEGORIES.SCORING,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🏆',
    points: 100,
    condition: { type: 'single_game_score', value: 200 }
  },
  {
    id: 'quarter_thousand',
    name: 'Quarter Thousand',
    description: 'Score 250 or higher',
    category: ACHIEVEMENT_CATEGORIES.SCORING,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '⭐',
    points: 200,
    condition: { type: 'single_game_score', value: 250 }
  },
  {
    id: 'perfect_game',
    name: 'Perfect Game',
    description: 'Bowl a perfect 300 game',
    category: ACHIEVEMENT_CATEGORIES.PERFECTION,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '👑',
    points: 1000,
    condition: { type: 'single_game_score', value: 300 }
  },
  {
    id: 'high_average_150',
    name: 'Consistent Performer',
    description: 'Maintain a 150+ average over 10 games',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '📈',
    points: 75,
    condition: { type: 'average_over_games', average: 150, games: 10 }
  },
  {
    id: 'high_average_175',
    name: 'Elite Bowler',
    description: 'Maintain a 175+ average over 20 games',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🥇',
    points: 150,
    condition: { type: 'average_over_games', average: 175, games: 20 }
  },
  {
    id: 'high_average_200',
    name: 'Professional Level',
    description: 'Maintain a 200+ average over 30 games',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🏅',
    points: 300,
    condition: { type: 'average_over_games', average: 200, games: 30 }
  },
  {
    id: 'turkey',
    name: 'Turkey',
    description: 'Roll three strikes in a row',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🦃',
    points: 75,
    condition: { type: 'consecutive_strikes', value: 3 }
  },
  {
    id: 'four_bagger',
    name: 'Four-Bagger',
    description: 'Roll four strikes in a row',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🔥',
    points: 100,
    condition: { type: 'consecutive_strikes', value: 4 }
  },
  {
    id: 'five_bagger',
    name: 'Five-Bagger',
    description: 'Roll five strikes in a row',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '⚡',
    points: 125,
    condition: { type: 'consecutive_strikes', value: 5 }
  },
  {
    id: 'six_pack',
    name: 'Six Pack',
    description: 'Roll six strikes in a row',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '💥',
    points: 200,
    condition: { type: 'consecutive_strikes', value: 6 }
  },
  {
    id: 'lucky_seven',
    name: 'Lucky Seven',
    description: 'Roll seven strikes in a row',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🍀',
    points: 250,
    condition: { type: 'consecutive_strikes', value: 7 }
  },
  {
    id: 'octopus',
    name: 'Octopus',
    description: 'Roll eight strikes in a row',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🐙',
    points: 300,
    condition: { type: 'consecutive_strikes', value: 8 }
  },
  {
    id: 'front_nine',
    name: 'Front Nine',
    description: 'Roll nine strikes in a row',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '⭐',
    points: 400,
    condition: { type: 'consecutive_strikes', value: 9 }
  },
  {
    id: 'double_spare',
    name: 'Spare Collector',
    description: 'Convert 10 spares in a single game',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '♻️',
    points: 100,
    condition: { type: 'spares_in_game', value: 10 }
  },
  {
    id: 'clean_game',
    name: 'Clean Game',
    description: 'Bowl a game with all strikes and spares',
    category: ACHIEVEMENT_CATEGORIES.PERFECTION,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '✨',
    points: 150,
    condition: { type: 'clean_game', value: true }
  },
  {
    id: 'split_master',
    name: 'Split Master',
    description: 'Convert 5 splits in a single game',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '⚡',
    points: 200,
    condition: { type: 'splits_converted_game', value: 5 }
  },
  {
    id: 'strike_rate_king',
    name: 'Strike Rate King',
    description: 'Achieve 70% strike rate over 10 games',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '👑',
    points: 175,
    condition: { type: 'strike_rate_over_games', rate: 0.7, games: 10 }
  },

  // STREAKS Achievements (15)
  {
    id: 'strike_streak_5',
    name: 'Strike Train',
    description: 'Roll 5 strikes across multiple games',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🚂',
    points: 50,
    condition: { type: 'strike_streak', value: 5 }
  },
  {
    id: 'strike_streak_10',
    name: 'Strike Express',
    description: 'Roll 10 strikes across multiple games',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🚅',
    points: 100,
    condition: { type: 'strike_streak', value: 10 }
  },
  {
    id: 'strike_streak_15',
    name: 'Strike Avalanche',
    description: 'Roll 15 strikes across multiple games',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🏔️',
    points: 200,
    condition: { type: 'strike_streak', value: 15 }
  },
  {
    id: 'spare_streak_10',
    name: 'Spare Specialist',
    description: 'Convert 10 spares in a row',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🔄',
    points: 100,
    condition: { type: 'spare_streak', value: 10 }
  },
  {
    id: 'game_streak_5',
    name: 'Hot Streak',
    description: 'Improve your score 5 games in a row',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🔥',
    points: 75,
    condition: { type: 'improving_game_streak', value: 5 }
  },
  {
    id: 'game_streak_10',
    name: 'Unstoppable',
    description: 'Improve your score 10 games in a row',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '⚡',
    points: 200,
    condition: { type: 'improving_game_streak', value: 10 }
  },
  {
    id: 'consistent_streak_20',
    name: 'Mr. Consistent',
    description: 'Bowl within 20 pins of your average for 20 games',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '📊',
    points: 150,
    condition: { type: 'consistency_streak', variance: 20, games: 20 }
  },
  {
    id: 'daily_streak_7',
    name: 'Week Warrior',
    description: 'Bowl at least one game daily for 7 days',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '📅',
    points: 100,
    condition: { type: 'daily_streak', value: 7 }
  },
  {
    id: 'daily_streak_30',
    name: 'Monthly Master',
    description: 'Bowl at least one game daily for 30 days',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🗓️',
    points: 300,
    condition: { type: 'daily_streak', value: 30 }
  },
  {
    id: 'clean_streak_5',
    name: 'Clean Sweep',
    description: 'Bowl 5 clean games in a row',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🧹',
    points: 250,
    condition: { type: 'clean_game_streak', value: 5 }
  },
  {
    id: 'split_conversion_streak_5',
    name: 'Split Surgeon',
    description: 'Convert 5 splits in a row',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🏥',
    points: 200,
    condition: { type: 'split_conversion_streak', value: 5 }
  },
  {
    id: 'no_gutter_streak_50',
    name: 'Gutter Avoider',
    description: 'Roll 50 throws without a gutter ball',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🛡️',
    points: 100,
    condition: { type: 'no_gutter_streak', value: 50 }
  },
  {
    id: 'frame_streak_perfect_10',
    name: 'Perfect Frames',
    description: 'Bowl 10 perfect frames in a row (strike or spare)',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🎯',
    points: 125,
    condition: { type: 'perfect_frame_streak', value: 10 }
  },
  {
    id: 'pin_streak_100',
    name: 'Pin Demolisher',
    description: 'Knock down 100 pins in a row without missing any',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '💥',
    points: 175,
    condition: { type: 'consecutive_pins_knocked', value: 100 }
  },
  {
    id: 'opening_streak_10',
    name: 'Opening Master',
    description: 'Start 10 games in a row with a strike',
    category: ACHIEVEMENT_CATEGORIES.STREAKS,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🚀',
    points: 150,
    condition: { type: 'opening_strike_streak', value: 10 }
  },

  // MILESTONES Achievements (20)
  {
    id: 'games_played_10',
    name: 'Getting Started',
    description: 'Play 10 games',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    icon: '🎳',
    points: 25,
    condition: { type: 'games_played', value: 10 }
  },
  {
    id: 'games_played_50',
    name: 'Regular Bowler',
    description: 'Play 50 games',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🎯',
    points: 75,
    condition: { type: 'games_played', value: 50 }
  },
  {
    id: 'games_played_100',
    name: 'Century of Games',
    description: 'Play 100 games',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '💯',
    points: 150,
    condition: { type: 'games_played', value: 100 }
  },
  {
    id: 'games_played_500',
    name: 'Bowling Enthusiast',
    description: 'Play 500 games',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🏆',
    points: 500,
    condition: { type: 'games_played', value: 500 }
  },
  {
    id: 'games_played_1000',
    name: 'Bowling Legend',
    description: 'Play 1000 games',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '👑',
    points: 1000,
    condition: { type: 'games_played', value: 1000 }
  },
  {
    id: 'strikes_100',
    name: 'Strike Century',
    description: 'Roll 100 strikes total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '⚡',
    points: 100,
    condition: { type: 'total_strikes', value: 100 }
  },
  {
    id: 'strikes_500',
    name: 'Strike Machine',
    description: 'Roll 500 strikes total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🤖',
    points: 250,
    condition: { type: 'total_strikes', value: 500 }
  },
  {
    id: 'strikes_1000',
    name: 'Strike Master',
    description: 'Roll 1000 strikes total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '⚡',
    points: 500,
    condition: { type: 'total_strikes', value: 1000 }
  },
  {
    id: 'spares_100',
    name: 'Spare Collector',
    description: 'Convert 100 spares total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '♻️',
    points: 75,
    condition: { type: 'total_spares', value: 100 }
  },
  {
    id: 'spares_500',
    name: 'Spare Specialist',
    description: 'Convert 500 spares total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🔄',
    points: 200,
    condition: { type: 'total_spares', value: 500 }
  },
  {
    id: 'pins_knocked_10000',
    name: 'Pin Destroyer',
    description: 'Knock down 10,000 pins total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '💥',
    points: 200,
    condition: { type: 'total_pins_knocked', value: 10000 }
  },
  {
    id: 'pins_knocked_50000',
    name: 'Pin Annihilator',
    description: 'Knock down 50,000 pins total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🌪️',
    points: 500,
    condition: { type: 'total_pins_knocked', value: 50000 }
  },
  {
    id: 'months_active_6',
    name: 'Half Year Hero',
    description: 'Be active for 6 months',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '📅',
    points: 100,
    condition: { type: 'months_active', value: 6 }
  },
  {
    id: 'months_active_12',
    name: 'Year Veteran',
    description: 'Be active for 12 months',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🗓️',
    points: 200,
    condition: { type: 'months_active', value: 12 }
  },
  {
    id: 'perfect_games_5',
    name: 'Perfect Quintet',
    description: 'Bowl 5 perfect games',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '🏆',
    points: 2000,
    condition: { type: 'perfect_games', value: 5 }
  },
  {
    id: 'venues_visited_10',
    name: 'Bowling Tourist',
    description: 'Bowl at 10 different locations',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🗺️',
    points: 150,
    condition: { type: 'unique_venues', value: 10 }
  },
  {
    id: 'splits_converted_100',
    name: 'Split Converter',
    description: 'Convert 100 splits total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '⚡',
    points: 300,
    condition: { type: 'total_splits_converted', value: 100 }
  },
  {
    id: 'hours_bowled_100',
    name: 'Century of Hours',
    description: 'Bowl for 100 hours total',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '⏰',
    points: 200,
    condition: { type: 'total_hours_bowled', value: 100 }
  },
  {
    id: 'improvement_50_pins',
    name: 'Tremendous Improvement',
    description: 'Improve your average by 50 pins',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '📈',
    points: 300,
    condition: { type: 'average_improvement', value: 50 }
  },
  {
    id: 'balls_owned_10',
    name: 'Arsenal Collector',
    description: 'Own 10 bowling balls',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🎳',
    points: 150,
    condition: { type: 'balls_owned', value: 10 }
  },

  // SOCIAL Achievements (15)
  {
    id: 'first_friend',
    name: 'Social Bowler',
    description: 'Add your first friend',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    icon: '👥',
    points: 25,
    condition: { type: 'friends_count', value: 1 }
  },
  {
    id: 'friends_10',
    name: 'Popular Bowler',
    description: 'Have 10 friends',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🤝',
    points: 75,
    condition: { type: 'friends_count', value: 10 }
  },
  {
    id: 'friends_50',
    name: 'Bowling Network',
    description: 'Have 50 friends',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🌐',
    points: 200,
    condition: { type: 'friends_count', value: 50 }
  },
  {
    id: 'leaderboard_top_10',
    name: 'Top 10 Bowler',
    description: 'Reach top 10 on any leaderboard',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🏅',
    points: 150,
    condition: { type: 'leaderboard_position', value: 10 }
  },
  {
    id: 'leaderboard_top_3',
    name: 'Podium Finisher',
    description: 'Reach top 3 on any leaderboard',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🥉',
    points: 250,
    condition: { type: 'leaderboard_position', value: 3 }
  },
  {
    id: 'leaderboard_first',
    name: 'Champion',
    description: 'Reach #1 on any leaderboard',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '🥇',
    points: 500,
    condition: { type: 'leaderboard_position', value: 1 }
  },
  {
    id: 'friend_challenge_win_5',
    name: 'Challenge Victor',
    description: 'Win 5 friend challenges',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '⚔️',
    points: 100,
    condition: { type: 'challenge_wins', value: 5 }
  },
  {
    id: 'friend_challenge_win_25',
    name: 'Challenge Champion',
    description: 'Win 25 friend challenges',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🏆',
    points: 250,
    condition: { type: 'challenge_wins', value: 25 }
  },
  {
    id: 'mentoring_sessions_10',
    name: 'Bowling Mentor',
    description: 'Help 10 new bowlers improve',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🎓',
    points: 200,
    condition: { type: 'mentoring_sessions', value: 10 }
  },
  {
    id: 'team_games_50',
    name: 'Team Player',
    description: 'Play 50 team games',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '👥',
    points: 100,
    condition: { type: 'team_games', value: 50 }
  },
  {
    id: 'tournament_winner',
    name: 'Tournament Victor',
    description: 'Win your first tournament',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🏆',
    points: 300,
    condition: { type: 'tournaments_won', value: 1 }
  },
  {
    id: 'tournament_winner_10',
    name: 'Tournament Dominator',
    description: 'Win 10 tournaments',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '👑',
    points: 1000,
    condition: { type: 'tournaments_won', value: 10 }
  },
  {
    id: 'shared_games_100',
    name: 'Show Off',
    description: 'Share 100 scorecards',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '📱',
    points: 150,
    condition: { type: 'shared_games', value: 100 }
  },
  {
    id: 'coaching_hours_50',
    name: 'Master Coach',
    description: 'Provide 50 hours of coaching',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🏅',
    points: 400,
    condition: { type: 'coaching_hours', value: 50 }
  },
  {
    id: 'league_seasons_5',
    name: 'League Veteran',
    description: 'Complete 5 league seasons',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🎖️',
    points: 250,
    condition: { type: 'league_seasons', value: 5 }
  },

  // EQUIPMENT Achievements (10)
  {
    id: 'first_ball',
    name: 'First Arsenal',
    description: 'Add your first bowling ball',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    icon: '🎳',
    points: 25,
    condition: { type: 'balls_owned', value: 1 }
  },
  {
    id: 'ball_maintenance_50',
    name: 'Equipment Caretaker',
    description: 'Perform 50 ball maintenance actions',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🔧',
    points: 100,
    condition: { type: 'maintenance_actions', value: 50 }
  },
  {
    id: 'different_weights_5',
    name: 'Weight Explorer',
    description: 'Bowl with 5 different ball weights',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '⚖️',
    points: 150,
    condition: { type: 'different_weights_used', value: 5 }
  },
  {
    id: 'brand_collector_5',
    name: 'Brand Collector',
    description: 'Own balls from 5 different brands',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🏷️',
    points: 175,
    condition: { type: 'different_brands_owned', value: 5 }
  },
  {
    id: 'coverstock_master',
    name: 'Coverstock Master',
    description: 'Bowl with all coverstock types',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🎯',
    points: 250,
    condition: { type: 'all_coverstock_types', value: true }
  },
  {
    id: 'ball_usage_1000',
    name: 'Workhorse',
    description: 'Use a single ball 1000 times',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🐎',
    points: 300,
    condition: { type: 'single_ball_usage', value: 1000 }
  },
  {
    id: 'oil_pattern_master_10',
    name: 'Oil Pattern Expert',
    description: 'Bowl on 10 different oil patterns',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🛢️',
    points: 200,
    condition: { type: 'different_oil_patterns', value: 10 }
  },
  {
    id: 'drilling_layouts_5',
    name: 'Layout Experimenter',
    description: 'Try 5 different drilling layouts',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🔨',
    points: 250,
    condition: { type: 'different_drilling_layouts', value: 5 }
  },
  {
    id: 'ball_resurfacing_25',
    name: 'Surface Specialist',
    description: 'Resurface balls 25 times',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '✨',
    points: 175,
    condition: { type: 'ball_resurfacing', value: 25 }
  },
  {
    id: 'arsenal_value_5000',
    name: 'High Roller',
    description: 'Own an arsenal worth $5000+',
    category: ACHIEVEMENT_CATEGORIES.EQUIPMENT,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '💎',
    points: 500,
    condition: { type: 'arsenal_value', value: 5000 }
  },

  // DEDICATION Achievements (10)
  {
    id: 'early_bird_50',
    name: 'Early Bird',
    description: 'Bowl 50 games before 10 AM',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🌅',
    points: 100,
    condition: { type: 'early_morning_games', value: 50 }
  },
  {
    id: 'night_owl_50',
    name: 'Night Owl',
    description: 'Bowl 50 games after 10 PM',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🦉',
    points: 100,
    condition: { type: 'late_night_games', value: 50 }
  },
  {
    id: 'practice_hours_100',
    name: 'Practice Makes Perfect',
    description: 'Log 100 hours of practice',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '⏰',
    points: 200,
    condition: { type: 'practice_hours', value: 100 }
  },
  {
    id: 'comeback_king_10',
    name: 'Comeback King',
    description: 'Win 10 games after being behind by 50+ pins',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🔄',
    points: 300,
    condition: { type: 'comeback_victories', deficit: 50, value: 10 }
  },
  {
    id: 'marathon_session_10',
    name: 'Marathon Bowler',
    description: 'Bowl 10+ games in a single session',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🏃',
    points: 200,
    condition: { type: 'games_in_session', value: 10 }
  },
  {
    id: 'weather_warrior_rain_25',
    name: 'Rain Warrior',
    description: 'Bowl 25 games on rainy days',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '🌧️',
    points: 100,
    condition: { type: 'weather_games', weather: 'rain', value: 25 }
  },
  {
    id: 'holiday_bowler_5',
    name: 'Holiday Bowler',
    description: 'Bowl on 5 different holidays',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🎄',
    points: 150,
    condition: { type: 'holiday_games', value: 5 }
  },
  {
    id: 'data_tracker',
    name: 'Data Enthusiast',
    description: 'Log detailed stats for 100 games',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    icon: '📊',
    points: 125,
    condition: { type: 'detailed_stats_games', value: 100 }
  },
  {
    id: 'goal_achiever_10',
    name: 'Goal Crusher',
    description: 'Achieve 10 personal goals',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🎯',
    points: 200,
    condition: { type: 'goals_achieved', value: 10 }
  },
  {
    id: 'app_ambassador',
    name: 'App Ambassador',
    description: 'Refer 10 friends to the app',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '📢',
    points: 300,
    condition: { type: 'referrals', value: 10 }
  },

  // SPECIAL Achievements (10)
  {
    id: 'birthday_strike',
    name: 'Birthday Strike',
    description: 'Roll a strike on your birthday',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🎂',
    points: 100,
    condition: { type: 'birthday_strike', value: true }
  },
  {
    id: 'new_year_perfect',
    name: 'New Year Perfect',
    description: 'Bowl a perfect game in January',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '🎊',
    points: 500,
    condition: { type: 'new_year_perfect_game', value: true }
  },
  {
    id: 'lucky_number_7',
    name: 'Lucky Number Seven',
    description: 'Roll exactly 7 pins 77 times',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🍀',
    points: 250,
    condition: { type: 'exact_pins_count', pins: 7, value: 77 }
  },
  {
    id: 'midnight_strike',
    name: 'Midnight Strike',
    description: 'Roll a strike at exactly midnight',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🌙',
    points: 200,
    condition: { type: 'midnight_strike', value: true }
  },
  {
    id: 'palindrome_score',
    name: 'Palindrome Perfectionist',
    description: 'Bowl a palindrome score (121, 131, 151, etc.)',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '🔄',
    points: 150,
    condition: { type: 'palindrome_score', value: true }
  },
  {
    id: 'fibonacci_score',
    name: 'Mathematical Bowler',
    description: 'Bowl a Fibonacci sequence score',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '🔢',
    points: 300,
    condition: { type: 'fibonacci_score', value: true }
  },
  {
    id: 'all_single_pin_spares',
    name: 'Single Pin Master',
    description: 'Convert all 10 single pin spare combinations',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    icon: '📌',
    points: 400,
    condition: { type: 'all_single_pin_spares', value: true }
  },
  {
    id: 'reverse_300',
    name: 'Reverse Perfect',
    description: 'Bowl exactly in reverse pin order (0,1,2,3...)',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '🔄',
    points: 600,
    condition: { type: 'reverse_perfect_pattern', value: true }
  },
  {
    id: 'exactly_average_10',
    name: 'Average Joe',
    description: 'Bowl exactly your average 10 times',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    icon: '📊',
    points: 175,
    condition: { type: 'exactly_average_games', value: 10 }
  },
  {
    id: 'pin_by_pin_perfect',
    name: 'Pin by Pin Perfectionist',
    description: 'Bowl a 300 using pin-by-pin entry',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    icon: '🎯',
    points: 750,
    condition: { type: 'pin_by_pin_perfect_game', value: true }
  }
];

// Helper functions for achievement processing
export const getAchievementsByCategory = (category) => {
  return ACHIEVEMENTS.filter(achievement => achievement.category === category);
};

export const getAchievementsByRarity = (rarity) => {
  return ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
};

export const getAchievementById = (id) => {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
};

export const getTotalPossiblePoints = () => {
  return ACHIEVEMENTS.reduce((total, achievement) => total + achievement.points, 0);
};

export const getRarityColor = (rarity) => {
  const colors = {
    [ACHIEVEMENT_RARITIES.COMMON]: 'text-gray-600 bg-gray-100',
    [ACHIEVEMENT_RARITIES.UNCOMMON]: 'text-green-600 bg-green-100',
    [ACHIEVEMENT_RARITIES.RARE]: 'text-blue-600 bg-blue-100',
    [ACHIEVEMENT_RARITIES.EPIC]: 'text-purple-600 bg-purple-100',
    [ACHIEVEMENT_RARITIES.LEGENDARY]: 'text-yellow-600 bg-yellow-100'
  };
  return colors[rarity] || colors[ACHIEVEMENT_RARITIES.COMMON];
};

export const getCategoryColor = (category) => {
  const colors = {
    [ACHIEVEMENT_CATEGORIES.SCORING]: 'text-red-600 bg-red-100',
    [ACHIEVEMENT_CATEGORIES.CONSISTENCY]: 'text-blue-600 bg-blue-100',
    [ACHIEVEMENT_CATEGORIES.SPECIAL]: 'text-purple-600 bg-purple-100',
    [ACHIEVEMENT_CATEGORIES.SOCIAL]: 'text-green-600 bg-green-100',
    [ACHIEVEMENT_CATEGORIES.EQUIPMENT]: 'text-orange-600 bg-orange-100',
    [ACHIEVEMENT_CATEGORIES.STREAKS]: 'text-yellow-600 bg-yellow-100',
    [ACHIEVEMENT_CATEGORIES.MILESTONES]: 'text-indigo-600 bg-indigo-100',
    [ACHIEVEMENT_CATEGORIES.MASTERY]: 'text-pink-600 bg-pink-100',
    [ACHIEVEMENT_CATEGORIES.DEDICATION]: 'text-teal-600 bg-teal-100',
    [ACHIEVEMENT_CATEGORIES.PERFECTION]: 'text-gold-600 bg-gold-100'
  };
  return colors[category] || colors[ACHIEVEMENT_CATEGORIES.SCORING];
};