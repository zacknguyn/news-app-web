import React, { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Indent,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Outdent,
  Underline as UnderlineIcon,
} from 'lucide-react';

type EditorImage = {
  src: string;
  alt: string;
  title: string;
};

type RichPostEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onImagesChange?: (images: EditorImage[]) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onContextChange?: (context: RichEditorContext) => void;
  onControlsReady?: (controls: RichEditorControls | null) => void;
  error?: string;
};

type EditorPanel =
  | { kind: 'link'; url: string }
  | { kind: 'image'; url: string }
  | { kind: 'imageDetails'; alt: string; title: string }
  | null;

export type RichEditorContext =
  | { kind: 'default'; fontSize: number; block: string }
  | { kind: 'text'; fontSize: number; block: string }
  | { kind: 'image'; fontSize: number; block: string; src: string; alt: string; title: string };

export type RichEditorControls = {
  applyFontSize: (size: number) => void;
  applyBlock: (block: string) => void;
  editImageDetails: () => void;
  uploadImage: () => void;
};

const toolbarButtonClass = (active = false) =>
  `inline-flex h-9 min-w-9 items-center justify-center border border-transparent px-2.5 text-sm font-semibold transition-colors ${
    active
      ? 'bg-app-heading text-app-surface border-app-heading'
      : 'text-app-muted hover:text-app-heading hover:bg-app-surface-alt'
  }`;

const toolbarGroupClass = 'flex shrink-0 items-center gap-0.5 border border-app-border bg-app-surface p-0.5';
const toolbarLabelClass = 'px-2 text-[10px] font-bold font-mono text-app-faint select-none';
const selectClass =
  'h-9 border border-transparent bg-transparent px-2 text-sm font-semibold text-app-heading outline-none hover:bg-app-surface-alt focus:bg-app-surface-alt focus:border-app-border';
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const getImages = (html: string): EditorImage[] => {
  if (typeof document === 'undefined') return [];
  const template = document.createElement('template');
  template.innerHTML = html;
  return [...template.content.querySelectorAll<HTMLImageElement>('img')]
    .map((image) => ({
      src: image.getAttribute('src') || '',
      alt: image.getAttribute('alt') || '',
      title: image.getAttribute('title') || '',
    }))
    .filter((image) => Boolean(image.src));
};

