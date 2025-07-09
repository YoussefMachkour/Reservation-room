import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Building2,
  BarChart3,
  Download,
  Filter,
  Eye,
  Target,
  Activity,
  Zap
} from 'lucide-react'

export function Analytics() {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  // Types for chart data
  interface RevenueDataPoint {
    month: string;
    revenue: number;
    bookings: number;
    members: number;
  }

  interface RevenueChartProps {
    data: RevenueDataPoint[];
  }

  // Pie Chart Component
  interface PieChartData {
    label: string;
    value: number;
    color: string;
    percentage: number;
  }

  interface PieChartProps {
    data: PieChartData[];
    size?: number;
  }

  const CustomPieChart = ({ data, size = 200 }: PieChartProps) => {
    const radius = size / 2 - 20;
    const centerX = size / 2;
    const centerY = size / 2;
    
    let cumulativeAngle = 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    const createPath = (startAngle: number, endAngle: number) => {
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
      return [
        "M", centerX, centerY,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
      ].join(" ");
    };
    
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };
    
    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="drop-shadow-sm">
          {data.map((segment, index) => {
            const angle = (segment.value / total) * 360;
            const path = createPath(cumulativeAngle, cumulativeAngle + angle);
            const result = (
              <path
                key={index}
                d={path}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            );
            cumulativeAngle += angle;
            return result;
          })}
          
          {/* Center circle for donut effect */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.4}
            fill="white"
            stroke="#f1f5f9"
            strokeWidth="1"
          />
          
          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            className="text-sm font-semibold fill-gray-700"
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {total.toLocaleString()}
          </text>
        </svg>
      </div>
    );
  };

  // Custom Revenue Chart Component
  const RevenueChart = ({ data }: RevenueChartProps) => {
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const minRevenue = Math.min(...data.map(d => d.revenue));
    const range = maxRevenue - minRevenue;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.revenue - minRevenue) / range) * 80; // Use 80% of height for padding
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="h-[250px] w-full relative p-4">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Area under the curve */}
          <polygon
            fill="url(#gradient)"
            points={`0,100 ${points} 100,100`}
            opacity="0.3"
          />
          
          {/* Main line */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Data points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.revenue - minRevenue) / range) * 80;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  fill="#10b981"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-muted-foreground">
          {data.map((d, i) => (
            <span key={i} className="text-center">{d.month}</span>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-muted-foreground">
          <span>${(maxRevenue / 1000).toFixed(0)}k</span>
          <span>${((maxRevenue + minRevenue) / 2000).toFixed(0)}k</span>
          <span>${(minRevenue / 1000).toFixed(0)}k</span>
        </div>
      </div>
    );
  };

  // Comprehensive analytics data
  const stats = {
    totalRevenue: 45250,
    revenueGrowth: 23.5,
    spaceUtilization: 78,
    utilizationGrowth: 12.3,
    memberGrowth: 24,
    memberGrowthPercent: 15.2,
    avgBookingDuration: 4.5,
    durationGrowth: -8.5,
    totalBookings: 1247,
    bookingsGrowth: 18.7,
    activeSpaces: 8,
    avgRevPerMember: 193.2,
    peakHours: '2PM - 4PM',
    occupancyRate: 85.3
  }

  const revenueData = [
    { month: 'Jan', revenue: 32000, bookings: 180, members: 145 },
    { month: 'Feb', revenue: 35000, bookings: 210, members: 152 },
    { month: 'Mar', revenue: 38000, bookings: 235, members: 168 },
    { month: 'Apr', revenue: 42000, bookings: 268, members: 175 },
    { month: 'May', revenue: 45250, bookings: 295, members: 189 },
  ]

  const spaceUtilization = [
    { name: 'Meeting Room A', utilization: 92, bookings: 145, revenue: 7250 },
    { name: 'Conference Room B', utilization: 87, bookings: 128, revenue: 9600 },
    { name: 'Hot Desk Area', utilization: 75, bookings: 320, revenue: 8000 },
    { name: 'Creative Studio', utilization: 68, bookings: 89, revenue: 3560 },
    { name: 'Private Office 101', utilization: 95, bookings: 45, revenue: 3600 },
    { name: 'Tech Lab', utilization: 71, bookings: 112, revenue: 3920 },
    { name: 'Executive Suite', utilization: 58, bookings: 23, revenue: 3450 },
    { name: 'Wellness Room', utilization: 45, bookings: 67, revenue: 2010 }
  ]

  const membershipDistribution = [
    { type: 'Basic', count: 89, percentage: 47, revenue: 10680 },
    { type: 'Premium', count: 67, percentage: 35, revenue: 20100 },
    { type: 'Enterprise', count: 33, percentage: 18, revenue: 14470 }
  ]

  // Data for pie charts
  const membershipPieData: PieChartData[] = [
    { label: 'Enterprise', value: 14470, color: '#8b5cf6', percentage: 32 },
    { label: 'Premium', value: 20100, color: '#3b82f6', percentage: 44 },
    { label: 'Basic', value: 10680, color: '#6b7280', percentage: 24 }
  ];

  const trendsPieData: PieChartData[] = [
    { label: 'Meeting Rooms', value: 15, color: '#10b981', percentage: 25 },
    { label: 'Hot Desk', value: 22, color: '#3b82f6', percentage: 37 },
    { label: 'Premium Growth', value: 18, color: '#f59e0b', percentage: 30 },
    { label: 'Weekend Usage', value: 8, color: '#8b5cf6', percentage: 13 }
  ];

  const peakHoursData = [
    { hour: '8AM', occupancy: 25, bookings: 12 },
    { hour: '9AM', occupancy: 45, bookings: 28 },
    { hour: '10AM', occupancy: 68, bookings: 42 },
    { hour: '11AM', occupancy: 82, bookings: 55 },
    { hour: '12PM', occupancy: 75, bookings: 48 },
    { hour: '1PM', occupancy: 88, bookings: 62 },
    { hour: '2PM', occupancy: 95, bookings: 78 },
    { hour: '3PM', occupancy: 92, bookings: 74 },
    { hour: '4PM', occupancy: 89, bookings: 68 },
    { hour: '5PM', occupancy: 65, bookings: 45 },
    { hour: '6PM', occupancy: 35, bookings: 22 },
    { hour: '7PM', occupancy: 18, bookings: 8 }
  ]

  const topMembers = [
    { name: 'John Smith', bookings: 45, spent: 4500, type: 'Premium' },
    { name: 'Mike Chen', bookings: 38, spent: 7600, type: 'Enterprise' },
    { name: 'Emma Wilson', bookings: 32, spent: 3840, type: 'Premium' },
    { name: 'Robert Taylor', bookings: 29, spent: 8700, type: 'Enterprise' },
    { name: 'Sarah Johnson', bookings: 28, spent: 2800, type: 'Basic' }
  ]

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const exportData = (type: string) => {
    // Convert data to CSV format
    if (type === 'csv') {
      const csvData = [
        ['Month', 'Revenue', 'Bookings', 'Members'],
        ...revenueData.map(d => [d.month, d.revenue, d.bookings, d.members])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('CSV file downloaded successfully!');
    } else {
      // For PDF, you would typically use a library like jsPDF
      alert(`PDF export would require a PDF library like jsPDF. For now, showing mock functionality.`);
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'detailed-reports':
        // In a real app, this would navigate to a detailed reports page
        alert('Opening detailed reports view... (would navigate to /analytics/detailed)');
        break;
      case 'custom-filter':
        // This would open a filter modal or sidebar
        alert('Opening custom filter dialog... (would show filter options)');
        break;
      case 'schedule-report':
        // This would open a scheduling modal
        alert('Opening report scheduler... (would show scheduling options)');
        break;
      case 'export-all':
        // This would export all data
        const allData = {
          revenue: revenueData,
          spaces: spaceUtilization,
          members: topMembers,
          membership: membershipDistribution,
          peakHours: peakHoursData
        };
        
        const jsonContent = JSON.stringify(allData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `complete-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Complete analytics data exported as JSON!');
        break;
      default:
        alert(`Action "${action}" triggered!`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your coworking space performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportData('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(stats.revenueGrowth)}
                  <span className={`ml-1 text-sm ${getGrowthColor(stats.revenueGrowth)}`}>
                    {Math.abs(stats.revenueGrowth)}% from last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Space Utilization</p>
                <p className="text-3xl font-bold">{stats.spaceUtilization}%</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(stats.utilizationGrowth)}
                  <span className={`ml-1 text-sm ${getGrowthColor(stats.utilizationGrowth)}`}>
                    {Math.abs(stats.utilizationGrowth)}% from last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Growth</p>
                <p className="text-3xl font-bold">+{stats.memberGrowth}</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(stats.memberGrowthPercent)}
                  <span className={`ml-1 text-sm ${getGrowthColor(stats.memberGrowthPercent)}`}>
                    {Math.abs(stats.memberGrowthPercent)}% from last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Booking Duration</p>
                <p className="text-3xl font-bold">{stats.avgBookingDuration}h</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(stats.durationGrowth)}
                  <span className={`ml-1 text-sm ${getGrowthColor(stats.durationGrowth)}`}>
                    {Math.abs(stats.durationGrowth)}% from last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={revenueData} />
                <div className="mt-4 grid grid-cols-5 gap-2 text-xs text-center">
                  {revenueData.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="font-medium">{d.month}</div>
                      <div className="text-green-600">{formatCurrency(d.revenue)}</div>
                      <div className="text-muted-foreground">{d.bookings} bookings</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Revenue by Membership Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <CustomPieChart data={membershipPieData} size={220} />
                  <div className="space-y-3 w-full">
                    {membershipPieData.map((membership) => (
                      <div key={membership.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: membership.color }}
                          ></div>
                          <span className="font-medium">{membership.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(membership.value)}</div>
                          <div className="text-sm text-muted-foreground">{membership.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Space Utilization Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spaceUtilization.map((space) => (
                  <div key={space.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{space.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {space.bookings} bookings • {formatCurrency(space.revenue)} revenue
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">{space.utilization}%</div>
                        <div className="text-sm text-muted-foreground">utilization</div>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${space.utilization}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Members by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMembers.map((member, index) => (
                    <div key={member.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.bookings} bookings
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(member.spent)}</div>
                        <Badge variant="outline" className="text-xs">
                          {member.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membership Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {membershipDistribution.map((membership) => (
                    <div key={membership.type} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{membership.type}</span>
                        <span className="text-sm text-muted-foreground">{membership.count} members</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            membership.type === 'Enterprise' ? 'bg-purple-600' :
                            membership.type === 'Premium' ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                          style={{ width: `${membership.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end justify-between space-x-2 p-4">
                {peakHoursData.map((hour) => (
                  <div key={hour.hour} className="flex flex-col items-center space-y-2">
                    <div className="text-xs text-muted-foreground">{hour.bookings}</div>
                    <div 
                      className="w-8 bg-blue-600 rounded-t-sm"
                      style={{ height: `${(hour.occupancy / 100) * 200}px` }}
                    ></div>
                    <div className="text-xs text-muted-foreground transform -rotate-45">
                      {hour.hour}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-muted-foreground mt-4">
                Peak hours: {stats.peakHours} with {stats.occupancyRate}% average occupancy
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Key Performance Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Revenue per Member</span>
              <span className="font-medium">{formatCurrency(stats.avgRevPerMember)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Bookings</span>
              <span className="font-medium">{stats.totalBookings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Active Spaces</span>
              <span className="font-medium">{stats.activeSpaces}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Booking Growth</span>
              <span className={`font-medium ${getGrowthColor(stats.bookingsGrowth)}`}>
                +{stats.bookingsGrowth}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <CustomPieChart data={trendsPieData} size={200} />
              <div className="space-y-3 w-full">
                {trendsPieData.map((trend) => (
                  <div key={trend.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: trend.color }}
                      ></div>
                      <span className="text-sm">
                        {trend.label} {trend.label === 'Meeting Rooms' ? 'showing 15% increase' :
                         trend.label === 'Hot Desk' ? 'bookings up 22% this month' :
                         trend.label === 'Premium Growth' ? 'memberships growing fastest' :
                         'usage increased 8%'}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      +{trend.value}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuickAction('detailed-reports')}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Detailed Reports
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuickAction('custom-filter')}
            >
              <Filter className="mr-2 h-4 w-4" />
              Create Custom Filter
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuickAction('schedule-report')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuickAction('export-all')}
            >
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}