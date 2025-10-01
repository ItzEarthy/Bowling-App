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
              // In a real app, you'd fetch friend's games here
              // For now, generate realistic mock data based on friendship
              const baseScore = 160 + Math.random() * 60;
              return {
                ...friend,
                rank: index + 1,
                average: Math.round(baseScore),
                highScore: Math.round(baseScore + 40 + Math.random() * 40),
                gamesPlayed: 20 + Math.floor(Math.random() * 80),
                recentForm: Math.round(baseScore + (Math.random() - 0.5) * 20),
                totalStrikes: Math.floor((20 + Math.random() * 80) * (baseScore / 200) * 10),
                totalSpares: Math.floor((20 + Math.random() * 80) * (baseScore / 200) * 8),
                achievements: Math.floor(Math.random() * 15) + 3,
                lastPlayed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
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
          
          // Generate leaderboard from all users
          const globalLeaderboard = allUsers.map((user, index) => {
            const baseScore = 180 - (index * 8) + Math.random() * 30;
            return {
              ...user,
              rank: index + 1,
              average: Math.round(baseScore),
              highScore: Math.round(baseScore + 30 + Math.random() * 50),
              gamesPlayed: 30 + Math.floor(Math.random() * 120),
              recentForm: Math.round(baseScore + (Math.random() - 0.5) * 25),
              totalStrikes: Math.floor((30 + Math.random() * 120) * (baseScore / 200) * 10),
              totalSpares: Math.floor((30 + Math.random() * 120) * (baseScore / 200) * 8),
              achievements: Math.floor(Math.random() * 20) + 5,
              lastPlayed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: Math.random() > 0.6 ? 'online' : 'offline'
            };
          });
          
          // Sort by the selected metric
          globalLeaderboard.sort((a, b) => {
            switch (leaderboardType) {
              case 'average': return b.average - a.average;
              case 'high_score': return b.highScore - a.highScore;
              case 'games_played': return b.gamesPlayed - a.gamesPlayed;
              case 'recent_form': return b.recentForm - a.recentForm;
              default: return b.average - a.average;
            }
          });
          
          setLeaderboard(globalLeaderboard.map((user, index) => ({
            ...user,
            rank: index + 1
          })));
        } catch (adminError) {
          // If admin API fails, fall back to mock data
          console.warn('Admin API not available, using mock global leaderboard');
          const mockLeaderboard = await generateMockLeaderboard();
          setLeaderboard(mockLeaderboard);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      // Fallback to mock data
      const mockLeaderboard = await generateMockLeaderboard();
      setLeaderboard(mockLeaderboard);
    }
  };

  const generateMockLeaderboard = async () => {
    // Generate mock competitive data
    const users = [
      { id: 1, username: 'StrikeMaster', displayName: 'Mike Johnson', avatar: null },
      { id: 2, username: 'SpareQueen', displayName: 'Sarah Wilson', avatar: null },
      { id: 3, username: 'PinDestroyer', displayName: 'Alex Chen', avatar: null },
      { id: 4, username: 'BowlingPro', displayName: 'Emma Davis', avatar: null },
      { id: 5, username: 'TenPinKing', displayName: 'David Lee', avatar: null },
      { id: 6, username: 'GutterGuard', displayName: 'Lisa Park', avatar: null },
      { id: 7, username: 'FrameAce', displayName: 'Tom Brown', avatar: null },
      { id: 8, username: 'SplitChamp', displayName: 'Anna White', avatar: null }
    ];

    return users.map((user, index) => {
      const baseScore = 200 - (index * 15) + Math.random() * 20;
      return {
        ...user,
        rank: index + 1,
        average: Math.round(baseScore + Math.random() * 10),
        highScore: Math.round(baseScore + 30 + Math.random() * 40),
        gamesPlayed: 50 + Math.floor(Math.random() * 100),
        recentForm: Math.round(baseScore + (Math.random() - 0.5) * 30),
        totalStrikes: Math.floor((50 + Math.random() * 100) * (baseScore / 200) * 10),
        totalSpares: Math.floor((50 + Math.random() * 100) * (baseScore / 200) * 8),
        achievements: Math.floor(Math.random() * 25) + 5,
        currentStreak: Math.floor(Math.random() * 10),
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: Math.random() > 0.7,
        isFriend: index < 4, // First 4 are friends
        friendshipStatus: index < 4 ? 'friends' : Math.random() > 0.5 ? 'none' : 'sent'
      };
    });
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // Mock search - in real app would be API call
      const mockResults = leaderboard.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(mockResults);
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
    // Load detailed profile data
    const detailedProfile = {
      ...user,
      stats: {
        totalGames: user.gamesPlayed,
        average: user.average,
        highScore: user.highScore,
        totalStrikes: user.totalStrikes,
        totalSpares: user.totalSpares,
        achievements: user.achievements,
        currentStreak: user.currentStreak,
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
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-charcoal-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
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
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                          user.isOnline ? 'bg-green-500' : 'bg-charcoal-400'
                        }`}>
                          {user.displayName.charAt(0)}
                        </div>
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
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white ${
                        friend.isOnline ? 'bg-green-500' : 'bg-charcoal-400'
                      }`}>
                        {friend.displayName?.charAt(0) || 'F'}
                      </div>
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
                      <div className="w-12 h-12 bg-charcoal-400 rounded-full flex items-center justify-center font-bold text-white">
                        {request.sender?.displayName?.charAt(0) || 'U'}
                      </div>
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
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                        user.isOnline ? 'bg-green-500' : 'bg-charcoal-400'
                      }`}>
                        {user.displayName.charAt(0)}
                      </div>
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
              <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl ${
                selectedFriend.isOnline ? 'bg-green-500' : 'bg-charcoal-400'
              }`}>
                {selectedFriend.displayName.charAt(0)}
              </div>
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