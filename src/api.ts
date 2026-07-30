import axios from 'axios'
import type { CustomerAccount, Dish, DishCategory, DishCategoryPayload, DishPayload, EmployeeAccount, GalleryResponse, ImageAsset, ImageFolder, Order, OrderStatus } from './types'
import { clearAdminSession, getAdminToken, type AdminProfile, type AdminSession } from './auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !String(error.config?.url || '').includes('/admin-auth/login')) {
      clearAdminSession()
      if (window.location.hash !== '#/login') window.location.hash = '#/login'
    }
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  },
)

export async function loginAdmin(username: string, password: string, remember: boolean) {
  const response = await http.post<AdminSession>('/admin-auth/login', { username, password, remember })
  return response.data
}

export async function getCurrentAdmin() {
  const response = await http.get<AdminProfile>('/admin-auth/me')
  return response.data
}

export async function logoutAdmin() {
  await http.post('/admin-auth/logout')
}

export async function updateAdminProfile(displayName: string) {
  const response = await http.patch<AdminProfile>('/admin-auth/me', { displayName })
  return response.data
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  await http.post('/admin-auth/change-password', { currentPassword, newPassword })
}

export async function listEmployeeAccounts() {
  return (await http.get<EmployeeAccount[]>('/admin/user-management/employees')).data
}

export async function createEmployeeAccount(payload: { username: string; displayName: string; password: string; role: string }) {
  return (await http.post<EmployeeAccount>('/admin/user-management/employees', payload)).data
}

export async function updateEmployeeAccount(id: number, payload: { displayName?: string; role?: string; enabled?: boolean }) {
  return (await http.patch<EmployeeAccount>(`/admin/user-management/employees/${id}`, payload)).data
}

export async function resetEmployeePassword(id: number, password: string) {
  await http.post(`/admin/user-management/employees/${id}/reset-password`, { password })
}

export async function listCustomerAccounts() {
  return (await http.get<CustomerAccount[]>('/admin/user-management/customers')).data
}

export async function updateCustomerAccountStatus(id: number, status: 'ACTIVE' | 'DISABLED') {
  return (await http.patch<CustomerAccount>(`/admin/user-management/customers/${id}/status`, { status })).data
}

export async function listOrders(status?: OrderStatus | '') {
  const response = await http.get<Order[]>('/admin/orders', {
    params: status ? { status } : undefined,
  })
  return response.data
}

export async function updateOrderStatus(orderNo: string, status: OrderStatus) {
  const response = await http.patch<Order>(`/admin/orders/${orderNo}/status`, { status })
  return response.data
}

export async function listDishes() {
  const response = await http.get<Dish[]>('/admin/dishes')
  return response.data
}

export async function listDishCategories() {
  const response = await http.get<DishCategory[]>('/admin/dish-categories')
  return response.data
}

export async function createDishCategory(payload: Required<DishCategoryPayload>) {
  const response = await http.post<DishCategory>('/admin/dish-categories', payload)
  return response.data
}

export async function updateDishCategory(id: number, payload: DishCategoryPayload) {
  const response = await http.patch<DishCategory>(`/admin/dish-categories/${id}`, payload)
  return response.data
}

export async function deleteDishCategory(id: number) {
  await http.delete(`/admin/dish-categories/${id}`)
}

export async function createDish(payload: Required<DishPayload>) {
  const response = await http.post<Dish>('/admin/dishes', payload)
  return response.data
}

export async function updateDish(id: number, payload: DishPayload) {
  const response = await http.patch<Dish>(`/admin/dishes/${id}`, payload)
  return response.data
}

export async function deleteDish(id: number) {
  await http.delete(`/admin/dishes/${id}`)
}

export async function listImageAssets() {
  const response = await http.get<GalleryResponse>('/admin/image-assets')
  return response.data
}

export async function createImageFolder(path: string) {
  const response = await http.post<ImageFolder>('/admin/image-folders', { path })
  return response.data
}

export async function uploadImageAsset(folder: string, file: File) {
  const formData = new FormData()
  formData.append('folder', folder)
  formData.append('file', file)
  const response = await http.post<ImageAsset>('/admin/image-assets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function deleteImageAsset(id: string) {
  await http.delete('/admin/image-assets', { params: { id } })
}
