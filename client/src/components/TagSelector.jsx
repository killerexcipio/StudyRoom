import React, { useState, useEffect, useRef } from 'react';

const TagSelector = ({ selectedTags = [], onTagsChange, availableTags = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowNewTagInput(false);
        setNewTag('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagToggle = (tag) => {
    const updatedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(updatedTags);
  };

  const handleNewTagAdd = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      onTagsChange([...selectedTags, newTag.trim()]);
      setNewTag('');
      setShowNewTagInput(false);
    }
  };

  const handleNewTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewTagAdd();
    } else if (e.key === 'Escape') {
      setShowNewTagInput(false);
      setNewTag('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tag Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        + Tag
      </button>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tag, index) => (
            <span
              key={index}
              className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleTagToggle(tag)}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {/* Available Tags */}
          {availableTags.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-2">Available Tags</div>
              {availableTags.map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                    selectedTags.includes(tag) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="mr-2">{selectedTags.includes(tag) ? '✓' : ''}</span>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Add New Tag */}
          <div className="border-t border-gray-200 p-2">
            {showNewTagInput ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleNewTagKeyPress}
                  placeholder="Enter new tag"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleNewTagAdd}
                  className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewTagInput(true)}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Tag
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector;