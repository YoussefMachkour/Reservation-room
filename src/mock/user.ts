import type { User, UserRole } from '../types/auth';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@company.com',
    role: 'user',
    phone: '+1-555-123-4567',
    profile_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: '2024-01-15T09:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-002',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@company.com',
    role: 'manager',
    phone: '+1-555-987-6543',
    profile_picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    department: 'Product Management',
    position: 'Product Manager',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: '2024-01-10T09:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-003',
    first_name: 'Alex',
    last_name: 'Johnson',
    email: 'alex.johnson@company.com',
    role: 'admin',
    phone: '+1-555-456-7890',
    profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    department: 'IT Administration',
    position: 'IT Director',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: '2024-01-05T09:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-004',
    first_name: 'Sarah',
    last_name: 'Williams',
    email: 'sarah.williams@company.com',
    role: 'user',
    phone: '+1-555-234-5678',
    profile_picture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    department: 'Design',
    position: 'UX Designer',
    is_active: true,
    last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    created_at: '2024-01-20T09:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-005',
    first_name: 'Michael',
    last_name: 'Brown',
    email: 'michael.brown@company.com',
    role: 'user',
    phone: '+1-555-345-6789',
    profile_picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    department: 'Marketing',
    position: 'Marketing Specialist',
    is_active: true,
    last_login_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    created_at: '2024-01-25T09:00:00Z',
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-006',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@company.com',
    role: 'manager',
    phone: '+1-555-456-7890',
    profile_picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    department: 'Human Resources',
    position: 'HR Manager',
    is_active: true,
    last_login_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    created_at: '2024-01-12T09:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-007',
    first_name: 'David',
    last_name: 'Wilson',
    email: 'david.wilson@company.com',
    role: 'user',
    phone: '+1-555-567-8901',
    profile_picture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=face',
    department: 'Sales',
    position: 'Sales Representative',
    is_active: false, // Inactive user
    last_login_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    created_at: '2024-01-08T09:00:00Z',
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-008',
    first_name: 'Lisa',
    last_name: 'Garcia',
    email: 'lisa.garcia@company.com',
    role: 'user',
    phone: '+1-555-678-9012',
    profile_picture: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    department: 'Finance',
    position: 'Financial Analyst',
    is_active: true,
    last_login_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    created_at: '2024-01-30T09:00:00Z',
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
];

// Helper functions for working with mock users

// Get user by ID
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

// Get users by role
export const getUsersByRole = (role: UserRole): User[] => {
  return mockUsers.filter(user => user.role === role);
};

// Get active users
export const getActiveUsers = (): User[] => {
  return mockUsers.filter(user => user.is_active);
};

// Get users by department
export const getUsersByDepartment = (department: string): User[] => {
  return mockUsers.filter(user => 
    user.department?.toLowerCase().includes(department.toLowerCase())
  );
};

// Get recently active users (logged in within last 24 hours)
export const getRecentlyActiveUsers = (): User[] => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return mockUsers.filter(user => 
    user.last_login_at && new Date(user.last_login_at) > oneDayAgo
  );
};

// Get user full name
export const getUserFullName = (user: User): string => {
  return `${user.first_name} ${user.last_name}`;
};

// Get user initials
export const getUserInitials = (user: User): string => {
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
};

// Search users by name or email
export const searchUsers = (query: string): User[] => {
  const searchTerm = query.toLowerCase();
  return mockUsers.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm) ||
    user.last_name.toLowerCase().includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm) ||
    (user.department && user.department.toLowerCase().includes(searchTerm)) ||
    (user.position && user.position.toLowerCase().includes(searchTerm))
  );
};

// Get managers
export const getManagers = (): User[] => {
  return getUsersByRole('manager');
};

// Get admins
export const getAdmins = (): User[] => {
  return getUsersByRole('admin');
};

// Get standard users
export const getStandardUsers = (): User[] => {
  return getUsersByRole('user');
};

// Check if user can manage spaces (admin or manager)
export const canUserManageSpaces = (user: User): boolean => {
  return user.role === 'admin' || user.role === 'manager';
};

// Get user's current login status
export const getUserLoginStatus = (user: User): 'online' | 'recent' | 'away' => {
  if (!user.last_login_at) return 'away';
  
  const lastLogin = new Date(user.last_login_at);
  const now = new Date();
  const minutesAgo = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
  
  if (minutesAgo < 30) return 'online';
  if (minutesAgo < 60 * 24) return 'recent'; // Within 24 hours
  return 'away';
};

export default mockUsers;