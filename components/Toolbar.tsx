import React from 'react';
import { Bold, Italic, Strikethrough, Code, List, Heading1, Heading2, Heading3, Link, Image, Save } from 'lucide-react';
import { File } from '../types';

interface ToolbarProps {
  file: File | null;
  onContentChange: (content: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ file, onContentChange }) => {
  const insertText = (before: string, after: string = '') => {
    // This is a simplified implementation. A real implementation would need
    // to interact with the editor's state to insert text at the cursor.
    if (file) {
      const newContent = `${file.content}${before}${after}`;
      onContentChange(newContent);
    }
  };

  return (
    <div className="flex items-center p-2 bg-secondary border-b border-accent/20">
      <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-accent/10 rounded"><Bold size={20} /></button>
      <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-accent/10 rounded"><Italic size={20} /></button>
      <button onClick={() => insertText('~~', '~~')} className="p-2 hover:bg-accent/10 rounded"><Strikethrough size={20} /></button>
      <button onClick={() => insertText('`', '`')} className="p-2 hover:bg-accent/10 rounded"><Code size={20} /></button>
      <button onClick={() => insertText('\n- ')} className="p-2 hover:bg-accent/10 rounded"><List size={20} /></button>
      <button onClick={() => insertText('\n# ')} className="p-2 hover:bg-accent/10 rounded"><Heading1 size={20} /></button>
      <button onClick={() => insertText('\n## ')} className="p-2 hover:bg-accent/10 rounded"><Heading2 size={20} /></button>
      <button onClick={() => insertText('\n### ')} className="p-2 hover:bg-accent/10 rounded"><Heading3 size={20} /></button>
      <button onClick={() => insertText('[', '](url)')} className="p-2 hover:bg-accent/10 rounded"><Link size={20} /></button>
      <button onClick={() => insertText('![', '](url)')} className="p-2 hover:bg-accent/10 rounded"><Image size={20} /></button>
      <div className="flex-grow" />
      <button className="p-2 hover:bg-accent/10 rounded"><Save size={20} /></button>
    </div>
  );
};

export default Toolbar;
