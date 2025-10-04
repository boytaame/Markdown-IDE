import React, { DragEvent, useRef } from 'react';
import Tab from './Tab';
import { File } from '../types'; // Changed MarkdownFile to File

interface TabsProps {
  openFiles: File[];
  activeFile: File | null; // Changed activeFileId to activeFile
  onTabClick: (file: File) => void; // Changed onSelectFile to onTabClick and id to file
  onCloseTab: (id: string) => void;
  onReorderTabs: (reorderedIds: string[]) => void;
}

const Tabs: React.FC<TabsProps> = ({ openFiles, activeFile, onTabClick, onCloseTab, onReorderTabs }) => {
  const draggedTabId = useRef<string | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    draggedTabId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropTargetId: string) => {
    e.preventDefault();
    if (!draggedTabId.current || draggedTabId.current === dropTargetId) return;

    const reorderedFiles = [...openFiles];
    const draggedIndex = reorderedFiles.findIndex(f => f.id === draggedTabId.current);
    const targetIndex = reorderedFiles.findIndex(f => f.id === dropTargetId);

    const [draggedItem] = reorderedFiles.splice(draggedIndex, 1);
    reorderedFiles.splice(targetIndex, 0, draggedItem);

    onReorderTabs(reorderedFiles.map(f => f.id));
    draggedTabId.current = null;
  };

  return (
    <div ref={tabsContainerRef} className="flex bg-secondary border-b border-accent/20 overflow-x-auto">
      {openFiles.map(file => (
        <div
          key={file.id}
          draggable
          onDragStart={(e) => handleDragStart(e, file.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, file.id)}
        >
          <Tab
            file={file}
            isActive={activeFile?.id === file.id}
            onSelect={() => onTabClick(file)}
            onClose={() => onCloseTab(file.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default Tabs;
