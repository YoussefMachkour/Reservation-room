// components/chat/QuickReplies.tsx
import React from "react";
import {
  MessageCircle,
  CreditCard,
  Calendar,
  HelpCircle,
  Settings,
  Zap,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface QuickReply {
  id: string;
  text: string;
  icon?: React.ReactNode;
  category?: string;
}

interface QuickRepliesProps {
  replies: QuickReply[];
  onReplySelect: (reply: string) => void;
  className?: string;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  replies,
  onReplySelect,
  className = "",
}) => {
  const { isDark } = useTheme();

  const defaultReplies: QuickReply[] = [
    {
      id: "1",
      text: "How do I book a space?",
      icon: <Calendar className="w-4 h-4" />,
      category: "booking",
    },
    {
      id: "2",
      text: "Cancel my booking",
      icon: <MessageCircle className="w-4 h-4" />,
      category: "booking",
    },
    {
      id: "3",
      text: "Payment issues",
      icon: <CreditCard className="w-4 h-4" />,
      category: "billing",
    },
    {
      id: "4",
      text: "Account settings",
      icon: <Settings className="w-4 h-4" />,
      category: "account",
    },
    {
      id: "5",
      text: "Technical support",
      icon: <HelpCircle className="w-4 h-4" />,
      category: "support",
    },
    {
      id: "6",
      text: "Emergency assistance",
      icon: <Zap className="w-4 h-4" />,
      category: "urgent",
    },
  ];

  const repliesData = replies.length > 0 ? replies : defaultReplies;

  const buttonClasses = `
    flex items-center gap-2 px-4 py-2 text-sm rounded-full border transition-all duration-200 
    hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${
      isDark
        ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 bg-gray-800"
        : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 bg-white"
    }
  `;

  const containerClasses = `
    px-6 py-4 border-t
    ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}
    ${className}
  `;

  if (repliesData.length === 0) return null;

  return (
    <div className={containerClasses}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle
            className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          />
          <p
            className={`text-sm font-medium ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Quick replies:
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {repliesData.map((reply) => (
            <button
              key={reply.id}
              onClick={() => onReplySelect(reply.text)}
              className={buttonClasses}
              aria-label={`Quick reply: ${reply.text}`}
            >
              {reply.icon}
              <span>{reply.text}</span>
            </button>
          ))}
        </div>

        {/* Helper text */}
        <p
          className={`text-xs mt-2 ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          💡 Click any option above or type your own message
        </p>
      </div>
    </div>
  );
};
