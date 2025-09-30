import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Clock, Check, X, TrendingUp, Award, Target } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner, { LoadingCard } from '../components/ui/Spinner';
import { friendAPI, userAPI } from '../lib/api';

/**
 * Friends Page Component
 * Complete social system with friends list, requests, and user search
 */
const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      setIsLoading(true);
      const [friendsResponse, requestsResponse] = await Promise.all([
        friendAPI.getFriends(),
        friendAPI.getFriendRequests()
      ]);
      
      setFriends(friendsResponse.data.friends);
      setRequests(requestsResponse.data.requests);
    } catch (err) {
      setError('Failed to load friends data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await userAPI.searchUsers(query);
      setSearchResults(response.data.users);
    } catch (err) {
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendAPI.sendFriendRequest(userId);
      // Update search results to reflect sent request
      setSearchResults(prev => prev.map(user => 
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
        // Reload friends list to include newly accepted friend
        loadFriendsData();
      }
    } catch (err) {
      setError('Failed to respond to request');
    }
  };

  const handleViewProfile = (friend) => {
    setSelectedFriend(friend);
    setShowProfileModal(true);
  };

  const tabs = [
    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
    { id: 'requests', label: 'Requests', icon: Clock, count: requests.length },
    { id: 'search', label: 'Find Friends', icon: Search, count: null }
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Friends" subtitle="Connect with other bowlers" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <LoadingCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Friends"
        subtitle="Connect with other bowlers and compare your progress"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <Card className="mb-6">
        <CardContent padding="none">
          <div className="flex border-b border-cream-200">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 p-4 text-center transition-colors relative ${
                  activeTab === id
                    ? 'text-teal-600 bg-teal-50 border-b-2 border-teal-500'
                    : 'text-charcoal-600 hover:text-charcoal-800 hover:bg-cream-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                  {count !== null && count > 0 && (
                    <span className="bg-coral-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'friends' && (
        <FriendsListTab 
          friends={friends} 
          onViewProfile={handleViewProfile}
        />
      )}

      {activeTab === 'requests' && (
        <RequestsTab 
          requests={requests}
          onRespond={handleRequestResponse}
        />
      )}

      {activeTab === 'search' && (
        <SearchTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onSearch={handleSearch}
          onSendRequest={handleSendRequest}
        />
      )}

      {/* Friend Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title={selectedFriend?.displayName}
        size="lg"
      >
        {selectedFriend && <FriendProfile friend={selectedFriend} />}
      </Modal>
    </div>
  );
};

// Friends List Tab Component
const FriendsListTab = ({ friends, onViewProfile }) => {
  if (friends.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-charcoal-900 font-heading mb-2">
              No Friends Yet
            </h3>
            <p className="text-charcoal-600">
              Start by searching for other bowlers to connect with!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {friends.map((friend) => (
        <Card key={friend.id} variant="interactive" onClick={() => onViewProfile(friend)}>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal-900">{friend.displayName}</h3>
                <p className="text-charcoal-600 text-sm">@{friend.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-charcoal-900">{friend.stats.totalGames}</p>
                <p className="text-xs text-charcoal-600">Games</p>
              </div>
              <div>
                <p className="text-lg font-bold text-charcoal-900">{friend.stats.averageScore}</p>
                <p className="text-xs text-charcoal-600">Average</p>
              </div>
              <div>
                <p className="text-lg font-bold text-charcoal-900">{friend.stats.highScore}</p>
                <p className="text-xs text-charcoal-600">High Score</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-cream-200">
              <p className="text-xs text-charcoal-500">
                Friends since {new Date(friend.friendsSince).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Requests Tab Component
const RequestsTab = ({ requests, onRespond }) => {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-charcoal-900 font-heading mb-2">
              No Pending Requests
            </h3>
            <p className="text-charcoal-600">
              Friend requests will appear here when you receive them.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-coral-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal-900">
                    {request.requester.displayName}
                  </h3>
                  <p className="text-charcoal-600 text-sm">@{request.requester.username}</p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-charcoal-500">
                    <span>{request.requester.stats.totalGames} games</span>
                    <span>{request.requester.stats.averageScore} avg</span>
                    <span>{request.requester.stats.highScore} high</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onRespond(request.id, 'accepted')}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRespond(request.id, 'declined')}
                >
                  <X className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Search Tab Component
const SearchTab = ({ searchQuery, setSearchQuery, searchResults, isSearching, onSearch, onSendRequest }) => {
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div>
      <Card className="mb-6">
        <CardContent>
          <Input
            label="Search for bowlers"
            placeholder="Enter username to find other players..."
            value={searchQuery}
            onChange={handleSearchChange}
            helperText="Find friends by their username"
          />
        </CardContent>
      </Card>

      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((user) => (
            <Card key={user.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-cream-200 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-charcoal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal-900">{user.displayName}</h3>
                      <p className="text-charcoal-600 text-sm">@{user.username}</p>
                      <p className="text-charcoal-500 text-xs">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {user.friendshipStatus === 'none' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSendRequest(user.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add Friend
                      </Button>
                    )}
                    {user.friendshipStatus === 'sent' && (
                      <Button variant="outline" size="sm" disabled>
                        Request Sent
                      </Button>
                    )}
                    {user.friendshipStatus === 'received' && (
                      <Button variant="secondary" size="sm">
                        Respond to Request
                      </Button>
                    )}
                    {user.friendshipStatus === 'friends' && (
                      <Button variant="ghost" size="sm" disabled>
                        Already Friends
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchQuery && !isSearching && searchResults.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
              <p className="text-charcoal-600">
                No users found matching "{searchQuery}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Friend Profile Component
const FriendProfile = ({ friend }) => {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900 font-heading">
          {friend.displayName}
        </h2>
        <p className="text-charcoal-600">@{friend.username}</p>
        <p className="text-charcoal-500 text-sm">
          Member since {new Date(friend.userCreatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cream-50 rounded-xl p-4 text-center">
          <Target className="w-8 h-8 text-teal-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-charcoal-900">{friend.stats.totalGames}</p>
          <p className="text-charcoal-600 text-sm">Total Games</p>
        </div>
        
        <div className="bg-cream-50 rounded-xl p-4 text-center">
          <TrendingUp className="w-8 h-8 text-coral-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-charcoal-900">{friend.stats.averageScore}</p>
          <p className="text-charcoal-600 text-sm">Average Score</p>
        </div>
        
        <div className="bg-cream-50 rounded-xl p-4 text-center">
          <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-charcoal-900">{friend.stats.highScore}</p>
          <p className="text-charcoal-600 text-sm">High Score</p>
        </div>
      </div>

      {/* Friendship Info */}
      <div className="bg-teal-50 rounded-xl p-4">
        <h3 className="font-semibold text-charcoal-900 mb-2">Friendship</h3>
        <p className="text-charcoal-600 text-sm">
          You've been friends since {new Date(friend.friendsSince).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default FriendsPage;