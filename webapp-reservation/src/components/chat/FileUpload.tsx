// components/chat/FileUpload.tsx
import React, { useRef } from "react";
import { X, FileText, Image, Video, Music } from "lucide-react";
import { FileUploadConfig, ChatUtils } from "@/types/chat";
import { useTheme } from "@/contexts/ThemeContext";

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
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (fileType.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (fileType.startsWith("audio/")) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    selectedFiles.forEach((file) => {
      const validation = ChatUtils.validateFile(file, config);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error!);
      }
    });

    if (errors.length > 0) {
      // You can replace this with a toast notification
      console.error("File validation errors:", errors);
      alert(errors.join("\n"));
    }

    if (validFiles.length > 0) {
      const totalFiles = files.length + validFiles.length;
      if (totalFiles > config.maxFilesPerMessage) {
        const allowedCount = config.maxFilesPerMessage - files.length;
        const trimmedFiles = validFiles.slice(0, allowedCount);
        onFilesChange([...files, ...trimmedFiles]);
        alert(
          `Only ${allowedCount} more files can be added. Maximum ${config.maxFilesPerMessage} files per message.`
        );
      } else {
        onFilesChange([...files, ...validFiles]);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const acceptedTypes = config.allowedMimeTypes.join(",");

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
        <button
          type="button"
          onClick={triggerFileSelect}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
          }`}
          title="Attach file"
        >
          <FileText className="w-5 h-5" />
        </button>
      )}

      {/* File Preview */}
      {showPreview && files.length > 0 && (
        <div
          className={`px-4 py-3 border-t ${
            isDark
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Files to send:
              </p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isDark
                    ? "bg-gray-700 text-gray-300 border border-gray-600"
                    : "bg-gray-200 text-gray-600 border border-gray-300"
                }`}
              >
                {files.length}/{config.maxFilesPerMessage}
              </span>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDark
                        ? "bg-blue-900 text-blue-300"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {file.name}
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {ChatUtils.formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveFile(index)}
                    className={`p-1 rounded-full transition-colors ${
                      isDark
                        ? "hover:bg-gray-600 text-gray-400 hover:text-gray-300"
                        : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                    }`}
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
