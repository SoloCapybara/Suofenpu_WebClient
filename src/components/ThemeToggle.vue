<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue'

defineProps<{
  darkMode: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    type="button"
    class="theme-toggle top-toolbar-btn--theme"
    :class="{ 'is-dark': darkMode }"
    :aria-label="darkMode ? '切换为浅色模式' : '切换为深色模式'"
    :aria-pressed="darkMode"
    @click="$emit('toggle')"
  >
    <span class="theme-toggle__track">
      <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
        <el-icon><Sunny /></el-icon>
      </span>
      <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
        <el-icon><Moon /></el-icon>
      </span>
      <span class="theme-toggle__thumb" aria-hidden="true">
        <el-icon><Sunny v-if="!darkMode" /><Moon v-else /></el-icon>
      </span>
    </span>
  </button>
</template>
