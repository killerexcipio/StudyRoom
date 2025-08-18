import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, Filter, PenTool } from 'lucide-react';
import { getWhiteboards, deleteWhiteboard } from '../../features/whiteboard/whiteboardSlice';

const WhiteboardCard = ({ whiteboard, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onEdit(whiteboard._id)}
    >
      {/* Preview Canvas */}
      <div className="w-full h-32 bg-gray-50 rounded-lg mb-3 overflow-hidden">
        {whiteboard.canvasData ? (
          <img 
            src={whiteboard.canvasData} 
            alt="Whiteboard preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <PenTool size={24} />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
        {whiteboard.title || 'Untitled Whiteboard'}
      </h3>

      {/* Tags */}
      {whiteboard.tags && whiteboard.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {whiteboard.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {tag}
            </span>
          ))}
          {whiteboard.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{whiteboard.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{formatDate(whiteboard.updatedAt)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(whiteboard._id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

const AddWhiteboardCard = ({ onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="w-full h-32 flex items-center justify-center mb-3">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
          <Plus size={24} className="text-blue-600" />
        </div>
      </div>
      <h3 className="font-semibold text-gray-600 text-center group-hover:text-blue-600 transition-colors">
        Create New Whiteboard
      </h3>
    </div>
  );
};

const WhiteboardDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { whiteboards, loading, error } = useSelector(state => state.whiteboard);

  useEffect(() => {
    dispatch(getWhiteboards());
  }, [dispatch]);

  const handleCreateNew = () => {
    navigate('/whiteboard/new');
  };

  const handleEditWhiteboard = (id) => {
    navigate(`/whiteboard/${id}`);
  };

  const handleDeleteWhiteboard = async (id) => {
    if (window.confirm('Are you sure you want to delete this whiteboard?')) {
      await dispatch(deleteWhiteboard(id));
      dispatch(getWhiteboards()); // Refresh list
    }
  };

  // Get all unique tags
  const allTags = [...new Set(whiteboards.flatMap(w => w.tags || []))];

  // Filter whiteboards
  const filteredWhiteboards = whiteboards.filter(whiteboard => {
    const matchesSearch = whiteboard.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         whiteboard.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = !selectedTag || whiteboard.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Whiteboards</h1>
          <p className="text-gray-600 mt-1">
            {whiteboards.length} whiteboard{whiteboards.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search whiteboards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {allTags.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Whiteboards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Add New Whiteboard Card */}
        <AddWhiteboardCard onClick={handleCreateNew} />
        
        {/* Existing Whiteboards */}
        {filteredWhiteboards.map(whiteboard => (
          <WhiteboardCard
            key={whiteboard._id}
            whiteboard={whiteboard}
            onEdit={handleEditWhiteboard}
            onDelete={handleDeleteWhiteboard}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredWhiteboards.length === 0 && whiteboards.length > 0 && (
        <div className="text-center py-12">
          <PenTool className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No whiteboards found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {filteredWhiteboards.length === 0 && whiteboards.length === 0 && (
        <div className="text-center py-12">
          <PenTool className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Create your first whiteboard</h3>
          <p className="text-gray-500 mb-4">Start drawing and sketching your ideas.</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Create Whiteboard</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WhiteboardDashboard;