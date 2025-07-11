// components/chat/TypingIndicator.tsx
import React from "react";
import { User, Bot, Headphones } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface TypingUser {
  id: string;
  name: string;
  type: "user" | "admin" | "bot";
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  showAvatars?: boolean;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  showAvatars = true,
  className = "",
}) => {
  const { isDark } = useTheme();

  if (typingUsers.length === 0) return null;

  const getSenderIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "bot":
        return <Bot className="w-4 h-4" />;
      case "admin":
        return <Headphones className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getSenderColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-blue-600";
      case "bot":
        return "bg-purple-600";
      case "admin":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  const renderTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers[0].name} and ${
        typingUsers.length - 1
      } others are typing...`;
    }
  };

  const TypingDots = () => (
    <div className="flex items-center space-x-1">
      <div className="flex space-x-1">
        <div
          className={`w-2 h-2 rounded-full animate-bounce ${
            isDark ? "bg-gray-400" : "bg-gray-500"
          }`}
        ></div>
        <div
          className={`w-2 h-2 rounded-full animate-bounce ${
            isDark ? "bg-gray-400" : "bg-gray-500"
          }`}
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className={`w-2 h-2 rounded-full animate-bounce ${
            isDark ? "bg-gray-400" : "bg-gray-500"
          }`}
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );

  return (
    <div
      className={`flex justify-start animate-in fade-in duration-300 ${className}`}
    >
      <div className="flex items-start gap-3 max-w-[70%]">
        {showAvatars && (
          <div className="flex -space-x-2">
            {typingUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs ${
                  isDark ? "border-gray-700" : "border-white"
                } ${getSenderColor(user.type)}`}
                style={{ zIndex: typingUsers.length - index }}
              >
                {getSenderIcon(user.type)}
              </div>
            ))}
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-lg ${
            isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-900"
          }`}
        >
          <div className="flex items-center space-x-2">
            <TypingDots />
            <span
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {renderTypingText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