export const RichPostEditor: React.FC<RichPostEditorProps> = ({
  value,
  onChange,
  onImagesChange,
  onUploadImage,
  onContextChange,
  onControlsReady,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [panel, setPanel] = useState<EditorPanel>(null);

  const getCurrentBlock = (currentEditor: Editor) => {
    if (currentEditor.isActive('heading', { level: 2 })) return 'heading2';
    if (currentEditor.isActive('heading', { level: 3 })) return 'heading3';
    if (currentEditor.isActive('blockquote')) return 'quote';
    return 'paragraph';
  };

  const syncContext = (currentEditor: Editor) => {
    const currentSize = Number.parseInt(currentEditor.getAttributes('textStyle').fontSize || '', 10);
    const nextSize = Number.isFinite(currentSize) ? currentSize : 18;
    setFontSize(nextSize);

    if (currentEditor.isActive('image')) {
      const attrs = currentEditor.getAttributes('image') as { src?: string; alt?: string; title?: string };
      onContextChange?.({
        kind: 'image',
        fontSize: nextSize,
        block: getCurrentBlock(currentEditor),
        src: attrs.src || '',
        alt: attrs.alt || '',
        title: attrs.title || '',
      });
      return;
    }

    onContextChange?.({
      kind: currentEditor.state.selection.empty ? 'default' : 'text',
      fontSize: nextSize,
      block: getCurrentBlock(currentEditor),
    });
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      TextStyle,
      FontSize,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Image.configure({
        allowBase64: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Write the report. Use headings, quotes, lists, links, and image blocks...',
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'tourane-editor-content reader-serif min-h-[480px] px-0 py-6 text-xl leading-relaxed text-[var(--color-app-ink)] outline-none lg:min-h-[600px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      onImagesChange?.(getImages(html));
      syncContext(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      syncContext(editor);
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed || editor.getHTML() === value) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  const addLink = () => {
    if (!editor || editor.isDestroyed) return;
    const previousUrl = editor.getAttributes('link').href;
    setPanel({ kind: 'link', url: previousUrl || 'https://' });
  };

  const applyBlock = (block: string) => {
    if (!editor || editor.isDestroyed) return;
    if (block === 'paragraph') {
      editor.chain().focus().setParagraph().run();
      return;
    }
    if (block === 'heading2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
      return;
    }
    if (block === 'heading3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
      return;
    }
    if (block === 'quote') {
      editor.chain().focus().toggleBlockquote().run();
    }
  };

  const applyFontSize = (nextSize: number) => {
    if (!editor || editor.isDestroyed) return;
    setFontSize(nextSize);
    editor.chain().focus().setFontSize(`${nextSize}px`).run();
    window.setTimeout(() => syncContext(editor), 0);
  };

  const uploadAndInsert = async (file: File) => {
    if (!onUploadImage || !editor || editor.isDestroyed) return;
    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setIsUploading(false);
    }
  };

  const addImage = () => {
    if (!editor || editor.isDestroyed) return;
    setPanel({ kind: 'image', url: '' });
  };

  const editImageDetails = () => {
    if (!editor || editor.isDestroyed || !editor.isActive('image')) return;
    const attrs = editor.getAttributes('image') as { src?: string; alt?: string; title?: string };
    setPanel({ kind: 'imageDetails', alt: attrs.alt || '', title: attrs.title || '' });
  };

  const submitPanel = () => {
    if (!editor || editor.isDestroyed || !panel) return;
    if (panel.kind === 'link') {
      if (!panel.url.trim()) editor.chain().focus().unsetLink().run();
      else editor.chain().focus().extendMarkRange('link').setLink({ href: panel.url.trim() }).run();
    }
    if (panel.kind === 'image' && panel.url.trim()) {
      editor.chain().focus().setImage({ src: panel.url.trim() }).run();
    }
    if (panel.kind === 'imageDetails') {
      editor.chain().focus().updateAttributes('image', { alt: panel.alt.trim(), title: panel.title.trim() }).run();
    }
    setPanel(null);
  };

  const uploadImageFiles = (files: FileList | File[]) => {
    Array.from(files)
      .filter((file) => allowedImageTypes.has(file.type))
      .forEach((file) => {
        void uploadAndInsert(file);
      });
  };

  const cleanPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (!editor || editor.isDestroyed) return;
    if (event.clipboardData.files.length > 0) {
      const imageFiles = Array.from(event.clipboardData.files).filter((file) => allowedImageTypes.has(file.type));
      if (imageFiles.length > 0) {
        event.preventDefault();
        uploadImageFiles(imageFiles);
        return;
      }
    }

    const html = event.clipboardData.getData('text/html');
    if (!html) return;
    window.setTimeout(() => {
      const nextHtml = editor
        .getHTML()
        .replace(/\sstyle="[^"]*"/gi, '')
        .replace(/\sclass="Mso[^"]*"/gi, '')
        .replace(/<span>([\s\S]*?)<\/span>/gi, '$1');
      if (nextHtml !== editor.getHTML()) {
        editor.commands.setContent(nextHtml, { emitUpdate: true });
      }
    }, 0);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.files.length === 0) return;
    const imageFiles = Array.from(event.dataTransfer.files).filter((file) => allowedImageTypes.has(file.type));
    if (imageFiles.length === 0) return;
    event.preventDefault();
    uploadImageFiles(imageFiles);
  };

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      onControlsReady?.(null);
      return;
    }

    onControlsReady?.({
      applyFontSize,
      applyBlock,
      editImageDetails,
      uploadImage: () => fileInputRef.current?.click(),
    });

    return () => onControlsReady?.(null);
    // Controls are re-registered when the editor instance changes; toolbar callbacks read the current editor closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, fontSize]);

  if (!editor || editor.isDestroyed) return null;

  return (
    <div className="border border-app-border bg-app-surface">
      <BubbleMenu
        editor={editor}
        updateDelay={120}
        options={{ placement: 'top', offset: 8 }}
        shouldShow={({ editor }) => !editor.state.selection.empty}
      >
        <div className="flex items-center gap-0.5 border border-app-border bg-app-surface p-0.5 shadow-[var(--shadow-modal)]">
          <button
            type="button"
            className={toolbarButtonClass(editor.isActive('bold'))}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass(editor.isActive('italic'))}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass(editor.isActive('link'))}
            onClick={addLink}
            aria-label="Add link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <label className="ml-1 flex items-center gap-2 border-l border-app-border pl-2 text-xs font-semibold text-app-muted">
            <span className="font-mono tabular-nums">{fontSize}px</span>
            <input
              type="range"
              min="14"
              max="32"
              value={fontSize}
              onChange={(event) => applyFontSize(Number(event.target.value))}
              className="w-28 accent-app-action"
            />
          </label>
        </div>
      </BubbleMenu>

      <div className="overflow-x-auto border-b border-app-border bg-app-surface-alt p-2">
        <div className="flex min-w-max items-center gap-1.5">
          <div className={toolbarGroupClass}>
            <span className={toolbarLabelClass}>Block</span>
            <select
              value={getCurrentBlock(editor)}
              onChange={(event) => applyBlock(event.target.value)}
              className={selectClass}
              aria-label="Block style"
            >
              <option value="paragraph">Paragraph</option>
              <option value="heading2">Headline</option>
              <option value="heading3">Subhead</option>
              <option value="quote">Quote</option>
            </select>
          </div>

          <div className={toolbarGroupClass}>
            <span className={toolbarLabelClass}>Text</span>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive('bold'))}
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive('italic'))}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive('underline'))}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              aria-label="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive('link'))}
              onClick={addLink}
              aria-label="Add link"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className={toolbarGroupClass}>
            <span className={toolbarLabelClass}>Structure</span>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive('bulletList'))}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              aria-label="Bullet list"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive('orderedList'))}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              aria-label="Numbered list"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass()}
              onClick={() => editor.chain().focus().liftListItem('listItem').run()}
              aria-label="Outdent list item"
            >
              <Outdent className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass()}
              onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
              aria-label="Indent list item"
            >
              <Indent className="h-4 w-4" />
            </button>
          </div>

          <div className={toolbarGroupClass}>
            <span className={toolbarLabelClass}>Align</span>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive({ textAlign: 'left' }))}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              aria-label="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive({ textAlign: 'center' }))}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              aria-label="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive({ textAlign: 'right' }))}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              aria-label="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          <div className={toolbarGroupClass}>
            <span className={toolbarLabelClass}>Media</span>
            <button type="button" className={toolbarButtonClass()} onClick={addImage} aria-label="Add image URL">
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass(editor.isActive('image'))}
              onClick={editImageDetails}
              aria-label="Edit selected image caption and alt text"
            >
              Alt
            </button>
            <button
              type="button"
              className={toolbarButtonClass()}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload image"
              disabled={isUploading}
            >
              {isUploading ? '...' : 'Upload'}
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void uploadAndInsert(file);
          }}
        />
      </div>
      {panel && (
        <div className="border-b border-app-border p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            {panel.kind === 'link' && (
              <label className="block">
                <span className="mono-label mb-2 block text-app-muted">Source URL</span>
                <input
                  type="url"
                  value={panel.url}
                  onChange={(event) => setPanel({ kind: 'link', url: event.target.value })}
                  className="h-10 w-full border border-app-border bg-app-bg px-3 text-sm text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
                  autoFocus
                />
              </label>
            )}
            {panel.kind === 'image' && (
              <label className="block">
                <span className="mono-label mb-2 block text-app-muted">Image URL</span>
                <input
                  type="url"
                  value={panel.url}
                  onChange={(event) => setPanel({ kind: 'image', url: event.target.value })}
                  className="h-10 w-full border border-app-border bg-app-bg px-3 text-sm text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
                  autoFocus
                />
              </label>
            )}
            {panel.kind === 'imageDetails' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mono-label mb-2 block text-app-muted">Alt text</span>
                  <input
                    value={panel.alt}
                    onChange={(event) => setPanel({ ...panel, alt: event.target.value })}
                    className="h-10 w-full border border-app-border bg-app-bg px-3 text-sm text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
                    autoFocus
                  />
                </label>
                <label className="block">
                  <span className="mono-label mb-2 block text-app-muted">Caption</span>
                  <input
                    value={panel.title}
                    onChange={(event) => setPanel({ ...panel, title: event.target.value })}
                    className="h-10 w-full border border-app-border bg-app-bg px-3 text-sm text-app-text outline-none focus:border-app-action focus:shadow-[var(--shadow-focus)]"
                  />
                </label>
              </div>
            )}
            <button
              type="button"
              onClick={submitPanel}
              className="h-10 bg-app-action px-4 font-mono text-[11px] uppercase tracking-wider text-app-on-action hover:bg-app-action-hover"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="h-10 px-2 font-mono text-[11px] uppercase tracking-wider text-app-muted hover:text-app-heading"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <EditorContent editor={editor} className="px-4 sm:px-5" onPaste={cleanPaste} onDrop={handleDrop} />
      {error && <p className="border-t border-app-border px-4 py-2 text-xs font-bold text-error sm:px-5">{error}</p>}
    </div>
  );
};
