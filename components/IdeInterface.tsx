import React, { useState, useCallback, useEffect } from 'react';
import { MarkdownFile } from '../types';
import FileExplorer from './FileExplorer';
import Editor from './Editor';
import Preview from './Preview';
import Toolbar from './Toolbar';
import { v4 as uuidv4 } from 'uuid';

// Storage key for persisting editor state
const STORAGE_KEY = 'markdown-ide-state';

type PersistedState = {
  files: MarkdownFile[];
  activeFileId: string | null;
};

const IdeInterface: React.FC = () => {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const activeFile = files.find(file => file.id === activeFileId);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        if (Array.isArray(parsed.files) && parsed.files.length > 0) {
          setFiles(parsed.files);
          setActiveFileId(parsed.activeFileId ?? parsed.files[0]?.id ?? null);
          return;
        }
      }
    } catch (_) {
      // ignore parse errors and fall back to default
    }
    // Fallback to default welcome file
    const defaultFile: MarkdownFile = {
      id: '1',
      name: 'welcome.md',
      content:
        '# Welcome to Markdown IDE!\n\nThis is a simple markdown editor.\n\n- Create new files\n- Import local files\n- Save your work\n\nEnjoy!',
    };
    setFiles([defaultFile]);
    setActiveFileId(defaultFile.id);
  }, []);

  // Persist to localStorage whenever files or active file changes
  useEffect(() => {
    const state: PersistedState = { files, activeFileId };
    if (files.length > 0) { // Only save if there's something to save
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_) {
          // storage may be unavailable (private mode); ignore
        }
    }
  }, [files, activeFileId]);

  const updateActiveFileContent = useCallback((content: string) => {
    setFiles(currentFiles =>
      currentFiles.map(file =>
        file.id === activeFileId ? { ...file, content } : file
      )
    );
  }, [activeFileId]);

  const handleCreateFile = () => {
    const newFileName = `new-file-${files.length + 1}.md`;
    const newFile: MarkdownFile = {
      id: uuidv4(),
      name: newFileName,
      content: `# ${newFileName}\n`,
    };
    setFiles(prevFiles => [...prevFiles, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile: MarkdownFile = {
          id: uuidv4(),
          name: file.name,
          content,
        };
        setFiles(prevFiles => [...prevFiles, newFile]);
        setActiveFileId(newFile.id);
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
        onCreateFile={handleCreateFile}
        onImportFile={handleImportFile}
        onSaveFile={handleSaveFile}
        onTogglePreview={() => setIsPreviewVisible(!isPreviewVisible)}
        isPreviewVisible={isPreviewVisible}
        activeFileName={activeFile?.name}
      />
      <div className="flex flex-1 overflow-hidden">
        <FileExplorer 
          files={files} 
          activeFileId={activeFileId} 
          onSelectFile={setActiveFileId}
          onDeleteFile={handleDeleteFile}
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