import type { Component } from 'vue'
import type { OrderStatus } from './types'

export type Section = 'dashboard' | 'orders' | 'dishes' | 'gallery' | 'settings' | 'notFound'

export type NavKey =
  | 'home'
  | 'orders'
  | 'goods'
  | 'gallery'
  | 'storeData'
  | 'profit'
  | 'cost'
  | 'members'
  | 'staff'
  | 'stock'
  | 'marketing'
  | 'settings'

export interface NavItem {
  key: NavKey
  section: Section
  path: string
  label: string
  icon: Component
}

export interface DishForm {
  id?: number
  name: string
  description: string
  shortDescription: string
  imageUrl: string
  categoryId?: number
  price: number
  stock: number
  available: boolean
}

export interface StatusMeta {
  label: string
  type: '' | 'success' | 'warning' | 'info' | 'danger'
  next?: OrderStatus
  action?: string
}

export interface StatCard {
  label: string
  value: string
  unit: string
  icon: Component
  color: string
  delta: string
  trend: string
}

export interface StoreRow {
  code: string
  name: string
  area: string
  type: string
  revenue: number
  orders: number
  visitors: number
  avg: number
  efficiency: number
  available: boolean
}

export interface TopOrderItem {
  name: string
  count: number
}

export interface AnomalyCard {
  label: string
  value: string
  icon: Component
  color: string
  line: string
}
