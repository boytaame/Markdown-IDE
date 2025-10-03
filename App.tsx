import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import FileExplorer from './components/FileExplorer';
import Toolbar from './components/Toolbar';
import Tabs from './components/Tabs';
import { File, Group } from './types';
import { listen } from '@tauri-apps/api/event';
import GroupNameModal from './components/GroupNameModal';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [openFiles, setOpenFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isGroupNameModalOpen, setIsGroupNameModalOpen] = useState(false);

  useEffect(() => {
    const unlisten = listen('new-file', (event) => {
      const newFile = event.payload as File;
      setFiles(prevFiles => [...prevFiles, newFile]);
      setActiveFile(newFile);
      setOpenFiles(prevOpen => [...prevOpen, newFile]);
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  const handleNewFile = () => {
    const newFile: File = {
      id: `file_${Date.now()}`,
      name: 'untitled',
      content: '',
    };
    setFiles([...files, newFile]);
    setActiveFile(newFile);
    setOpenFiles([...openFiles, newFile]);
  };

  const handleFileClick = (file: File) => {
    setActiveFile(file);
    if (!openFiles.some(f => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
  };

  const handleFileSelect = (e: React.MouseEvent, fileId: string) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedFiles(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(fileId)) {
          newSelection.delete(fileId);
        } else {
          newSelection.add(fileId);
        }
        return newSelection;
      });
    } else {
      setSelectedFiles(new Set([fileId]));
    }
  };

  const handleContentChange = (content: string) => {
    if (activeFile) {
      const updatedFile = { ...activeFile, content };
      setActiveFile(updatedFile);
      setFiles(files.map(f => f.id === activeFile.id ? updatedFile : f));
      setOpenFiles(openFiles.map(f => f.id === activeFile.id ? updatedFile : f));
    }
  };

  const handleCloseTab = (fileId: string) => {
    setOpenFiles(openFiles.filter(f => f.id !== fileId));
    if (activeFile?.id === fileId) {
      const nextFile = openFiles.filter(f => f.id !== fileId)[0] || null;
      setActiveFile(nextFile);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
    setOpenFiles(openFiles.filter(f => f.id !== fileId));
    if (activeFile?.id === fileId) {
      const nextFile = files.filter(f => f.id !== fileId)[0] || null;
      setActiveFile(nextFile);
    }
  };

  const handleTogglePin = (fileId: string) => {
    setFiles(files.map(f => f.id === fileId ? { ...f, isPinned: !f.isPinned } : f));
  };

  const handleNewGroup = (groupName: string, fileIds: string[]) => {
    const newGroup: Group = {
      id: `group_${Date.now()}`,
      name: groupName,
      fileIds,
    };
    setGroups([...groups, newGroup]);
    setIsGroupNameModalOpen(false);
    setSelectedFiles(new Set());
  };

  const handleRemoveFromGroup = (fileId: string) => {
    setGroups(groups.map(g => ({
      ...g,
      fileIds: g.fileIds.filter(id => id !== fileId),
    })));
  };

  const handleToggleGroup = (groupId: string) => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g));
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
        onNewGroup={() => setIsGroupNameModalOpen(true)}
        onRemoveFromGroup={handleRemoveFromGroup}
        onToggleGroup={handleToggleGroup}
      />
      <div className="flex flex-col flex-1">
        <Toolbar />
        <Tabs
          openFiles={openFiles}
          activeFile={activeFile}
          onTabClick={handleFileClick}
          onCloseTab={handleCloseTab}
        />
        {activeFile && (
          <Editor
            key={activeFile.id}
            file={activeFile}
            onContentChange={handleContentChange}
          />
        )}
      </div>
      {isGroupNameModalOpen && (
        <GroupNameModal
          onClose={() => setIsGroupNameModalOpen(false)}
          onSubmit={(name) => handleNewGroup(name, Array.from(selectedFiles))}
        />
      )}
    </div>
  );
};

export default App;
