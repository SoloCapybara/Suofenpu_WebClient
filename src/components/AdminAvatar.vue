<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  displayName: string
  avatarUrl?: string | null
  size?: number
  variant?: 'topbar' | 'dropdown' | 'profile' | 'table'
}>(), {
  size: 38,
  variant: 'table',
})

const initials = computed(() => props.displayName.trim().slice(0, 1) || '管')
const resolvedUrl = computed(() => props.avatarUrl?.trim() || undefined)
</script>

<template>
  <el-avatar
    :size="size"
    :src="resolvedUrl"
    shape="square"
    class="admin-avatar"
    :class="`admin-avatar--${variant}`"
  >
    {{ initials }}
  </el-avatar>
</template>
