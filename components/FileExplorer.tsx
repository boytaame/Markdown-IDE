import React, { useState, useEffect, useRef, DragEvent, useMemo } from 'react';
import { MarkdownFile } from '../types';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface FileExplorerProps {
  files: MarkdownFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onReorderFiles: (files: MarkdownFile[]) => void;
  onTogglePin: (id: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFileId, onSelectFile, onDeleteFile, onRenameFile, onReorderFiles, onTogglePin }) => {
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingFile, setDeletingFile] = useState<MarkdownFile | null>(null);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ fileId: string; position: 'top' | 'bottom' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { pinnedFiles, unpinnedFiles } = useMemo(() => {
    const pinned = files.filter(file => file.pinned);
    const unpinned = files.filter(file => !file.pinned);
    return { pinnedFiles: pinned, unpinnedFiles: unpinned };
  }, [files]);

  const filteredPinnedFiles = useMemo(() =>
    pinnedFiles.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [pinnedFiles, searchQuery]);

  const filteredUnpinnedFiles = useMemo(() =>
    unpinnedFiles.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [unpinnedFiles, searchQuery]);

  useEffect(() => {
    if (renamingFileId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [renamingFileId]);

  const handleRename = (fileId: string, currentName: string) => {
    setRenamingFileId(fileId);
    setRenameValue(currentName);
  };

  const handleRenameSubmit = () => {
    if (renamingFileId && renameValue.trim()) {
      const finalName = renameValue.endsWith('.md') ? renameValue : renameValue + '.md';
      if (finalName !== files.find(f => f.id === renamingFileId)?.name) {
          onRenameFile(renamingFileId, finalName);
      }
    }
    setRenamingFileId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setRenamingFileId(null);
    }
  };

  const handleDeleteRequest = (file: MarkdownFile) => {
    setDeletingFile(file);
  };

  const confirmDelete = () => {
    if (deletingFile) {
      onDeleteFile(deletingFile.id);
      setDeletingFile(null);
    }
  };

  const cancelDelete = () => {
    setDeletingFile(null);
  };

  const handleDragStart = (e: DragEvent<HTMLLIElement>, fileId: string) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLLIElement>, fileId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const padding = 10; // 20px forgiveness zone (10px top, 10px bottom)

    if (e.clientY < rect.top + padding) {
      setDropIndicator({ fileId, position: 'top' });
    } else if (e.clientY > rect.bottom - padding) {
      setDropIndicator({ fileId, position: 'bottom' });
    } else {
      setDropIndicator(null);
    }
  };

  const handleDrop = () => {
    if (draggedFileId && dropIndicator) {
      const { fileId: targetFileId, position } = dropIndicator;
      if (draggedFileId === targetFileId) {
        setDraggedFileId(null);
        setDropIndicator(null);
        return;
      }

      const newFiles = [...files];
      const draggedIndex = newFiles.findIndex(f => f.id === draggedFileId);
      const [draggedItem] = newFiles.splice(draggedIndex, 1);

      const targetIndex = newFiles.findIndex(f => f.id === targetFileId);

      if (position === 'top') {
        newFiles.splice(targetIndex, 0, draggedItem);
      } else {
        newFiles.splice(targetIndex + 1, 0, draggedItem);
      }
      onReorderFiles(newFiles);
    }
    setDraggedFileId(null);
    setDropIndicator(null);
  };

  const handleDragEnd = () => {
    setDraggedFileId(null);
    setDropIndicator(null);
  };

  const renderFile = (file: MarkdownFile) => (
    <li
      key={file.id}
      draggable
      onDragStart={(e) => handleDragStart(e, file.id)}
      onDragOver={(e) => handleDragOver(e, file.id)}
      className="relative group"
    >
      {dropIndicator?.fileId === file.id && dropIndicator.position === 'top' &&
        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      }
      <div
        onClick={() => onSelectFile(file.id)}
        className={`flex justify-between items-center text-sm w-full text-left px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-200 ${
          activeFileId === file.id ? 'bg-accent text-white' : 'text-text-primary hover:bg-gray-700'
        }`}
      >
        <div className="flex items-center flex-grow min-w-0">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(file.id);
                }}
                className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center transition-opacity ${file.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-blue-500`}
                title={file.pinned ? `Unpin ${file.name}` : `Pin ${file.name}`}
            >
                <PinIcon pinned={file.pinned} />
            </button>
            <div className={`transition-all duration-200 min-w-0 ${file.pinned ? 'ml-2' : 'group-hover:ml-2'}`}>
                {renamingFileId === file.id ? (
                    <input
                    ref={inputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleKeyDown}
                    className="bg-gray-800 text-white w-full px-1 -ml-1 rounded"
                    />
                ) : (
                    <span className="truncate block">{file.name}</span>
                )}
            </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          <button
              onClick={(e) => {
                  e.stopPropagation();
                  handleRename(file.id, file.name);
              }}
              className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500`}
              title={`Rename ${file.name}`}
          >
              <RenameIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRequest(file);
            }}
            className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${activeFileId === file.id ? 'hover:bg-blue-300' : 'hover:bg-red-500'}`}
            title={`Delete ${file.name}`}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      {dropIndicator?.fileId === file.id && dropIndicator.position === 'bottom' &&
        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      }
    </li>
  )

  return (
    <aside className="bg-secondary h-full flex flex-col flex-shrink-0 p-2 border-r border-gray-700">
      <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2 px-2">Explorer</h2>
      <div className="px-2 mb-2">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-primary text-text-primary w-full px-2 py-1 text-sm rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <ul onDragLeave={() => setDropIndicator(null)} onDrop={handleDrop} onDragEnd={handleDragEnd} className="flex-1 overflow-y-auto file-explorer-container">
        {filteredPinnedFiles.length > 0 && (
            <>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mt-2 px-2">Pinned</h3>
                {filteredPinnedFiles.map(renderFile)}
                <hr className="my-2 border-gray-600"/>
            </>
        )}
        {filteredUnpinnedFiles.map(renderFile)}
      </ul>
      {deletingFile && (
        <DeleteConfirmationModal
          fileName={deletingFile.name}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
      <style>{`
        .file-explorer-container::-webkit-scrollbar {
          width: 4px;
        }

        .file-explorer-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .file-explorer-container::-webkit-scrollbar-thumb {
          background-color: #7aa2f7;
          border-radius: 2px;
        }

        .file-explorer-container::-webkit-scrollbar-button {
            display: none;
        }
        
        .file-explorer-container {
            scrollbar-width: thin;
            scrollbar-color: #7aa2f7 transparent;
        }
      `}</style>
    </aside>
  );
};

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const RenameIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
    </svg>
);

const PinIcon = ({ pinned }: { pinned: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-colors ${pinned ? 'fill-current text-accent' : ''}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v1.172l5.071 5.071a1 1 0 01-1.414 1.414L14 11.414V16a1 1 0 11-2 0v-4.586l-1.293-1.293a1 1 0 010-1.414L12 7.414V4a1 1 0 01-1-1H9a1 1 0 01-1-1zm-4 8a1 1 0 011-1h.586l1.707 1.707a1 1 0 01-1.414 1.414L6 11.414V16a1 1 0 11-2 0v-5z" clipRule="evenodd" />
    </svg>
);


export default FileExplorer;
