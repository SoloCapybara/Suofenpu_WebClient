<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'

export interface DataListTabItem {
  key: string | number
  label: string
  count?: number
  icon?: Component
}

const props = defineProps<{
  modelValue: string | number
  items: DataListTabItem[]
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const tabsRef = ref<HTMLElement | null>(null)
const indicatorLeft = ref(0)
const indicatorWidth = ref(0)
const indicatorReady = ref(false)

const indicatorStyle = computed(() => ({
  transform: `translate3d(${indicatorLeft.value}px, -50%, 0)`,
  width: `${indicatorWidth.value}px`,
  opacity: indicatorReady.value ? 1 : 0,
}))

function updateIndicator() {
  const wrap = tabsRef.value
  if (!wrap) return

  const active = wrap.querySelector('.data-list-tab.active') as HTMLElement | null
  if (!active) {
    indicatorReady.value = false
    return
  }

  const wrapRect = wrap.getBoundingClientRect()
  const itemRect = active.getBoundingClientRect()
  indicatorLeft.value = Math.round(itemRect.left - wrapRect.left + wrap.scrollLeft)
  indicatorWidth.value = Math.round(itemRect.width)
  indicatorReady.value = true
}

function selectTab(key: string | number) {
  if (key === props.modelValue) return
  emit('update:modelValue', key)
}

watch(
  () => [props.modelValue, props.items.length] as const,
  async () => {
    await nextTick()
    updateIndicator()
  },
)

onMounted(() => {
  nextTick(updateIndicator)
  window.addEventListener('resize', updateIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIndicator)
})
</script>

<template>
  <nav ref="tabsRef" class="data-list-tabs" :aria-label="ariaLabel">
    <div class="data-list-tabs__indicator" :style="indicatorStyle" aria-hidden="true" />
    <button
      v-for="item in items"
      :key="String(item.key)"
      type="button"
      class="data-list-tab"
      :class="{ active: modelValue === item.key }"
      @click="selectTab(item.key)"
    >
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      {{ item.label }}
      <span v-if="item.count !== undefined">{{ item.count }}</span>
    </button>
  </nav>
</template>
