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

const highlightLine = (line: string): string => {
  return line
    .replace(/(<\/?[a-zA-Z][\w\s="'\/.:;#-]*>)/g,  `<span style="color: ${colors.htmlTags};">$&</span>`)
    .replace(/^(#{1,6})\s(.*)/g, (_, hashes: string, content: string) => {
      const level = hashes.length;
      const color = lightenColor(colors.headings, (level - 1) * 15);
      return `<span style="color: ${color};">${hashes}</span> ${content}`;
    })
    .replace(/^(\s*)(&gt;.*)/g, (_, indent: string, content: string) => {
        return `${indent}<span style="color: ${colors.blockquote};">${content}</span>`;
    })
    .replace(/^(\s*)([\*\-\+]|\d+\.)\s/gm, (_, indent, marker) => `${indent}<span style="color: ${colors.lists};">${marker}</span> `)
    .replace(/^(---|___|\*\*\*)$/gm, `<span style="color: ${colors.horizontalRules};">$&</span>`)
    .replace(/!\[(.*?)\]\((.*?)\)/g, `<span style="color: ${colors.images.exclamationMark};">!</span><span style="color: ${colors.images.altText};">[</span>$1<span style="color: ${colors.images.altText};">]</span><span>($2)</span>`)
    .replace(/\[(.*?)\]\((.*?)\)/g, `<span style="color: ${colors.links};">[$1]($2)</span>`)
    .replace(/(\*\*|__)(.*?)\1/g, `<span style="color: ${colors.bold}; font-weight: bold;">$1$2$1</span>`)
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, `<span style="color: ${colors.italic}; font-style: italic;">*$1*</span>`)
    .replace(/_(.*?)_/g, `<span style="color: ${colors.italic}; font-style: italic;">_$1_</span>`)
    .replace(/~~(.*?)~~/g, `<span style="color: ${colors.strikethrough}; text-decoration: line-through;">~~$1~~</span>`)
    .replace(/`(.*?)`/g, `<span style="color: ${colors.code};"> \`$1\`</span>`);
};


const Editor: React.FC<EditorProps> = ({ file, onContentChange }) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);

  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

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

  const handleSelectionChange = () => {
    if (editorRef.current) {
      setCursorPosition(editorRef.current.selectionStart);
    }
  };

  const handleCheckboxClick = (lineIndex: number, charIndex: number) => {
    const lines = file.content.split('\n');
    const line = lines[lineIndex];
    
    const isChecked = line.substring(charIndex, charIndex + 9) === '$check[x]';
    const newCheck = isChecked ? '$check[ ]' : '$check[x]';
    
    lines[lineIndex] = line.substring(0, charIndex) + newCheck + line.substring(charIndex + 9);
    
    onContentChange(lines.join('\n'));
  };

  useEffect(() => {
    const highlighter = highlighterRef.current;
    if (!highlighter) return;

    const clickListener = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('custom-checkbox')) {
            e.preventDefault();
            e.stopPropagation();
            const lineIndex = parseInt(target.getAttribute('data-line-index') || '0', 10);
            const charIndex = parseInt(target.getAttribute('data-char-index') || '0', 10);
            
            if (!isNaN(lineIndex) && !isNaN(charIndex)) {
              handleCheckboxClick(lineIndex, charIndex);
            }
        }
    };

    highlighter.addEventListener('mousedown', clickListener as EventListener);

    return () => {
      highlighter.removeEventListener('mousedown', clickListener as EventListener);
    };
  }, [highlighterRef.current, file.content]);

  const highlightedContent = useMemo(() => {
    const lines = file.content.split('\n');
    let charCounter = 0;

    return lines.map((line, lineIndex) => {
      const lineStartPos = charCounter;
      let processedLine = highlightLine(line);

      processedLine = processedLine.replace(/\$check\[( |x)\]/g, (match, _, offset) => {
        const isChecked = match === '$check[x]';
        const checkedClass = isChecked ? 'checked' : '';
        const checkboxStartPos = lineStartPos + offset;
        const checkboxEndPos = checkboxStartPos + 9;

        if (cursorPosition >= checkboxStartPos && cursorPosition < checkboxEndPos) {
          return match;
        }
        
        return `<span class="checkbox-container">` +
               `<span class="custom-checkbox ${checkedClass}" data-line-index="${lineIndex}" data-char-index="${offset}"></span>` +
               `<span class="hidden-syntax">${match}</span>` +
               `</span>`;
      });
      
      charCounter += line.length + 1;
      return processedLine;
    });
  }, [file.content, cursorPosition]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value.replace(/\$check(?!\[)/g, '$check[ ]');
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
    if (editorRef.current) {
        const { selectionStart, selectionEnd, value } = editorRef.current;

        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            const now = new Date();
            const date = now.toLocaleDateString();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateTime = `${date} ${time}`;
            const newValue =
                value.substring(0, selectionStart) +
                dateTime +
                value.substring(selectionEnd);
            onContentChange(newValue);
            setTimeout(() => {
                if (editorRef.current) {
                    const newCursorPos = selectionStart + dateTime.length;
                    editorRef.current.selectionStart = newCursorPos;
                    editorRef.current.selectionEnd = newCursorPos;
                }
            }, 0);
            return;
        }

        if (e.key === 'Backspace' && selectionStart === selectionEnd) {
            const textBeforeCursor = value.substring(0, selectionStart);
            const checkboxRegex = /\$check\[( |x)\]$/;
            if (checkboxRegex.test(textBeforeCursor)) {
                e.preventDefault();
                const newContent = textBeforeCursor.replace(checkboxRegex, '') + value.substring(selectionStart);
                onContentChange(newContent);
                setTimeout(() => {
                    if (editorRef.current) {
                        const newCursorPos = selectionStart - 9;
                        editorRef.current.selectionStart = newCursorPos;
                        editorRef.current.selectionEnd = newCursorPos;
                    }
                }, 0);
                return;
            }
        }

        if (e.key === 'Delete' && selectionStart === selectionEnd) {
            const textAfterCursor = value.substring(selectionStart);
            const checkboxRegex = /^\$check\[( |x)\]/;
            if (checkboxRegex.test(textAfterCursor)) {
                e.preventDefault();
                const newContent = value.substring(0, selectionStart) + textAfterCursor.replace(checkboxRegex, '');
                onContentChange(newContent);
                setTimeout(() => {
                    if (editorRef.current) {
                        editorRef.current.selectionStart = selectionStart;
                        editorRef.current.selectionEnd = selectionStart;
                    }
                }, 0);
                return;
            }
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            const lines = value.substring(0, selectionStart).split('\n');
            const currentLineNumber = lines.length - 1;
            const selection = value.substring(selectionStart, selectionEnd);
            const selectedLines = selection.split('\n');

            if (selectedLines.length > 1) {
                const allLines = value.split('\n');
                let newSelectionStart = selectionStart;
                let newSelectionEnd = selectionEnd;

                if (e.shiftKey) {
                    for (let i = 0; i < selectedLines.length; i++) {
                        const lineIndex = currentLineNumber + i;
                        if (allLines[lineIndex].startsWith('\t')) {
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
                        allLines[lineIndex] = '\t' + allLines[lineIndex];
                        if (i === 0) newSelectionStart++;
                        newSelectionEnd++;
                    }
                }
                const newValue = allLines.join('\n');
                onContentChange(newValue);

                setTimeout(() => {
                    if(editorRef.current) {
                        editorRef.current.selectionStart = newSelectionStart;
                        editorRef.current.selectionEnd = newSelectionEnd;
                    }
                }, 0);

            } else {
                if (e.shiftKey) {
                    const allLines = value.split('\n');
                    const lineIndex = currentLineNumber;
                    let newSelectionStart = selectionStart;

                    if (allLines[lineIndex] && allLines[lineIndex].startsWith('\t')) {
                        allLines[lineIndex] = allLines[lineIndex].substring(1);
                        newSelectionStart = Math.max(value.lastIndexOf('\n', selectionStart - 1) + 1, newSelectionStart - 1);
                    } else if (allLines[lineIndex] && allLines[lineIndex].startsWith('  ')) {
                        allLines[lineIndex] = allLines[lineIndex].substring(2);
                        newSelectionStart = Math.max(value.lastIndexOf('\n', selectionStart - 1) + 1, newSelectionStart - 2);
                    }
                    const newValue = allLines.join('\n');
                    onContentChange(newValue);

                    setTimeout(() => {
                        if(editorRef.current) {
                            editorRef.current.selectionStart = editorRef.current.selectionEnd = newSelectionStart;
                        }
                    }, 0);
                } else {
                    const newValue =
                        value.substring(0, selectionStart) +
                        '\t' +
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
          onSelect={handleSelectionChange}
          className="absolute inset-0 resize-none focus:outline-none bg-transparent text-transparent caret-text-primary w-full h-full z-0"
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
          className="code-view absolute inset-0 resize-none focus:outline-none overflow-hidden text-text-primary w-full h-full pointer-events-none z-10"
          style={{
            ...commonStyles,
            paddingTop: '1rem',
            paddingBottom: END_PADDING,
            paddingRight: `calc(${CODE_PADDING_LEFT} + ${scrollbarWidth}px)`,
          }}
        >
          <code>
            {highlightedContent.map((lineHtml, index) => (
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
        .checkbox-container {
            position: relative;
            display: inline-block;
        }
        .hidden-syntax {
            visibility: hidden;
        }
        .custom-checkbox {
            position: absolute;
            left: 0;
            top: 3px;
            width: 16px;
            height: 16px;
            border: 2px solid #a9b1d6;
            border-radius: 4px;
            cursor: pointer;
            pointer-events: auto;
        }
        .custom-checkbox.checked {
            background-color: #7aa2f7;
            border-color: #7aa2f7;
        }
        .custom-checkbox.checked::after {
            content: '';
            position: absolute;
            left: 4px;
            top: 0px;
            width: 5px;
            height: 10px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
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
