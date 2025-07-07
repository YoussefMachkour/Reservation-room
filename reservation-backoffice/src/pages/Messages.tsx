import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Send, 
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  MessageCircle,
  Users,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Message } from '@/types'

interface Conversation {
  id: string
  participantName: string
  participantAvatar?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline: boolean
  membershipType: 'Premium' | 'Basic' | 'Enterprise'
  messages: Message[]
}

export function Messages() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1')
  const [newMessage, setNewMessage] = useState('')
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      participantName: 'John Smith',
      participantAvatar: '',
      lastMessage: 'Thanks for confirming my meeting room booking!',
      timestamp: '2025-03-15T10:30:00Z',
      unreadCount: 0,
      isOnline: true,
      membershipType: 'Premium',
      messages: [
        {
          id: '1',
          senderId: '1',
          senderName: 'John Smith',
          content: 'Hi, I wanted to book Meeting Room A for tomorrow at 2 PM.',
          timestamp: '2025-03-15T09:00:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '2',
          senderId: 'admin',
          senderName: 'Admin',
          content: 'Hi John! I can help you with that booking. Let me check the availability for Meeting Room A tomorrow at 2 PM.',
          timestamp: '2025-03-15T09:05:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '3',
          senderId: 'admin',
          senderName: 'Admin',
          content: 'Great news! Meeting Room A is available tomorrow from 2 PM to 4 PM. I\'ve confirmed your booking.',
          timestamp: '2025-03-15T09:10:00Z',
          type: 'booking_confirmation',
          isRead: true
        },
        {
          id: '4',
          senderId: '1',
          senderName: 'John Smith',
          content: 'Perfect! How much will that be?',
          timestamp: '2025-03-15T09:15:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '5',
          senderId: 'admin',
          senderName: 'Admin',
          content: 'The cost for 2 hours in Meeting Room A is $100. I\'ll send you the payment link shortly.',
          timestamp: '2025-03-15T09:20:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '6',
          senderId: '1',
          senderName: 'John Smith',
          content: 'Thanks for confirming my meeting room booking!',
          timestamp: '2025-03-15T10:30:00Z',
          type: 'text',
          isRead: true
        }
      ]
    },
    {
      id: '2',
      participantName: 'Sarah Johnson',
      participantAvatar: '',
      lastMessage: 'Can you help me renew my membership?',
      timestamp: '2025-03-15T08:45:00Z',
      unreadCount: 2,
      isOnline: false,
      membershipType: 'Basic',
      messages: [
        {
          id: '7',
          senderId: '2',
          senderName: 'Sarah Johnson',
          content: 'Hello! My membership expired last week. Can you help me renew it?',
          timestamp: '2025-03-15T08:30:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '8',
          senderId: 'admin',
          senderName: 'Admin',
          content: 'Hi Sarah! I can definitely help you renew your membership. Let me check your account details.',
          timestamp: '2025-03-15T08:35:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '9',
          senderId: '2',
          senderName: 'Sarah Johnson',
          content: 'Can you help me renew my membership?',
          timestamp: '2025-03-15T08:45:00Z',
          type: 'text',
          isRead: false
        }
      ]
    },
    {
      id: '3',
      participantName: 'Mike Chen',
      participantAvatar: '',
      lastMessage: 'The conference room setup looks perfect!',
      timestamp: '2025-03-15T07:20:00Z',
      unreadCount: 0,
      isOnline: true,
      membershipType: 'Enterprise',
      messages: [
        {
          id: '10',
          senderId: '3',
          senderName: 'Mike Chen',
          content: 'Hi, I need to book Conference Room B for a client presentation next week.',
          timestamp: '2025-03-15T07:00:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '11',
          senderId: 'admin',
          senderName: 'Admin',
          content: 'Hi Mike! I\'d be happy to help you book Conference Room B. What date and time works best for you?',
          timestamp: '2025-03-15T07:05:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '12',
          senderId: '3',
          senderName: 'Mike Chen',
          content: 'Next Wednesday from 2 PM to 4 PM would be ideal. We\'ll need the projector and video conferencing setup.',
          timestamp: '2025-03-15T07:10:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '13',
          senderId: 'admin',
          senderName: 'Admin',
          content: 'Perfect! I\'ve booked Conference Room B for next Wednesday 2-4 PM with all the AV equipment you requested.',
          timestamp: '2025-03-15T07:15:00Z',
          type: 'booking_confirmation',
          isRead: true
        },
        {
          id: '14',
          senderId: '3',
          senderName: 'Mike Chen',
          content: 'The conference room setup looks perfect!',
          timestamp: '2025-03-15T07:20:00Z',
          type: 'text',
          isRead: true
        }
      ]
    },
    {
      id: '4',
      participantName: 'Emma Wilson',
      participantAvatar: '',
      lastMessage: 'Is the Creative Studio available this afternoon?',
      timestamp: '2025-03-15T06:30:00Z',
      unreadCount: 1,
      isOnline: false,
      membershipType: 'Premium',
      messages: [
        {
          id: '15',
          senderId: '4',
          senderName: 'Emma Wilson',
          content: 'Hi! I was wondering if the Creative Studio is available this afternoon around 3 PM?',
          timestamp: '2025-03-15T06:15:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '16',
          senderId: 'admin',
          senderName: 'Admin',
          content: 'Hi Emma! Let me check the Creative Studio availability for this afternoon.',
          timestamp: '2025-03-15T06:20:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '17',
          senderId: '4',
          senderName: 'Emma Wilson',
          content: 'Is the Creative Studio available this afternoon?',
          timestamp: '2025-03-15T06:30:00Z',
          type: 'text',
          isRead: false
        }
      ]
    },
    {
      id: '5',
      participantName: 'David Brown',
      participantAvatar: '',
      lastMessage: 'Thank you for the hot desk reservation!',
      timestamp: '2025-03-14T16:45:00Z',
      unreadCount: 0,
      isOnline: false,
      membershipType: 'Basic',
      messages: [
        {
          id: '18',
          senderId: '5',
          senderName: 'David Brown',
          content: 'I need a hot desk for tomorrow morning. Are there any available?',
          timestamp: '2025-03-14T16:30:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '19',
          senderId: 'admin',
          senderName: 'Admin',
          content: 'Hi David! Yes, we have several hot desks available tomorrow morning. I can reserve one for you.',
          timestamp: '2025-03-14T16:35:00Z',
          type: 'text',
          isRead: true
        },
        {
          id: '20',
          senderId: '5',
          senderName: 'David Brown',
          content: 'Thank you for the hot desk reservation!',
          timestamp: '2025-03-14T16:45:00Z',
          type: 'text',
          isRead: true
        }
      ]
    }
  ])

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedConv = conversations.find(conv => conv.id === selectedConversation)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const message: Message = {
        id: Date.now().toString(),
        senderId: 'admin',
        senderName: 'Admin',
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
        isRead: true
      }

      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation 
          ? { 
              ...conv, 
              messages: [...conv.messages, message],
              lastMessage: newMessage.trim(),
              timestamp: new Date().toISOString()
            }
          : conv
      ))

      setNewMessage('')
      showNotification('success', 'Message sent successfully!')
    }
  }

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ))
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  const getMembershipColor = (type: 'Premium' | 'Basic' | 'Enterprise') => {
    switch (type) {
      case 'Enterprise': return 'bg-purple-100 text-purple-800'
      case 'Premium': return 'bg-blue-100 text-blue-800'
      case 'Basic': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMessageTypeColor = (type: Message['type']) => {
    switch (type) {
      case 'booking_confirmation': return 'bg-green-50 border-green-200 text-green-800'
      case 'membership_renewal': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'cancellation': return 'bg-red-50 border-red-200 text-red-800'
      default: return ''
    }
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
  const onlineCount = conversations.filter(conv => conv.isOnline).length

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Alert className={notification.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            Communicate with your members • {conversations.length} conversations • {totalUnread} unread • {onlineCount} online
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
        </div>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              <div className="space-y-1 p-4">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conversation.id 
                        ? 'bg-primary/10 border-primary/20 border' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation.id)
                      markAsRead(conversation.id)
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.participantAvatar} alt={conversation.participantName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 font-medium">
                          {conversation.participantName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conversation.participantName}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={`text-xs ${getMembershipColor(conversation.membershipType)}`}>
                            {conversation.membershipType}
                          </Badge>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      <p className="text-xs text-muted-foreground">{formatLastMessageTime(conversation.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConv.participantAvatar} alt={selectedConv.participantName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 font-medium">
                          {selectedConv.participantName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {selectedConv.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedConv.participantName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConv.isOnline ? 'Online' : 'Offline'} • {selectedConv.membershipType} Member
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Info className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Archive Conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Block User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-4">
                    {selectedConv.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.senderId === 'admin'
                              ? 'bg-primary text-primary-foreground'
                              : message.type === 'text'
                              ? 'bg-muted'
                              : `border ${getMessageTypeColor(message.type)}`
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70">{formatMessageTime(message.timestamp)}</p>
                            {message.senderId === 'admin' && (
                              <div className="ml-2">
                                {message.isRead ? (
                                  <CheckCircle2 className="h-3 w-3 opacity-70" />
                                ) : (
                                  <Circle className="h-3 w-3 opacity-70" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Select a conversation</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a conversation from the list to start messaging.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
} 