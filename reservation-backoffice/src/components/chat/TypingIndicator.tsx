// components/chat/TypingIndicator.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ConversationParticipant } from '@/types/chat';

interface TypingIndicatorProps {
  typingUsers: ConversationParticipant[];
  showAvatars?: boolean;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  showAvatars = true,
  className = ''
}) => {
  if (typingUsers.length === 0) return null;

  const renderTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  const TypingDots = () => (
    <div className="flex items-center space-x-1">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
        <div 
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
          style={{animationDelay: '0.1s'}}
        ></div>
        <div 
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
          style={{animationDelay: '0.2s'}}
        ></div>
      </div>
    </div>
  );

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="flex items-start gap-3 max-w-[70%]">
        {showAvatars && (
          <div className="flex -space-x-2">
            {typingUsers.slice(0, 3).map((user, index) => (
              <Avatar key={user.userId} className="w-8 h-8 border-2 border-background">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
        
        <div className="px-4 py-2 rounded-lg bg-muted">
          <div className="flex items-center space-x-2">
            <TypingDots />
            <span className="text-xs text-muted-foreground">
              {renderTypingText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};