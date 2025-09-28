
import React from 'react';
import { MarkdownFile } from '../types';

interface FileExplorerProps {
  files: MarkdownFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFileId, onSelectFile, onDeleteFile }) => {
  return (
    <aside className="w-64 bg-secondary flex-shrink-0 overflow-y-auto p-2 border-r border-gray-700">
      <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2 px-2">Explorer</h2>
      <ul>
        {files.map(file => (
          <li key={file.id}>
            <div
              onClick={() => onSelectFile(file.id)}
              className={`flex justify-between items-center group text-sm w-full text-left px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-200 ${
                activeFileId === file.id ? 'bg-accent text-white' : 'text-text-primary hover:bg-gray-700'
              }`}
            >
              <span className="truncate">{file.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
                    onDeleteFile(file.id);
                  }
                }}
                className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${activeFileId === file.id ? 'hover:bg-blue-300' : 'hover:bg-red-500'}`}
                title={`Delete ${file.name}`}
              >
                <CloseIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default FileExplorer;
