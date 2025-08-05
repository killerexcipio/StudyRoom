import React from 'react';
import { useNavigate } from 'react-router-dom';

const NoteCard = ({ note, isAddCard = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isAddCard) {
      navigate('/note');
    } else {
      navigate(`/note/${note._id}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isAddCard) {
    return (
      <div
        onClick={handleClick}
        className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center min-h-[200px]"
      >
        {/* Alternative with Styled-Components:
        const AddCardContainer = styled.div`
          background: white;
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          padding: 1.5rem;
          cursor: pointer;
          &:hover {
            border-color: #60a5fa;
            background: #eff6ff;
          }
        `;
        
        Alternative with Material-UI:
        <Card sx={{ border: '2px dashed #ccc', '&:hover': { borderColor: 'primary.main' } }}>
        */}
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <p className="text-gray-600 font-medium">Add New Note</p>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow min-h-[200px] flex flex-col"
    >
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {note.title || 'Untitled Note'}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {note.content || 'No content yet...'}
        </p>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {note.tags?.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{note.tags.length - 2}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </div>
  );
};

export default NoteCard;