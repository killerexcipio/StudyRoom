// client/src/pages/Chat/GroupChat.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, UserPlus, Settings, Crown, UserMinus, Edit3 } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';
import { getChat, updateChat, addParticipants, removeParticipant } from '../../features/chat/chatSlice';
import { searchUsers } from '../../features/user/userSlice';

const GroupChatSettings = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editForm, setEditForm] = useState({
    chatName: '',
    description: ''
  });

  const { currentChat, loading } = useSelector(state => state.chat);
  const { searchResults } = useSelector(state => state.user);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (chatId) {
      dispatch(getChat(chatId));
    }
  }, [chatId, dispatch]);

  useEffect(() => {
    if (currentChat) {
      setEditForm({
        chatName: currentChat.chatName || '',
        description: currentChat.description || ''
      });
    }
  }, [currentChat]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        dispatch(searchUsers(searchQuery));
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, dispatch]);

  const isAdmin = currentChat?.admin?._id === user._id;

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      await dispatch(addParticipants({
        chatId,
        userIds: selectedUsers.map(u => u._id)
      }));
      setShowAddMembers(false);
      setSelectedUsers([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add members:', error);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await dispatch(removeParticipant({ chatId, userId }));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(updateChat({
        chatId,
        chatData: editForm
      }));
      setShowEditGroup(false);
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  if (loading || !currentChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Group Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Group Information</h2>
          {isAdmin && (
            <button
              onClick={() => setShowEditGroup(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Users size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{currentChat.chatName}</h3>
            <p className="text-gray-600">{currentChat.participants.length} members</p>
          </div>
        </div>

        {currentChat.description && (
          <p className="text-gray-700">{currentChat.description}</p>
        )}
      </div>

      {/* Members */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Members</h3>
          {isAdmin && (
            <button
              onClick={() => setShowAddMembers(true)}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <UserPlus size={16} />
              <span>Add Members</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {currentChat.participants.map(participant => (
            <div key={participant._id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserAvatar user={participant} size="md" showOnlineStatus />
                <div>
                  <p className="font-medium">{participant.name}</p>
                  <p className="text-sm text-gray-500">{participant.email}</p>
                </div>
                {participant._id === currentChat.admin?._id && (
                  <Crown size={16} className="text-yellow-500" />
                )}
              </div>
              
              {isAdmin && participant._id !== user._id && participant._id !== currentChat.admin?._id && (
                <button
                  onClick={() => handleRemoveMember(participant._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Add Members</h3>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              {selectedUsers.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <span
                        key={user._id}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        {user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto">
                {searchResults
                  .filter(user => !currentChat.participants.find(p => p._id === user._id))
                  .map(user => (
                    <div
                      key={user._id}
                      className={`flex items-center p-2 rounded cursor-pointer ${
                        selectedUsers.find(u => u._id === user._id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleUserSelection(user)}
                    >
                      <UserAvatar user={user} size="sm" className="mr-3" />
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {selectedUsers.find(u => u._id === user._id) && (
                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedUsers([]);
                  setSearchQuery('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembers}
                disabled={selectedUsers.length === 0}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Edit Group</h3>
            </div>
            
            <form onSubmit={handleUpdateGroup} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editForm.chatName}
                  onChange={(e) => setEditForm({ ...editForm, chatName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditGroup(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatSettings;

