// components/ui/StatCard.tsx
import React from "react";
import { LucideIcon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

type IconColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "yellow"
  | "indigo"
  | "pink"
  | "gray";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: IconColor;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "blue",
  onClick,
  className = "",
}) => {
  const { isDark } = useTheme();

  const getIconColorClasses = (color: IconColor): string => {
    const colorMap: Record<IconColor, string> = {
      blue: "bg-blue-100 dark:bg-blue-900 text-blue-600",
      green: "bg-green-100 dark:bg-green-900 text-green-600",
      purple: "bg-purple-100 dark:bg-purple-900 text-purple-600",
      orange: "bg-orange-100 dark:bg-orange-900 text-orange-600",
      red: "bg-red-100 dark:bg-red-900 text-red-600",
      yellow: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600",
      indigo: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600",
      pink: "bg-pink-100 dark:bg-pink-900 text-pink-600",
      gray: "bg-gray-100 dark:bg-gray-900 text-gray-600",
    };
    return colorMap[color];
  };

  const cardClasses = `
    p-6 rounded-lg border transition-all duration-200
    ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}
    ${onClick ? "cursor-pointer hover:shadow-md hover:scale-105" : ""}
    ${className}
  `.trim();

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconColorClasses(
            iconColor
          )}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4 flex-1">
          <p
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </p>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {subtitle}
          </p>
          {title && (
            <p
              className={`text-xs mt-1 font-medium ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
