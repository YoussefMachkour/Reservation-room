import { useState, useRef, useEffect } from "react";
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
  X,
  FileText,
  Image,
  Video,
  Music,
  Download,
} from "lucide-react";

// Import your actual theme context
// import { useTheme } from "../../contexts/ThemeContext";

interface Message {
  id: string;
  content: string;
  sender: "user" | "support" | "bot";
  timestamp: Date;
  type: "text" | "image" | "file" | "video" | "audio";
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
}

interface SupportAgent {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  department: string;
}

export const CustomerSupportPage = () => {
  // OPTION 1: Use your actual theme context (recommended)
  // const { isDark } = useTheme();
  
  // OPTION 2: Detect system theme (temporary solution)
  const [isDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // OPTION 3: Check if document has dark class (if you use class-based theming)
  // const [isDark] = useState(() => {
  //   if (typeof document !== 'undefined') {
  //     return document.documentElement.classList.contains('dark');
  //   }
  //   return false;
  // });
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
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() && uploadingFiles.length === 0) return;

    // Send text message if there's content
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender: "user",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev: Message[]) => [...prev, userMessage]);
    }

    // Send file messages
    uploadingFiles.forEach((file: File, index: number) => {
      const fileUrl = URL.createObjectURL(file);
      const fileMessage: Message = {
        id: (Date.now() + index + 1).toString(),
        content: `Shared a ${getFileTypeLabel(file.type)}`,
        sender: "user",
        timestamp: new Date(),
        type: getMessageType(file.type),
        fileName: file.name,
        fileSize: file.size,
        fileUrl: fileUrl,
      };
      setMessages((prev: Message[]) => [...prev, fileMessage]);
    });

    setNewMessage("");
    setUploadingFiles([]);

    // Simulate support response
    setTimeout(() => {
      const supportResponse: Message = {
        id: (Date.now() + 1000).toString(),
        content: uploadingFiles.length > 0 
          ? "Thank you for sharing the file(s)! I've received them and will review them to better assist you."
          : "Thank you for your message! I'll help you with that right away. Let me check our system for you.",
        sender: "support",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev: Message[]) => [...prev, supportResponse]);
    }, 1500);
  };

  const getFileTypeLabel = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const getMessageType = (mimeType: string): Message['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const getFileIcon = (type: Message['type']) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: any) => {
    const files = Array.from(e.target.files || []) as File[];
    const validFiles = files.filter((file: File) => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    
    setUploadingFiles((prev: File[]) => [...prev, ...validFiles]);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
  };

  const downloadFile = (message: Message) => {
    if (message.fileUrl && message.fileName) {
      const link = document.createElement('a');
      link.href = message.fileUrl;
      link.download = message.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'text') {
      return <p className="text-sm">{message.content}</p>;
    }

    if (message.type === 'image' && message.fileUrl) {
      return (
        <div className="space-y-2">
          <p className="text-sm">{message.content}</p>
          <img
            src={message.fileUrl}
            alt={message.fileName}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-80"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          <div className="flex items-center gap-2 text-xs opacity-75">
            <span>{message.fileName}</span>
            {message.fileSize && <span>• {formatFileSize(message.fileSize)}</span>}
          </div>
        </div>
      );
    }

    if (message.type === 'video' && message.fileUrl) {
      return (
        <div className="space-y-2">
          <p className="text-sm">{message.content}</p>
          <video
            src={message.fileUrl}
            controls
            className="max-w-xs rounded-lg"
          />
          <div className="flex items-center gap-2 text-xs opacity-75">
            <span>{message.fileName}</span>
            {message.fileSize && <span>• {formatFileSize(message.fileSize)}</span>}
          </div>
        </div>
      );
    }

    if (message.type === 'audio' && message.fileUrl) {
      return (
        <div className="space-y-2">
          <p className="text-sm">{message.content}</p>
          <audio
            src={message.fileUrl}
            controls
            className="w-full max-w-xs"
          />
          <div className="flex items-center gap-2 text-xs opacity-75">
            <span>{message.fileName}</span>
            {message.fileSize && <span>• {formatFileSize(message.fileSize)}</span>}
          </div>
        </div>
      );
    }

    // Generic file
    return (
      <div className="space-y-2">
        <p className="text-sm">{message.content}</p>
        <div 
          className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
          onClick={() => downloadFile(message)}
        >
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            {getFileIcon(message.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{message.fileName}</p>
            {message.fileSize && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(message.fileSize)}</p>
            )}
          </div>
          <Download className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
    );
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
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          Customer Support
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Get help when you need it. Our team is here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Support Info Panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Contact Methods */}
          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Contact Methods
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Live Chat
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  <p className="font-medium text-gray-900 dark:text-white">
                    Phone Support
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    +1 (555) 123-4567
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Email Support
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    support@cohub.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details key={index} className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-4">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Clock className="w-5 h-5" />
              Operating Hours
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  Live Chat
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  24/7
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  Phone Support
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  9 AM - 6 PM EST
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  Email Response
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Within 2 hours
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="xl:col-span-3">
          <div className="rounded-xl shadow-lg h-full flex flex-col bg-white dark:bg-gray-800">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {activeAgent.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Online • {activeAgent.department}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
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
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {renderMessage(message)}
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === "user"
                                ? "text-blue-100"
                                : "text-gray-500 dark:text-gray-400"
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

                {/* File Upload Preview */}
                {uploadingFiles.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Files to send:
                      </p>
                      <div className="space-y-2">
                        {uploadingFiles.map((file: File, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              {getFileIcon(getMessageType(file.type))}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                              onClick={() => removeUploadingFile(index)}
                              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Replies */}
                <div className="px-6 py-2">
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => setNewMessage(reply)}
                        className="px-3 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      title="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && uploadingFiles.length === 0}
                      className={`p-3 rounded-lg transition-colors ${
                        newMessage.trim() || uploadingFiles.length > 0
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};