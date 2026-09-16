<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'order' | 'product' | 'category' | 'user' | 'gallery' | 'default'
  title: string
  description?: string
  compact?: boolean
}>(), {
  variant: 'default',
  compact: false,
})

const imageSrc = computed(() => ({
  order: '/images/empty/order.svg',
  product: '/images/empty/product.svg',
  category: '/images/empty/category.svg',
  user: '/images/empty/user.svg',
  gallery: '/images/empty/gallery.svg',
  default: '/images/empty/default.svg',
}[props.variant]))
</script>

<template>
  <div class="list-empty-state" :class="{ compact }">
    <img class="list-empty-state__image" :src="imageSrc" :alt="title" />
    <strong class="list-empty-state__title">{{ title }}</strong>
    <span v-if="description" class="list-empty-state__desc">{{ description }}</span>
  </div>
</template>
