import React, { useEffect, useRef, useCallback } from 'react';

interface MinimapProps {
  editorRef: React.RefObject<HTMLTextAreaElement | HTMLDivElement>;
  minimapRef: React.RefObject<HTMLCanvasElement>;
  content: string;
  width?: number;
  theme?: {
    background?: string;
    foreground?: string;
    activeLine?: string;
    viewport?: string;
  };
}

const DEFAULT_THEME = {
  background: '#1a1b26',
  foreground: '#c0caf5',
  activeLine: '#1f2335',
  viewport: 'rgba(122, 162, 247, 0.3)'
};

const Minimap: React.FC<MinimapProps> = ({
  editorRef,
  minimapRef,
  content,
  width = 120,
  theme = DEFAULT_THEME
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isMouseOverViewportRef = useRef(false);
  const dragOffsetYRef = useRef(0);

  const getScaleFactor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return 0.1;
    const editorWidth = editor.clientWidth;
    return (width - 8) / editorWidth; 
  }, [editorRef, width]);

  const drawMinimap = useCallback(() => {
    const canvas = minimapRef.current;
    const editor = editorRef.current;
    const container = containerRef.current;
    if (!canvas || !editor || !container) return;

    const styles = getComputedStyle(editor);
    const editorFontSize = parseFloat(styles.fontSize);
    let editorLineHeight = parseFloat(styles.lineHeight);
    if (isNaN(editorLineHeight)) editorLineHeight = editorFontSize * 1.2;
    
    const editorFontFamily = styles.fontFamily;
    const editorPaddingTop = parseFloat(styles.paddingTop);
    const editorPaddingLeft = parseFloat(styles.paddingLeft);

    const dpr = window.devicePixelRatio || 1;
    const scale = getScaleFactor();
    const scaledHeight = editor.scrollHeight * scale;

    canvas.width = width * dpr;
    canvas.height = scaledHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${scaledHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, scaledHeight);

    const lines = content.split('\n');
    const scaledLineHeight = editorLineHeight * scale;
    ctx.font = `${editorFontSize * scale}px ${editorFontFamily}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = theme.foreground;

    let y = editorPaddingTop * scale;
    for (const line of lines) {
      ctx.fillText(line, editorPaddingLeft * scale, y);
      y += scaledLineHeight;
      if (y > scaledHeight) break;
    }

    const viewportHeight = (editor.clientHeight / editor.scrollHeight) * scaledHeight;
    const viewportY = (editor.scrollTop / editor.scrollHeight) * scaledHeight;

    const isHoveringOrDragging = isDraggingRef.current || isMouseOverViewportRef.current;
    ctx.fillStyle = isHoveringOrDragging ? 'rgba(122, 162, 247, 0.5)' : theme.viewport;
    ctx.fillRect(2, viewportY, width - 4, viewportHeight);

    if (isHoveringOrDragging) {
      ctx.strokeStyle = 'rgba(122, 162, 247, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, viewportY, width - 4, viewportHeight);
    }
    
    const containerHeight = container.clientHeight;
    if (scaledHeight > containerHeight) {
      const viewportCenter = viewportY + viewportHeight / 2;
      const containerCenter = containerHeight / 2;
      let targetScroll = viewportCenter - containerCenter;
      const maxMinimapScroll = scaledHeight - containerHeight;
      const newMinimapScroll = Math.max(0, Math.min(targetScroll, maxMinimapScroll));
      canvas.style.transform = `translateY(-${newMinimapScroll}px)`;
    } else {
      canvas.style.transform = `translateY(0px)`;
    }
  }, [content, getScaleFactor, minimapRef, theme, width, editorRef]);

  const getPositions = useCallback((e: React.MouseEvent | MouseEvent) => {
    const editor = editorRef.current;
    const canvas = minimapRef.current;
    const container = containerRef.current;
    if (!editor || !canvas || !container) return null;
    const rect = container.getBoundingClientRect();
    const yInContainer = e.clientY - rect.top;
    const transform = getComputedStyle(canvas).transform;
    const matrix = new DOMMatrixReadOnly(transform);
    const minimapScrollTop = Math.abs(matrix.m42);
    const yOnCanvas = yInContainer + minimapScrollTop;
    return { yOnCanvas, yInContainer, editor, canvas, container };
  }, [editorRef, minimapRef]);

  const handleMinimapClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) return;
    const pos = getPositions(e);
    if (!pos) return;
    const { yOnCanvas, editor, canvas } = pos;
    const viewportHeight = (editor.clientHeight / editor.scrollHeight) * canvas.offsetHeight;
    const newScrollTop = (yOnCanvas - viewportHeight / 2) / canvas.offsetHeight * editor.scrollHeight;
    const clampedScrollTop = Math.max(0, Math.min(newScrollTop, editor.scrollHeight - editor.clientHeight));
    editor.scrollTop = clampedScrollTop;
  }, [getPositions]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getPositions(e);
    if (!pos) return;
    const { yOnCanvas, editor, canvas } = pos;
    const scaledHeight = canvas.offsetHeight;
    const viewportHeight = (editor.clientHeight / editor.scrollHeight) * scaledHeight;
    const viewportY = (editor.scrollTop / editor.scrollHeight) * scaledHeight;

    if (yOnCanvas >= viewportY && yOnCanvas <= viewportY + viewportHeight) {
      isDraggingRef.current = true;
      document.body.style.cursor = 'grabbing';
      dragOffsetYRef.current = yOnCanvas - viewportY;

      if (minimapRef.current) {
        minimapRef.current.style.transition = 'none';
      }
      e.preventDefault();
    }
  }, [getPositions, minimapRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const editor = editorRef.current;
    const canvas = minimapRef.current;
    const container = containerRef.current;
    if (!editor || !canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const mouseYInContainer = e.clientY - rect.top;
    const transform = getComputedStyle(canvas).transform;
    const matrix = new DOMMatrixReadOnly(transform);
    const minimapScrollTop = Math.abs(matrix.m42);
    const yOnCanvas = mouseYInContainer + minimapScrollTop;
    const newViewportY = yOnCanvas - dragOffsetYRef.current;
    const newScrollTop = (newViewportY / canvas.offsetHeight) * editor.scrollHeight;
    const clampedScrollTop = Math.max(0, Math.min(newScrollTop, editor.scrollHeight - editor.clientHeight));
    
    // Set the scroll position directly. No animation, no easing.
    editor.scrollTop = clampedScrollTop;
    
  }, [editorRef, minimapRef]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    document.body.style.cursor = 'default';

    if (minimapRef.current) {
      minimapRef.current.style.transition = 'transform 100ms ease-out';
    }
  }, [minimapRef]);
  
  const handleMouseMoveOnCanvas = useCallback((e: React.MouseEvent) => {
    const pos = getPositions(e);
    if (!pos) return;
    const { yOnCanvas, editor, canvas } = pos;
    const scaledHeight = canvas.offsetHeight;
    const viewportHeight = (editor.clientHeight / editor.scrollHeight) * scaledHeight;
    const viewportY = (editor.scrollTop / editor.scrollHeight) * scaledHeight;
    const isOverViewport = yOnCanvas >= viewportY && yOnCanvas <= viewportY + viewportHeight;
    if (isOverViewport !== isMouseOverViewportRef.current) {
        isMouseOverViewportRef.current = isOverViewport;
        canvas.style.cursor = isOverViewport ? 'grab' : 'default';
        drawMinimap();
    }
  }, [drawMinimap, getPositions]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    let animationFrameId: number | null = null;
    const updateViewport = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(drawMinimap);
    };
    updateViewport();
    editor.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('resize', updateViewport);
    const observer = new ResizeObserver(updateViewport);
    observer.observe(editor);
    return () => {
      editor.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [drawMinimap, editorRef]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: '100%',
        overflow: 'hidden',
        backgroundColor: theme.background,
        cursor: 'pointer'
      }}
      onMouseDown={(e) => {
        handleMouseDown(e);
        handleMinimapClick(e);
      }}
      onMouseMove={handleMouseMoveOnCanvas}
      onMouseLeave={() => {
        isMouseOverViewportRef.current = false;
        drawMinimap();
      }}
    >
      <canvas
        ref={minimapRef}
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
          height: 'auto',
          display: 'block',
          transition: 'transform 100ms ease-out',
        }}
      />
    </div>
  );
};

export default Minimap;