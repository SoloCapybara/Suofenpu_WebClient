<script setup lang="ts">
function goHome() {
  window.location.hash = '#/'
}
</script>

<template>
  <section class="module-view">
    <el-card class="not-found-card">
      <div class="not-found">
        <strong>404</strong>
        <h2>页面不存在</h2>
        <p>当前页面暂未开放或路径不正确。</p>
        <el-button type="primary" @click="goHome">返回首页</el-button>
      </div>
    </el-card>
  </section>
</template>
