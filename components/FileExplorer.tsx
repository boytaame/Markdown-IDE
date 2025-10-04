import React, { useState } from 'react';
import { FileText, Plus, Star, Trash2, FolderPlus, FolderMinus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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
  onNewGroupRequest: (fileIds: string[]) => void;
  onRemoveFromGroup: (fileId: string) => void;
  onToggleGroup: (groupId: string) => void;
  onDragEnd: (result: DropResult) => void;
}

const FileItem: React.FC<{
  file: File;
  isActive: boolean;
  isSelected: boolean;
  onFileClick: (file: File) => void;
  onFileSelect: (e: React.MouseEvent, fileId: string) => void;
  onContextMenu: (e: React.MouseEvent, fileId: string) => void;
}> = ({ file, isActive, isSelected, onFileClick, onFileSelect, onContextMenu }) => (
  <div
    onClick={() => onFileClick(file)}
    onMouseDown={(e) => onFileSelect(e, file.id)}
    onContextMenu={(e) => onContextMenu(e, file.id)}
    className={`flex items-center p-2 rounded cursor-pointer ${
      isActive ? 'bg-accent/20' : ''
    } ${isSelected ? 'bg-accent/30' : ''} hover:bg-accent/10`}
  >
    <FileText size={18} className="mr-2 flex-shrink-0" />
    <span className="flex-1 truncate">{file.name}</span>
    {file.isPinned && <Star size={14} className="ml-2 text-yellow-400 flex-shrink-0" />}
  </div>
);

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
  onNewGroupRequest,
  onRemoveFromGroup,
  onToggleGroup,
  onDragEnd,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);

  const pinnedFiles = files.filter(f => f.isPinned);
  const filesInGroups = new Set(groups.flatMap(g => g.fileIds));
  const regularFiles = files.filter(f => !f.isPinned && !filesInGroups.has(f.id));

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedFiles.has(fileId)) {
        onFileSelect(e, fileId);
    }
    setContextMenu({ x: e.pageX, y: e.pageY, fileId });
  };

  const closeContextMenu = () => setContextMenu(null);

  const renderFile = (file: File, index: number) => (
    <Draggable key={file.id} draggableId={file.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <FileItem
            file={file}
            isActive={activeFile?.id === file.id}
            isSelected={selectedFiles.has(file.id)}
            onFileClick={onFileClick}
            onFileSelect={onFileSelect}
            onContextMenu={handleContextMenu}
          />
        </div>
      )}
    </Draggable>
  );

  return (
    <div className="w-64 bg-secondary text-text-primary p-4 flex flex-col" onClick={closeContextMenu}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Files</h2>
        <button onClick={onNewFile} className="hover:text-accent p-1"><Plus size={20} /></button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-grow overflow-y-auto">
          {pinnedFiles.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-text-secondary mb-2 px-2">PINNED</h3>
              <Droppable droppableId="pinned" type="file">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {pinnedFiles.map(renderFile)}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-2 px-2">GROUPS</h3>
            <Droppable droppableId="groups" type="group">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {groups.map((group, index) => (
                            <Draggable key={group.id} draggableId={group.id} index={index}>
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps}>
                                        <div {...provided.dragHandleProps} className="flex items-center p-2 rounded cursor-pointer" onClick={() => onToggleGroup(group.id)}>
                                            {group.isCollapsed ? <FolderPlus size={18} className="mr-2" /> : <FolderMinus size={18} className="mr-2" />}
                                            <span className="font-semibold">{group.name}</span>
                                        </div>
                                        {!group.isCollapsed && (
                                            <Droppable droppableId={group.id} type="file">
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.droppableProps} className="pl-4 border-l-2 border-accent/10 ml-2">
                                                        {group.fileIds.map((id, idx) => {
                                                            const file = files.find(f => f.id === id);
                                                            return file ? renderFile(file, idx) : null;
                                                        })}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        )}
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
            {groups.length === 0 && (
                <button
                    onClick={() => onNewGroupRequest(Array.from(selectedFiles))}
                    className="w-full text-left p-2 rounded hover:bg-accent/10 text-sm text-text-secondary"
                >
                    Make a group
                </button>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-2 px-2">FILES</h3>
            <Droppable droppableId="files" type="file">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {regularFiles.map(renderFile)}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute bg-primary border border-accent/20 rounded-md shadow-lg z-50 py-1"
        >
          <button onClick={() => { onTogglePin(contextMenu.fileId); closeContextMenu(); }} className="flex items-center px-4 py-2 hover:bg-accent/10 w-full text-left">
            <Star size={16} className="mr-2" /> Pin
          </button>
          <button onClick={() => { onNewGroupRequest(Array.from(selectedFiles)); closeContextMenu(); }} className="flex items-center px-4 py-2 hover:bg-accent/10 w-full text-left">
            <FolderPlus size={16} className="mr-2" /> Add to New Group
          </button>
          {filesInGroups.has(contextMenu.fileId) && (
            <button onClick={() => { onRemoveFromGroup(contextMenu.fileId); closeContextMenu(); }} className="flex items-center px-4 py-2 hover:bg-accent/10 w-full text-left">
              <FolderMinus size={16} className="mr-2" /> Remove from Group
            </button>
          )}
          <div className="border-t border-accent/10 my-1"></div>
          <button onClick={() => { onDeleteFile(contextMenu.fileId); closeContextMenu(); }} className="flex items-center px-4 py-2 hover:bg-accent/10 w-full text-left text-red-500">
            <Trash2 size={16} className="mr-2" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
