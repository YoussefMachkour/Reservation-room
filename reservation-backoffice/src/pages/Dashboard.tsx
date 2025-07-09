import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Calendar,
  Users,
  DollarSign,
  Plus,
  MessageSquare,
  UserPlus,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      title: "New Bookings",
      value: "47",
      change: "+23% from yesterday",
      icon: Calendar,
      color: "text-blue-600",
      trend: "up",
      data: [20, 25, 30, 35, 40, 45, 47],
    },
    {
      title: "Occupancy Rate",
      value: "89%",
      change: "+12% this week",
      icon: Building2,
      color: "text-green-600",
      trend: "up",
      data: [65, 70, 75, 80, 85, 87, 89],
    },
    {
      title: "Active Members",
      value: "234",
      change: "+8 new today",
      icon: Users,
      color: "text-purple-600",
      trend: "up",
      data: [200, 210, 220, 225, 230, 232, 234],
    },
    {
      title: "Revenue",
      value: "$18,750",
      change: "This month",
      icon: DollarSign,
      color: "text-emerald-600",
      trend: "up",
      data: [12000, 13500, 15000, 16200, 17500, 18200, 18750],
    },
  ];

  const quickActions = [
    {
      title: "New Space",
      icon: Plus,
      description: "Add a new workspace",
      action: () => {
        navigate("/spaces");
        toast.success("Navigating to Spaces page");
      },
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    },
    {
      title: "Add Reservation",
      icon: Calendar,
      description: "Book a space",
      action: () => {
        navigate("/reservations");
        toast.success("Navigating to Reservations page");
      },
      color: "bg-green-50 hover:bg-green-100 text-green-700",
    },
    {
      title: "Add Member",
      icon: UserPlus,
      description: "Register new member",
      action: () => {
        navigate("/members");
        toast.success("Navigating to Members page");
      },
      color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
    },
    {
      title: "Send Message",
      icon: MessageSquare,
      description: "Contact members",
      action: () => {
        navigate("/messages");
        toast.success("Navigating to Messages page");
      },
      color: "bg-orange-50 hover:bg-orange-100 text-orange-700",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      user: "John Smith",
      action: "booked Meeting Room A",
      time: "2 minutes ago",
      type: "booking",
      avatar: "JS",
    },
    {
      id: 2,
      user: "Sarah Johnson",
      action: "renewed Premium membership",
      time: "15 minutes ago",
      type: "membership",
      avatar: "SJ",
    },
    {
      id: 3,
      user: "Mike Chen",
      action: "canceled Hot Desk reservation",
      time: "1 hour ago",
      type: "cancellation",
      avatar: "MC",
    },
    {
      id: 4,
      user: "Emma Wilson",
      action: "completed payment for Private Office",
      time: "2 hours ago",
      type: "payment",
      avatar: "EW",
    },
    {
      id: 5,
      user: "David Brown",
      action: "joined as Basic member",
      time: "3 hours ago",
      type: "membership",
      avatar: "DB",
    },
    {
      id: 6,
      user: "Lisa Garcia",
      action: "booked Conference Room B",
      time: "4 hours ago",
      type: "booking",
      avatar: "LG",
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Team Standup",
      time: "10:00 AM",
      room: "Meeting Room A",
      attendees: 8,
    },
    {
      id: 2,
      title: "Client Presentation",
      time: "2:00 PM",
      room: "Conference Room B",
      attendees: 12,
    },
    {
      id: 3,
      title: "Board Meeting",
      time: "4:30 PM",
      room: "Executive Suite",
      attendees: 6,
    },
  ];

  const alerts = [
    {
      id: 1,
      type: "warning",
      message: "Meeting Room C air conditioning needs maintenance",
      time: "30 minutes ago",
    },
    {
      id: 2,
      type: "info",
      message: "New member registration pending approval",
      time: "1 hour ago",
    },
    {
      id: 3,
      type: "success",
      message: "Monthly revenue target achieved!",
      time: "2 hours ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, Admin
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening in your spaces today -{" "}
            {currentTime.toLocaleDateString()}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          return (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendIcon
                    className={`mr-1 h-3 w-3 ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  />
                  {stat.change}
                </div>
                {/* Mini chart simulation */}
                <div className="mt-2 flex items-end space-x-1 h-6">
                  {stat.data.map((value, i) => (
                    <div
                      key={i}
                      className={`w-2 bg-${
                        stat.color.split("-")[1]
                      }-200 rounded-sm`}
                      style={{
                        height: `${(value / Math.max(...stat.data)) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto flex-col space-y-2 p-4 ${action.color}`}
                  onClick={action.action}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-70">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {activity.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      <span className="font-semibold">{activity.user}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <Badge
                    variant={
                      activity.type === "booking"
                        ? "default"
                        : activity.type === "membership"
                        ? "secondary"
                        : activity.type === "payment"
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border-l-4 border-primary pl-4 py-2"
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {event.time}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Building2 className="inline h-3 w-3 mr-1" />
                    {event.room}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Users className="inline h-3 w-3 mr-1" />
                    {event.attendees} attendees
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === "warning"
                    ? "bg-yellow-50 border-yellow-400"
                    : alert.type === "info"
                    ? "bg-blue-50 border-blue-400"
                    : "bg-green-50 border-green-400"
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {alert.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
