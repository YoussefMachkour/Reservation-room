// components/chat/MessageList.tsx
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { Message, ConversationParticipant, MessageAttachment } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUsers?: ConversationParticipant[];
  showAvatars?: boolean;
  showMetadata?: boolean;
  onFileDownload?: (attachment: MessageAttachment) => void;
  onImageClick?: (imageUrl: string) => void;
  onMessageRead?: (messageIds: string[]) => void;
  autoScroll?: boolean;
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  typingUsers = [],
  showAvatars = true,
  showMetadata = false,
  onFileDownload,
  onImageClick,
  onMessageRead,
  autoScroll = true,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, typingUsers, autoScroll]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (onMessageRead) {
      const unreadMessageIds = messages
        .filter(msg => !msg.isRead && msg.senderId !== currentUserId)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        onMessageRead(unreadMessageIds);
      }
    }
  }, [messages, currentUserId, onMessageRead]);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp).toDateString();
      const existingGroup = groups.find(group => group.date === messageDate);
      
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({ date: messageDate, messages: [message] });
      }
    });
    
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <ScrollArea ref={scrollAreaRef} className={`h-full ${className}`}>
      <div className="p-4 space-y-4">
        {messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {/* Date Header */}
              <div className="flex justify-center">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <p className="text-xs text-muted-foreground font-medium">
                    {formatDateHeader(group.date)}
                  </p>
                </div>
              </div>
              
              {/* Messages */}
              <div className="space-y-4">
                {group.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === currentUserId}
                    showAvatar={showAvatars}
                    showMetadata={showMetadata}
                    onFileDownload={onFileDownload}
                    onImageClick={onImageClick}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator 
            typingUsers={typingUsers} 
            showAvatars={showAvatars}
          />
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};