<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { subscribeRouteProgress } from '../utils/route-progress'

const progress = ref(0)
const visible = ref(false)
const finishing = ref(false)

const unsubscribe = subscribeRouteProgress(({ progress: value, visible: show }) => {
  if (show && value >= 100) {
    finishing.value = true
  } else if (!show) {
    finishing.value = false
  }
  progress.value = value
  visible.value = show
})

onBeforeUnmount(unsubscribe)
</script>

<template>
  <div
    class="route-progress"
    :class="{ active: visible, finishing }"
    aria-hidden="true"
  >
    <div class="route-progress__bar" :style="{ transform: `scaleX(${progress / 100})` }" />
  </div>
</template>
