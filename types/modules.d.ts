// types/uiw-react-textarea-code-editor.d.ts
// Type definitions for @uiw/react-textarea-code-editor
declare module '@uiw/react-textarea-code-editor' {
  import { DetailedHTMLProps, TextareaHTMLAttributes } from 'react';
  
  export interface ICodeEditorProps extends DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
    value?: string;
    language?: string;
    placeholder?: string;
    padding?: number;
    style?: React.CSSProperties;
    className?: string;
    'data-color-mode'?: 'light' | 'dark';
  }
  
  const CodeEditor: React.FC<ICodeEditorProps>;
  export default CodeEditor;
}

declare module '@uiw/react-textarea-code-editor/dist.css' {
  const content: string;
  export default content;
}