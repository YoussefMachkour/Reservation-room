// pages/admin/Messages.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MessageCircle,
  Users,
  Wifi,
  WifiOff,
  Filter,
  Plus
} from 'lucide-react';

// Import chat components
import { ConversationList } from '@/components/chat/ConversationList';
import { ConversationHeader } from '@/components/chat/ConversationHeader';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

// Import types and utilities
import type { 
  Conversation, 
  Message, 
  ConversationParticipant,
  MessageAttachment,
  MessageType
} from '@/types/chat';
import { 
  ChatUtils 
} from '@/types/chat';

// Import mock data
import { mockConversations, mockMessages, mockTypingUsers } from '@/mock/chat';

interface ChatInputMessageData {
  content: string;
  type: MessageType;
  attachments?: File[];
}

export function AdminMessages() {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<{[key: string]: Message[]}>(mockMessages);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>('1');
  const [typingUsers, setTypingUsers] = useState<{[key: string]: ConversationParticipant[]}>(mockTypingUsers);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // UI states
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Computed values
  const filteredConversations = conversations.filter(conv => {
    const participant = conv.participants[0];
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);
  const selectedMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];
  const selectedTypingUsers = selectedConversationId ? typingUsers[selectedConversationId] || [] : [];
  
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const onlineCount = conversations.reduce((count, conv) => 
    count + conv.participants.filter(p => p.isOnline).length, 0
  );

  // Effects
  useEffect(() => {
    // Simulate connection status changes
    const interval = setInterval(() => {
      const statuses: ('connected' | 'connecting' | 'disconnected')[] = ['connected', 'connecting', 'disconnected'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      if (Math.random() > 0.95) { // 5% chance to change status
        setConnectionStatus(randomStatus);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Clear typing users after some time
    const timeout = setTimeout(() => {
      setTypingUsers({});
    }, 3000);

    return () => clearTimeout(timeout);
  }, [typingUsers]);

  // Event handlers
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleMarkAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
  };

  const handleSendMessage = (messageData: ChatInputMessageData) => {
    if (!selectedConversationId) return;

    setIsLoading(true);

    // Create text message
    if (messageData.content.trim()) {
      const newMessage: Message = {
        id: ChatUtils.createMessageId(),
        conversationId: selectedConversationId,
        senderId: 'admin1',
        senderName: 'Admin Support',
        senderType: 'admin',
        content: messageData.content.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
        isRead: true
      };

      setMessages(prev => ({
        ...prev,
        [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage]
      }));
    }

    // Handle file attachments
    if (messageData.attachments && messageData.attachments.length > 0) {
      messageData.attachments.forEach((file, index) => {
        const fileUrl = URL.createObjectURL(file);
        const fileMessage: Message = {
          id: ChatUtils.createMessageId(),
          conversationId: selectedConversationId,
          senderId: 'admin1',
          senderName: 'Admin Support',
          senderType: 'admin',
          content: `Shared a ${ChatUtils.getFileTypeLabel(file.type)}`,
          timestamp: new Date().toISOString(),
          type: ChatUtils.getMessageType(file.type),
          isRead: true,
          attachments: [{
            id: `attachment-${Date.now() + index}`,
            messageId: ChatUtils.createMessageId(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl: fileUrl
          }]
        };

        setMessages(prev => ({
          ...prev,
          [selectedConversationId]: [...(prev[selectedConversationId] || []), fileMessage]
        }));
      });
    }

    // Update conversation
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversationId 
        ? { 
            ...conv, 
            lastMessage: {
              id: ChatUtils.createMessageId(),
              conversationId: selectedConversationId,
              senderId: 'admin1',
              senderName: 'Admin Support',
              senderType: 'admin',
              content: messageData.attachments && messageData.attachments.length > 0 
                ? `Shared ${messageData.attachments.length} file(s)` 
                : messageData.content.trim(),
              timestamp: new Date().toISOString(),
              type: 'text',
              isRead: true
            },
            lastMessageAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : conv
    ));

    setIsLoading(false);
    showNotification('success', 'Message sent successfully!');
  };

  const handleStatusChange = (status: 'active' | 'resolved' | 'pending') => {
    if (!selectedConversationId) return;

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversationId 
        ? { ...conv, status, updatedAt: new Date().toISOString() }
        : conv
    ));
    showNotification('success', `Conversation marked as ${status}`);
  };

  const handlePriorityChange = (priority: 'low' | 'normal' | 'high' | 'urgent') => {
    if (!selectedConversationId) return;

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversationId 
        ? { ...conv, priority, updatedAt: new Date().toISOString() }
        : conv
    ));
    showNotification('success', `Priority updated to ${priority}`);
  };

  const handleFileDownload = (attachment: MessageAttachment) => {
    ChatUtils.downloadFile(attachment.fileUrl, attachment.fileName);
  };

  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const handleArchiveConversation = () => {
    if (!selectedConversationId) return;
    
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversationId 
        ? { ...conv, isArchived: true, updatedAt: new Date().toISOString() }
        : conv
    ));
    showNotification('success', 'Conversation archived');
    setSelectedConversationId(null);
  };

  const handleBlockUser = () => {
    if (!selectedConversation) return;
    
    showNotification('success', `User ${selectedConversation.participants[0].name} has been blocked`);
    setSelectedConversationId(null);
  };

  const handleViewProfile = () => {
    if (!selectedConversation) return;
    
    showNotification('success', `Opening profile for ${selectedConversation.participants[0].name}`);
  };

  return (
    <div className="space-y-6 h-full">
      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <Alert className={`${notification.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} shadow-lg max-w-md`}>
            <AlertDescription className={`${notification.type === 'success' ? 'text-green-800' : 'text-red-800'} flex items-center gap-2`}>
              {notification.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {notification.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            Manage customer conversations • {conversations.length} total • {totalUnread} unread • {onlineCount} online
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <MessageCircle className="h-3 w-3" />
            <span>{totalUnread} unread</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{onlineCount} online</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-3 w-3 text-green-600" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-600" />
            )}
            <span className="capitalize">{connectionStatus}</span>
          </Badge>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations Sidebar */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Conversations
              <Button variant="ghost" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </CardTitle>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
              onMarkAsRead={handleMarkAsRead}
              showTags={true}
              className="h-full"
            />
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <ConversationHeader
                conversation={selectedConversation}
                connectionStatus={connectionStatus}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onArchive={handleArchiveConversation}
                onBlock={handleBlockUser}
                onViewProfile={handleViewProfile}
                onCall={() => showNotification('success', 'Starting voice call...')}
                onVideoCall={() => showNotification('success', 'Starting video call...')}
                showControls={true}
                showTags={true}
              />

              {/* Messages Area */}
              <div className="flex-1 min-h-0">
                <MessageList
                  messages={selectedMessages}
                  currentUserId="admin1"
                  typingUsers={selectedTypingUsers}
                  showAvatars={true}
                  showMetadata={true}
                  onFileDownload={handleFileDownload}
                  onImageClick={handleImageClick}
                  onMessageRead={(messageIds) => {
                    // Mark messages as read
                    setMessages(prev => ({
                      ...prev,
                      [selectedConversationId!]: prev[selectedConversationId!]?.map(msg =>
                        messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
                      ) || []
                    }));
                  }}
                  autoScroll={true}
                  className="flex-1"
                />
              </div>

              {/* Chat Input */}
              <ChatInput
                onSendMessage={handleSendMessage}
                placeholder="Type your message..."
                disabled={isLoading || connectionStatus === 'disconnected'}
                showFileUpload={true}
                showEmoji={true}
                maxLength={2000}
              />
            </>
          ) : (
            /* No Conversation Selected */
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
                <Button onClick={() => setSelectedConversationId(conversations[0]?.id || null)}>
                  Open First Conversation
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread Messages</p>
                <p className="text-2xl font-bold text-red-600">{totalUnread}</p>
              </div>
              <Badge variant="destructive" className="text-lg px-2 py-1">
                {totalUnread}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Users</p>
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent Priority</p>
                <p className="text-2xl font-bold text-orange-600">
                  {conversations.filter(c => c.priority === 'urgent').length}
                </p>
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                Urgent
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}