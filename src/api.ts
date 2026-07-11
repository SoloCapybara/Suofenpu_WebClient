import axios from 'axios'
import type { Dish, DishCategory, DishCategoryPayload, DishPayload, GalleryResponse, ImageAsset, ImageFolder, Order, OrderStatus } from './types'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  },
)

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
