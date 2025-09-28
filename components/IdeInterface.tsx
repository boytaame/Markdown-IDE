
import React, { useState, useCallback } from 'react';
import { MarkdownFile } from '../types';
import FileExplorer from './FileExplorer';
import Editor from './Editor';
import Preview from './Preview';
import Toolbar from './Toolbar';
import { v4 as uuidv4 } from 'uuid'; // Simple uuid, in a real app use a library

const IdeInterface: React.FC = () => {
  const [files, setFiles] = useState<MarkdownFile[]>([
    { id: '1', name: 'welcome.md', content: '# Welcome to Markdown IDE!\n\nThis is a simple markdown editor.\n\n- Create new files\n- Import local files\n- Save your work\n\nEnjoy!' },
  ]);
  const [activeFileId, setActiveFileId] = useState<string | null>('1');
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  const activeFile = files.find(file => file.id === activeFileId);

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
            <div className={isPreviewVisible ? 'w-1/2' : 'w-full'}>
              <Editor file={activeFile} onContentChange={updateActiveFileContent} />
            </div>
            {isPreviewVisible && (
              <div className="w-1/2 border-l border-gray-600">
                <Preview content={activeFile.content} />
              </div>
            )}
          </div>
        ) : (
            <div className="flex-1 flex items-center justify-center bg-secondary text-text-secondary">
                <p>Select a file to start editing or create a new one.</p>
            </div>
        )}
      </div>
    </div>
  );
};



export default IdeInterface;
