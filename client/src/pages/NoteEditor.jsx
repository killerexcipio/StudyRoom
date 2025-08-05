import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TagSelector from '../components/TagSelector';
import api from '../api/axios';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [note, setNote] = useState({
    title: '',
    content: '',
    tags: [],
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchNote();
    }
    fetchAvailableTags();
  }, [id, isEditing]);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/notes/${id}`);
      setNote(response.data.note);
    } catch (error) {
      setError('Failed to load note');
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await api.get('/notes/tags');
      setAvailableTags(response.data.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      if (isEditing) {
        await api.put(`/notes/${id}`, note);
      } else {
        const response = await api.post('/notes', note);
        navigate(`/note/${response.data.note._id}`, { replace: true });
      }
      setLastSaved(new Date());
    } catch (error) {
      setError('Failed to save note');
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await api.delete(`/notes/${id}`);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to delete note');
      console.error('Error deleting note:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setNote(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagsChange = (newTags) => {
    setNote(prev => ({
      ...prev,
      tags: newTags,
    }));
  };

  // Content tools handlers
  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const imageMarkdown = `![Image](${url})`;
      handleInputChange('content', note.content + '\n\n' + imageMarkdown);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    const text = prompt('Enter link text:') || url;
    if (url) {
      const linkMarkdown = `[${text}](${url})`;
      handleInputChange('content', note.content + linkMarkdown);
    }
  };

  const insertList = () => {
    const listItems = '- Item 1\n- Item 2\n- Item 3';
    handleInputChange('content', note.content + '\n\n' + listItems);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Navbar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Notes
              </button>
              
              <div className="flex items-center space-x-4">
                {lastSaved && (
                  <span className="text-sm text-gray-500">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                
                {isEditing && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Editor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* Title Field */}
              <input
                type="text"
                placeholder="Note title..."
                value={note.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none mb-6"
              />

              {/* Tags */}
              <div className="mb-6">
                <TagSelector
                  selectedTags={note.tags}
                  onTagsChange={handleTagsChange}
                  availableTags={availableTags}
                />
              </div>

              {/* Content Area */}
              <textarea
                placeholder="Start writing your note..."
                value={note.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="w-full h-96 text-gray-700 placeholder-gray-400 border-none outline-none resize-none"
              />

              {/* Content Tools */}
              <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
                <div className="flex space-x-6">
                  <button
                    type="button"
                    onClick={insertImage}
                    className="flex flex-col items-center p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="Add Image"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={insertLink}
                    className="flex flex-col items-center p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="Add Link"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={insertList}
                    className="flex flex-col items-center p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="Add List"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">List</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInputChange('content', note.content + '\n\n### New Section\n\n')}
                    className="flex flex-col items-center p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="Add Section"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-xs text-gray-600 mt-1">Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NoteEditor;