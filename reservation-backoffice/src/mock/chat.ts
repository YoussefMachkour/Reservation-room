// data/mockChatData.ts
import type { Conversation, Message, ConversationParticipant } from '@/types/chat';

export const mockParticipants: ConversationParticipant[] = [
  {
    userId: 'user1',
    userType: 'member',
    name: 'John Smith',
    email: 'john.smith@email.com',
    avatar: '',
    isOnline: true,
    lastSeenAt: '2025-07-10T14:30:00Z',
    membershipType: 'Premium',
    joinedAt: '2025-01-15T09:00:00Z'
  },
  {
    userId: 'user2',
    userType: 'member',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    avatar: '',
    isOnline: false,
    lastSeenAt: '2025-07-10T12:45:00Z',
    membershipType: 'Basic',
    joinedAt: '2025-02-01T10:00:00Z'
  },
  {
    userId: 'user3',
    userType: 'member',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    avatar: '',
    isOnline: true,
    lastSeenAt: '2025-07-10T14:20:00Z',
    membershipType: 'Enterprise',
    joinedAt: '2024-12-01T09:00:00Z'
  },
  {
    userId: 'user4',
    userType: 'member',
    name: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    avatar: '',
    isOnline: false,
    lastSeenAt: '2025-07-10T11:30:00Z',
    membershipType: 'Premium',
    joinedAt: '2025-03-10T14:00:00Z'
  },
  {
    userId: 'user5',
    userType: 'member',
    name: 'David Brown',
    email: 'david.brown@email.com',
    avatar: '',
    isOnline: false,
    lastSeenAt: '2025-07-09T16:45:00Z',
    membershipType: 'Basic',
    joinedAt: '2025-04-05T11:30:00Z'
  }
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: [mockParticipants[0]],
    lastMessageAt: '2025-07-10T14:30:00Z',
    unreadCount: 0,
    isArchived: false,
    tags: ['booking', 'meeting-room'],
    priority: 'normal',
    status: 'active',
    assignedAgentId: 'admin1',
    createdAt: '2025-07-10T09:00:00Z',
    updatedAt: '2025-07-10T14:30:00Z'
  },
  {
    id: '2',
    participants: [mockParticipants[1]],
    lastMessageAt: '2025-07-10T12:45:00Z',
    unreadCount: 2,
    isArchived: false,
    tags: ['membership', 'renewal'],
    priority: 'high',
    status: 'pending',
    assignedAgentId: 'admin1',
    createdAt: '2025-07-10T08:30:00Z',
    updatedAt: '2025-07-10T12:45:00Z'
  },
  {
    id: '3',
    participants: [mockParticipants[2]],
    lastMessageAt: '2025-07-10T14:20:00Z',
    unreadCount: 0,
    isArchived: false,
    tags: ['conference-room', 'av-equipment'],
    priority: 'urgent',
    status: 'resolved',
    assignedAgentId: 'admin2',
    createdAt: '2025-07-10T07:00:00Z',
    updatedAt: '2025-07-10T14:20:00Z'
  },
  {
    id: '4',
    participants: [mockParticipants[3]],
    lastMessageAt: '2025-07-10T11:30:00Z',
    unreadCount: 1,
    isArchived: false,
    tags: ['creative-studio'],
    priority: 'normal',
    status: 'pending',
    assignedAgentId: 'admin1',
    createdAt: '2025-07-10T06:15:00Z',
    updatedAt: '2025-07-10T11:30:00Z'
  },
  {
    id: '5',
    participants: [mockParticipants[4]],
    lastMessageAt: '2025-07-09T16:45:00Z',
    unreadCount: 0,
    isArchived: false,
    tags: ['hot-desk'],
    priority: 'low',
    status: 'resolved',
    assignedAgentId: 'admin2',
    createdAt: '2025-07-09T16:30:00Z',
    updatedAt: '2025-07-09T16:45:00Z'
  }
];

