<script setup lang="ts">
import { ArrowDown, Bowl, Refresh, Search, Shop } from '@element-plus/icons-vue'
import type { NavItem, NavKey } from '../admin-types'

defineProps<{
  activeNav: NavKey | ''
  navItems: readonly NavItem[]
  storeOpen: boolean
}>()

defineEmits<{
  selectNav: [key: string]
  refresh: []
  'update:storeOpen': [value: boolean]
}>()
</script>

<template>
  <el-container class="admin-shell">
    <el-aside width="236px" class="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <Bowl />
        </div>
        <strong>粉店经营后台</strong>
      </div>

      <el-menu :default-active="activeNav" class="side-menu" @select="$emit('selectNav', $event)">
        <el-menu-item v-for="item in navItems" :key="item.key" :index="item.key">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>

      <div class="version-card">
        <div class="version-art"><Shop /></div>
        <strong>版本 1.0.0</strong>
        <span>数据实时更新中</span>
      </div>
    </el-aside>

    <el-container class="main-panel">
      <el-header class="topbar">
        <div class="top-search">
          <el-input placeholder="搜索订单、商品、会员..." :prefix-icon="Search" />
        </div>
        <div class="top-actions">
          <el-switch
            :model-value="storeOpen"
            inline-prompt
            active-text="营业"
            inactive-text="打烊"
            @update:model-value="$emit('update:storeOpen', Boolean($event))"
          />
          <el-button :icon="Refresh" @click="$emit('refresh')">刷新</el-button>
          <div class="admin-user">
            <div class="avatar">张</div>
            <div>
              <strong>店长张三</strong>
              <span>管理员</span>
            </div>
            <el-icon><ArrowDown /></el-icon>
          </div>
        </div>
      </el-header>

      <el-main class="content">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>
