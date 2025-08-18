// client/src/pages/Whiteboard/WhiteboardCanvas.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PenTool, Eraser, Minus, Plus, Save, ArrowLeft, Tag } from 'lucide-react';
import TagSelector from '../../components/TagSelector';
import { saveWhiteboard, getWhiteboard } from '../../features/whiteboard/whiteboardSlice';

const WhiteboardCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
  const [brushSize, setBrushSize] = useState(5);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentWhiteboard, loading } = useSelector(state => state.whiteboard);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set initial canvas properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing whiteboard if editing
    if (id && id !== 'new') {
      dispatch(getWhiteboard(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentWhiteboard && canvasRef.current) {
      setTitle(currentWhiteboard.title || '');
      setTags(currentWhiteboard.tags || []);
      
      // Load canvas data if exists
      if (currentWhiteboard.canvasData) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = currentWhiteboard.canvasData;
      }
    }
  }, [currentWhiteboard]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const pos = getMousePos(e);
    setLastPos(pos);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentPos = getMousePos(e);

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'pen' ? '#2563eb' : 'rgba(0,0,0,1)';

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    setLastPos(currentPos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    const canvasData = canvas.toDataURL();
    
    const whiteboardData = {
      title: title || 'Untitled Whiteboard',
      tags,
      canvasData,
      ...(id && id !== 'new' && { _id: id })
    };

    await dispatch(saveWhiteboard(whiteboardData));
    navigate('/whiteboard');
  };

  const handleTagAdd = (selectedTags) => {
    setTags(selectedTags);
    setShowTagSelector(false);
  };

  const removeBrushSize = () => {
    setBrushSize(prev => Math.max(1, prev - 1));
  };

  const addBrushSize = () => {
    setBrushSize(prev => Math.min(20, prev + 1));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/whiteboard')}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Whiteboard"
              className="text-xl font-semibold bg-transparent border-none outline-none text-gray-800"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTagSelector(true)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <Tag size={16} />
              <span>+ Tag</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Tags Display */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-center space-x-6">
          {/* Drawing Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-3 rounded-full ${
                tool === 'pen' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PenTool size={20} />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-3 rounded-full ${
                tool === 'eraser' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Eraser size={20} />
            </button>
          </div>

          {/* Brush Size */}
          <div className="flex items-center space-x-2">
            <button
              onClick={removeBrushSize}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Minus size={16} />
            </button>
            <div className="flex items-center space-x-2">
              <div
                className="bg-blue-600 rounded-full"
                style={{
                  width: `${Math.max(8, brushSize)}px`,
                  height: `${Math.max(8, brushSize)}px`
                }}
              />
              <span className="text-sm text-gray-600 w-8">{brushSize}px</span>
            </div>
            <button
              onClick={addBrushSize}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Clear */}
          <button
            onClick={clearCanvas}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>

      {/* Tag Selector Modal */}
      {showTagSelector && (
        <TagSelector
          selectedTags={tags}
          onTagsChange={handleTagAdd}
          onClose={() => setShowTagSelector(false)}
        />
      )}
    </div>
  );
};

export default WhiteboardCanvas;