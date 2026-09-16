<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    class="store-status-chip"
    :class="{ open: modelValue }"
    :aria-pressed="modelValue"
    aria-label="切换门店营业状态"
    @click="toggle"
  >
    <span class="store-status-chip__accent" aria-hidden="true"></span>
    <span class="store-status-chip__dot-wrap" aria-hidden="true">
      <span class="store-status-chip__dot"></span>
    </span>
    <span class="store-status-chip__label">
      <span class="store-status-chip__text" :class="{ 'is-active': modelValue }">营业中</span>
      <span class="store-status-chip__text" :class="{ 'is-active': !modelValue }">已打烊</span>
    </span>
  </button>
</template>
