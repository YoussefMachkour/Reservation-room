// types/chat.ts - For Admin Dashboard (shadcn/ui)

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
}

export interface MessageMetadata {
  bookingId?: string;
  spaceId?: string;
  paymentId?: string;
  membershipId?: string;
}

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'file' 
  | 'video' 
  | 'audio'
  | 'booking_confirmation'
  | 'membership_renewal'
  | 'cancellation'
  | 'payment_reminder'
  | 'system_notification';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin' | 'bot';
  content: string;
  timestamp: string; // ISO string
  type: MessageType;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
}

export interface ConversationParticipant {
  userId: string;
  userType: 'member' | 'admin' | 'agent';
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeenAt: string;
  membershipType?: 'Basic' | 'Premium' | 'Enterprise';
  joinedAt: string;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount: number;
  isArchived: boolean;
  tags?: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'active' | 'resolved' | 'pending';
  assignedAgentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportAgent {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  department: string;
  rating?: number;
}

// API Types
export interface ConversationListResponse {
  conversations: Conversation[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface MessageListResponse {
  messages: Message[];
  totalCount: number;
  hasMore: boolean;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type: MessageType;
  attachments?: File[];
  metadata?: MessageMetadata;
}

export interface CreateConversationRequest {
  participantIds: string[];
  initialMessage?: SendMessageRequest;
  subject?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface UpdateConversationRequest {
  status?: 'active' | 'resolved' | 'pending';
  assignedAgentId?: string;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// WebSocket Events
export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

export type WebSocketEventType =
  | 'message_sent'
  | 'message_read'
  | 'user_typing'
  | 'user_stopped_typing'
  | 'user_online'
  | 'user_offline'
  | 'conversation_updated';

export interface MessageSentEvent {
  type: 'message_sent';
  data: {
    conversationId: string;
    message: Message;
  };
}

export interface MessageReadEvent {
  type: 'message_read';
  data: {
    conversationId: string;
    messageIds: string[];
    readByUserId: string;
  };
}

export interface TypingEvent {
  type: 'user_typing' | 'user_stopped_typing';
  data: {
    conversationId: string;
    userId: string;
    userName: string;
  };
}

// File Upload
export interface FileUploadConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  maxFilesPerMessage: number;
}

export const DEFAULT_FILE_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  maxFilesPerMessage: 5
};

// Utility functions
export class ChatUtils {
  static formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  static formatLastMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileTypeLabel(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  }

  static getMessageType(mimeType: string): MessageType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  }

  static validateFile(file: File, config: FileUploadConfig): { isValid: boolean; error?: string } {
    if (file.size > config.maxFileSize) {
      return {
        isValid: false,
        error: `File "${file.name}" is too large. Maximum size is ${this.formatFileSize(config.maxFileSize)}.`
      };
    }

    const isValidType = config.allowedMimeTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not allowed.`
      };
    }

    return { isValid: true };
  }

  static downloadFile(fileUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static createMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateSmartResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('book') || message.includes('reservation')) {
      return "I'd be happy to help you with booking! You can book spaces directly through our platform, or I can assist you with finding the perfect space for your needs. What type of space are you looking for?";
    }
    
    if (message.includes('cancel')) {
      return "I can help you with cancellation. You can cancel bookings up to 2 hours before the start time through your account, or I can process the cancellation for you. What booking would you like to cancel?";
    }
    
    if (message.includes('payment') || message.includes('billing')) {
      return "For payment and billing inquiries, I can help you with payment methods, invoices, or resolving any payment issues. What specific payment question do you have?";
    }
    
    if (message.includes('access') || message.includes('code')) {
      return "Access codes are sent 15 minutes before your booking starts. If you haven't received yours or it's not working, I can generate a new one for you. What's your booking reference?";
    }
    
    if (message.includes('membership')) {
      return "I can help you with membership-related questions including renewals, upgrades, benefits, and account management. What would you like to know about your membership?";
    }
    
    return "Thank you for your message! I'll help you with that right away. Let me check our system for you and provide the best assistance possible.";
  }

  static getMessageTypeColor(type: MessageType): string {
    switch (type) {
      case 'booking_confirmation': return 'bg-green-50 border-green-200 text-green-800';
      case 'membership_renewal': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'cancellation': return 'bg-red-50 border-red-200 text-red-800';
      case 'payment_reminder': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'system_notification': return 'bg-gray-50 border-gray-200 text-gray-800';
      default: return '';
    }
  }

  static getMembershipColor(type?: string): string {
    switch (type) {
      case 'Enterprise': return 'bg-purple-100 text-purple-800';
      case 'Premium': return 'bg-blue-100 text-blue-800';
      case 'Basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  static getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}