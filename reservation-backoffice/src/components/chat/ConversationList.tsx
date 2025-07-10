// components/chat/ConversationList.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag } from 'lucide-react';
import type { Conversation } from '@/types/chat';
import {  ChatUtils } from '@/types/chat';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string | null;
  onConversationSelect: (conversationId: string) => void;
  onMarkAsRead?: (conversationId: string) => void;
  showTags?: boolean;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onMarkAsRead,
  showTags = true,
  className = ''
}) => {
  const handleConversationClick = (conversation: Conversation) => {
    onConversationSelect(conversation.id);
    if (conversation.unreadCount > 0 && onMarkAsRead) {
      onMarkAsRead(conversation.id);
    }
  };

  return (
    <ScrollArea className={`h-full ${className}`}>
      <div className="space-y-1 p-4">
        {conversations.map((conversation) => {
          const participant = conversation.participants[0];
          return (
            <div
              key={conversation.id}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedConversationId === conversation.id 
                  ? 'bg-primary/10 border-primary/20 border' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 font-medium">
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {participant.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium truncate">{participant.name}</p>
                  <div className="flex items-center space-x-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${ChatUtils.getPriorityColor(conversation.priority)}`}
                    >
                      {conversation.priority}
                    </Badge>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${ChatUtils.getMembershipColor(participant.membershipType)}`}
                  >
                    {participant.membershipType}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${ChatUtils.getStatusColor(conversation.status)}`}
                  >
                    {conversation.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {ChatUtils.formatLastMessageTime(conversation.lastMessageAt)}
                  </p>
                  {showTags && conversation.tags && conversation.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span className="text-xs text-muted-foreground">{conversation.tags.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {conversations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};