// components/chat/ConversationHeader.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Phone, 
  Video, 
  Info, 
  Archive, 
  UserX, 
  Tag,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import type { Conversation } from '@/types/chat';
import  { ChatUtils } from '@/types/chat';

interface ConversationHeaderProps {
  conversation: Conversation;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  onStatusChange?: (status: 'active' | 'resolved' | 'pending') => void;
  onPriorityChange?: (priority: 'low' | 'normal' | 'high' | 'urgent') => void;
  onArchive?: () => void;
  onBlock?: () => void;
  onViewProfile?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  showControls?: boolean;
  showTags?: boolean;
  className?: string;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  connectionStatus = 'connected',
  onStatusChange,
  onPriorityChange,
  onArchive,
  onBlock,
  onViewProfile,
  onCall,
  onVideoCall,
  showControls = true,
  showTags = true,
  className = ''
}) => {
  const participant = conversation.participants[0];

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-600" />;
      case 'connecting':
        return <Wifi className="h-3 w-3 text-yellow-600 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="h-3 w-3 text-red-600" />;
      default:
        return <WifiOff className="h-3 w-3 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const formatLastSeen = (lastSeenAt: string) => {
    if (participant.isOnline) return 'Online now';
    
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just seen';
    if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    return `Last seen ${diffDays}d ago`;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
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
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{participant.name}</h3>
              <Badge 
                variant="outline" 
                className={`text-xs ${ChatUtils.getMembershipColor(participant.membershipType)}`}
              >
                {participant.membershipType}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatLastSeen(participant.lastSeenAt)}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                {getConnectionIcon()}
                <span className="text-xs">{getConnectionStatusText()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${ChatUtils.getStatusColor(conversation.status)}`}
              >
                {conversation.status}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${ChatUtils.getPriorityColor(conversation.priority)}`}
              >
                {conversation.priority}
              </Badge>
              {conversation.assignedAgentId && (
                <Badge variant="outline" className="text-xs">
                  Assigned
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            {onStatusChange && (
              <Select 
                value={conversation.status} 
                onValueChange={(value: 'active' | 'resolved' | 'pending') => 
                  onStatusChange(value)
                }
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="resolved">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Resolved
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {onPriorityChange && (
              <Select 
                value={conversation.priority} 
                onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                  onPriorityChange(value)
                }
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Normal
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {onCall && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onCall}
                title="Start voice call"
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            
            {onVideoCall && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onVideoCall}
                title="Start video call"
              >
                <Video className="h-4 w-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onViewProfile && (
                  <DropdownMenuItem onClick={onViewProfile}>
                    <Info className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem>
                  <Clock className="mr-2 h-4 w-4" />
                  Conversation History
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {onArchive && (
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Conversation
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem>
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tags
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {onBlock && (
                  <DropdownMenuItem onClick={onBlock} className="text-red-600">
                    <UserX className="mr-2 h-4 w-4" />
                    Block User
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Tags Display */}
      {showTags && conversation.tags && conversation.tags.length > 0 && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              {conversation.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Conversation Info */}
      <div className="px-4 py-2 bg-muted/20 border-b">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Created {ChatUtils.formatLastMessageTime(conversation.createdAt)}
            </span>
            <span>
              {conversation.unreadCount > 0 ? `${conversation.unreadCount} unread` : 'All read'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>ID: {conversation.id.slice(-8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};