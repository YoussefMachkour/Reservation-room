// components/chat/MessageBubble.tsx
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Circle, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video 
} from 'lucide-react';
import type { Message, MessageAttachment, } from '@/types/chat';
import {  ChatUtils } from '@/types/chat';

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
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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
        <div className={`p-3 border rounded-lg ${ChatUtils.getMessageTypeColor(message.type)}`}>
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-3 p-3 h-auto justify-start"
              onClick={() => handleFileDownload(attachment)}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                {getFileIcon(message.type)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                <p className="text-xs text-muted-foreground">{ChatUtils.formatFileSize(attachment.fileSize)}</p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground" />
            </Button>
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
          <Avatar className="w-8 h-8">
            <AvatarFallback className={`text-xs ${
              isCurrentUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {message.senderName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={`px-4 py-2 rounded-lg ${
            isCurrentUser
              ? 'bg-primary text-primary-foreground'
              : ['booking_confirmation', 'membership_renewal', 'cancellation', 'payment_reminder', 'system_notification'].includes(message.type)
              ? '' // Special message types handle their own styling
              : 'bg-muted'
          }`}
        >
          {renderMessageContent()}
          
          <div className="flex items-center justify-between mt-1 gap-2">
            <p className={`text-xs ${
              isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              {ChatUtils.formatMessageTime(message.timestamp)}
              {message.isEdited && (
                <span className="ml-1">(edited)</span>
              )}
            </p>
            
            {isCurrentUser && message.senderType === 'admin' && (
              <div className="ml-2">
                {message.isRead ? (
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground/70" />
                ) : (
                  <Circle className="h-3 w-3 text-primary-foreground/70" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};