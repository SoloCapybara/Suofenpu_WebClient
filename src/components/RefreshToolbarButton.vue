<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'

defineProps<{
  loading?: boolean
}>()

defineEmits<{
  refresh: []
}>()
</script>

<template>
  <button
    type="button"
    class="refresh-toolbar-btn"
    :class="{ 'is-loading': loading }"
    :disabled="loading"
    aria-label="刷新数据"
    @click="$emit('refresh')"
  >
    <el-icon class="refresh-toolbar-btn__icon"><Refresh /></el-icon>
  </button>
</template>
