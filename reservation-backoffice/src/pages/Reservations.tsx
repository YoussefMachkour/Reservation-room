import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  Calendar, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import type { Reservation } from '@/types'

export function Reservations() {
  const [currentView, setCurrentView] = useState('Day')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false)

  // Separate form state to prevent input blocking
  const [reservationFormData, setReservationFormData] = useState({
    memberName: '',
    memberEmail: '',
    memberPhone: '',
    spaceName: '',
    spaceId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  })

  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: '1',
      memberName: 'John Smith',
      memberEmail: 'john.smith@example.com',
      memberPhone: '+1 234 567 890',
      spaceName: 'Meeting Room A',
      spaceId: '1',
      date: '2025-03-15',
      startTime: '9:00 AM',
      endTime: '10:30 AM',
      duration: '1.5h',
      status: 'confirmed',
      notes: 'Team standup meeting',
      createdAt: '2025-03-14T10:00:00Z',
      updatedAt: '2025-03-14T10:00:00Z'
    },
    {
      id: '2',
      memberName: 'Sarah Johnson',
      memberEmail: 'sarah.johnson@example.com',
      memberPhone: '+1 234 567 891',
      spaceName: 'Hot Desk Area',
      spaceId: '3',
      date: '2025-03-15',
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      duration: '8h',
      status: 'pending',
      notes: 'Hot desk booking for development work',
      createdAt: '2025-03-14T11:00:00Z',
      updatedAt: '2025-03-14T11:00:00Z'
    },
    {
      id: '3',
      memberName: 'Mike Chen',
      memberEmail: 'mike.chen@example.com',
      memberPhone: '+1 234 567 892',
      spaceName: 'Conference Room B',
      spaceId: '4',
      date: '2025-03-15',
      startTime: '2:00 PM',
      endTime: '4:00 PM',
      duration: '2h',
      status: 'confirmed',
      notes: 'Client presentation',
      createdAt: '2025-03-14T12:00:00Z',
      updatedAt: '2025-03-14T12:00:00Z'
    },
    {
      id: '4',
      memberName: 'Emma Wilson',
      memberEmail: 'emma.wilson@example.com',
      memberPhone: '+1 234 567 893',
      spaceName: 'Private Office 101',
      spaceId: '2',
      date: '2025-03-15',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      duration: '2h',
      status: 'cancelled',
      notes: 'Private meeting cancelled',
      createdAt: '2025-03-14T13:00:00Z',
      updatedAt: '2025-03-15T08:00:00Z'
    },
    {
      id: '5',
      memberName: 'David Brown',
      memberEmail: 'david.brown@example.com',
      memberPhone: '+1 234 567 894',
      spaceName: 'Creative Studio',
      spaceId: '5',
      date: '2025-03-15',
      startTime: '1:00 PM',
      endTime: '5:00 PM',
      duration: '4h',
      status: 'confirmed',
      notes: 'Design workshop',
      createdAt: '2025-03-14T14:00:00Z',
      updatedAt: '2025-03-14T14:00:00Z'
    },
    {
      id: '6',
      memberName: 'Lisa Garcia',
      memberEmail: 'lisa.garcia@example.com',
      memberPhone: '+1 234 567 895',
      spaceName: 'Tech Lab',
      spaceId: '7',
      date: '2025-03-16',
      startTime: '9:00 AM',
      endTime: '12:00 PM',
      duration: '3h',
      status: 'pending',
      notes: 'Code review session',
      createdAt: '2025-03-15T09:00:00Z',
      updatedAt: '2025-03-15T09:00:00Z'
    }
  ])

  const spaces = [
    { id: '1', name: 'Meeting Room A' },
    { id: '2', name: 'Private Office 101' },
    { id: '3', name: 'Hot Desk Area' },
    { id: '4', name: 'Conference Room B' },
    { id: '5', name: 'Creative Studio' },
    { id: '6', name: 'Executive Suite' },
    { id: '7', name: 'Tech Lab' },
    { id: '8', name: 'Wellness Room' }
  ]

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ]

  const todayReservations = reservations.filter(r => r.date === '2025-03-15')
  const tomorrowReservations = reservations.filter(r => r.date === '2025-03-16')

  const resetForm = () => {
    setReservationFormData({
      memberName: '',
      memberEmail: '',
      memberPhone: '',
      spaceName: '',
      spaceId: '',
      date: '',
      startTime: '',
      endTime: '',
      notes: ''
    })
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-3 w-3" />
      case 'pending': return <AlertCircle className="h-3 w-3" />
      case 'cancelled': return <XCircle className="h-3 w-3" />
      case 'completed': return <CheckCircle className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  const handleStatusChange = (reservationId: string, newStatus: Reservation['status']) => {
    setReservations(prev => prev.map(r => 
      r.id === reservationId 
        ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
        : r
    ))
    showNotification('success', `Reservation status updated to ${newStatus}`)
  }

  const handleCreateReservation = () => {
    if (reservationFormData.memberName && reservationFormData.spaceName && reservationFormData.date && reservationFormData.startTime && reservationFormData.endTime) {
      const reservation: Reservation = {
        id: Date.now().toString(),
        memberName: reservationFormData.memberName,
        memberEmail: reservationFormData.memberEmail,
        memberPhone: reservationFormData.memberPhone,
        spaceName: reservationFormData.spaceName,
        spaceId: reservationFormData.spaceId,
        date: reservationFormData.date,
        startTime: reservationFormData.startTime,
        endTime: reservationFormData.endTime,
        duration: '2h', // Calculate this properly in real app
        status: 'pending',
        notes: reservationFormData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setReservations(prev => [...prev, reservation])
      resetForm()
      setIsNewReservationOpen(false)
      showNotification('success', `Reservation created for ${reservation.memberName}`)
    } else {
      showNotification('error', 'Please fill in all required fields')
    }
  }

  const getReservationForTimeSlot = (time: string, spaceName: string) => {
    return todayReservations.find(r => 
      r.spaceName === spaceName && 
      (r.startTime === time || (r.startTime <= time && r.endTime > time))
    )
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getStats = () => {
    const total = reservations.length
    const confirmed = reservations.filter(r => r.status === 'confirmed').length
    const pending = reservations.filter(r => r.status === 'pending').length
    const cancelled = reservations.filter(r => r.status === 'cancelled').length
    
    return { total, confirmed, pending, cancelled }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Notification */}
      {/* Notification */}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reservations</h2>
          <p className="text-muted-foreground">
            Manage space bookings and reservations • {stats.total} total • {stats.confirmed} confirmed • {stats.pending} pending
          </p>
        </div>
        <Sheet open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Reservation
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create New Reservation</SheetTitle>
              <SheetDescription>
                Book a space for a member.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="memberName">Member Name *</Label>
                <Input
                  id="memberName"
                  value={reservationFormData.memberName}
                  onChange={(e) => setReservationFormData({...reservationFormData, memberName: e.target.value})}
                  placeholder="Enter member name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberEmail">Member Email</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={reservationFormData.memberEmail}
                  onChange={(e) => setReservationFormData({...reservationFormData, memberEmail: e.target.value})}
                  placeholder="member@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="space">Space *</Label>
                <Select 
                  value={reservationFormData.spaceId} 
                  onValueChange={(value) => {
                    const space = spaces.find(s => s.id === value)
                    setReservationFormData({
                      ...reservationFormData, 
                      spaceId: value,
                      spaceName: space?.name || ''
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a space" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map(space => (
                      <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={reservationFormData.date}
                  onChange={(e) => setReservationFormData({...reservationFormData, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Select 
                    value={reservationFormData.startTime} 
                    onValueChange={(value) => setReservationFormData({...reservationFormData, startTime: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Select 
                    value={reservationFormData.endTime} 
                    onValueChange={(value) => setReservationFormData({...reservationFormData, endTime: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={reservationFormData.notes}
                  onChange={(e) => setReservationFormData({...reservationFormData, notes: e.target.value})}
                  placeholder="Additional notes or requirements"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setIsNewReservationOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReservation}>
                  Create Reservation
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View Tabs */}
      <Tabs value={currentView} onValueChange={setCurrentView}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="Day">Day</TabsTrigger>
            <TabsTrigger value="Week">Week</TabsTrigger>
            <TabsTrigger value="Month">Month</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[200px] text-center">
              {formatDate(selectedDate)}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="Day" className="space-y-4">
          {/* Calendar Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div className="font-medium">Time</div>
                <div className="font-medium">Meeting Room A</div>
                <div className="font-medium">Conference Room B</div>
                <div className="font-medium">Hot Desk Area</div>
                <div className="font-medium">Creative Studio</div>
              </div>
              
              {/* Time slots */}
              <div className="space-y-2">
                {timeSlots.slice(1, 6).map(time => (
                  <div key={time} className="grid grid-cols-5 gap-4 py-2 border-b">
                    <div className="text-sm text-muted-foreground font-medium">{time}</div>
                    {['Meeting Room A', 'Conference Room B', 'Hot Desk Area', 'Creative Studio'].map(spaceName => {
                      const reservation = getReservationForTimeSlot(time, spaceName)
                      return (
                        <div key={spaceName} className="min-h-[60px]">
                          {reservation ? (
                            <div className={`p-2 rounded text-sm ${
                              reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              <div className="font-medium">{reservation.memberName}</div>
                              <div className="text-xs">{reservation.startTime} - {reservation.endTime}</div>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {reservation.status}
                              </Badge>
                            </div>
                          ) : (
                            <div className="h-full border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-xs text-muted-foreground">
                              Available
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Week">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Week View</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Week view calendar will be implemented here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Month">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Month View</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Month view calendar will be implemented here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Today's Reservations */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Reservations ({todayReservations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayReservations.map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{reservation.memberName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="font-medium">{reservation.memberName}</div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {reservation.spaceName}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {reservation.startTime} - {reservation.endTime}
                      </div>
                      {reservation.memberEmail && (
                        <div className="flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          {reservation.memberEmail}
                        </div>
                      )}
                    </div>
                    {reservation.notes && (
                      <p className="text-sm text-muted-foreground">{reservation.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getStatusColor(reservation.status)} flex items-center space-x-1`}>
                    {getStatusIcon(reservation.status)}
                    <span>{reservation.status}</span>
                  </Badge>
                  <Select 
                    value={reservation.status} 
                    onValueChange={(value: Reservation['status']) => handleStatusChange(reservation.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tomorrow's Reservations */}
      {tomorrowReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tomorrow's Reservations ({tomorrowReservations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tomorrowReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{reservation.memberName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="font-medium">{reservation.memberName}</div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-3 w-3" />
                          {reservation.spaceName}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {reservation.startTime} - {reservation.endTime}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(reservation.status)} flex items-center space-x-1`}>
                    {getStatusIcon(reservation.status)}
                    <span>{reservation.status}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
