export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface Dish {
  id: number
  name: string
  description: string
  shortDescription: string
  price: number
  imageUrl: string
  stock: number
  available: boolean
  categoryId: number
  categoryCode: string
  categoryName: string
  categorySortOrder: number
}

export interface DishPayload {
  name?: string
  description?: string
  shortDescription?: string
  imageUrl?: string
  categoryId?: number
  price?: number
  stock?: number
  available?: boolean
}

export interface DishCategory {
  id: number
  code: string
  name: string
  iconUrl: string
  sortOrder: number
  enabled: boolean
}

export interface DishCategoryPayload {
  code?: string
  name?: string
  iconUrl?: string
  sortOrder?: number
  enabled?: boolean
}

export interface ImageAsset {
  id: string
  folder: string
  name: string
  fileName: string
  imageUrl: string
  size: number
  width?: number
  height?: number
  updatedAt: string
}

export interface ImageFolder {
  path: string
  name: string
  imageCount: number
}

export interface GalleryResponse {
  rootDir: string
  publicPrefix: string
  maxStorageBytes: number
  usedStorageBytes: number
  remainingStorageBytes: number
  maxFileBytes: number
  folders: ImageFolder[]
  images: ImageAsset[]
}

export interface OrderItem {
  dishId: number
  dishName: string
  spec: string
  spice: string
  tableware: string
  itemRemark?: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface Order {
  orderNo: string
  userId?: number
  customerName?: string
  phone: string
  address: string
  deliveryTime: string
  invoiceType: string
  orderRemark?: string
  couponId: string
  subtotal: number
  packingFee: number
  deliveryFee: number
  couponDiscount: number
  totalAmount: number
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
}

export interface EmployeeAccount {
  id: number
  username: string
  displayName: string
  role: 'OWNER' | 'MANAGER' | 'STAFF'
  enabled: boolean
  createdAt: string
}

export interface CustomerAccount {
  id: number
  nickname?: string
  phone?: string
  avatarUrl?: string
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
}
