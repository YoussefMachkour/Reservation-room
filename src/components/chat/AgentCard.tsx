// components/chat/AgentCard.tsx
import React from "react";
import {
  Star,
  Phone,
  Video,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "../ui/button/Button";
import { SupportAgent } from "@/types/chat";
import { useTheme } from "@/contexts/ThemeContext";

interface AgentCardProps {
  agent: SupportAgent;
  connectionStatus?: "connected" | "connecting" | "disconnected";
  estimatedWaitTime?: number;
  onCall?: () => void;
  onVideoCall?: () => void;
  onStartChat?: () => void;
  className?: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  connectionStatus = "connected",
  estimatedWaitTime,
  onCall,
  onVideoCall,
  onStartChat,
  className = "",
}) => {
  const { isDark } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return isDark ? "text-green-400" : "text-green-600";
      case "away":
        return isDark ? "text-yellow-400" : "text-yellow-600";
      case "offline":
        return isDark ? "text-gray-400" : "text-gray-500";
      default:
        return isDark ? "text-gray-400" : "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4" />;
      case "away":
        return <Clock className="w-4 h-4" />;
      case "offline":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="w-4 h-4 text-green-600" />;
      case "connecting":
        return <Wifi className="w-4 h-4 text-yellow-600 animate-pulse" />;
      case "disconnected":
        return <WifiOff className="w-4 h-4 text-red-600" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "text-yellow-400 fill-current"
            : isDark
            ? "text-gray-600"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const isDisabled =
    agent.status === "offline" || connectionStatus === "disconnected";

  return (
    <div
      className={`p-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl border ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } ${className}`}
    >
      {/* Agent Info */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          {/* Avatar */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {agent.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>

          {/* Status indicator */}
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isDark ? "border-gray-800" : "border-white"
            } ${
              agent.status === "online"
                ? "bg-green-500"
                : agent.status === "away"
                ? "bg-yellow-500"
                : "bg-gray-500"
            }`}
          >
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="flex-1">
          <h3
            className={`text-lg font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {agent.name}
          </h3>

          <div
            className={`flex items-center gap-2 text-sm ${getStatusColor(
              agent.status
            )}`}
          >
            {getStatusIcon(agent.status)}
            <span className="capitalize">{agent.status}</span>
          </div>

          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {agent.department}
          </p>
        </div>
      </div>

      {/* Rating */}
      {agent.rating && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {renderStars(Math.floor(agent.rating))}
          </div>
          <span
            className={`text-sm font-medium ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {agent.rating.toFixed(1)}
          </span>
          <span
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
          >
            (4.2k reviews)
          </span>
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getConnectionIcon()}
          <span
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "connecting"
              ? "Connecting..."
              : "Disconnected"}
          </span>
        </div>

        {estimatedWaitTime && estimatedWaitTime > 0 && (
          <div className="flex items-center gap-1">
            <Clock
              className={`w-4 h-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <span
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              ~{estimatedWaitTime}m wait
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={onStartChat}
          disabled={isDisabled}
          icon={MessageCircle}
          iconPosition="left"
        >
          Start Chat
        </Button>

        <div className="grid grid-cols-2 gap-2">
          {onCall && (
            <Button
              variant="outline"
              size="md"
              onClick={onCall}
              disabled={isDisabled}
              icon={Phone}
              iconPosition="left"
            >
              Call
            </Button>
          )}

          {onVideoCall && (
            <Button
              variant="outline"
              size="md"
              onClick={onVideoCall}
              disabled={isDisabled}
              icon={Video}
              iconPosition="left"
            >
              Video
            </Button>
          )}
        </div>
      </div>

      {/* Help Notice */}
      <div
        className={`mt-4 p-3 rounded-lg ${
          isDark
            ? "bg-gray-700 border border-gray-600"
            : "bg-blue-50 border border-blue-200"
        }`}
      >
        <p className={`text-xs ${isDark ? "text-gray-300" : "text-blue-700"}`}>
          💡 Available 24/7 for urgent issues. Response time: ~2 minutes
        </p>
      </div>
    </div>
  );
};
