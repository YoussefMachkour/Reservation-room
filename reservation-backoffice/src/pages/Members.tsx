import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Search, 
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Star
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Member } from '@/types'

export function Members() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [membershipFilter, setMembershipFilter] = useState('All Types')

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

  const [memberFormData, setMemberFormData] = useState({
    name: '',
    email: '',
    phone: '',
    membershipType: 'Basic' as Member['membershipType'],
    company: '',
    address: '',
    notes: ''
  })

  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1 234 567 890',
      membershipType: 'Premium',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2025-03-15T10:30:00Z',
      totalBookings: 45,
      monthlySpend: 450,
      avatar: '',
      address: '123 Main St, New York, NY 10001',
      company: 'Tech Innovations Inc.',
      notes: 'Frequent user of meeting rooms, prefers morning slots'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 234 567 891',
      membershipType: 'Basic',
      status: 'expired',
      joinDate: '2024-02-20',
      lastActive: '2025-03-10T14:20:00Z',
      totalBookings: 12,
      monthlySpend: 120,
      avatar: '',
      address: '456 Oak Ave, Brooklyn, NY 11201',
      company: 'Freelance Designer',
      notes: 'Membership expired, needs renewal reminder'
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike.chen@example.com',
      phone: '+1 234 567 892',
      membershipType: 'Enterprise',
      status: 'active',
      joinDate: '2023-11-10',
      lastActive: '2025-03-15T09:45:00Z',
      totalBookings: 128,
      monthlySpend: 1200,
      avatar: '',
      address: '789 Pine St, Manhattan, NY 10002',
      company: 'Global Solutions Ltd.',
      notes: 'Corporate account, books spaces for team meetings'
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      phone: '+1 234 567 893',
      membershipType: 'Premium',
      status: 'active',
      joinDate: '2024-03-05',
      lastActive: '2025-03-14T16:15:00Z',
      totalBookings: 28,
      monthlySpend: 380,
      avatar: '',
      address: '321 Elm St, Queens, NY 11375',
      company: 'Marketing Pro Agency',
      notes: 'Prefers creative spaces, excellent feedback ratings'
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david.brown@example.com',
      phone: '+1 234 567 894',
      membershipType: 'Basic',
      status: 'active',
      joinDate: '2024-01-28',
      lastActive: '2025-03-13T11:30:00Z',
      totalBookings: 22,
      monthlySpend: 180,
      avatar: '',
      address: '654 Maple Dr, Staten Island, NY 10301',
      company: 'Independent Consultant',
      notes: 'Quiet worker, prefers hot desk areas'
    },
    {
      id: '6',
      name: 'Lisa Garcia',
      email: 'lisa.garcia@example.com',
      phone: '+1 234 567 895',
      membershipType: 'Premium',
      status: 'suspended',
      joinDate: '2023-12-15',
      lastActive: '2025-03-08T13:45:00Z',
      totalBookings: 67,
      monthlySpend: 0,
      avatar: '',
      address: '987 Cedar Ln, Bronx, NY 10451',
      company: 'Creative Studios Inc.',
      notes: 'Account suspended due to payment issues'
    },
    {
      id: '7',
      name: 'Robert Taylor',
      email: 'robert.taylor@example.com',
      phone: '+1 234 567 896',
      membershipType: 'Enterprise',
      status: 'active',
      joinDate: '2023-09-20',
      lastActive: '2025-03-15T08:20:00Z',
      totalBookings: 156,
      monthlySpend: 1800,
      avatar: '',
      address: '147 Birch St, Manhattan, NY 10003',
      company: 'Financial Services Corp.',
      notes: 'VIP member, requires executive suite access'
    },
    {
      id: '8',
      name: 'Jennifer Lee',
      email: 'jennifer.lee@example.com',
      phone: '+1 234 567 897',
      membershipType: 'Basic',
      status: 'active',
      joinDate: '2024-02-14',
      lastActive: '2025-03-12T15:10:00Z',
      totalBookings: 18,
      monthlySpend: 150,
      avatar: '',
      address: '258 Spruce Ave, Brooklyn, NY 11215',
      company: 'Startup Ventures',
      notes: 'New member, showing good engagement'
    }
  ])

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || member.status === statusFilter
    const matchesType = membershipFilter === 'All Types' || member.membershipType === membershipFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMembershipIcon = (type: Member['membershipType']) => {
    switch (type) {
      case 'Enterprise': return <Crown className="h-4 w-4" />
      case 'Premium': return <Star className="h-4 w-4" />
      case 'Basic': return <Users className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getMembershipColor = (type: Member['membershipType']) => {
    switch (type) {
      case 'Enterprise': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Premium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Basic': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleAddMember = () => {
    if (memberFormData.name && memberFormData.email) {
      const member: Member = {
        id: Date.now().toString(),
        name: memberFormData.name,
        email: memberFormData.email,
        phone: memberFormData.phone,
        membershipType: memberFormData.membershipType as Member['membershipType'],
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString(),
        totalBookings: 0,
        monthlySpend: 0,
        avatar: '',
        address: memberFormData.address,
        company: memberFormData.company,
        notes: memberFormData.notes
      }
      setMembers(prev => [...prev, member])
      setMemberFormData({
        name: '',
        email: '',
        phone: '',
        membershipType: 'Basic',
        company: '',
        address: '',
        notes: ''
      })
      setIsAddMemberOpen(false)
      showNotification('success', `Member "${member.name}" has been added successfully!`)
    } else {
      showNotification('error', 'Please fill in required fields (Name and Email)')
    }
  }

  const handleStatusChange = (memberId: string, newStatus: Member['status']) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, status: newStatus } : m
    ))
    showNotification('success', `Member status updated to ${newStatus}`)
  }

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to delete "${memberName}"? This action cannot be undone.`)) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
      showNotification('success', `Member "${memberName}" has been deleted successfully!`)
    }
  }

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now'
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else {
      return `${diffDays}d ago`
    }
  }

  const getStats = () => {
    const total = members.length
    const active = members.filter(m => m.status === 'active').length
    const expired = members.filter(m => m.status === 'expired').length
    const suspended = members.filter(m => m.status === 'suspended').length
    const totalRevenue = members.reduce((sum, m) => sum + m.monthlySpend, 0)
    const avgBookings = Math.round(members.reduce((sum, m) => sum + m.totalBookings, 0) / members.length)
    
    return { total, active, expired, suspended, totalRevenue, avgBookings }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">


      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage your community members • {stats.total} total • {stats.active} active • ${stats.totalRevenue.toLocaleString()} monthly revenue
          </p>
        </div>
        <Sheet open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add New Member</SheetTitle>
              <SheetDescription>
                Register a new member to your coworking space.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 py-6 px-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={memberFormData.name}
                  onChange={(e) => setMemberFormData({...memberFormData, name: e.target.value})}
                  placeholder="Enter member name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={memberFormData.email}
                  onChange={(e) => setMemberFormData({...memberFormData, email: e.target.value})}
                  placeholder="member@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={memberFormData.phone}
                  onChange={(e) => setMemberFormData({...memberFormData, phone: e.target.value})}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipType">Membership</Label>
                <Select 
                  value={memberFormData.membershipType} 
                  onValueChange={(value) => setMemberFormData({...memberFormData, membershipType: value as Member['membershipType']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={memberFormData.company}
                  onChange={(e) => setMemberFormData({...memberFormData, company: e.target.value})}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={memberFormData.address}
                  onChange={(e) => setMemberFormData({...memberFormData, address: e.target.value})}
                  placeholder="Enter member address"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={memberFormData.notes}
                  onChange={(e) => setMemberFormData({...memberFormData, notes: e.target.value})}
                  placeholder="Enter member notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember}>
                  Add Member
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-blue-600">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Bookings</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgBookings}</p>
              </div>
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={membershipFilter} onValueChange={setMembershipFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Types">All Types</SelectItem>
            <SelectItem value="Basic">Basic</SelectItem>
            <SelectItem value="Premium">Premium</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.company}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(member.id, member.status === 'suspended' ? 'active' : 'suspended')}>
                      {member.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`${getStatusColor(member.status)} flex items-center space-x-1`}>
                  <span>{member.status}</span>
                </Badge>
                <Badge className={`${getMembershipColor(member.membershipType)} flex items-center space-x-1`}>
                  {getMembershipIcon(member.membershipType)}
                  <span>{member.membershipType}</span>
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-2 h-4 w-4" />
                    {member.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Joined {new Date(member.joinDate).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{member.totalBookings}</div>
                  <div className="text-xs text-muted-foreground">Total Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${member.monthlySpend}</div>
                  <div className="text-xs text-muted-foreground">Monthly Spend</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Last active: {formatLastActive(member.lastActive)}
              </div>

              {member.notes && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                  {member.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredMembers.length} of {members.length} members
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold">No members found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters, or add a new member.
          </p>
        </div>
      )}
    </div>
  )
} 