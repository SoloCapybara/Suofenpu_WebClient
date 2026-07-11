<script setup lang="ts">
defineProps<{
  title: string
  settings: {
    storeName: string
    businessHours: string
    deliveryRange: string
    notice: string
  }
}>()

defineEmits<{
  save: []
}>()
</script>

<template>
  <section class="module-view">
    <el-card>
      <template #header>
        <div class="panel-title">
          <strong>{{ title }}</strong>
          <el-button type="primary" @click="$emit('save')">保存设置</el-button>
        </div>
      </template>
      <el-form label-width="100px" class="settings-form">
        <el-form-item label="门店名称"><el-input v-model="settings.storeName" /></el-form-item>
        <el-form-item label="营业时间"><el-input v-model="settings.businessHours" /></el-form-item>
        <el-form-item label="配送范围"><el-input v-model="settings.deliveryRange" /></el-form-item>
        <el-form-item label="门店公告"><el-input v-model="settings.notice" type="textarea" :rows="4" /></el-form-item>
      </el-form>
    </el-card>
  </section>
</template>
