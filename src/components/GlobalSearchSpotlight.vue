<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
  clear: []
}>()

const triggerRef = ref<HTMLElement | null>(null)
const inputRef = ref<{ focus: () => void }>()
const open = ref(false)
const expanded = ref(false)
const originVars = ref<Record<string, string>>({})

function measureOrigin() {
  const rect = triggerRef.value?.getBoundingClientRect()
  if (!rect) return
  originVars.value = {
    '--spotlight-from-x': `${rect.left + rect.width / 2}px`,
    '--spotlight-from-y': `${rect.top + rect.height / 2}px`,
    '--spotlight-from-w': `${rect.width}px`,
    '--spotlight-from-h': `${rect.height}px`,
  }
}

async function openSpotlight() {
  if (open.value) return
  measureOrigin()
  open.value = true
  document.body.classList.add('search-spotlight-open')
  await nextTick()
  requestAnimationFrame(() => {
    expanded.value = true
  })
  await nextTick()
  inputRef.value?.focus()
}

function closeSpotlight() {
  if (!open.value) return
  expanded.value = false
  window.setTimeout(() => {
    open.value = false
    document.body.classList.remove('search-spotlight-open')
  }, 280)
}

function handleSearch() {
  if (!props.modelValue.trim()) return
  emit('search')
  closeSpotlight()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSpotlight()
  }
}

function onGlobalKeydown(event: KeyboardEvent) {
  const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
  if (!isShortcut) return
  event.preventDefault()
  if (open.value) {
    closeSpotlight()
  } else {
    void openSpotlight()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.body.classList.remove('search-spotlight-open')
})
</script>

<template>
  <div ref="triggerRef" class="top-search">
    <button type="button" class="top-search-trigger" @click="openSpotlight">
      <el-icon class="top-search-trigger__icon"><Search /></el-icon>
      <span class="top-search-trigger__text" :class="{ filled: modelValue }">
        {{ modelValue || '搜索订单、商品，回车跳转' }}
      </span>
    </button>
  </div>

  <Teleport to="body">
    <div
      v-if="open"
      class="search-spotlight"
      :class="{ expanded }"
      :style="originVars"
      @keydown="onKeydown"
    >
      <button type="button" class="search-spotlight__backdrop" aria-label="关闭搜索" @click="closeSpotlight" />

      <div class="search-spotlight__panel" role="dialog" aria-modal="true" aria-label="全局搜索">
        <el-input
          ref="inputRef"
          :model-value="modelValue"
          placeholder="搜索订单、商品，回车跳转"
          :prefix-icon="Search"
          clearable
          size="large"
          class="search-spotlight__input"
          @update:model-value="emit('update:modelValue', $event)"
          @keyup.enter="handleSearch"
          @clear="emit('clear')"
        />
        <p class="search-spotlight__hint">支持订单号、手机号、商品名称 · Enter 跳转 · Esc 关闭 · Ctrl/⌘K 唤起</p>
      </div>
    </div>
  </Teleport>
</template>
