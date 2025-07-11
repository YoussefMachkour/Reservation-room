// pages/CustomerSupport.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  User,
  Bot,
  Minimize2,
  Maximize2,
  Star,
  HelpCircle,
  Wifi,
  WifiOff,
  CheckCircle,
  Settings,
  Headphones,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageList } from "@/components/chat/MessageList";
import { AgentCard } from "@/components/chat/AgentCard";
import { QuickReplies } from "@/components/chat/QuickReplies";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Message, SupportAgent, MessageType, ChatUtils } from "@/types/chat";
import { useTheme } from "@/contexts/ThemeContext";

interface ChatInputMessageData {
  content: string;
  type: MessageType;
  attachments?: File[];
}

interface TypingUser {
  id: string;
  name: string;
  type: "user" | "admin" | "bot";
}

export const CustomerSupport: React.FC = () => {
  const { isDark } = useTheme();

  // State management
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      conversationId: "conv1",
      senderId: "agent1",
      senderName: "Sarah Williams",
      senderType: "admin",
      content: "Hello! I'm Sarah from CoHub Support. How can I help you today?",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: "text",
      isRead: true,
    },
    {
      id: "2",
      conversationId: "conv1",
      senderId: "bot",
      senderName: "Support Bot",
      senderType: "bot",
      content:
        "You can also check our FAQ section below for quick answers to common questions.",
      timestamp: new Date(Date.now() - 290000).toISOString(),
      type: "system_notification",
      isRead: true,
    },
  ]);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("connected");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const [activeAgent] = useState<SupportAgent>({
    id: "agent1",
    name: "Sarah Williams",
    status: "online",
    department: "General Support",
    avatar: "",
    rating: 4.9,
  });

  const typingUsers: TypingUser[] = isTyping
    ? [{ id: "agent1", name: "Sarah Williams", type: "admin" }]
    : [];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    // Simulate connection status changes
    const interval = setInterval(() => {
      if (Math.random() > 0.98) {
        // 2% chance to change status
        const statuses: ("connected" | "connecting" | "disconnected")[] = [
          "connected",
          "connecting",
          "disconnected",
        ];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];
        setConnectionStatus(randomStatus);

        // Auto-reconnect after a few seconds
        if (randomStatus === "disconnected") {
          setTimeout(() => setConnectionStatus("connected"), 3000);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Clear typing indicator
    if (isTyping) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isTyping]);

  // Event handlers
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartChat = () => {
    setSessionStarted(true);
    showNotification("success", "Chat session started!");
  };

  const handleSendMessage = (messageData: ChatInputMessageData) => {
    if (!sessionStarted) {
      setSessionStarted(true);
    }

    setIsLoading(true);

    // Create user message
    if (messageData.content.trim()) {
      const userMessage: Message = {
        id: ChatUtils.createMessageId(),
        conversationId: "conv1",
        senderId: "user1",
        senderName: "You",
        senderType: "user",
        content: messageData.content,
        timestamp: new Date().toISOString(),
        type: "text",
        isRead: false,
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    // Handle file attachments
    if (messageData.attachments && messageData.attachments.length > 0) {
      messageData.attachments.forEach((file, index) => {
        const fileUrl = URL.createObjectURL(file);
        const fileMessage: Message = {
          id: ChatUtils.createMessageId(),
          conversationId: "conv1",
          senderId: "user1",
          senderName: "You",
          senderType: "user",
          content: `Shared a ${ChatUtils.getFileTypeLabel(file.type)}`,
          timestamp: new Date().toISOString(),
          type: ChatUtils.getMessageType(file.type),
          isRead: false,
          attachments: [
            {
              id: `attachment-${Date.now() + index}`,
              messageId: ChatUtils.createMessageId(),
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileUrl: fileUrl,
            },
          ],
        };
        setMessages((prev) => [...prev, fileMessage]);
      });
    }

    setIsLoading(false);
    setIsTyping(true);
    showNotification("success", "Message sent!");

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
      const agentResponse: Message = {
        id: ChatUtils.createMessageId(),
        conversationId: "conv1",
        senderId: "agent1",
        senderName: "Sarah Williams",
        senderType: "admin",
        content:
          messageData.attachments && messageData.attachments.length > 0
            ? "Thank you for sharing the file(s)! I've received them and will review them to better assist you."
            : ChatUtils.generateSmartResponse(messageData.content),
        timestamp: new Date().toISOString(),
        type: "text",
        isRead: true,
      };
      setMessages((prev) => [...prev, agentResponse]);

      // Mark user messages as read
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderType === "user" && !msg.isRead
            ? { ...msg, isRead: true }
            : msg
        )
      );
    }, 1500);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage({
      content: reply,
      type: "text",
    });
  };

  const faqItems = [
    {
      question: "How do I book a workspace?",
      answer:
        "Navigate to the Spaces section, select your preferred workspace, choose your date and time, then confirm your booking.",
    },
    {
      question: "Can I cancel my booking?",
      answer:
        "Yes, you can cancel bookings up to 2 hours before the start time. Go to 'My Bookings' and click the cancel button.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and company billing accounts.",
    },
    {
      question: "How do I access my booked space?",
      answer:
        "You'll receive an access code via email 15 minutes before your booking starts. Use this code at the space entrance.",
    },
    {
      question: "What if I have technical issues?",
      answer:
        "Our technical support team is available 24/7. Use the chat below or call our emergency line for immediate assistance.",
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div
            className={`max-w-md p-4 rounded-lg shadow-lg border ${
              notification.type === "success"
                ? isDark
                  ? "bg-green-900/20 border-green-800 text-green-300"
                  : "bg-green-50 border-green-200 text-green-800"
                : isDark
                ? "bg-red-900/20 border-red-800 text-red-300"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {notification.message}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-4xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Customer Support
          </h1>
          <p
            className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Get help when you need it. Our team is here to assist you 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 min-h-[80vh]">
          {/* Support Info Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Agent Card */}
            <AgentCard
              agent={activeAgent}
              connectionStatus={connectionStatus}
              estimatedWaitTime={connectionStatus === "connected" ? 0 : 2}
              onCall={() =>
                showNotification("success", "Initiating voice call...")
              }
              onVideoCall={() =>
                showNotification("success", "Starting video call...")
              }
              onStartChat={handleStartChat}
            />

            {/* Contact Methods */}
            <div
              className={`p-6 rounded-xl shadow-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Contact Methods
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? "bg-blue-900" : "bg-blue-100"
                    }`}
                  >
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Live Chat
                    </p>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Available 24/7
                    </p>
                  </div>
                  <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? "bg-green-900" : "bg-green-100"
                    }`}
                  >
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Phone Support
                    </p>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? "bg-purple-900" : "bg-purple-100"
                    }`}
                  >
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Email Support
                    </p>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      support@cohub.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div
              className={`p-6 rounded-xl shadow-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                <Clock className="w-5 h-5" />
                Operating Hours
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                    Live Chat
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-500"}
                    >
                      24/7
                    </span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                    Phone Support
                  </span>
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                    9 AM - 6 PM EST
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                    Email Response
                  </span>
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                    Within 2 hours
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Chat Interface */}
            <div
              className={`rounded-xl shadow-lg border flex flex-col ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } ${isMinimized ? "h-20" : "h-[600px]"}`}
            >
              {/* Chat Header */}
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDark ? "bg-blue-900" : "bg-blue-100"
                    }`}
                  >
                    <Headphones className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {sessionStarted ? activeAgent.name : "Support Chat"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {sessionStarted
                          ? `Online • ${activeAgent.department}`
                          : "Ready to help"}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        {connectionStatus === "connected" ? (
                          <Wifi className="w-3 h-3 text-green-600" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-red-600" />
                        )}
                        <span className="text-xs capitalize">
                          {connectionStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    icon={isMinimized ? Maximize2 : Minimize2}
                  >
                    {isMinimized ? "Expand" : "Minimize"}
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 min-h-0">
                    <MessageList
                      messages={messages}
                      currentUserId="user1"
                      typingUsers={typingUsers}
                      showAvatars={true}
                      showMetadata={false}
                      autoScroll={true}
                      className="h-full"
                    />
                  </div>

                  {/* Quick Replies */}
                  {!sessionStarted && (
                    <QuickReplies
                      replies={[]}
                      onReplySelect={handleQuickReply}
                    />
                  )}

                  {/* Chat Input */}
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    placeholder="Type your message..."
                    disabled={isLoading || connectionStatus === "disconnected"}
                    showFileUpload={true}
                    showEmoji={true}
                    maxLength={2000}
                  />
                </>
              )}
            </div>

            {/* FAQ Section */}
            <div
              className={`p-6 rounded-xl shadow-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3
                className={`text-xl font-semibold mb-6 flex items-center gap-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faqItems.map((item, index) => (
                  <details
                    key={index}
                    className={`group p-4 border rounded-lg ${
                      isDark
                        ? "border-gray-600 hover:border-gray-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <summary
                      className={`cursor-pointer text-sm font-medium transition-colors hover:text-blue-600 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {item.question}
                    </summary>
                    <p
                      className={`mt-3 text-sm leading-relaxed ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
