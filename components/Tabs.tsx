import React, { useState, DragEvent } from 'react';
import Tab from './Tab';
import { MarkdownFile } from '../types';

interface TabsProps {
  openFiles: MarkdownFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCloseFile: (id: string) => void;
  onReorderTabs: (reorderedIds: string[]) => void;
}

const Tabs: React.FC<TabsProps> = ({ openFiles, activeFileId, onSelectFile, onCloseFile, onReorderTabs }) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ fileId: string; position: 'left' | 'right' } | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (id === draggedTabId) {
      setDropIndicator(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    if (e.clientX < mid) {
      setDropIndicator({ fileId: id, position: 'left' });
    } else {
      setDropIndicator({ fileId: id, position: 'right' });
    }
  };

  const handleDrop = () => {
    if (draggedTabId && dropIndicator) {
      const { fileId: targetId, position } = dropIndicator;
      if (draggedTabId === targetId) {
          setDraggedTabId(null);
          setDropIndicator(null);
          return;
      }
      
      const reorderedIds = openFiles.map(f => f.id);
      const draggedIndex = reorderedIds.indexOf(draggedTabId);
      reorderedIds.splice(draggedIndex, 1);
      
      const targetIndex = reorderedIds.indexOf(targetId);

      if (position === 'left') {
        reorderedIds.splice(targetIndex, 0, draggedTabId);
      } else {
        reorderedIds.splice(targetIndex + 1, 0, draggedTabId);
      }
      onReorderTabs(reorderedIds);
    }
    setDraggedTabId(null);
    setDropIndicator(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDropIndicator(null);
  };

  return (
    <>
      <div 
        className="flex bg-primary border-b border-gray-700 overflow-x-auto tabs-container"
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onDragLeave={() => setDropIndicator(null)}
      >
        {openFiles.map(file => (
          <Tab
            key={file.id}
            id={file.id}
            fileName={file.name}
            isActive={file.id === activeFileId}
            onClick={() => onSelectFile(file.id)}
            onClose={() => onCloseFile(file.id)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            isDragging={file.id === draggedTabId}
            dropIndicator={dropIndicator?.fileId === file.id ? dropIndicator.position : null}
          />
        ))}
      </div>
      <style>{`
        .tabs-container::-webkit-scrollbar {
          height: 2px; /* Thinner scrollbar */
        }

        .tabs-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .tabs-container::-webkit-scrollbar-thumb {
          background-color: #7aa2f7;
          border-radius: 2px;
        }

        /* Explicitly hide scrollbar buttons (arrows) */
        .tabs-container::-webkit-scrollbar-button {
            display: none;
        }
        
        .tabs-container {
            scrollbar-width: thin;
            scrollbar-color: #7aa2f7 transparent;
        }
      `}</style>
    </>
  );
};

export default Tabs;
