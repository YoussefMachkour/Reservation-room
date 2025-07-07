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
  PieChart,
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
    // Simulate export functionality
    alert(`Exporting ${type} data... (This would download a ${type.toUpperCase()} file in a real application)`)
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
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Revenue Chart</p>
                    <p className="text-xs text-muted-foreground">
                      {revenueData.map(d => `${d.month}: ${formatCurrency(d.revenue)}`).join(' • ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Revenue by Membership Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {membershipDistribution.map((membership) => (
                    <div key={membership.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          membership.type === 'Enterprise' ? 'bg-purple-500' :
                          membership.type === 'Premium' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="font-medium">{membership.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(membership.revenue)}</div>
                        <div className="text-sm text-muted-foreground">{membership.percentage}%</div>
                      </div>
                    </div>
                  ))}
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
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Meeting rooms showing 15% increase</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Hot desk bookings up 22% this month</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm">Premium memberships growing fastest</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Weekend usage increased 8%</span>
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
            <Button variant="outline" className="w-full justify-start">
              <Eye className="mr-2 h-4 w-4" />
              View Detailed Reports
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Create Custom Filter
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
