// pages/support/CustomerSupportPage.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  User,
  Bot,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

interface Message {
  id: string;
  content: string;
  sender: "user" | "support" | "bot";
  timestamp: Date;
  type: "text" | "image" | "file";
}

interface SupportAgent {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  department: string;
}

export const CustomerSupportPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Sarah from CoHub Support. How can I help you today?",
      sender: "support",
      timestamp: new Date(Date.now() - 300000),
      type: "text",
    },
    {
      id: "2",
      content:
        "You can also check our FAQ section below for quick answers to common questions.",
      sender: "bot",
      timestamp: new Date(Date.now() - 290000),
      type: "text",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeAgent] = useState<SupportAgent>({
    id: "1",
    name: "Sarah Williams",
    status: "online",
    department: "General Support",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    // Simulate support response
    setTimeout(() => {
      const supportResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Thank you for your message! I'll help you with that right away. Let me check our system for you.",
        sender: "support",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, supportResponse]);
    }, 1500);
  };

  const quickReplies = [
    "How do I book a space?",
    "Cancel my booking",
    "Payment issues",
    "Account settings",
    "Technical support",
  ];

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
  ];

  return (
    <div className="h-full w-full">
      {/* Header */}
      <div className="mb-6">
        <h1
          className={`text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Customer Support
        </h1>
        <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Get help when you need it. Our team is here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Support Info Panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Contact Methods */}
          <div
            className={`p-6 rounded-xl ${
              isDark ? "bg-gray-800" : "bg-white"
            } shadow-lg`}
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
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
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
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
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
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
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

          {/* FAQ Section */}
          <div
            className={`p-6 rounded-xl ${
              isDark ? "bg-gray-800" : "bg-white"
            } shadow-lg`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details key={index} className="group">
                  <summary
                    className={`cursor-pointer text-sm font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    } hover:text-blue-600 transition-colors`}
                  >
                    {item.question}
                  </summary>
                  <p
                    className={`mt-2 text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    } pl-4`}
                  >
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Operating Hours */}
          <div
            className={`p-6 rounded-xl ${
              isDark ? "bg-gray-800" : "bg-white"
            } shadow-lg`}
          >
            <h3
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              <Clock className="w-5 h-5" />
              Operating Hours
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Live Chat
                </span>
                <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                  24/7
                </span>
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

        {/* Chat Interface */}
        <div className="xl:col-span-3">
          <div
            className={`rounded-xl shadow-lg h-full flex flex-col ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Chat Header */}
            <div
              className={`px-6 py-4 border-b ${
                isDark ? "border-gray-700" : "border-gray-200"
              } flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {activeAgent.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Online • {activeAgent.department}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start gap-3 max-w-md xl:max-w-lg ${
                          message.sender === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.sender === "user"
                              ? "bg-blue-600"
                              : message.sender === "bot"
                              ? "bg-purple-600"
                              : "bg-green-600"
                          }`}
                        >
                          {message.sender === "user" ? (
                            <User className="w-4 h-4 text-white" />
                          ) : message.sender === "bot" ? (
                            <Bot className="w-4 h-4 text-white" />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.sender === "user"
                              ? "bg-blue-600 text-white"
                              : isDark
                              ? "bg-gray-700 text-gray-200"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === "user"
                                ? "text-blue-100"
                                : isDark
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-6 py-2">
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => setNewMessage(reply)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          isDark
                            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                            : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div
                  className={`px-6 py-4 border-t ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-3"
                  >
                    <button
                      type="button"
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                      />
                      <button
                        type="button"
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`p-3 rounded-lg transition-colors ${
                        newMessage.trim()
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
