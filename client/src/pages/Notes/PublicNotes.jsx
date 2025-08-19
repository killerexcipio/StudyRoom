// client/src/pages/Notes/PublicNotes.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Heart, Share2, BookOpen } from 'lucide-react';
import NoteCard from '../../components/NoteCard';
import UserAvatar from '../../components/UserAvatar';

const PublicNotes = () => {
  const [publicNotes, setPublicNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchPublicNotes = async () => {
      setLoading(true);
      try {
        // Simulate API call
        const mockNotes = [
          {
            _id: '1',
            title: 'Introduction to React Hooks',
            content: 'A comprehensive guide to understanding and using React Hooks in your applications...',
            author: {
              _id: 'user1',
              name: 'John Doe',
              avatar: null
            },
            tags: ['react', 'javascript', 'frontend'],
            likes: 45,
            views: 230,
            isPublic: true,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
          },
          {
            _id: '2',
            title: 'Advanced CSS Grid Techniques',
            content: 'Learn advanced CSS Grid layouts and responsive design patterns...',
            author: {
              _id: 'user2',
              name: 'Jane Smith',
              avatar: null
            },
            tags: ['css', 'grid', 'layout', 'responsive'],
            likes: 38,
            views: 180,
            isPublic: true,
            createdAt: new Date('2024-01-14'),
            updatedAt: new Date('2024-01-14')
          },
          {
            _id: '3',
            title: 'Node.js Best Practices',
            content: 'Essential best practices for building scalable Node.js applications...',
            author: {
              _id: 'user3',
              name: 'Mike Johnson',
              avatar: null
            },
            tags: ['nodejs', 'backend', 'javascript'],
            likes: 62,
            views: 320,
            isPublic: true,
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-13')
          }
        ];
        
        setPublicNotes(mockNotes);
        setFilteredNotes(mockNotes);
      } catch (error) {
        console.error('Failed to fetch public notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicNotes();
  }, []);

  useEffect(() => {
    filterAndSortNotes();
  }, [searchQuery, selectedCategory, sortBy, publicNotes]);

  const filterAndSortNotes = () => {
    let filtered = [...publicNotes];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        note.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(note =>
        note.tags.includes(selectedCategory)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes;
        case 'views':
          return b.views - a.views;
        case 'recent':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    setFilteredNotes(filtered);
  };

  const handleLikeNote = (noteId) => {
    setPublicNotes(prev => prev.map(note => 
      note._id === noteId 
        ? { ...note, likes: note.likes + 1 }
        : note
    ));
  };

  const handleShareNote = (note) => {
    if (navigator.share) {
      navigator.share({
        title: note.title,
        text: note.content.substring(0, 100) + '...',
        url: window.location.href + `/note/${note._id}`
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href + `/note/${note._id}`);
      alert('Link copied to clipboard!');
    }
  };

  const categories = ['all', ...new Set(publicNotes.flatMap(note => note.tags))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Public Notes</h1>
        <p className="text-gray-600">Discover and explore notes shared by the community</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search notes, authors, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Liked</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {searchQuery || selectedCategory !== 'all' 
              ? 'No notes found' 
              : 'No public notes available'
            }
          </h3>
          <p className="text-gray-500">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Be the first to share a note with the community!'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <PublicNoteCard
              key={note._id}
              note={note}
              onLike={handleLikeNote}
              onShare={handleShareNote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PublicNoteCard = ({ note, onLike, onShare }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Author Info */}
      <div className="flex items-center space-x-3 mb-4">
        <UserAvatar user={note.author} size="sm" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{note.author.name}</p>
          <p className="text-xs text-gray-500">{formatDate(note.updatedAt)}</p>
        </div>
      </div>

      {/* Note Content */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
        {note.title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {note.content}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {note.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
        {note.tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            +{note.tags.length - 3}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Eye size={14} />
            <span>{note.views}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart size={14} />
            <span>{note.likes}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onLike(note._id)}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <Heart size={16} />
          </button>
          <button
            onClick={() => onShare(note)}
            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicNotes;
