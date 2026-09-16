<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'

defineProps<{
  label: string
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button type="button" class="panel-nav-link" @click="$emit('click')">
    <span class="panel-nav-link__label">{{ label }}</span>
    <el-icon class="panel-nav-link__icon"><ArrowRight /></el-icon>
  </button>
</template>
