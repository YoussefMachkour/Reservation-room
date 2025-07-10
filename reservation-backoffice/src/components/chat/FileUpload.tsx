// components/chat/FileUpload.tsx
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, FileText, Image, Video, Music } from 'lucide-react';
import type { FileUploadConfig } from '@/types/chat';
import {  ChatUtils } from '@/types/chat';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  config: FileUploadConfig;
  showPreview?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  onRemoveFile,
  config,
  showPreview = true,
  children,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    selectedFiles.forEach(file => {
      const validation = ChatUtils.validateFile(file, config);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error!);
      }
    });

    if (errors.length > 0) {
      // You can replace this with a toast notification
      console.error('File validation errors:', errors);
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      const totalFiles = files.length + validFiles.length;
      if (totalFiles > config.maxFilesPerMessage) {
        const allowedCount = config.maxFilesPerMessage - files.length;
        const trimmedFiles = validFiles.slice(0, allowedCount);
        onFilesChange([...files, ...trimmedFiles]);
        alert(`Only ${allowedCount} more files can be added. Maximum ${config.maxFilesPerMessage} files per message.`);
      } else {
        onFilesChange([...files, ...validFiles]);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const acceptedTypes = config.allowedMimeTypes.join(',');

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File Upload Trigger */}
      {children ? (
        <div onClick={triggerFileSelect} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={triggerFileSelect}
          title="Attach file"
        >
          <FileText className="w-4 h-4" />
        </Button>
      )}

      {/* File Preview */}
      {showPreview && files.length > 0 && (
        <div className="px-4 py-3 border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Files to send:
              </p>
              <Badge variant="secondary" className="text-xs">
                {files.length}/{config.maxFilesPerMessage}
              </Badge>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-muted rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ChatUtils.formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveFile(index)}
                    className="h-6 w-6"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};