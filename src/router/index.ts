import { defineComponent } from 'vue'
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const RouteHost = defineComponent({
  name: 'RouteHost',
  template: '<span />',
})

export const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: RouteHost,
    meta: { section: 'dashboard', navKey: 'home', title: '首页总览' },
  },
  {
    path: '/orders',
    name: 'orders',
    component: RouteHost,
    meta: { section: 'orders', navKey: 'orders', title: '订单管理' },
  },
  {
    path: '/dishes',
    name: 'dishes',
    component: RouteHost,
    meta: { section: 'dishes', navKey: 'goods', title: '商品管理' },
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: RouteHost,
    meta: { section: 'gallery', navKey: 'gallery', title: '图库管理' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: RouteHost,
    meta: { section: 'settings', navKey: 'settings', title: '系统设置' },
  },
  {
    path: '/storeData',
    name: 'storeDataNotFound',
    component: RouteHost,
    meta: { section: 'notFound', navKey: '', title: '404' },
  },
  {
    path: '/profit',
    name: 'profitNotFound',
    component: RouteHost,
    meta: { section: 'notFound', navKey: '', title: '404' },
  },
  {
    path: '/cost',
    name: 'costNotFound',
    component: RouteHost,
    meta: { section: 'notFound', navKey: '', title: '404' },
  },
  {
    path: '/members',
    name: 'membersNotFound',
    component: RouteHost,
    meta: { section: 'notFound', navKey: '', title: '404' },
  },
  {
    path: '/staff',
    name: 'staffNotFound',
    component: RouteHost,
    meta: { section: 'notFound', navKey: '', title: '404' },
  },
  {
    path: '/stock',
    name: 'stockNotFound',
    component: RouteHost,
    meta: { section: 'notFound', navKey: '', title: '404' },
  },
  {
    path: '/marketing',
    name: 'marketingNotFound',
    component: RouteHost,
    meta: { section: 'notFound', navKey: '', title: '404' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: RouteHost,
    meta: { section: 'notFound', navKey: '', title: '404' },
  },
] satisfies RouteRecordRaw[]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
