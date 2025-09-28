import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  content: string;
}

const Preview: React.FC<PreviewProps> = ({ content }) => {

  return (
    <div 
      className="bg-secondary p-6 overflow-y-auto prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none prose-pre:bg-primary prose-pre:p-4 prose-pre:rounded-md"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#7aa2f7 #24283b' }}
    >
      <ReactMarkdown remarkPlugins={remarkGfm ? [remarkGfm] : []}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Preview;