export const mockMessages: {[key: string]: Message[]} = {
  '1': [
    {
      id: '1',
      conversationId: '1',
      senderId: 'user1',
      senderName: 'John Smith',
      senderType: 'user',
      content: 'Hi, I wanted to book Meeting Room A for tomorrow at 2 PM.',
      timestamp: '2025-07-10T09:00:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '2',
      conversationId: '1',
      senderId: 'admin1',
      senderName: 'Admin Support',
      senderType: 'admin',
      content: 'Hi John! I can help you with that booking. Let me check the availability for Meeting Room A tomorrow at 2 PM.',
      timestamp: '2025-07-10T09:05:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '3',
      conversationId: '1',
      senderId: 'admin1',
      senderName: 'Admin Support',
      senderType: 'admin',
      content: 'Great news! Meeting Room A is available tomorrow from 2 PM to 4 PM. I\'ve confirmed your booking.',
      timestamp: '2025-07-10T09:10:00Z',
      type: 'booking_confirmation',
      isRead: true,
      metadata: {
        bookingId: 'booking123',
        spaceId: 'room-a'
      }
    },
    {
      id: '4',
      conversationId: '1',
      senderId: 'user1',
      senderName: 'John Smith',
      senderType: 'user',
      content: 'Perfect! How much will that be?',
      timestamp: '2025-07-10T09:15:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '5',
      conversationId: '1',
      senderId: 'admin1',
      senderName: 'Admin Support',
      senderType: 'admin',
      content: 'The cost for 2 hours in Meeting Room A is $100. I\'ll send you the payment link shortly.',
      timestamp: '2025-07-10T09:20:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '6',
      conversationId: '1',
      senderId: 'user1',
      senderName: 'John Smith',
      senderType: 'user',
      content: 'Thanks for confirming my meeting room booking!',
      timestamp: '2025-07-10T14:30:00Z',
      type: 'text',
      isRead: true
    }
  ],
  '2': [
    {
      id: '7',
      conversationId: '2',
      senderId: 'user2',
      senderName: 'Sarah Johnson',
      senderType: 'user',
      content: 'Hello! My membership expired last week. Can you help me renew it?',
      timestamp: '2025-07-10T08:30:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '8',
      conversationId: '2',
      senderId: 'admin1',
      senderName: 'Admin Support',
      senderType: 'admin',
      content: 'Hi Sarah! I can definitely help you renew your membership. Let me check your account details.',
      timestamp: '2025-07-10T08:35:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '9',
      conversationId: '2',
      senderId: 'user2',
      senderName: 'Sarah Johnson',
      senderType: 'user',
      content: 'Can you help me renew my membership? I need access by tomorrow.',
      timestamp: '2025-07-10T12:45:00Z',
      type: 'text',
      isRead: false
    },
    {
      id: '10',
      conversationId: '2',
      senderId: 'user2',
      senderName: 'Sarah Johnson',
      senderType: 'user',
      content: 'This is urgent as I have an important client meeting scheduled.',
      timestamp: '2025-07-10T12:46:00Z',
      type: 'text',
      isRead: false
    }
  ],
  '3': [
    {
      id: '11',
      conversationId: '3',
      senderId: 'user3',
      senderName: 'Mike Chen',
      senderType: 'user',
      content: 'Hi, I need to book Conference Room B for a client presentation next week.',
      timestamp: '2025-07-10T07:00:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '12',
      conversationId: '3',
      senderId: 'admin2',
      senderName: 'Admin Support',
      senderType: 'admin',
      content: 'Hi Mike! I\'d be happy to help you book Conference Room B. What date and time works best for you?',
      timestamp: '2025-07-10T07:05:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '13',
      conversationId: '3',
      senderId: 'user3',
      senderName: 'Mike Chen',
      senderType: 'user',
      content: 'Next Wednesday from 2 PM to 4 PM would be ideal. We\'ll need the projector and video conferencing setup.',
      timestamp: '2025-07-10T07:10:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '14',
      conversationId: '3',
      senderId: 'admin2',
      senderName: 'Admin Support',
      senderType: 'admin',
      content: 'Perfect! I\'ve booked Conference Room B for next Wednesday 2-4 PM with all the AV equipment you requested.',
      timestamp: '2025-07-10T07:15:00Z',
      type: 'booking_confirmation',
      isRead: true,
      metadata: {
        bookingId: 'booking124',
        spaceId: 'conf-room-b'
      }
    },
    {
      id: '15',
      conversationId: '3',
      senderId: 'user3',
      senderName: 'Mike Chen',
      senderType: 'user',
      content: 'The conference room setup looks perfect! Thank you for the excellent service.',
      timestamp: '2025-07-10T14:20:00Z',
      type: 'text',
      isRead: true
    }
  ],
  '4': [
    {
      id: '16',
      conversationId: '4',
      senderId: 'user4',
      senderName: 'Emma Wilson',
      senderType: 'user',
      content: 'Hi! I was wondering if the Creative Studio is available this afternoon around 3 PM?',
      timestamp: '2025-07-10T06:15:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '17',
      conversationId: '4',
      senderId: 'admin1',
      senderName: 'Admin Support',
      senderType: 'admin',
      content: 'Hi Emma! Let me check the Creative Studio availability for this afternoon.',
      timestamp: '2025-07-10T06:20:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '18',
      conversationId: '4',
      senderId: 'user4',
      senderName: 'Emma Wilson',
      senderType: 'user',
      content: 'Is the Creative Studio available this afternoon? I need it for a photo shoot.',
      timestamp: '2025-07-10T11:30:00Z',
      type: 'text',
      isRead: false
    }
  ],
  '5': [
    {
      id: '19',
      conversationId: '5',
      senderId: 'user5',
      senderName: 'David Brown',
      senderType: 'user',
      content: 'I need a hot desk for tomorrow morning. Are there any available?',
      timestamp: '2025-07-09T16:30:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '20',
      conversationId: '5',
      senderId: 'admin2',
      senderName: 'Admin Support',
      senderType: 'admin',
      content: 'Hi David! Yes, we have several hot desks available tomorrow morning. I can reserve one for you.',
      timestamp: '2025-07-09T16:35:00Z',
      type: 'text',
      isRead: true
    },
    {
      id: '21',
      conversationId: '5',
      senderId: 'user5',
      senderName: 'David Brown',
      senderType: 'user',
      content: 'Thank you for the hot desk reservation!',
      timestamp: '2025-07-09T16:45:00Z',
      type: 'text',
      isRead: true
    }
  ]
};

// Update lastMessage for conversations
mockConversations.forEach(conversation => {
  const conversationMessages = mockMessages[conversation.id];
  if (conversationMessages && conversationMessages.length > 0) {
    conversation.lastMessage = conversationMessages[conversationMessages.length - 1];
  }
});

export const mockTypingUsers = {
  '2': [mockParticipants[1]] // Sarah is typing in conversation 2
};