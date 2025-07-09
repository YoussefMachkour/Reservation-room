import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign,
  MapPin,
  Image as ImageIcon,
  Building2,
  Wifi,
  Monitor,
  Coffee,
  Car,
  Shield,
  Zap,
  CheckCircle,
  AlertCircle,
  Upload,
  X
} from 'lucide-react'
import type { Space } from '@/types'

export function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([
    {
      id: '1',
      name: 'Meeting Room A',
      type: 'Meeting Room',
      location: '4th Floor, North Wing',
      capacity: 8,
      pricePerHour: 50,
      status: 'Available',
      amenities: ['Projector', 'Whiteboard', 'Video Conferencing', 'WiFi'],
      description: 'Perfect for team meetings and presentations with state-of-the-art AV equipment',
      createdAt: '2024-01-15T10:00:00Z',
      images: [] // Add images array to existing spaces
    },
    {
      id: '2',
      name: 'Private Office 101',
      type: 'Private Office',
      location: '2nd Floor, East Wing',
      capacity: 4,
      pricePerMonth: 800,
      status: 'Occupied',
      amenities: ['Desk', 'Chair', 'Storage', 'WiFi', 'Phone Line'],
      description: 'Quiet private office space ideal for focused work',
      createdAt: '2024-01-15T10:00:00Z',
      images: []
    },
    {
      id: '3',
      name: 'Hot Desk Area',
      type: 'Hot Desk',
      location: '3rd Floor, Open Space',
      capacity: 20,
      pricePerDay: 25,
      status: 'Available',
      amenities: ['Desk', 'Chair', 'WiFi', 'Power Outlets', 'Coffee Station'],
      description: 'Flexible hot desk workspace in a collaborative environment',
      createdAt: '2024-01-15T10:00:00Z',
      images: []
    },
    {
      id: '4',
      name: 'Conference Room B',
      type: 'Meeting Room',
      location: '5th Floor, South Wing',
      capacity: 16,
      pricePerHour: 75,
      status: 'Available',
      amenities: ['Large Screen', 'Surround Sound', 'Video Conferencing', 'WiFi', 'Catering Setup'],
      description: 'Large conference room perfect for board meetings and presentations',
      createdAt: '2024-01-16T10:00:00Z',
      images: []
    },
    {
      id: '5',
      name: 'Creative Studio',
      type: 'Coworking Space',
      location: '1st Floor, West Wing',
      capacity: 12,
      pricePerDay: 40,
      status: 'Available',
      amenities: ['Art Supplies', 'Easels', 'Natural Light', 'WiFi', 'Storage Lockers'],
      description: 'Inspiring creative workspace with artistic amenities',
      createdAt: '2024-01-17T10:00:00Z',
      images: []
    },
    {
      id: '6',
      name: 'Executive Suite',
      type: 'Private Office',
      location: '6th Floor, Corner Office',
      capacity: 6,
      pricePerMonth: 1500,
      status: 'Disabled',
      amenities: ['Executive Desk', 'Meeting Table', 'City View', 'WiFi', 'Minibar', 'Private Bathroom'],
      description: 'Premium executive office with panoramic city views',
      createdAt: '2024-01-18T10:00:00Z',
      images: []
    },
    {
      id: '7',
      name: 'Tech Lab',
      type: 'Coworking Space',
      location: '2nd Floor, Tech Hub',
      capacity: 15,
      pricePerDay: 35,
      status: 'Available',
      amenities: ['High-Speed Internet', 'Monitors', 'Whiteboard', 'WiFi', 'Power Strips', 'Security Access'],
      description: 'Technology-focused workspace with development tools',
      createdAt: '2024-01-19T10:00:00Z',
      images: []
    },
    {
      id: '8',
      name: 'Wellness Room',
      type: 'Meeting Room',
      location: '1st Floor, Wellness Center',
      capacity: 10,
      pricePerHour: 30,
      status: 'Available',
      amenities: ['Yoga Mats', 'Sound System', 'Aromatherapy', 'WiFi', 'Natural Lighting'],
      description: 'Peaceful space for wellness meetings and meditation sessions',
      createdAt: '2024-01-20T10:00:00Z',
      images: []
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  // Separate form states to prevent input blocking
  const [addFormData, setAddFormData] = useState({
    name: '',
    type: 'Meeting Room' as Space['type'],
    location: '',
    capacity: '',
    pricePerHour: '',
    description: '',
    images: [] as string[] // Add images to form data
  })

  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'Meeting Room' as Space['type'],
    location: '',
    capacity: '',
    pricePerHour: '',
    description: '',
    images: [] as string[]
  })

  const amenityIcons: Record<string, React.ComponentType<{className?: string}>> = {
    'WiFi': Wifi,
    'Projector': Monitor,
    'Coffee Station': Coffee,
    'Parking': Car,
    'Security Access': Shield,
    'Power Outlets': Zap,
    'Video Conferencing': Monitor,
    'Whiteboard': Edit,
    'High-Speed Internet': Wifi
  }

  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All Types' || space.type === typeFilter
    const matchesStatus = statusFilter === 'All Status' || space.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  const resetAddForm = () => {
    setAddFormData({
      name: '',
      type: 'Meeting Room',
      location: '',
      capacity: '',
      pricePerHour: '',
      description: '',
      images: []
    })
  }

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      type: 'Meeting Room',
      location: '',
      capacity: '',
      pricePerHour: '',
      description: '',
      images: []
    })
  }

  // Image handling functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const files = e.target.files
    if (files) {
      const newImages: string[] = []
      
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const result = e.target?.result as string
            newImages.push(result)
            
            if (formType === 'add') {
              setAddFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages]
              }))
            } else {
              setEditFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages]
              }))
            }
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const removeImage = (index: number, formType: 'add' | 'edit') => {
    if (formType === 'add') {
      setAddFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }))
    } else {
      setEditFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }))
    }
  }

  const handleAddSpace = () => {
    if (addFormData.name && addFormData.location && addFormData.capacity) {
      const space: Space = {
        id: Date.now().toString(),
        name: addFormData.name,
        type: addFormData.type,
        location: addFormData.location,
        capacity: parseInt(addFormData.capacity) || 0,
        pricePerHour: parseInt(addFormData.pricePerHour) || 0,
        status: 'Available',
        amenities: ['WiFi', 'Power Outlets'],
        description: addFormData.description,
        createdAt: new Date().toISOString(),
        images: addFormData.images
      }
      setSpaces([...spaces, space])
      resetAddForm()
      setIsAddSheetOpen(false)
      showNotification('success', `Space "${space.name}" has been added successfully!`)
    } else {
      showNotification('error', 'Please fill in all required fields')
    }
  }

  const handleEditSpace = () => {
    if (editingSpace && editFormData.name && editFormData.location && editFormData.capacity) {
      const updatedSpace: Space = {
        ...editingSpace,
        name: editFormData.name,
        type: editFormData.type,
        location: editFormData.location,
        capacity: parseInt(editFormData.capacity) || 0,
        pricePerHour: parseInt(editFormData.pricePerHour) || 0,
        description: editFormData.description,
        images: editFormData.images
      }
      setSpaces(spaces.map(space => 
        space.id === editingSpace.id ? updatedSpace : space
      ))
      setIsEditSheetOpen(false)
      setEditingSpace(null)
      resetEditForm()
      showNotification('success', `Space "${updatedSpace.name}" has been updated successfully!`)
    } else {
      showNotification('error', 'Please fill in all required fields')
    }
  }

  const handleDeleteSpace = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      setSpaces(spaces.filter(space => space.id !== id))
      showNotification('success', `Space "${name}" has been deleted successfully!`)
    }
  }

  const handleToggleStatus = (id: string, currentStatus: Space['status']) => {
    const newStatus = currentStatus === 'Disabled' ? 'Available' : 'Disabled'
    setSpaces(spaces.map(space => 
      space.id === id 
        ? { ...space, status: newStatus }
        : space
    ))
    showNotification('success', `Space status updated to ${newStatus}`)
  }

  const openEditSheet = (space: Space) => {
    setEditingSpace(space)
    setEditFormData({
      name: space.name,
      type: space.type,
      location: space.location,
      capacity: space.capacity.toString(),
      pricePerHour: space.pricePerHour?.toString() || '',
      description: space.description || '',
      images: space.images || []
    })
    setIsEditSheetOpen(true)
  }

  const getStatusColor = (status: Space['status']) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800 border-green-200'
      case 'Occupied': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Disabled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Space['status']) => {
    switch (status) {
      case 'Available': return <CheckCircle className="h-3 w-3" />
      case 'Occupied': return <Users className="h-3 w-3" />
      case 'Disabled': return <AlertCircle className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  const getPriceDisplay = (space: Space) => {
    if (space.pricePerHour) return `$${space.pricePerHour}/hour`
    if (space.pricePerDay) return `$${space.pricePerDay}/day`
    if (space.pricePerMonth) return `$${space.pricePerMonth}/month`
    return 'Price not set'
  }

  const getUtilizationRate = () => {
    const occupiedSpaces = spaces.filter(s => s.status === 'Occupied').length
    return Math.round((occupiedSpaces / spaces.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Spaces Management</h2>
          <p className="text-muted-foreground">
            Manage your coworking spaces and facilities • {spaces.length} total spaces • {getUtilizationRate()}% occupied
          </p>
        </div>
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Space
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add New Space</SheetTitle>
              <SheetDescription>
                Create a new workspace for your coworking space.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 py-6 px-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Name *</Label>
                <Input
                  id="add-name"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter space name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-type">Type</Label>
                <Select 
                  value={addFormData.type} 
                  onValueChange={(value) => setAddFormData(prev => ({ ...prev, type: value as Space['type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                    <SelectItem value="Private Office">Private Office</SelectItem>
                    <SelectItem value="Hot Desk">Hot Desk</SelectItem>
                    <SelectItem value="Coworking Space">Coworking Space</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-location">Location *</Label>
                <Input
                  id="add-location"
                  value={addFormData.location}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., 4th Floor, North Wing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-capacity">Capacity *</Label>
                <Input
                  id="add-capacity"
                  type="number"
                  value={addFormData.capacity}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Number of people"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-price">Price/Hour</Label>
                <Input
                  id="add-price"
                  type="number"
                  value={addFormData.pricePerHour}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, pricePerHour: e.target.value }))}
                  placeholder="Price per hour"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-description">Description</Label>
                <Textarea
                  id="add-description"
                  value={addFormData.description}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the space and its features"
                  rows={3}
                />
              </div>
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Images</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'add')}
                      />
                    </label>
                  </div>
                  
                  {/* Image Previews */}
                  {addFormData.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {addFormData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Space image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index, 'add')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setIsAddSheetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSpace}>
                  Add Space
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Space</SheetTitle>
            <SheetDescription>
              Update the space information.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-6 px-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter space name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select 
                value={editFormData.type} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, type: value as Space['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                  <SelectItem value="Private Office">Private Office</SelectItem>
                  <SelectItem value="Hot Desk">Hot Desk</SelectItem>
                  <SelectItem value="Coworking Space">Coworking Space</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                value={editFormData.location}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., 4th Floor, North Wing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity *</Label>
              <Input
                id="edit-capacity"
                type="number"
                value={editFormData.capacity}
                onChange={(e) => setEditFormData(prev => ({ ...prev, capacity: e.target.value }))}
                placeholder="Number of people"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price/Hour</Label>
              <Input
                id="edit-price"
                type="number"
                value={editFormData.pricePerHour}
                onChange={(e) => setEditFormData(prev => ({ ...prev, pricePerHour: e.target.value }))}
                placeholder="Price per hour"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the space and its features"
                rows={3}
              />
            </div>
            
            {/* Image Upload Section for Edit */}
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'edit')}
                    />
                  </label>
                </div>
                
                {/* Image Previews for Edit */}
                {editFormData.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {editFormData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Space image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, 'edit')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setIsEditSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSpace}>
                Update Space
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Types">All Types</SelectItem>
            <SelectItem value="Meeting Room">Meeting Room</SelectItem>
            <SelectItem value="Private Office">Private Office</SelectItem>
            <SelectItem value="Hot Desk">Hot Desk</SelectItem>
            <SelectItem value="Coworking Space">Coworking Space</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Occupied">Occupied</SelectItem>
            <SelectItem value="Disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Spaces Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSpaces.map((space) => (
          <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    {space.images && space.images.length > 0 ? (
                      <img 
                        src={space.images[0]} 
                        alt={space.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{space.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{space.type}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditSheet(space)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(space.id, space.status)}>
                      {space.status === 'Disabled' ? 'Enable' : 'Disable'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteSpace(space.id, space.name)}
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
                <Badge className={`${getStatusColor(space.status)} flex items-center space-x-1`}>
                  {getStatusIcon(space.status)}
                  <span>{space.status}</span>
                </Badge>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{space.capacity} people</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  {space.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign className="mr-2 h-4 w-4" />
                  {getPriceDisplay(space)}
                </div>
              </div>

              {space.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>
              )}

              {/* Image Gallery */}
              {space.images && space.images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>{space.images.length} image{space.images.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {space.images.slice(0, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${space.name} image ${index + 1}`}
                        className="w-full h-16 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          // You can add a modal or lightbox here to view full image
                          window.open(image, '_blank')
                        }}
                      />
                    ))}
                    {space.images.length > 3 && (
                      <div className="w-full h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-sm text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors">
                        +{space.images.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="flex flex-wrap gap-1">
                {space.amenities.slice(0, 4).map((amenity, index) => {
                  const IconComponent = amenityIcons[amenity] || Zap
                  return (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <IconComponent className="mr-1 h-3 w-3" />
                      {amenity}
                    </Badge>
                  )
                })}
                {space.amenities.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{space.amenities.length - 4} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredSpaces.length} of {spaces.length} spaces
      </div>

      {filteredSpaces.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold">No spaces found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters, or add a new space.
          </p>
        </div>
      )}
    </div>
  )
}