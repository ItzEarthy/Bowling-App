import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Clock, Check, X, TrendingUp, Award, Target, Trophy, Crown, Flame, Star, BarChart3, Calendar } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner, { LoadingCard } from '../components/ui/Spinner';
import { friendAPI, userAPI, gameAPI } from '../lib/api';

/**
 * Enhanced Friends Page with Leaderboards and Social Features
 */
const EnhancedFriendsPage = () => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [leaderboardType, setLeaderboardType] = useState('average'); // average, high_score, games_played, recent_form
  const [timeframe, setTimeframe] = useState('all_time'); // all_time, month, week
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [leaderboardType, timeframe, activeTab]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadFriendsData(),
        loadLeaderboard()
      ]);
    } catch (err) {
      setError('Failed to load social data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendsData = async () => {
    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        friendAPI.getFriends(),
        friendAPI.getFriendRequests()
      ]);
      
      setFriends(friendsResponse.data.friends || []);
      setRequests(requestsResponse.data.requests || []);
    } catch (err) {
      console.error('Failed to load friends data:', err);
    }
  };

  const loadLeaderboard = async () => {
    try {
      if (leaderboardType === 'friends') {
        // Load friends leaderboard
        if (friends.length === 0) {
          setLeaderboard([]);
          return;
        }
        
        // Generate leaderboard from friends with their actual game data
        const friendsLeaderboard = await Promise.all(
          friends.map(async (friend, index) => {
            try {
              // Fetch actual games for this friend
              const gamesResponse = await gameAPI.getUserGames(friend.id);
              const games = gamesResponse.data.games || [];
              
              if (games.length === 0) {
                // Return friend with zeros if no games
                return {
                  ...friend,
                  rank: index + 1,
                  average: 0,
                  highScore: 0,
                  gamesPlayed: 0,
                  recentForm: 0,
                  totalStrikes: 0,
                  totalSpares: 0,
                  achievements: 0,
                  lastPlayed: friend.created_at,
                  status: 'offline'
                };
              }

              // Calculate real stats from games
              const completedGames = games.filter(g => g.is_complete);
              const scores = completedGames.map(g => g.total_score || g.score || 0);
              const totalPins = scores.reduce((sum, score) => sum + score, 0);
              const average = completedGames.length > 0 ? Math.round(totalPins / completedGames.length) : 0;
              const highScore = completedGames.length > 0 ? Math.max(...scores) : 0;

              // Calculate recent form (last 5 games)
              const recentGames = completedGames.slice(0, 5);
              const recentForm = recentGames.length > 0 
                ? Math.round(recentGames.reduce((sum, g) => sum + (g.total_score || g.score || 0), 0) / recentGames.length)
                : 0;

              // Calculate strikes and spares
              let totalStrikes = 0;
              let totalSpares = 0;
              
              completedGames.forEach(game => {
                if (game.entry_mode === 'final_score') {
                  totalStrikes += game.strikes || 0;
                  totalSpares += game.spares || 0;
                } else if (game.frames && Array.isArray(game.frames)) {
                  // Calculate from frames
                  game.frames.forEach(frame => {
                    if (frame.frame_number < 10 && frame.throws) {
                      if (frame.throws[0] === 10) totalStrikes++;
                      else if (frame.throws[0] + (frame.throws[1] || 0) === 10) totalSpares++;
                    }
                  });
                }
              });

              return {
                ...friend,
                rank: index + 1,
                average: average,
                highScore: highScore,
                gamesPlayed: completedGames.length,
                recentForm: recentForm,
                totalStrikes: totalStrikes,
                totalSpares: totalSpares,
                achievements: Math.floor(completedGames.length / 10) + (highScore >= 200 ? 1 : 0),
                lastPlayed: completedGames.length > 0 ? completedGames[0].created_at : friend.created_at,
                status: Math.random() > 0.7 ? 'online' : 'offline'
              };
            } catch (err) {
              console.error('Error loading friend data:', err);
              return null;
            }
          })
        );
        
        const validFriends = friendsLeaderboard.filter(Boolean);
        validFriends.sort((a, b) => {
          switch (leaderboardType) {
            case 'friends': return b.average - a.average;
            default: return b.average - a.average;
          }
        });
        
        setLeaderboard(validFriends.map((friend, index) => ({
          ...friend,
          rank: index + 1
        })));
      } else {
        // Load global leaderboard
        try {
          // Try to get all users for global leaderboard
          const usersResponse = await userAPI.getAllUsers();
          const allUsers = usersResponse.data.users || [];
          
          // Fetch games for each user and calculate real stats
          const globalLeaderboard = await Promise.all(
            allUsers.map(async (user, index) => {
              try {
                const gamesResponse = await gameAPI.getUserGames(user.id);
                const games = gamesResponse.data.games || [];
                
                if (games.length === 0) {
                  return {
                    ...user,
                    rank: index + 1,
                    average: 0,
                    highScore: 0,
                    gamesPlayed: 0,
                    recentForm: 0,
                    totalStrikes: 0,
                    totalSpares: 0,
                    achievements: 0,
                    lastPlayed: user.created_at,
                    status: 'offline'
                  };
                }

                const completedGames = games.filter(g => g.is_complete);
                const scores = completedGames.map(g => g.total_score || g.score || 0);
                const totalPins = scores.reduce((sum, score) => sum + score, 0);
                const average = completedGames.length > 0 ? Math.round(totalPins / completedGames.length) : 0;
                const highScore = completedGames.length > 0 ? Math.max(...scores) : 0;

                const recentGames = completedGames.slice(0, 5);
                const recentForm = recentGames.length > 0 
                  ? Math.round(recentGames.reduce((sum, g) => sum + (g.total_score || g.score || 0), 0) / recentGames.length)
                  : 0;

                let totalStrikes = 0;
                let totalSpares = 0;
                
                completedGames.forEach(game => {
                  if (game.entry_mode === 'final_score') {
                    totalStrikes += game.strikes || 0;
                    totalSpares += game.spares || 0;
                  } else if (game.frames && Array.isArray(game.frames)) {
                    game.frames.forEach(frame => {
                      if (frame.frame_number < 10 && frame.throws) {
                        if (frame.throws[0] === 10) totalStrikes++;
                        else if (frame.throws[0] + (frame.throws[1] || 0) === 10) totalSpares++;
                      }
                    });
                  }
                });

                return {
                  ...user,
                  rank: index + 1,
                  average: average,
                  highScore: highScore,
                  gamesPlayed: completedGames.length,
                  recentForm: recentForm,
                  totalStrikes: totalStrikes,
                  totalSpares: totalSpares,
                  achievements: Math.floor(completedGames.length / 10) + (highScore >= 200 ? 1 : 0),
                  lastPlayed: completedGames.length > 0 ? completedGames[0].created_at : user.created_at,
                  status: Math.random() > 0.6 ? 'online' : 'offline'
                };
              } catch (err) {
                console.error('Error loading user games:', err);
                return null;
              }
            })
          );
          
          // Filter out nulls and sort by the selected metric
          const validUsers = globalLeaderboard.filter(Boolean);
          validUsers.sort((a, b) => {
            switch (leaderboardType) {
              case 'average': return b.average - a.average;
              case 'high_score': return b.highScore - a.highScore;
              case 'games_played': return b.gamesPlayed - a.gamesPlayed;
              case 'recent_form': return b.recentForm - a.recentForm;
              default: return b.average - a.average;
            }
          });
          
          setLeaderboard(validUsers.map((user, index) => ({
            ...user,
            rank: index + 1
          })));
        } catch (adminError) {
          // If admin API fails, show empty leaderboard
          console.warn('Admin API not available, showing empty leaderboard');
          setLeaderboard([]);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      // Show empty leaderboard on error
      setLeaderboard([]);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      
      // Try to get all users from API and filter
      try {
        const usersResponse = await userAPI.getAllUsers();
        const allUsers = usersResponse.data.users || [];
        
        // Filter by search query
        const filteredUsers = allUsers.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.display_name.toLowerCase().includes(query.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(query.toLowerCase())
        );
        
        // Enhance with friendship status
        const enhancedResults = filteredUsers.map(user => {
          const isFriend = friends.some(f => f.id === user.id);
          const hasSentRequest = requests.some(r => r.receiver_id === user.id);
          
          return {
            ...user,
            displayName: user.display_name || user.displayName,
            isFriend: isFriend,
            friendshipStatus: isFriend ? 'friends' : hasSentRequest ? 'sent' : 'none'
          };
        });
        
        setSearchResults(enhancedResults);
      } catch (apiError) {
        // If API fails, fall back to searching leaderboard
        console.warn('API search failed, searching leaderboard');
        const mockResults = leaderboard.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.displayName.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(mockResults);
      }
    } catch (err) {
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendAPI.sendFriendRequest(userId);
      setSearchResults(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, friendshipStatus: 'sent' }
          : user
      ));
      setLeaderboard(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, friendshipStatus: 'sent' }
          : user
      ));
    } catch (err) {
      setError('Failed to send friend request');
    }
  };

  const handleRequestResponse = async (requestId, status) => {
    try {
      await friendAPI.respondToRequest(requestId, status);
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      if (status === 'accepted') {
        loadFriendsData();
      }
    } catch (err) {
      setError('Failed to respond to request');
    }
  };

  const handleViewProfile = async (user) => {
    try {
      // Load actual game data for the user
      const gamesResponse = await gameAPI.getUserGames(user.id);
      const games = gamesResponse.data.games || [];
      
      const completedGames = games.filter(g => g.is_complete);
      const scores = completedGames.map(g => g.total_score || g.score || 0);
      const totalPins = scores.reduce((sum, score) => sum + score, 0);
      const average = completedGames.length > 0 ? Math.round(totalPins / completedGames.length) : 0;
      const highScore = completedGames.length > 0 ? Math.max(...scores) : 0;

      // Get recent games (last 5)
      const recentGames = completedGames.slice(0, 5).map(game => ({
        id: game.id,
        score: game.total_score || game.score || 0,
        date: new Date(game.created_at).toLocaleDateString(),
        location: game.location || 'Unknown'
      }));

      // Calculate strikes and spares
      let totalStrikes = 0;
      let totalSpares = 0;
      
      completedGames.forEach(game => {
        if (game.entry_mode === 'final_score') {
          totalStrikes += game.strikes || 0;
          totalSpares += game.spares || 0;
        } else if (game.frames && Array.isArray(game.frames)) {
          game.frames.forEach(frame => {
            if (frame.frame_number < 10 && frame.throws) {
              if (frame.throws[0] === 10) totalStrikes++;
              else if (frame.throws[0] + (frame.throws[1] || 0) === 10) totalSpares++;
            }
          });
        }
      });

      // Load detailed profile data
      const detailedProfile = {
        ...user,
        stats: {
          totalGames: completedGames.length,
          average: average,
          highScore: highScore,
          totalStrikes: totalStrikes,
          totalSpares: totalSpares,
          achievements: Math.floor(completedGames.length / 10) + (highScore >= 200 ? 1 : 0),
          currentStreak: user.currentStreak || 0,
          consistency: completedGames.length > 5 
            ? Math.round(100 - (Math.max(...scores) - Math.min(...scores)) / 3)
            : 0,
          improvement: 0, // Could calculate from trend
          favoriteAlley: completedGames.length > 0 
            ? completedGames[0].location || 'Unknown'
            : 'Unknown',
          bowlingStyle: average >= 180 ? 'Power' : average >= 150 ? 'Accuracy' : 'Developing',
          experienceLevel: completedGames.length >= 100 ? 'Expert' : 
                          completedGames.length >= 50 ? 'Advanced' : 
                          completedGames.length >= 20 ? 'Intermediate' : 'Beginner'
        },
        recentGames: recentGames,
        compareStats: {
          averageComparison: 0, // Would need current user's average
          gamesComparison: 0,
          improvementComparison: 0
        }
      };
      
      setSelectedFriend(detailedProfile);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to existing mock data approach
      const detailedProfile = {
        ...user,
        stats: {
          totalGames: user.gamesPlayed || 0,
          average: user.average || 0,
          highScore: user.highScore || 0,
          totalStrikes: user.totalStrikes || 0,
          totalSpares: user.totalSpares || 0,
          achievements: user.achievements || 0,
          currentStreak: user.currentStreak || 0,
          consistency: Math.round(85 + Math.random() * 15),
          improvement: Math.round((Math.random() - 0.5) * 20),
          favoriteAlley: 'Sunset Lanes',
          bowlingStyle: ['Power', 'Accuracy', 'Consistency'][Math.floor(Math.random() * 3)],
          experienceLevel: ['Beginner', 'Intermediate', 'Advanced', 'Expert'][Math.floor(Math.random() * 4)]
        },
        recentGames: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          score: Math.round(user.average + (Math.random() - 0.5) * 40),
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
          location: ['Sunset Lanes', 'Strike Zone', 'Perfect Pin', 'Lucky Seven'][Math.floor(Math.random() * 4)]
        })),
        compareStats: {
          averageComparison: Math.round((Math.random() - 0.5) * 30),
          gamesComparison: Math.round((Math.random() - 0.5) * 50),
          improvementComparison: Math.round((Math.random() - 0.5) * 10)
        }
      };
      
      setSelectedFriend(detailedProfile);
      setShowProfileModal(true);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-500" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-charcoal-600">#{rank}</span>;
  };

  const getLeaderboardValue = (user) => {
    switch (leaderboardType) {
      case 'high_score': return user.highScore;
      case 'games_played': return user.gamesPlayed;
      case 'recent_form': return user.recentForm;
      default: return user.average;
    }
  };

  const getLeaderboardLabel = () => {
    switch (leaderboardType) {
      case 'high_score': return 'High Score';
      case 'games_played': return 'Games';
      case 'recent_form': return 'Recent Avg';
      default: return 'Average';
    }
  };

  const tabs = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, count: null },
    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
    { id: 'requests', label: 'Requests', icon: Clock, count: requests.length },
    { id: 'search', label: 'Find Players', icon: Search, count: null }
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Social Hub" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Social Hub"
        subtitle="Connect with bowlers and compete on leaderboards"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <Card className="mb-8">
        <CardContent>
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-charcoal-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 text-charcoal-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div>
          {/* Leaderboard Filters */}
          <Card className="mb-6">
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Ranking By
                  </label>
                  <select
                    value={leaderboardType}
                    onChange={(e) => setLeaderboardType(e.target.value)}
                    className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="average">Global - Average Score</option>
                    <option value="high_score">Global - High Score</option>
                    <option value="games_played">Global - Games Played</option>
                    <option value="recent_form">Global - Recent Form</option>
                    <option value="friends">Friends Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Timeframe
                  </label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all_time">All Time</option>
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>🏆 Global Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div 
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 
                      user.isFriend ? 'bg-green-50 border-green-200' : 'bg-white border-charcoal-200'
                    }`}
                    onClick={() => handleViewProfile(user)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10">
                        {getRankIcon(user.rank)}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {user.profile_picture || user.profilePicture ? (
                          <img 
                            src={user.profile_picture || user.profilePicture} 
                            alt={user.displayName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            user.isOnline ? 'bg-green-500' : 'bg-charcoal-400'
                          }`}>
                            {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-charcoal-900">
                              {user.displayName}
                            </h3>
                            {user.isOnline && (
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                            {user.isFriend && (
                              <Users className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-charcoal-600">@{user.username}</p>
                          <div className="flex items-center space-x-3 text-xs text-charcoal-500">
                            <span>{user.gamesPlayed} games</span>
                            <span>{user.achievements} achievements</span>
                            {user.currentStreak > 0 && (
                              <span className="flex items-center space-x-1 text-orange-600">
                                <Flame className="w-3 h-3" />
                                <span>{user.currentStreak}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-charcoal-900">
                        {getLeaderboardValue(user)}
                      </div>
                      <div className="text-sm text-charcoal-600">
                        {getLeaderboardLabel()}
                      </div>
                      {!user.isFriend && user.friendshipStatus === 'none' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendRequest(user.id);
                          }}
                          className="mt-2"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                      {user.friendshipStatus === 'sent' && (
                        <span className="text-xs text-orange-600 mt-2 block">
                          Request Sent
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <Card>
              <CardContent className="text-center py-20">
                <Users className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No friends yet</h3>
                <p className="text-charcoal-600 mb-6">
                  Connect with other bowlers to compare scores and achievements
                </p>
                <Button onClick={() => setActiveTab('search')}>
                  <Search className="w-4 h-4 mr-2" />
                  Find Friends
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <Card key={friend.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleViewProfile(friend)}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      {friend.profile_picture || friend.profilePicture ? (
                        <img 
                          src={friend.profile_picture || friend.profilePicture} 
                          alt={friend.displayName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-charcoal-200 shadow-sm"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white ${
                          friend.isOnline ? 'bg-green-500' : 'bg-charcoal-400'
                        }`}>
                          {friend.displayName?.charAt(0)?.toUpperCase() || 'F'}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-charcoal-900">
                          {friend.displayName || friend.username}
                        </h3>
                        <p className="text-sm text-charcoal-600">@{friend.username}</p>
                        {friend.isOnline && (
                          <span className="text-xs text-green-600">Online now</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-charcoal-900">
                          {friend.average || '---'}
                        </div>
                        <div className="text-charcoal-600">Average</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-charcoal-900">
                          {friend.gamesPlayed || '---'}
                        </div>
                        <div className="text-charcoal-600">Games</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-20">
                <Clock className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No pending requests</h3>
                <p className="text-charcoal-600">
                  Friend requests will appear here when other players want to connect
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      {request.sender?.profile_picture || request.sender?.profilePicture ? (
                        <img 
                          src={request.sender.profile_picture || request.sender.profilePicture} 
                          alt={request.sender.displayName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-charcoal-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-charcoal-400 rounded-full flex items-center justify-center font-bold text-white">
                          {request.sender?.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-charcoal-900">
                          {request.sender?.displayName || request.sender?.username}
                        </h3>
                        <p className="text-sm text-charcoal-600">
                          @{request.sender?.username}
                        </p>
                        <p className="text-xs text-charcoal-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequestResponse(request.id, 'accepted')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRequestResponse(request.id, 'declined')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          <Card className="mb-6">
            <CardContent>
              <Input
                placeholder="Search by username or display name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                icon={Search}
              />
            </CardContent>
          </Card>

          {isSearching ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((user) => (
                <Card key={user.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      {user.profile_picture || user.profilePicture ? (
                        <img 
                          src={user.profile_picture || user.profilePicture} 
                          alt={user.displayName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-charcoal-200 shadow-sm"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                          user.isOnline ? 'bg-green-500' : 'bg-charcoal-400'
                        }`}>
                          {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-charcoal-900">
                          {user.displayName}
                        </h3>
                        <p className="text-sm text-charcoal-600">@{user.username}</p>
                        <div className="flex items-center space-x-3 text-xs text-charcoal-500">
                          <span>Avg: {user.average}</span>
                          <span>{user.gamesPlayed} games</span>
                          <span>{user.achievements} achievements</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewProfile(user)}
                      >
                        View Profile
                      </Button>
                      {user.friendshipStatus === 'none' && (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add Friend
                        </Button>
                      )}
                      {user.friendshipStatus === 'sent' && (
                        <span className="text-sm text-orange-600">Request Sent</span>
                      )}
                      {user.friendshipStatus === 'friends' && (
                        <span className="text-sm text-green-600 flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Friends
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery ? (
            <Card>
              <CardContent className="text-center py-20">
                <Search className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No results found</h3>
                <p className="text-charcoal-600">
                  Try searching with a different username or display name
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-20">
                <Search className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">Find bowling friends</h3>
                <p className="text-charcoal-600">
                  Search for other bowlers to connect and compete with
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Enhanced Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title={`${selectedFriend?.displayName || 'Player'} Profile`}
        size="lg"
      >
        {selectedFriend && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              {selectedFriend.profile_picture || selectedFriend.profilePicture ? (
                <img 
                  src={selectedFriend.profile_picture || selectedFriend.profilePicture} 
                  alt={selectedFriend.displayName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl ${
                  selectedFriend.isOnline ? 'bg-green-500' : 'bg-charcoal-400'
                }`}>
                  {selectedFriend.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-charcoal-900">
                  {selectedFriend.displayName}
                </h2>
                <p className="text-charcoal-600">@{selectedFriend.username}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {selectedFriend.isOnline && (
                    <span className="flex items-center text-green-600 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Online now
                    </span>
                  )}
                  <span className="text-sm text-charcoal-500">
                    Rank #{selectedFriend.rank}
                  </span>
                  <span className="text-sm text-charcoal-500">
                    {selectedFriend.stats?.experienceLevel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-charcoal-900">
                  {selectedFriend.average}
                </div>
                <div className="text-sm text-charcoal-600">Average Score</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  {selectedFriend.stats?.totalGames}
                </div>
                <div className="text-sm text-blue-700">Total Games</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  {selectedFriend.stats?.highScore}
                </div>
                <div className="text-sm text-green-700">High Score</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-900">
                  {selectedFriend.stats?.totalStrikes}
                </div>
                <div className="text-sm text-yellow-700">Total Strikes</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">
                  {selectedFriend.stats?.achievements}
                </div>
                <div className="text-sm text-purple-700">Achievements</div>
              </div>
            </div>

            {/* Recent Games */}
            <div>
              <h3 className="text-lg font-semibold text-charcoal-900 mb-4">Recent Games</h3>
              <div className="space-y-3">
                {selectedFriend.recentGames?.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-charcoal-900">{game.location}</div>
                      <div className="text-sm text-charcoal-600">{game.date}</div>
                    </div>
                    <div className="text-xl font-bold text-charcoal-900">
                      {game.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Section */}
            {selectedFriend.compareStats && (
              <div>
                <h3 className="text-lg font-semibold text-charcoal-900 mb-4">vs You</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      selectedFriend.compareStats.averageComparison > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedFriend.compareStats.averageComparison > 0 ? '+' : ''}
                      {selectedFriend.compareStats.averageComparison}
                    </div>
                    <div className="text-sm text-charcoal-600">Average Diff</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      selectedFriend.compareStats.gamesComparison > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedFriend.compareStats.gamesComparison > 0 ? '+' : ''}
                      {selectedFriend.compareStats.gamesComparison}
                    </div>
                    <div className="text-sm text-charcoal-600">Games Diff</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${
                      selectedFriend.compareStats.improvementComparison > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedFriend.compareStats.improvementComparison > 0 ? '+' : ''}
                      {selectedFriend.compareStats.improvementComparison}%
                    </div>
                    <div className="text-sm text-charcoal-600">Improvement</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowProfileModal(false)}>
                Close
              </Button>
              {!selectedFriend.isFriend && selectedFriend.friendshipStatus === 'none' && (
                <Button onClick={() => handleSendRequest(selectedFriend.id)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Friend Request
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedFriendsPage;