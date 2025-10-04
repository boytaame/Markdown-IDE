import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import FileExplorer from './components/FileExplorer';
import Toolbar from './components/Toolbar';
import Tabs from './components/Tabs';
import { File, Group } from './types';
import { listen } from '@tauri-apps/api/event';
import GroupNameModal from './components/GroupNameModal';
import { DropResult } from 'react-beautiful-dnd';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [openFiles, setOpenFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isGroupNameModalOpen, setIsGroupNameModalOpen] = useState(false);
  const [groupModalFiles, setGroupModalFiles] = useState<string[]>([]);

  useEffect(() => {
    const mockFiles: File[] = [
      { id: '1', name: 'welcome.md', content: '# Welcome!', isPinned: true },
      { id: '2', name: 'getting-started.md', content: '## Getting Started' },
      { id: '3', name: 'feature-cheatsheet.md', content: '### Cheatsheet' },
      { id: '4', name: 'project-ideas.md', content: '## Project Ideas' },
    ];
    setFiles(mockFiles);
    setActiveFile(mockFiles[0]);
    setOpenFiles([mockFiles[0]]);
  }, []);

  const handleNewFile = () => {
    const newFile: File = { id: `file_${Date.now()}`, name: 'untitled.md', content: '' };
    setFiles(p => [...p, newFile]);
    setActiveFile(newFile);
    setOpenFiles(p => [...p, newFile]);
  };

  const handleFileClick = (file: File) => {
    setActiveFile(file);
    if (!openFiles.some(f => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
  };

  const handleFileSelect = (e: React.MouseEvent, fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (e.ctrlKey || e.metaKey) {
      if (newSelection.has(fileId)) newSelection.delete(fileId);
      else newSelection.add(fileId);
    } else {
      newSelection.clear();
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const handleContentChange = (content: string) => {
    if (activeFile) {
      const updatedFile = { ...activeFile, content };
      const updater = (files: File[]) => files.map(f => (f.id === activeFile.id ? updatedFile : f));
      setFiles(updater);
      setOpenFiles(updater);
      setActiveFile(updatedFile);
    }
  };

  const handleCloseTab = (fileId: string) => {
    const newOpenFiles = openFiles.filter(f => f.id !== fileId);
    setOpenFiles(newOpenFiles);
    if (activeFile?.id === fileId) {
      setActiveFile(newOpenFiles[0] || null);
    }
  };
  
  const handleReorderTabs = (reorderedIds: string[]) => {
    const reorderedOpenFiles = reorderedIds.map(id => openFiles.find(f => f.id === id)).filter((f): f is File => !!f);
    setOpenFiles(reorderedOpenFiles);
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
    handleCloseTab(fileId);
    setGroups(prev => prev.map(g => ({ ...g, fileIds: g.fileIds.filter(id => id !== fileId) })));
  };

  const handleTogglePin = (fileId: string) => {
    const fileToPin = files.find(f => f.id === fileId);
    if (!fileToPin) return;

    const isPinned = !fileToPin.isPinned;
    setFiles(files.map(f => (f.id === fileId ? { ...f, isPinned } : f)));

    if (isPinned) {
      setGroups(prev => prev.map(g => ({ ...g, fileIds: g.fileIds.filter(id => id !== fileId) })));
    }
  };

  const handleOpenGroupNameModal = (fileIds: string[]) => {
    setGroupModalFiles(fileIds);
    setIsGroupNameModalOpen(true);
  };

  const handleNewGroup = (groupName: string, fileIds: string[]) => {
    if (!groupName || fileIds.length === 0) {
      setIsGroupNameModalOpen(false);
      return;
    }
    const newGroup: Group = { id: `group_${Date.now()}`, name: groupName, fileIds, isCollapsed: false };
    setGroups(prev => [...prev, newGroup]);
    setFiles(prev => prev.map(f => (fileIds.includes(f.id) ? { ...f, isPinned: false } : f)));
    setIsGroupNameModalOpen(false);
    setSelectedFiles(new Set());
  };

  const handleRemoveFromGroup = (fileId: string) => {
    setGroups(prev => prev.map(g => ({ ...g, fileIds: g.fileIds.filter(id => id !== fileId) })));
  };

  const handleToggleGroup = (groupId: string) => {
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g)));
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;

    if (type === 'group') {
      const reordered = Array.from(groups);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setGroups(reordered);
      return;
    }

    let newFiles = [...files];
    let newGroups = [...groups];

    // Remove from source
    if (source.droppableId.startsWith('group-')) {
      const group = newGroups.find(g => g.id === source.droppableId);
      if (group) group.fileIds.splice(source.index, 1);
    }

    // Add to destination
    if (destination.droppableId.startsWith('group-')) {
      const group = newGroups.find(g => g.id === destination.droppableId);
      if (group) {
        group.fileIds.splice(destination.index, 0, draggableId);
        newFiles = newFiles.map(f => (f.id === draggableId ? { ...f, isPinned: false } : f));
      }
    } else if (destination.droppableId === 'pinned') {
      newFiles = newFiles.map(f => (f.id === draggableId ? { ...f, isPinned: true } : f));
    } else if (destination.droppableId === 'files') {
      newFiles = newFiles.map(f => (f.id === draggableId ? { ...f, isPinned: false } : f));
    }

    setFiles(newFiles);
    setGroups(newGroups);
  };

  return (
    <div className="flex h-screen bg-primary text-text-primary">
      <FileExplorer
        files={files}
        groups={groups}
        activeFile={activeFile}
        selectedFiles={selectedFiles}
        onFileClick={handleFileClick}
        onFileSelect={handleFileSelect}
        onNewFile={handleNewFile}
        onDeleteFile={handleDeleteFile}
        onTogglePin={handleTogglePin}
        onNewGroupRequest={handleOpenGroupNameModal}
        onRemoveFromGroup={handleRemoveFromGroup}
        onToggleGroup={handleToggleGroup}
        onDragEnd={onDragEnd}
      />
      <div className="flex flex-col flex-1">
        <Toolbar file={activeFile} onContentChange={handleContentChange} />
        <Tabs
          openFiles={openFiles}
          activeFile={activeFile}
          onTabClick={handleFileClick}
          onCloseTab={handleCloseTab}
          onReorderTabs={handleReorderTabs}
        />
        {activeFile ? (
          <Editor
            key={activeFile.id}
            file={activeFile}
            onContentChange={handleContentChange}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            Select a file to start editing or create a new one.
          </div>
        )}
      </div>
      {isGroupNameModalOpen && (
        <GroupNameModal
          onClose={() => setIsGroupNameModalOpen(false)}
          onSubmit={name => handleNewGroup(name, groupModalFiles)}
        />
      )}
    </div>
  );
};

export default App;
