// Utility helpers for consistent statistics calculations across pages

export function extractScore(game) {
  return (game.total_score ?? game.score ?? 0);
}

export function completedGamesFilter(games) {
  return games.filter(g => g && (g.is_complete === true || g.is_complete === 1));
}

export function averageScore(games) {
  const completed = completedGamesFilter(games);
  if (!completed.length) return 0;
  const total = completed.reduce((sum, g) => sum + extractScore(g), 0);
  return total / completed.length;
}

export function roundedAverage(games) {
  return Math.round(averageScore(games));
}

export function variance(games) {
  const completed = completedGamesFilter(games);
  if (completed.length === 0) return 0;
  const mean = averageScore(completed);
  return completed.reduce((sum, g) => sum + Math.pow(extractScore(g) - mean, 2), 0) / completed.length;
}

export function standardDeviation(games) {
  return Math.sqrt(variance(games));
}
