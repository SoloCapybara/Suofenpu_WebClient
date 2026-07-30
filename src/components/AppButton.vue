<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'text' | 'icon'
  tone?: 'default' | 'brand' | 'danger' | 'warning' | 'success'
  type?: '' | 'primary' | 'danger' | 'warning' | 'success' | 'info'
  plain?: boolean
  link?: boolean
  circle?: boolean
}>(), {
  variant: undefined,
  tone: undefined,
  type: '',
  plain: false,
  link: false,
  circle: false,
})

const attrs = useAttrs()
const resolvedTone = computed(() => props.tone || ({
  primary: 'brand', danger: 'danger', warning: 'warning', success: 'success', info: 'default',
} as const)[props.type || 'info'])
const resolvedVariant = computed(() => {
  if (props.variant) return props.variant
  if (props.circle) return 'icon'
  if (props.link) return 'text'
  if (props.type === 'primary' && !props.plain) return 'primary'
  return 'secondary'
})
</script>

<template>
  <el-button
    v-bind="attrs"
    class="app-button"
    :class="[`app-button--${resolvedVariant}`, `app-button--${resolvedTone}`]"
    :circle="resolvedVariant === 'icon'"
    :link="resolvedVariant === 'text'"
  >
    <slot />
  </el-button>
</template>
