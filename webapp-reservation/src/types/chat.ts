// types/chat.ts - For Web App (Tailwind CSS)

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
  | "text"
  | "image"
  | "file"
  | "video"
  | "audio"
  | "booking_confirmation"
  | "membership_renewal"
  | "cancellation"
  | "payment_reminder"
  | "system_notification";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: "user" | "admin" | "bot";
  content: string;
  timestamp: string; // ISO string
  type: MessageType;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
}

export interface SupportAgent {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  department: string;
  rating?: number;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount: number;
  status: "active" | "resolved" | "pending";
  createdAt: string;
  updatedAt: string;
}

// API Types
export interface SendMessageRequest {
  content: string;
  type: MessageType;
  attachments?: File[];
  metadata?: MessageMetadata;
}

export interface StartConversationRequest {
  subject?: string;
  initialMessage: SendMessageRequest;
}

// WebSocket Events
export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

export type WebSocketEventType =
  | "message_sent"
  | "message_read"
  | "agent_typing"
  | "agent_stopped_typing"
  | "agent_joined"
  | "agent_left"
  | "conversation_status_changed";

export interface MessageSentEvent {
  type: "message_sent";
  data: {
    message: Message;
  };
}

export interface AgentTypingEvent {
  type: "agent_typing" | "agent_stopped_typing";
  data: {
    agentId: string;
    agentName: string;
  };
}

export interface AgentStatusEvent {
  type: "agent_joined" | "agent_left";
  data: {
    agent: SupportAgent;
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
    "image/*",
    "video/*",
    "audio/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  maxFilesPerMessage: 5,
};

// Support-specific types
export interface SupportSession {
  id: string;
  conversationId: string;
  agent?: SupportAgent;
  status: "waiting" | "active" | "resolved";
  estimatedWaitTime?: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface QuickReply {
  id: string;
  text: string;
  category?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful?: boolean;
}

// Utility functions
export class ChatUtils {
  static formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  static formatLastMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static getFileTypeLabel(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "file";
  }

  static getMessageType(mimeType: string): MessageType {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "file";
  }

  static validateFile(
    file: File,
    config: FileUploadConfig
  ): { isValid: boolean; error?: string } {
    if (file.size > config.maxFileSize) {
      return {
        isValid: false,
        error: `File "${
          file.name
        }" is too large. Maximum size is ${this.formatFileSize(
          config.maxFileSize
        )}.`,
      };
    }

    const isValidType = config.allowedMimeTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.replace("/*", "/"));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not allowed.`,
      };
    }

    return { isValid: true };
  }

  static downloadFile(fileUrl: string, fileName: string): void {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static createMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateSmartResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();

    if (message.includes("book") || message.includes("reservation")) {
      return "I'd be happy to help you with booking! You can book spaces directly through our platform, or I can assist you with finding the perfect space for your needs. What type of space are you looking for?";
    }

    if (message.includes("cancel")) {
      return "I can help you with cancellation. You can cancel bookings up to 2 hours before the start time through your account, or I can process the cancellation for you. What booking would you like to cancel?";
    }

    if (message.includes("payment") || message.includes("billing")) {
      return "For payment and billing inquiries, I can help you with payment methods, invoices, or resolving any payment issues. What specific payment question do you have?";
    }

    if (message.includes("access") || message.includes("code")) {
      return "Access codes are sent 15 minutes before your booking starts. If you haven't received yours or it's not working, I can generate a new one for you. What's your booking reference?";
    }

    if (message.includes("membership")) {
      return "I can help you with membership-related questions including renewals, upgrades, benefits, and account management. What would you like to know about your membership?";
    }

    if (
      message.includes("technical") ||
      message.includes("problem") ||
      message.includes("issue")
    ) {
      return "I'm here to help resolve any technical issues you're experiencing. Could you please describe the specific problem you're encountering so I can provide the best assistance?";
    }

    return "Thank you for your message! I'll help you with that right away. Let me check our system for you and provide the best assistance possible.";
  }

  // Tailwind-specific styling utilities
  static getMessageTypeColor(
    type: MessageType,
    isDark: boolean = false
  ): string {
    switch (type) {
      case "booking_confirmation":
        return `bg-green-50 border-green-200 text-green-800 ${
          isDark
            ? "dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
            : ""
        }`;
      case "membership_renewal":
        return `bg-blue-50 border-blue-200 text-blue-800 ${
          isDark
            ? "dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
            : ""
        }`;
      case "cancellation":
        return `bg-red-50 border-red-200 text-red-800 ${
          isDark
            ? "dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
            : ""
        }`;
      case "payment_reminder":
        return `bg-yellow-50 border-yellow-200 text-yellow-800 ${
          isDark
            ? "dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300"
            : ""
        }`;
      case "system_notification":
        return `bg-purple-50 border-purple-200 text-purple-800 ${
          isDark
            ? "dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300"
            : ""
        }`;
      default:
        return "";
    }
  }

  static getAgentStatusColor(
    status: SupportAgent["status"],
    isDark: boolean = false
  ): string {
    switch (status) {
      case "online":
        return `text-green-600 ${isDark ? "dark:text-green-400" : ""}`;
      case "away":
        return `text-yellow-600 ${isDark ? "dark:text-yellow-400" : ""}`;
      case "offline":
        return `text-gray-500 ${isDark ? "dark:text-gray-400" : ""}`;
      default:
        return `text-gray-500 ${isDark ? "dark:text-gray-400" : ""}`;
    }
  }

  static getConnectionStatusColor(
    status: "connected" | "connecting" | "disconnected",
    isDark: boolean = false
  ): string {
    switch (status) {
      case "connected":
        return `text-green-600 ${isDark ? "dark:text-green-400" : ""}`;
      case "connecting":
        return `text-yellow-600 ${isDark ? "dark:text-yellow-400" : ""}`;
      case "disconnected":
        return `text-red-600 ${isDark ? "dark:text-red-400" : ""}`;
      default:
        return `text-gray-500 ${isDark ? "dark:text-gray-400" : ""}`;
    }
  }
}

// React Context types for state management
export interface ChatContextState {
  conversation?: Conversation;
  messages: Message[];
  supportSession?: SupportSession;
  isTyping: boolean;
  connectionStatus: "connected" | "connecting" | "disconnected";
  isLoading: boolean;
  error: string | null;
}

export interface ChatContextActions {
  sendMessage: (request: SendMessageRequest) => Promise<void>;
  startConversation: (request: StartConversationRequest) => Promise<void>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  endSession: () => Promise<void>;
  rateExperience: (rating: number, feedback?: string) => Promise<void>;
}

export interface ChatContextValue
  extends ChatContextState,
    ChatContextActions {}

// Hook return types
export interface UseChatReturn extends ChatContextValue {
  // Additional utilities
  formatMessageTime: (timestamp: string) => string;
  formatFileSize: (bytes: number) => string;
  validateFile: (file: File) => { isValid: boolean; error?: string };
}
