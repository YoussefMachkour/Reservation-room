// components/chat/ChatInput.tsx
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Smile } from 'lucide-react';
import { FileUpload } from './FileUpload';
import type { MessageType } from '@/types/chat';
import { DEFAULT_FILE_CONFIG } from '@/types/chat';

interface ChatInputMessageData {
  content: string;
  type: MessageType;
  attachments?: File[];
}

interface ChatInputProps {
  onSendMessage: (message: ChatInputMessageData) => void;
  placeholder?: string;
  disabled?: boolean;
  showFileUpload?: boolean;
  showEmoji?: boolean;
  maxLength?: number;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = "Type your message...",
  disabled = false,
  showFileUpload = true,
  showEmoji = true,
  maxLength = 2000,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && files.length === 0) || disabled) return;

    onSendMessage({
      content: message.trim(),
      type: 'text',
      attachments: files.length > 0 ? files : undefined
    });

    setMessage('');
    setFiles([]);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isDisabled = disabled || (!message.trim() && files.length === 0);

  return (
    <div className={className}>
      <FileUpload
        files={files}
        onFilesChange={handleFilesChange}
        onRemoveFile={handleRemoveFile}
        config={DEFAULT_FILE_CONFIG}
        showPreview={true}
      />
      
      <div className="flex items-center space-x-2 p-4 border-t">
        {showFileUpload && (
          <FileUpload
            files={[]}
            onFilesChange={handleFilesChange}
            onRemoveFile={handleRemoveFile}
            config={DEFAULT_FILE_CONFIG}
            showPreview={false}
          >
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              type="button"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </FileUpload>
        )}
        
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={showEmoji ? "pr-10" : ""}
          />
          
          {showEmoji && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              disabled={disabled}
              type="button"
            >
              <Smile className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={isDisabled}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {maxLength && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/{maxLength}
          </p>
        </div>
      )}
    </div>
  );
};