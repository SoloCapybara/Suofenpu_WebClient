import type { Dish, Order } from '../types'

export type GlobalSearchTarget = '/orders' | '/dishes'

function includesKeyword(value: string | undefined, keyword: string) {
  return value?.toLowerCase().includes(keyword.toLowerCase()) ?? false
}

export function orderMatchesKeyword(order: Order, keyword: string) {
  const q = keyword.trim()
  if (!q) return true
  return [
    order.orderNo,
    order.phone,
    order.address,
    order.customerName,
    order.orderRemark,
    ...order.items.flatMap((item) => [item.dishName, item.spec, item.itemRemark]),
  ].some((value) => includesKeyword(value, q))
}

export function dishMatchesKeyword(dish: Dish, keyword: string) {
  const q = keyword.trim()
  if (!q) return true
  return [
    dish.name,
    dish.shortDescription,
    dish.description,
    dish.categoryName,
    String(dish.id),
  ].some((value) => includesKeyword(value, q))
}

export function resolveGlobalSearchTarget(
  keyword: string,
  orders: Order[],
  dishes: Dish[],
): GlobalSearchTarget | null {
  const q = keyword.trim()
  if (!q) return null

  const orderMatches = orders.filter((order) => orderMatchesKeyword(order, q))
  const dishMatches = dishes.filter((dish) => dishMatchesKeyword(dish, q))

  if (orderMatches.length === 0 && dishMatches.length === 0) return null

  const exactOrder = orders.some((order) => order.orderNo.toLowerCase() === q.toLowerCase())
  if (exactOrder) return '/orders'

  if (/^sf/i.test(q) && orderMatches.length > 0) return '/orders'
  if (/^\d{3,}$/.test(q) && orderMatches.length > 0) return '/orders'

  if (orderMatches.length > 0 && dishMatches.length === 0) return '/orders'
  if (dishMatches.length > 0 && orderMatches.length === 0) return '/dishes'

  return orderMatches.length >= dishMatches.length ? '/orders' : '/dishes'
}
