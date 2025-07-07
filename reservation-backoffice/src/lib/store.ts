import { create } from 'zustand'
import type { User } from '@/types/index.ts'
import type { Reservation } from '@/types/index'

interface DashboardState {
  sidebarOpen: boolean
  currentUser: User | null
  reservations: Reservation[]
  setSidebarOpen: (open: boolean) => void
  setCurrentUser: (user: User | null) => void
  setReservations: (reservations: Reservation[]) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarOpen: true,
  currentUser: null,
  reservations: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setReservations: (reservations) => set({ reservations }),
}))