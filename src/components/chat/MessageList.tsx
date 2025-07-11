// components/chat/MessageList.tsx
import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Message, MessageAttachment } from "@/types/chat";
import { useTheme } from "@/contexts/ThemeContext";

interface TypingUser {
  id: string;
  name: string;
  type: "user" | "admin" | "bot";
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUsers?: TypingUser[];
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
  className = "",
}) => {
  const { isDark } = useTheme();
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
        .filter((msg) => !msg.isRead && msg.senderId !== currentUserId)
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        onMessageRead(unreadMessageIds);
      }
    }
  }, [messages, currentUserId, onMessageRead]);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString();
      const existingGroup = groups.find((group) => group.date === messageDate);

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
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  const containerClasses = `
    h-full overflow-y-auto scroll-smooth
    ${
      isDark
        ? "scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500"
        : "scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
    }
    ${className}
  `;

  const emptyStateClasses = `
    flex items-center justify-center h-full
    ${isDark ? "text-gray-400" : "text-gray-500"}
  `;

  const dateHeaderClasses = `
    px-3 py-1 rounded-full text-xs font-medium
    ${
      isDark
        ? "bg-gray-700 text-gray-300 border border-gray-600"
        : "bg-gray-100 text-gray-600 border border-gray-200"
    }
  `;

  return (
    <div ref={scrollAreaRef} className={containerClasses}>
      <div className="p-4 space-y-4">
        {messageGroups.length === 0 ? (
          <div className={emptyStateClasses}>
            <div className="text-center">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isDark
                    ? "bg-gray-700 border border-gray-600"
                    : "bg-gray-100 border border-gray-200"
                }`}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1 opacity-75">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {/* Date Header */}
              <div className="flex justify-center">
                <div className={dateHeaderClasses}>
                  {formatDateHeader(group.date)}
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
    </div>
  );
};
