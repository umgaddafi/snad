import { useEffect, useRef, useState } from 'react';
import { 
  Code, 
  Eye, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Heading2, 
  Heading3, 
  Link as LinkIcon, 
  RotateCcw, 
  RotateCw,
  Loader2,
  Sparkles
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

declare global {
  interface Window {
    ClassicEditor?: any;
  }
}

const CKEDITOR_CDN = 'https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js';

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Compose content...',
  minHeight = '380px'
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const isUpdatingFromProp = useRef(false);

  const [isCkLoaded, setIsCkLoaded] = useState(false);
  const [ckLoadError, setCkLoadError] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const fallbackEditableRef = useRef<HTMLDivElement>(null);

  // 1. Dynamically load CKEditor from CDN (100% Free Open Source build, zero payment)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.ClassicEditor) {
      setIsCkLoaded(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${CKEDITOR_CDN}"]`);
    if (existingScript) {
      const onLoad = () => setIsCkLoaded(true);
      existingScript.addEventListener('load', onLoad);
      return () => existingScript.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.src = CKEDITOR_CDN;
    script.async = true;
    script.onload = () => {
      setIsCkLoaded(true);
    };
    script.onerror = () => {
      console.warn('CKEditor CDN failed to load; using built-in rich text editor fallback.');
      setCkLoadError(true);
    };

    document.head.appendChild(script);
  }, []);

  // 2. Initialize or destroy CKEditor instance
  useEffect(() => {
    if (!isCkLoaded || showHtmlSource || !containerRef.current || !window.ClassicEditor) return;

    let isMounted = true;
    const element = document.createElement('div');
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(element);

    window.ClassicEditor.create(element, {
      toolbar: {
        items: [
          'heading',
          '|',
          'bold',
          'italic',
          'link',
          'bulletedList',
          'numberedList',
          'blockQuote',
          '|',
          'undo',
          'redo'
        ],
        shouldNotGroupWhenFull: true
      },
      heading: {
        options: [
          { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
        ]
      },
      placeholder: placeholder
    })
      .then((editor: any) => {
        if (!isMounted) {
          editor.destroy();
          return;
        }

        editorRef.current = editor;

        // Set initial data
        if (value) {
          isUpdatingFromProp.current = true;
          editor.setData(value);
          isUpdatingFromProp.current = false;
        }

        // Listen for changes
        editor.model.document.on('change:data', () => {
          if (isUpdatingFromProp.current) return;
          const data = editor.getData();
          onChange(data);
        });
      })
      .catch((err: any) => {
        console.error('Failed to initialize CKEditor:', err);
        setCkLoadError(true);
      });

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.destroy().catch(() => {});
        editorRef.current = null;
      }
    };
  }, [isCkLoaded, showHtmlSource]);

  // 3. Update editor content if external value changes (e.g., Reset button clicked)
  useEffect(() => {
    if (editorRef.current && !showHtmlSource) {
      const currentData = editorRef.current.getData();
      if (currentData !== value) {
        isUpdatingFromProp.current = true;
        editorRef.current.setData(value || '');
        isUpdatingFromProp.current = false;
      }
    }
  }, [value, showHtmlSource]);

  // Fallback built-in rich actions (execCommand for offline / immediate toolbar)
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (fallbackEditableRef.current) {
      onChange(fallbackEditableRef.current.innerHTML);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500">
      {/* Top Meta Bar: Editor Mode & HTML Source Switcher */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
        <div className="flex items-center gap-2 text-gray-500 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>{isCkLoaded && !ckLoadError ? 'CKEditor 5 (Online Rich WYSIWYG)' : 'Rich Text Editor'}</span>
          {!isCkLoaded && !ckLoadError && (
            <span className="flex items-center gap-1 text-[11px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Initializing editor...
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowHtmlSource(!showHtmlSource)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
            showHtmlSource 
              ? 'bg-orange-500 text-white shadow-sm' 
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
          title="Toggle between WYSIWYG and Raw HTML source"
        >
          {showHtmlSource ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
          <span>{showHtmlSource ? 'Visual Editor' : 'HTML Source'}</span>
        </button>
      </div>

      {/* Editor Body */}
      {showHtmlSource ? (
        // Raw HTML source textarea for power users
        <div className="p-4 bg-slate-900 text-slate-100">
          <div className="text-[11px] text-slate-400 font-mono mb-2 flex items-center justify-between">
            <span>Direct HTML Source Editor:</span>
            <span>{value?.length || 0} characters</span>
          </div>
          <textarea
            rows={14}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950 text-orange-300 font-mono text-xs p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed"
            placeholder="<p>Write raw HTML here...</p>"
          />
        </div>
      ) : isCkLoaded && !ckLoadError ? (
        // CKEditor 5 container
        <div className="ckeditor-wrapper p-1">
          <div ref={containerRef} style={{ minHeight }} />
          <style>{`
            .ck.ck-toolbar {
              border: none !important;
              border-bottom: 1px solid #f3f4f6 !important;
              background: #fbfbfb !important;
              padding: 0.5rem 0.75rem !important;
              border-radius: 0.75rem 0.75rem 0 0 !important;
            }
            .ck-editor__editable_inline {
              min-height: ${minHeight} !important;
              padding: 1.25rem !important;
              border: none !important;
              font-family: inherit !important;
              font-size: 0.95rem !important;
              line-height: 1.75 !important;
              color: #374151 !important;
            }
            .ck.ck-editor__editable.ck-focused:not(.ck-editor__nested-editable) {
              border: none !important;
              box-shadow: none !important;
            }
            .ck-editor__editable h1 { font-size: 1.875rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #111827; }
            .ck-editor__editable h2 { font-size: 1.5rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #111827; }
            .ck-editor__editable h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #111827; }
            .ck-editor__editable p { margin-bottom: 0.85rem; }
            .ck-editor__editable strong { font-weight: 700; color: #111827; }
            .ck-editor__editable em { font-style: italic; }
            .ck-editor__editable ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.85rem; }
            .ck-editor__editable ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.85rem; }
            .ck-editor__editable blockquote { border-left: 4px solid #f97316; padding-left: 1rem; font-style: italic; color: #6b7280; }
          `}</style>
        </div>
      ) : (
        // Built-in Lightweight Rich Text Editor Fallback
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700 font-bold"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700 italic"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700 underline"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => execCmd('formatBlock', '<h2>')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700 font-extrabold text-xs"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('formatBlock', '<h3>')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700 font-bold text-xs"
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('formatBlock', '<blockquote>')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) execCmd('createLink', url);
              }}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-6 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => execCmd('undo')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('redo')}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div
            ref={fallbackEditableRef}
            contentEditable
            onInput={(e) => onChange((e.target as HTMLElement).innerHTML)}
            dangerouslySetInnerHTML={{ __html: value }}
            style={{ minHeight }}
            className="p-4 focus:outline-none text-sm text-gray-700 leading-relaxed overflow-y-auto"
          />
        </div>
      )}
    </div>
  );
}
