import React, { useRef, useLayoutEffect, useMemo, useState, useEffect } from 'react';
import Minimap from './Minimap';

interface EditorProps {
  file: {
    id: string;
    name: string;
    content: string;
  };
  onContentChange: (content: string) => void;
}

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

const highlightLine = (
  line: string,
  lineNumber: number,
  cursorLine: number
): string => {
  if (lineNumber !== cursorLine && line.includes('$check')) {
    return line.replace(/\\$check\\[( |x)\\]/g, (match) => {
      const isChecked = match === '$check[x]';
      return `<input type="checkbox" ${isChecked ? 'checked' : ''} style="margin-right: 6px; transform: translateY(2px);" />`;
    });
  }

  return line
    .replace(/^(#{1,6})\\s(.*)/g, (_, hashes: string, content: string) => {
      const level = hashes.length;
      const color = lightenColor(colors.headings, (level - 1) * 15);
      return `<span style="color: ${color};">${hashes}</span> ${content}`;
    })
    .replace(/^(\\s*)(&gt;.*)/g, (_, indent: string, content: string) => {
        return `${indent}<span style="color: ${colors.blockquote};">${content}</span>`;
    })
    .replace(/^(\\s*)([\\*\\-\\+]|\\d+\\.)\\s/gm, (_, indent, marker) => `${indent}<span style="color: ${colors.lists};">${marker}</span> `)
    .replace(/^(---|___|\\*\\*\\*)$/gm, `<span style="color: ${colors.horizontalRules};">$&</span>`)
    .replace(/!\\[(.*?)\\]\\((.*?)\\)/g, `<span style="color: ${colors.images.exclamationMark};">!</span><span style="color: ${colors.images.altText};">[</span><span style="color: ${colors.images.altText};">${'[$1]'}</span><span style="color: ${colors.images.altText};">]</span><span>($2)</span>`.replace('[$1]', '$1'))
    .replace(/\\[(.*?)\\]\\((.*?)\\)/g, `<span style="color: ${colors.links};">[$1]($2)</span>`)
    .replace(/(\\*\\*|__)(.*?)\\1/g, `<span style="color: ${colors.bold}; font-weight: bold;">$1$2$1</span>`)
    .replace(/(?<!\\*)\\*(?!\\*)(.*?)(?<!\\*)\\*(?!\\*)/g, `<span style="color: ${colors.italic}; font-style: italic;">*S1*</span>`)
    .replace(/_(.*?)_/g, `<span style="color: ${colors.italic}; font-style: italic;">_$1_</span>`)
    .replace(/~~(.*?)~~/g, `<span style="color: ${colors.strikethrough}; text-decoration: line-through;">~~$1~~</span>`)
    .replace(/`(.*?)`/g, `<span style="color: ${colors.code};"> \`$1\`</span>`)
    .replace(/(<\\/?[\\w\\s="\\/.'\\:;#-?&]+>)/g, `<span style="color:${colors.htmlTags};">$&</span>`);
};


const Editor: React.FC<EditorProps> = ({ file, onContentChange }) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);

  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [cursorLine, setCursorLine] = useState(1);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const updateLayoutSync = () => {
      const width = editor.offsetWidth - editor.clientWidth;
      setScrollbarWidth(width);
    };

    const observer = new ResizeObserver(updateLayoutSync);
    observer.observe(editor);

    updateLayoutSync();

    return () => observer.disconnect();
  }, []);

  const handleEditorScroll = () => {
    const scrollTop = editorRef.current?.scrollTop ?? 0;
    if (highlighterRef.current) {
      highlighterRef.current.scrollTop = scrollTop;
    }
  };

  const updateCursorPosition = () => {
    const editor = editorRef.current;
    if (editor) {
      const line = editor.value.substring(0, editor.selectionStart).split('\\n').length;
      setCursorLine(line);
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('keyup', updateCursorPosition);
      editor.addEventListener('mouseup', updateCursorPosition);
      editor.addEventListener('selectionchange', updateCursorPosition);

      return () => {
        editor.removeEventListener('keyup', updateCursorPosition);
        editor.removeEventListener('mouseup', updateCursorPosition);
        editor.removeEventListener('selectionchange', updateCursorPosition);
      };
    }
  }, [editorRef.current]);

  const handleCheckboxClick = (lineIndex: number, matchIndex: number) => {
    const lines = file.content.split('\\n');
    const line = lines[lineIndex];
    let matchCount = 0;
    const updatedLine = line.replace(/\\$check\\[( |x)\\]/g, (match) => {
      if (matchCount === matchIndex) {
        matchCount++;
        return match === '$check[ ]' ? '$check[x]' : '$check[ ]';
      }
      matchCount++;
      return match;
    });

    lines[lineIndex] = updatedLine;
    onContentChange(lines.join('\\n'));
  };

  useEffect(() => {
    const highlighter = highlighterRef.current;
    if (!highlighter) return;

    const clickListener = (e: MouseEvent) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT' && target.type === 'checkbox' && target.parentElement) {
        const lineElement = target.parentElement;
        const lineIndex = parseInt(lineElement.getAttribute('data-line-index') || '0', 10);

        const nodes = Array.from(lineElement.childNodes);
        let checkboxIndex = -1;
        let currentCheckbox = 0;

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as HTMLElement;
          if (node.tagName === 'INPUT' && node.getAttribute('type') === 'checkbox') {
            if (node === target) {
              checkboxIndex = currentCheckbox;
              break;
            }
            currentCheckbox++;
          }
        }

        if (checkboxIndex !== -1) {
          handleCheckboxClick(lineIndex, checkboxIndex);
        }
      }
    };

    highlighter.addEventListener('click', clickListener);

    return () => {
      highlighter.removeEventListener('click', clickListener);
    };
  }, [highlighterRef.current, handleCheckboxClick]);

  const highlightedLines = useMemo(() => {
    let text = file.content;
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const blocks = text.split(/^(```[\\s\\S]*?```)/gm);
    const processedLines: string[] = [];
    blocks.forEach((block) => {
      if (block.startsWith('```')) {
        processedLines.push(`<span style="color: ${colors.code};">${block}</span>`);
      } else {
        const lines = block.split('\\n');
        lines.forEach((line) => {
          const globalLineIndex = processedLines.length;
          processedLines.push(highlightLine(line, globalLineIndex + 1, cursorLine));
        });
      }
    });
    return processedLines;
  }, [file.content, cursorLine]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value.replace(/\\$check(?!\\u005b)/g, '$check[ ]');
    onContentChange(newContent);
  };

  const commonStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    lineHeight: '1.5',
    tabSize: 2,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && editorRef.current) {
        e.preventDefault();
        const { selectionStart, selectionEnd, value } = editorRef.current;
        const lines = value.substring(0, selectionStart).split('\\n');
        const currentLineNumber = lines.length - 1;
        const selection = value.substring(selectionStart, selectionEnd);
        const selectedLines = selection.split('\\n');

        if (selectedLines.length > 1) {
            const allLines = value.split('\\n');
            let newSelectionStart = selectionStart;
            let newSelectionEnd = selectionEnd;

            if (e.shiftKey) {
                for (let i = 0; i < selectedLines.length; i++) {
                    const lineIndex = currentLineNumber + i;
                    if (allLines[lineIndex].startsWith('\\t')) {
                        allLines[lineIndex] = allLines[lineIndex].substring(1);
                        if (i === 0) newSelectionStart--;
                        newSelectionEnd--;
                    } else if (allLines[lineIndex].startsWith('  ')) {
                        allLines[lineIndex] = allLines[lineIndex].substring(2);
                        if (i === 0) newSelectionStart -= 2;
                        newSelectionEnd -= 2;
                    }
                }
            } else {
                for (let i = 0; i < selectedLines.length; i++) {
                    const lineIndex = currentLineNumber + i;
                    allLines[lineIndex] = '\\t' + allLines[lineIndex];
                    if (i === 0) newSelectionStart++;
                    newSelectionEnd++;
                }
            }
            const newValue = allLines.join('\\n');
            onContentChange(newValue);

            setTimeout(() => {
                if(editorRef.current) {
                    editorRef.current.selectionStart = newSelectionStart;
                    editorRef.current.selectionEnd = newSelectionEnd;
                }
            }, 0);

        } else {
            if (e.shiftKey) {
                const allLines = value.split('\\n');
                const lineIndex = currentLineNumber;
                let newSelectionStart = selectionStart;

                if (allLines[lineIndex] && allLines[lineIndex].startsWith('\\t')) {
                    allLines[lineIndex] = allLines[lineIndex].substring(1);
                    newSelectionStart = Math.max(value.lastIndexOf('\\n', selectionStart - 1) + 1, newSelectionStart - 1);
                } else if (allLines[lineIndex] && allLines[lineIndex].startsWith('  ')) {
                    allLines[lineIndex] = allLines[lineIndex].substring(2);
                    newSelectionStart = Math.max(value.lastIndexOf('\\n', selectionStart - 1) + 1, newSelectionStart - 2);
                }
                const newValue = allLines.join('\\n');
                onContentChange(newValue);

                setTimeout(() => {
                    if(editorRef.current) {
                        editorRef.current.selectionStart = editorRef.current.selectionEnd = newSelectionStart;
                    }
                }, 0);
            } else {
                const newValue =
                    value.substring(0, selectionStart) +
                    '\\t' +
                    value.substring(selectionEnd);
                onContentChange(newValue);
                
                setTimeout(() => {
                    if(editorRef.current) {
                        editorRef.current.selectionStart = editorRef.current.selectionEnd = selectionStart + 1;
                    }
                }, 0);
            }
        }
    }
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
          onChange={handleContentChange}
          onScroll={handleEditorScroll}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 resize-none focus:outline-none bg-transparent text-transparent caret-text-primary w-full h-full z-10"
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
                data-line-index={index}
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
