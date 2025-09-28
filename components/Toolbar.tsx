import React, { useRef } from 'react';
import { PlusIcon, UploadIcon, SaveIcon, EyeIcon, EyeOffIcon } from './Icons.tsx';

interface ToolbarProps {
  onCreateFile: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveFile: () => void;
  onTogglePreview: () => void;
  isPreviewVisible: boolean;
  activeFileName?: string;
}

const ToolbarButton: React.FC<{ onClick?: () => void; children: React.ReactNode; title: string }> = ({ onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center px-3 py-2 text-sm text-text-secondary hover:bg-accent hover:text-white transition-colors duration-200"
  >
    {children}
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
  onCreateFile,
  onImportFile,
  onSaveFile,
  onTogglePreview,
  isPreviewVisible,
  activeFileName
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <header className="flex items-center justify-between bg-secondary border-b border-gray-700 h-10 flex-shrink-0">
      <div className="flex items-center">
        <ToolbarButton onClick={onCreateFile} title="Create New File">
          <PlusIcon /> <span className="hidden md:inline ml-2">New</span>
        </ToolbarButton>
        <ToolbarButton onClick={handleImportClick} title="Import Markdown File">
          <UploadIcon /> <span className="hidden md:inline ml-2">Import</span>
        </ToolbarButton>
        <input type="file" ref={fileInputRef} onChange={onImportFile} className="hidden" accept=".md" />
        <ToolbarButton onClick={onSaveFile} title="Save File As...">
          <SaveIcon /> <span className="hidden md:inline ml-2">Save</span>
        </ToolbarButton>
      </div>
      {activeFileName && <div className="text-text-secondary text-sm">{activeFileName}</div>}
      <div className="flex items-center">
        <ToolbarButton 
          onClick={onTogglePreview} 
          title={isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
        >
          {isPreviewVisible ? <EyeOffIcon /> : <EyeIcon />}
          <span className="hidden md:inline ml-2">
            {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
          </span>
        </ToolbarButton>
      </div>
    </header>
  );
};

export default Toolbar;
