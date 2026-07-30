import type { Component } from 'vue'
import type { OrderStatus } from './types'

export type Section = 'dashboard' | 'orders' | 'dishes' | 'gallery' | 'users' | 'settings' | 'profile' | 'notFound'

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
  | 'users'

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
}

export interface TopOrderItem {
  name: string
  count: number
}
