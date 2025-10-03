import React from 'react';
import { FileText, Plus, Star, Trash2, X, FolderPlus, FolderMinus } from 'lucide-react';
import { File, Group } from '../types';

interface FileExplorerProps {
  files: File[];
  groups: Group[];
  activeFile: File | null;
  selectedFiles: Set<string>;
  onFileClick: (file: File) => void;
  onFileSelect: (e: React.MouseEvent, fileId: string) => void;
  onNewFile: () => void;
  onDeleteFile: (fileId: string) => void;
  onTogglePin: (fileId: string) => void;
  onNewGroup: (groupName: string, fileIds: string[]) => void;
  onRemoveFromGroup: (fileId: string) => void;
  onToggleGroup: (groupId: string) => void;
  // Add props for reordering if you have them
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  groups,
  activeFile,
  selectedFiles,
  onFileClick,
  onFileSelect,
  onNewFile,
  onDeleteFile,
  onTogglePin,
  onNewGroup,
  onRemoveFromGroup,
  onToggleGroup,
}) => {
  const pinnedFiles = files.filter(f => f.isPinned);
  const regularFiles = files.filter(f => !f.isPinned && !groups.some(g => g.fileIds.includes(f.id)));

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    // Your context menu logic here
  };

  return (
    <div className="w-64 bg-secondary text-text-primary p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Files</h2>
        <button onClick={onNewFile} className="hover:text-accent"><Plus size={20} /></button>
      </div>

      {pinnedFiles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-2">PINNED</h3>
          {pinnedFiles.map(file => (
            <div
              key={file.id}
              onClick={() => onFileClick(file)}
              onMouseDown={(e) => onFileSelect(e, file.id)}
              onContextMenu={(e) => handleContextMenu(e, file.id)}
              className={`flex items-center p-2 rounded cursor-pointer ${
                activeFile?.id === file.id ? 'bg-accent/20' : ''
              } ${selectedFiles.has(file.id) ? 'bg-accent/30' : ''}`}
            >
              <FileText size={18} className="mr-2" />
              <span className="flex-1 truncate">{file.name}</span>
              <Star size={14} className="text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">GROUPS</h3>
        {groups.map(group => (
          <div key={group.id}>
            <div className="flex items-center p-2 rounded cursor-pointer" onClick={() => onToggleGroup(group.id)}>
              {group.isCollapsed ? <FolderPlus size={18} className="mr-2" /> : <FolderMinus size={18} className="mr-2" />}
              <span className="font-semibold">{group.name}</span>
            </div>
            {!group.isCollapsed && (
              <div className="pl-4">
                {group.fileIds.map(fileId => {
                  const file = files.find(f => f.id === fileId);
                  if (!file) return null;
                  return (
                    <div
                      key={file.id}
                      onClick={() => onFileClick(file)}
                      onMouseDown={(e) => onFileSelect(e, file.id)}
                      onContextMenu={(e) => handleContextMenu(e, file.id)}
                      className={`flex items-center p-2 rounded cursor-pointer ${
                        activeFile?.id === file.id ? 'bg-accent/20' : ''
                      } ${selectedFiles.has(file.id) ? 'bg-accent/30' : ''}`}
                    >
                      <FileText size={18} className="mr-2" />
                      <span className="flex-1 truncate">{file.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {groups.length === 0 && (
          <button
            onClick={() => onNewGroup('New Group', Array.from(selectedFiles))}
            className="w-full text-left p-2 rounded hover:bg-accent/10"
          >
            Make a group
          </button>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-2">FILES</h3>
        {regularFiles.map(file => (
          <div
            key={file.id}
            onClick={() => onFileClick(file)}
            onMouseDown={(e) => onFileSelect(e, file.id)}
            onContextMenu={(e) => handleContextMenu(e, file.id)}
            className={`flex items-center p-2 rounded cursor-pointer ${
              activeFile?.id === file.id ? 'bg-accent/20' : ''
            } ${selectedFiles.has(file.id) ? 'bg-accent/30' : ''}`}
          >
            <FileText size={18} className="mr-2" />
            <span className="flex-1 truncate">{file.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
