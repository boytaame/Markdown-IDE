import React, { useState, useCallback, useEffect, useRef } from 'react';
import { File } from '../types';
import FileExplorer from './FileExplorer';
import Editor from './Editor';
import Preview from './Preview';
import Toolbar from './Toolbar';
import Tabs from './Tabs';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'markdown-ide-state';
const MIN_SIDEBAR_WIDTH = 200; // Minimum width for the sidebar
const MAX_SIDEBAR_WIDTH = 500; // Maximum width for the sidebar

type PersistedState = {
  files: File[];
  openFileIds: string[];
  activeFileId: string | null;
  sidebarWidth?: number;
  sidebarVisible?: boolean;
};

const IdeInterface: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true); 
  const sidebarRef = useRef<HTMLDivElement>(null);

  const openFiles = openFileIds.map(id => files.find(f => f.id === id)).filter((f): f is File => !!f);
  const activeFile = files.find(file => file.id === activeFileId);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        if (Array.isArray(parsed.files) && parsed.files.length > 0) {
          const loadedFiles = parsed.files.map(f => ({ ...f, isPinned: f.isPinned ?? false }));
          setFiles(loadedFiles);
          const fileIds = loadedFiles.map(f => f.id);
          const validOpenFileIds = parsed.openFileIds?.filter(id => fileIds.includes(id)) ?? [];
          setOpenFileIds(validOpenFileIds);
          setActiveFileId(parsed.activeFileId ?? validOpenFileIds[0] ?? null);
          setSidebarWidth(parsed.sidebarWidth ?? 256);
          setSidebarVisible(parsed.sidebarVisible ?? true);
          return;
        }
      }
    } catch (_) {
      // Fallback to default state
    }
    const defaultFile: File = {
      id: '1',
      name: 'welcome.md',
      content: '# Welcome to your Markdown IDE!\n\nStart typing...\n',
      isPinned: false,
    };
    setFiles([defaultFile]);
    setOpenFileIds([defaultFile.id]);
    setActiveFileId(defaultFile.id);
  }, []);

  useEffect(() => {
    const state: PersistedState = { files, openFileIds, activeFileId, sidebarWidth, sidebarVisible };
    if (files.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_) {
          // Storage may be unavailable
        }
    }
  }, [files, openFileIds, activeFileId, sidebarWidth, sidebarVisible]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth < MIN_SIDEBAR_WIDTH / 2) {
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
        setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(newWidth, MAX_SIDEBAR_WIDTH)));
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if(isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 'b') {
            event.preventDefault();
            toggleSidebar();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]);


  const updateActiveFileContent = useCallback((content: string) => {
    setFiles(currentFiles =>
      currentFiles.map(file =>
        file.id === activeFileId ? { ...file, content } : file
      )
    );
  }, [activeFileId]);

  const handleSelectFile = (file: File) => {
    if (!openFileIds.includes(file.id)) {
      setOpenFileIds(prev => [...prev, file.id]);
    }
    setActiveFileId(file.id);
  };

  const handleCloseFile = (id: string) => {
    const newOpenFileIds = openFileIds.filter(fileId => fileId !== id);
    setOpenFileIds(newOpenFileIds);
    if (activeFileId === id) {
      const newActiveFileId = newOpenFileIds.length > 0 ? newOpenFileIds[0] : null;
      setActiveFileId(newActiveFileId);
    }
  };

  const handleCreateFile = () => {
    const newFileName = `new-file-${files.length + 1}.md`;
    const newFile: File = {
      id: uuidv4(),
      name: newFileName,
      content: `# ${newFileName}\n`,
      isPinned: false,
    };
    setFiles(prevFiles => [...prevFiles, newFile]);
    handleSelectFile(newFile);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile: File = {
          id: uuidv4(),
          name: file.name,
          content,
          isPinned: false,
        };
        setFiles(prevFiles => [...prevFiles, newFile]);
        handleSelectFile(newFile);
      };
      reader.readAsText(file);
    } else {
        alert("Please select a valid .md file.");
    }
  }; 
  
  const handleSaveFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDeleteFile = (fileId: string) => {
    setFiles(prevFiles => {
        const newFiles = prevFiles.filter(f => f.id !== fileId);
        if(activeFileId === fileId) {
            setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
        }
        return newFiles;
    });
    setOpenFileIds(prev => prev.filter(id => id !== fileId));
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles(prevFiles =>
      prevFiles.map(f => (f.id === fileId ? { ...f, name: newName } : f))
    );
  };

  const handleReorderFiles = (reorderedFiles: File[]) => {
    setFiles(reorderedFiles);
  };

  const handleReorderTabs = (reorderedIds: string[]) => {
    setOpenFileIds(reorderedIds);
  };

  const handleTogglePin = (fileId: string) => {
    setFiles(prevFiles =>
      prevFiles.map(f => (f.id === fileId ? { ...f, isPinned: !f.isPinned } : f))
    );
  };

  const handleDownloadAll = async () => {
    try {
      const anyWindow: any = window as any;
      if (anyWindow.showDirectoryPicker) {
        const dirHandle = await anyWindow.showDirectoryPicker({ mode: 'readwrite' });
        for (const f of files) {
          const fileHandle = await dirHandle.getFileHandle(f.name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(new Blob([f.content], { type: 'text/markdown;charset=utf-8' }));
          await writable.close();
        }
        alert('All files have been saved to the selected directory.');
        return;
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
    }

    for (const f of files) {
      const blob = new Blob([f.content], { type: 'text/markdown;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = f.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col h-screen font-mono bg-primary">
      <Toolbar 
        onNewFile={handleCreateFile}
        onImportFile={handleImportFile}
        onSaveFile={handleSaveFile}
        onTogglePreview={() => setIsPreviewVisible(!isPreviewVisible)}
        isPreviewVisible={isPreviewVisible}
        activeFileName={activeFile?.name}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && (
          <div ref={sidebarRef} style={{ width: sidebarWidth }} className="flex-shrink-0">
            <FileExplorer 
              files={files} 
              activeFile={activeFile}
              onFileClick={handleSelectFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onReorderFiles={handleReorderFiles}
              onTogglePin={handleTogglePin}
              // Grouping related props will be passed from App.tsx
              groups={[]} // Placeholder for groups
              selectedFiles={new Set()} // Placeholder for selectedFiles
              onNewFile={handleCreateFile} // Placeholder for onNewFile
              onNewGroupRequest={() => {}} // Placeholder
              onRemoveFromGroup={() => {}} // Placeholder
              onToggleGroup={() => {}} // Placeholder
              onDragEnd={() => {}} // Placeholder
              onFileSelect={() => {}} // Placeholder
            />
          </div>
        )}
        <div onMouseDown={handleMouseDown} className="w-1 cursor-col-resize bg-gray-700 hover:bg-accent transition-colors" />
        <div className="flex-1 flex flex-col bg-gray-700 overflow-hidden">
          <Tabs
            openFiles={openFiles}
            activeFile={activeFile}
            onTabClick={handleSelectFile}
            onCloseTab={handleCloseFile}
            onReorderTabs={handleReorderTabs}
          />
          {activeFile ? (
            <div className="flex-1 flex bg-gray-700 overflow-hidden">
              {isPreviewVisible ? (
                <div className="w-full h-full overflow-y-auto">
                  <Preview content={activeFile.content} />
                </div>
              ) : (
                <Editor file={activeFile} onContentChange={updateActiveFileContent} />
              )}
            </div>
          ) : (
              <div className="flex-1 flex items-center justify-center bg-secondary text-text-secondary">
                  <p>Select a file to start editing or create a new one.</p>
              </div>
          )}
        </div>
        <button
          onClick={handleDownloadAll}
          className="fixed bottom-2 left-2 bg-primary text-white shadow-lg hover:shadow-xl transition-shadow px-1 flex items-center gap-1"
          title="Download all files"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
          <span className="hidden sm:inline">Download All</span>
        </button>
      </div>
    </div>
  );
};

export default IdeInterface;
