// components/chat/MessageBubble.tsx
import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video,
  User,
  Bot,
  Headphones
} from 'lucide-react';
import { Message, MessageAttachment, ChatUtils } from '@/types/chat';
import { useTheme } from '@/contexts/ThemeContext';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser?: boolean;
  showAvatar?: boolean;
  showMetadata?: boolean;
  onFileDownload?: (attachment: MessageAttachment) => void;
  onImageClick?: (imageUrl: string) => void;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser = false,
  showAvatar = true,
  showMetadata = false,
  onFileDownload,
  onImageClick,
  className = ''
}) => {
  const { isDark } = useTheme();

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSenderIcon = () => {
    switch (message.senderType) {
      case 'user': return <User className="w-4 h-4" />;
      case 'bot': return <Bot className="w-4 h-4" />;
      case 'admin': return <Headphones className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const handleFileDownload = (attachment: MessageAttachment) => {
    if (onFileDownload) {
      onFileDownload(attachment);
    } else {
      ChatUtils.downloadFile(attachment.fileUrl, attachment.fileName);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    if (onImageClick) {
      onImageClick(imageUrl);
    } else {
      window.open(imageUrl, '_blank');
    }
  };

  const renderMessageContent = () => {
    // Special message types (booking confirmations, etc.) - check these first
    if (['booking_confirmation', 'membership_renewal', 'cancellation', 'payment_reminder', 'system_notification'].includes(message.type)) {
      return (
        <div className={`p-3 border rounded-lg ${ChatUtils.getMessageTypeColor(message.type, isDark)}`}>
          <p className="text-sm font-medium">{message.content}</p>
          {showMetadata && message.metadata && (
            <div className="mt-2 text-xs opacity-75 space-y-1">
              {message.metadata.bookingId && (
                <p>Booking ID: {message.metadata.bookingId}</p>
              )}
              {message.metadata.spaceId && (
                <p>Space: {message.metadata.spaceId}</p>
              )}
              {message.metadata.paymentId && (
                <p>Payment ID: {message.metadata.paymentId}</p>
              )}
              {message.metadata.membershipId && (
                <p>Membership ID: {message.metadata.membershipId}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Messages with attachments
    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];
      
      if (message.type === 'image') {
        return (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            <img
              src={attachment.fileUrl}
              alt={attachment.fileName}
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleImageClick(attachment.fileUrl)}
            />
            <div className="flex items-center gap-2 text-xs opacity-75">
              <span>{attachment.fileName}</span>
              <span>• {ChatUtils.formatFileSize(attachment.fileSize)}</span>
            </div>
          </div>
        );
      }

      if (message.type === 'video') {
        return (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            <video
              src={attachment.fileUrl}
              controls
              className="max-w-xs rounded-lg"
            />
            <div className="flex items-center gap-2 text-xs opacity-75">
              <span>{attachment.fileName}</span>
              <span>• {ChatUtils.formatFileSize(attachment.fileSize)}</span>
            </div>
          </div>
        );
      }

      if (message.type === 'audio') {
        return (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            <audio
              src={attachment.fileUrl}
              controls
              className="w-full max-w-xs"
            />
            <div className="flex items-center gap-2 text-xs opacity-75">
              <span>{attachment.fileName}</span>
              <span>• {ChatUtils.formatFileSize(attachment.fileSize)}</span>
            </div>
          </div>
        );
      }

      // Generic file (type === 'file')
      if (message.type === 'file') {
        return (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            <button
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors w-full text-left ${
                isDark 
                  ? 'border-gray-600 hover:bg-gray-700 bg-gray-800'
                  : 'border-gray-200 hover:bg-gray-50 bg-white'
              }`}
              onClick={() => handleFileDownload(attachment)}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
              }`}>
                {getFileIcon(message.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {attachment.fileName}
                </p>
                <p className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {ChatUtils.formatFileSize(attachment.fileSize)}
                </p>
              </div>
              <Download className={`w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </button>
          </div>
        );
      }
    }

    // Default to text message for 'text' type or fallback
    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div
        className={`flex items-start gap-3 max-w-[70%] ${
          isCurrentUser ? 'flex-row-reverse' : ''
        }`}
      >
        {showAvatar && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isCurrentUser 
              ? 'bg-blue-600 text-white' 
              : message.senderType === 'bot'
              ? 'bg-purple-600 text-white'
              : 'bg-green-600 text-white'
          }`}>
            {getSenderIcon()}
          </div>
        )}
        
        <div
          className={`px-4 py-2 rounded-lg ${
            isCurrentUser
              ? 'bg-blue-600 text-white'
              : ['booking_confirmation', 'membership_renewal', 'cancellation', 'payment_reminder', 'system_notification'].includes(message.type)
              ? '' // Special message types handle their own styling
              : isDark
              ? 'bg-gray-700 text-gray-200'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {renderMessageContent()}
          
          <div className="flex items-center justify-between mt-1 gap-2">
            <p className={`text-xs ${
              isCurrentUser 
                ? 'text-blue-100' 
                : isDark 
                ? 'text-gray-400' 
                : 'text-gray-500'
            }`}>
              {ChatUtils.formatMessageTime(message.timestamp)}
              {message.isEdited && (
                <span className="ml-1">(edited)</span>
              )}
            </p>
            
            {isCurrentUser && (
              <div className="ml-2">
                {message.isRead ? (
                  <CheckCircle2 className={`h-3 w-3 ${
                    isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                  }`} />
                ) : (
                  <Circle className={`h-3 w-3 ${
                    isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                  }`} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};