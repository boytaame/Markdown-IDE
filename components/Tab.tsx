import React, { DragEvent } from 'react';

interface TabProps {
  id: string;
  fileName: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, id: string) => void;
  isDragging: boolean;
  dropIndicator: 'left' | 'right' | null;
}

const Tab: React.FC<TabProps> = ({ id, fileName, isActive, onClick, onClose, onDragStart, onDragOver, isDragging, dropIndicator }) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e, id)}
      onClick={onClick}
      className={`relative flex items-center justify-between px-4 py-2 cursor-pointer border-r border-gray-700 transition-colors duration-200 ${isActive ? 'bg-secondary text-text-primary' : 'bg-primary text-text-secondary hover:bg-gray-700'} ${isDragging ? 'opacity-50' : ''}`}>
      {dropIndicator && (
        <div className={`absolute top-0 bottom-0 ${dropIndicator === 'left' ? '-left-px' : '-right-px'} w-0.5 bg-blue-500 z-10`} />
      )}
      <span className="truncate text-sm">{fileName}</span>
      <button
        onClick={handleClose}
        className="ml-4 w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center hover:bg-gray-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Tab;
