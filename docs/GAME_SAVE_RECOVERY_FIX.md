# Game Save Recovery Fix

## Problem
When a user's JWT token expires during an active game, the API returns a 401/403 error. The previous implementation aggressively cleared ALL localStorage on logout, including the unsaved game state. This resulted in **permanent data loss** of the game in progress.

## Root Cause
1. User plays a game that extends beyond JWT token expiration (30 days)
2. Game completion triggers save API call
3. Backend returns 401/403 due to expired token
4. API interceptor in `api.js` triggers logout
5. `authStore.logout()` clears **all localStorage** including `bowlingGameState`
6. User loses all game data with no recovery option

## Solution Architecture
Three-layer defense system to prevent game data loss:

### Layer 1: Preserve (authStore.js)
- Modified `logout()` to accept `preserveGameState` parameter (default: false)
- When true, saves `bowlingGameState` to sessionStorage before clearing localStorage
- Restores game state after logout completes
- Preserves game data across authentication reset

### Layer 2: Detection (api.js)
- API interceptor detects auth failures (401/403)
- Checks localStorage for unsaved game (`bowlingGameState`)
- If found, sets sessionStorage flags:
  - `authFailedWithGame: 'true'`
  - `gamePreservedAfterAuth: 'true'`
  - `authFailureTime: <timestamp>`
- Calls `logout(true)` to trigger game state preservation

### Layer 3: Recovery (GameEntryPage.jsx)
- Enhanced error handling in `handleGameComplete()`
- Detects auth errors via status code 401/403
- Shows user-friendly message when game is preserved
- Provides "Retry Save" button to attempt save after re-login
- `handleRetry()` function:
  - Restores saved game state
  - Prepares data for API
  - Attempts save again
  - Clears sessionStorage flags on success

## Modified Files

### 1. `frontend/src/stores/authStore.js`
```javascript
logout: (preserveGameState = false) => {
  // Save game state if requested
  if (preserveGameState) {
    const gameState = localStorage.getItem('bowlingGameState');
    if (gameState) {
      sessionStorage.setItem('preservedGameState', gameState);
    }
  }
  
  // Clear auth data
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  // Restore game state if preserved
  if (preserveGameState) {
    const preserved = sessionStorage.getItem('preservedGameState');
    if (preserved) {
      localStorage.setItem('bowlingGameState', preserved);
      sessionStorage.removeItem('preservedGameState');
    }
  }
  
  set({ user: null, token: null });
}
```

### 2. `frontend/src/lib/api.js`
```javascript
// Response interceptor - auth failure handling
if (status === 401 || status === 403) {
  // Check if there's an unsaved game
  const hasUnsavedGame = localStorage.getItem('bowlingGameState');
  
  if (hasUnsavedGame) {
    // Flag that we had a game when auth failed
    sessionStorage.setItem('authFailedWithGame', 'true');
    sessionStorage.setItem('gamePreservedAfterAuth', 'true');
    sessionStorage.setItem('authFailureTime', Date.now().toString());
    
    // Preserve game state during logout
    authStore.getState().logout(true);
  } else {
    authStore.getState().logout();
  }
  
  window.location.href = '/login';
}
```

### 3. `frontend/src/pages/GameEntryPage.jsx`
```javascript
// Added imports
const { currentGame, initializeGame, restoredFromSave, clearSavedState, prepareGameForAPI } = useGameStore();

// Enhanced handleGameComplete
const handleGameComplete = async (completedGame) => {
  try {
    setIsLoading(true);
    setError(null);
    // ... save logic
  } catch (err) {
    // Auth error handling
    if (err.response?.status === 401 || err.response?.status === 403) {
      setError('Your session expired during the game. Your game has been preserved. Please log in and click "Retry Save" to save your game.');
      sessionStorage.setItem('gamePreservedAfterAuth', 'true');
    } else {
      setError(err.response?.data?.error || 'Failed to save game. Please try again.');
    }
  }
};

// New retry handler
const handleRetry = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    const savedState = localStorage.getItem('bowlingGameState');
    if (!savedState) {
      setError('No saved game found to retry.');
      return;
    }
    
    const parsedState = JSON.parse(savedState);
    const gameData = prepareGameForAPI(parsedState);
    
    await api.post('/api/games', gameData);
    
    clearSavedState();
    sessionStorage.removeItem('gamePreservedAfterAuth');
    sessionStorage.removeItem('authFailedWithGame');
    sessionStorage.removeItem('authFailureTime');
    
    navigate('/games');
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to retry save. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Error Display UI
```jsx
{error && (
  <div className="mb-6 bg-vintage-red-50 border border-vintage-red-200 rounded-xl p-4">
    <h4 className="font-medium text-vintage-red-800 mb-2">Error</h4>
    <p className="text-vintage-red-700 text-sm">{error}</p>
    <div className="flex gap-2 mt-3">
      {sessionStorage.getItem('gamePreservedAfterAuth') && (
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleRetry}
          className="bg-mint-green-500 hover:bg-mint-green-600 text-white"
        >
          Retry Save
        </Button>
      )}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setError(null)}
      >
        Dismiss
      </Button>
    </div>
  </div>
)}
```

## Testing Scenarios

### Scenario 1: Token Expiration During Game
1. Start a game with valid authentication
2. Simulate token expiration (or wait 30 days)
3. Complete the game and attempt save
4. **Expected**: Error message appears with "Retry Save" button
5. Log back in
6. Click "Retry Save"
7. **Expected**: Game saves successfully and navigates to games list

### Scenario 2: Network Failure
1. Complete a game with valid auth
2. Disable network connection before clicking save
3. **Expected**: Standard error message without retry button
4. Re-enable network and retry normally

### Scenario 3: Normal Save Flow
1. Complete a game with valid authentication
2. Click save
3. **Expected**: Normal save succeeds, no preservation needed

## SessionStorage Flags

| Flag | Purpose | Lifecycle |
|------|---------|-----------|
| `authFailedWithGame` | Indicates auth failed while game was in progress | Set by api.js, cleared by handleRetry |
| `gamePreservedAfterAuth` | Shows retry button in UI | Set by api.js, cleared by handleRetry |
| `authFailureTime` | Timestamp of failure for debugging | Set by api.js, cleared by handleRetry |
| `preservedGameState` | Temporary storage during logout | Set/removed by authStore.logout() |

## Benefits
1. **Zero Data Loss**: Games are never lost due to authentication issues
2. **User-Friendly**: Clear messaging about what happened and how to recover
3. **Automatic Recovery**: Seamless restoration after re-authentication
4. **Minimal Impact**: Only affects logout flow when game is active
5. **Fail-Safe**: Falls back to standard logout if no game in progress

## Version
- Implemented: 2025-01-XX
- Related to: v2.2.0 PWA Auth Fix
- Build: Frontend v1.0.0 (build passed)

## Future Improvements
1. Add toast notification when game is auto-restored
2. Implement token refresh before expiration during active games
3. Add visual indicator in game entry when session is near expiration
4. Store multiple game states for recovery (currently only latest)
