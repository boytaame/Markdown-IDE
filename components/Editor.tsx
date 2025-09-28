import React, { useRef, useLayoutEffect, useMemo, useState } from 'react';
import Minimap from './Minimap';

interface EditorProps {
  file: {
    id: string;
    name: string;
    content: string;
  };
  onContentChange: (content: string) => void;
}

// Color palette provided by the user
const colors = {
  headings: '#f0700e',
  bold: '#026654',
  italic: '#ccbb02',
  strikethrough: '#04dbd8',
  blockquote: '#04db37',
  links: '#047edb',
  images: {
    altText: '#047edb',
    exclamationMark: '#db1d04',
  },
  code: '#06d114',
  lists: '#d67600',
  horizontalRules: '#d63900',
  htmlTags: '#d60068',
};

/**
 * A utility function to lighten a hex color.
 */
const lightenColor = (hex: string, percent: number): string => {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)))
    .toString(16)
    .padStart(2, '0');
  const newG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)))
    .toString(16)
    .padStart(2, '0');
  const newB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)))
    .toString(16)
    .padStart(2, '0');

  return `#${newR}${newG}${newB}`;
};

// Function to apply syntax highlighting rules to a single line of text
const highlightLine = (line: string): string => {
  return line
    .replace(/^(#{1,6})\s(.*)/g, (_, hashes: string, content: string) => {
      const level = hashes.length;
      const color = lightenColor(colors.headings, (level - 1) * 15);
      return `<span style="color: ${color};">${hashes}</span> ${content}`;
    })
    .replace(/^(&gt;.*)/g, `<span style="color: ${colors.blockquote};">$&</span>`)
    .replace(/^(\s*)([\*\-\+]|\d+\.)\s/gm, (_, indent, marker) => `${indent}<span style="color: ${colors.lists};">${marker}</span> `)
    .replace(/^(---|___|\*\*\*)$/gm, `<span style="color: ${colors.horizontalRules};">$&</span>`)
    .replace(/!\[(.*?)\]\((.*?)\)/g, `<span style="color: ${colors.images.exclamationMark};">!</span><span style="color: ${colors.images.altText};">[</span><span style="color: ${colors.images.altText};">${'[$1]'}</span><span style="color: ${colors.images.altText};">]</span><span>($2)</span>`.replace('[$1]', '$1'))
    .replace(/\[(.*?)\]\((.*?)\)/g, `<span style="color: ${colors.links};">[$1]($2)</span>`)
    .replace(/(\*\*|__)(.*?)\1/g, `<span style="color: ${colors.bold}; font-weight: bold;">$1$2$1</span>`)
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, `<span style="color: ${colors.italic}; font-style: italic;">*$1*</span>`)
    .replace(/_(.*?)_/g, `<span style="color: ${colors.italic}; font-style: italic;">_$1_</span>`)
    .replace(/~~(.*?)~~/g, `<span style="color: ${colors.strikethrough}; text-decoration: line-through;">~~$1~~</span>`)
    .replace(/`(.*?)`/g, `<span style="color: ${colors.code};"> \`$1\`</span>`)
    .replace(/(&lt;\/?[\w\s="/.':;#-?&]+&gt;)/g, `<span style="color: ${colors.htmlTags};">$&</span>`);
};


const Editor: React.FC<EditorProps> = ({ file, onContentChange }) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);

  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // THE FIX: This layout effect now uses a ResizeObserver to watch the editor itself.
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // This function now runs whenever the editor's size changes.
    const updateLayoutSync = () => {
      const width = editor.offsetWidth - editor.clientWidth;
      setScrollbarWidth(width);
    };

    const observer = new ResizeObserver(updateLayoutSync);
    observer.observe(editor);

    // Initial call to set the width on mount.
    updateLayoutSync();

    // Clean up the observer when the component unmounts.
    return () => observer.disconnect();
  }, []); // Empty dependency array is correct, as the observer handles updates.

  const handleEditorScroll = () => {
    const scrollTop = editorRef.current?.scrollTop ?? 0;
    if (highlighterRef.current) {
      highlighterRef.current.scrollTop = scrollTop;
    }
  };

  const highlightedLines = useMemo(() => {
    let text = file.content;
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const blocks = text.split(/^(```[\s\S]*?```)/gm);
    const processedLines: string[] = [];
    blocks.forEach(block => {
      if (block.startsWith('```')) {
        processedLines.push(`<span style="color: ${colors.code};">${block}</span>`);
      } else {
        const lines = block.split('\n');
        lines.forEach(line => {
          processedLines.push(highlightLine(line));
        });
      }
    });
    return processedLines;
  }, [file.content]);
  
  const commonStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    lineHeight: '1.5',
    tabSize: 2,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const GUTTER_WIDTH = '3.5rem';
  const CODE_PADDING_LEFT = '1rem';
  const END_PADDING = '22.5rem';

  return (
    <div className="relative flex flex-1 h-full overflow-hidden bg-primary font-mono">
      <div className="relative flex-1 h-full w-full">
        <textarea
          ref={editorRef}
          value={file.content}
          onChange={(e) => onContentChange(e.target.value)}
          onScroll={handleEditorScroll}
          className="absolute inset-0 resize-none focus:outline-none bg-transparent text-transparent caret-text-primary w-full h-full"
          style={{
            ...commonStyles,
            paddingLeft: `calc(${GUTTER_WIDTH} + ${CODE_PADDING_LEFT})`,
            paddingRight: CODE_PADDING_LEFT,
            paddingTop: '1rem',
            paddingBottom: END_PADDING,
            scrollbarWidth: 'none',
          }}
          spellCheck="false"
        />

        <pre
          ref={highlighterRef}
          aria-hidden="true"
          className="code-view absolute inset-0 resize-none focus:outline-none overflow-hidden text-text-primary w-full h-full pointer-events-none"
          style={{
            ...commonStyles,
            paddingTop: '1rem',
            paddingBottom: END_PADDING,
            paddingRight: `calc(${CODE_PADDING_LEFT} + ${scrollbarWidth}px)`,
          }}
        >
          <code>
            {highlightedLines.map((lineHtml, index) => (
              <div
                key={index}
                className="code-line"
                dangerouslySetInnerHTML={{ __html: lineHtml || ' ' }}
              />
            ))}
          </code>
        </pre>
      </div>

      <style>{`
        textarea::-webkit-scrollbar { display: none; }
        .caret-text-primary { caret-color: #c0caf5; }

        .code-view {
          counter-reset: line;
        }
        .code-line {
          counter-increment: line;
          position: relative;
          padding-left: ${`calc(${GUTTER_WIDTH} + ${CODE_PADDING_LEFT})`};
        }
        .code-line::before {
          content: counter(line);
          position: absolute;
          left: 0;
          width: ${GUTTER_WIDTH};
          padding-right: 1rem;
          text-align: right;
          color: rgba(192, 202, 245, 0.3);
          user-select: none;
        }
      `}</style>

      <div className="w-[120px] flex-shrink-0 bg-primary border-l border-accent/20 overflow-hidden">
        <Minimap
          editorRef={editorRef}
          minimapRef={minimapRef}
          content={file.content}
          width={120}
          theme={{ background: '#1a1b26', foreground: '#c0caf5', activeLine: '#1f2335', viewport: 'rgba(122, 162, 247, 0.3)' }}
        />
      </div>
    </div>
  );
};

export default Editor;