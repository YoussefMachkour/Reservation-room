// components/chat/ChatInput.tsx
import React, { useState } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "../ui/button/Button";
import { Input } from "../ui/input/Input";
import { FileUpload } from "./FileUpload";
import { MessageType, DEFAULT_FILE_CONFIG } from "@/types/chat";
import { useTheme } from "@/contexts/ThemeContext";

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
  className = "",
}) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { isDark } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((!message.trim() && files.length === 0) || disabled) return;

    onSendMessage({
      content: message.trim(),
      type: "text",
      attachments: files.length > 0 ? files : undefined,
    });

    setMessage("");
    setFiles([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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

      <form
        onSubmit={handleSubmit}
        className={`flex items-end gap-3 p-4 border-t ${
          isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        {showFileUpload && (
          <FileUpload
            files={[]}
            onFilesChange={handleFilesChange}
            onRemoveFile={handleRemoveFile}
            config={DEFAULT_FILE_CONFIG}
            showPreview={false}
          >
            <button
              type="button"
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
              } ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              disabled={disabled}
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </FileUpload>
        )}

        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rightIcon={showEmoji ? Smile : undefined}
            className="pr-12"
          />
        </div>

        <Button
          type="submit"
          disabled={isDisabled}
          icon={Send}
          size="md"
          loading={disabled}
        >
          Send
        </Button>
      </form>

      {maxLength && (
        <div className="px-4 pb-2">
          <p
            className={`text-xs text-right ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {message.length}/{maxLength}
          </p>
        </div>
      )}
    </div>
  );
};
