<script setup lang="ts">
import AppButton from './AppButton.vue'
import { computed, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import type { DishForm } from '../admin-types'
import type { DishCategory, ImageAsset } from '../types'

const props = defineProps<{
  visible: boolean
  dishForm: DishForm
  rules: FormRules<DishForm>
  categories: DishCategory[]
  imageAssets: ImageAsset[]
}>()

const formRef = defineModel<FormInstance | undefined>('formRef')
const imagePickerVisible = ref(false)
const visibleImageAssets = computed(() => props.imageAssets)

defineEmits<{
  'update:visible': [value: boolean]
  submit: []
}>()

function selectImage(imageAsset: ImageAsset) {
  props.dishForm.imageUrl = imageAsset.imageUrl
  imagePickerVisible.value = false
}
</script>

<template>
  <el-dialog :model-value="visible" :title="dishForm.id ? '编辑菜品' : '新增菜品'" width="640px" @update:model-value="$emit('update:visible', $event)">
    <el-form ref="formRef" :model="dishForm" :rules="rules" label-width="94px">
      <el-form-item label="菜品名称" prop="name">
        <el-input v-model="dishForm.name" placeholder="例如：经典螺蛳粉" />
      </el-form-item>
      <el-form-item label="短描述" prop="shortDescription">
        <el-input v-model="dishForm.shortDescription" placeholder="卡片上的一句话描述" />
      </el-form-item>
      <el-form-item label="商品分类" prop="categoryId">
        <el-select v-model="dishForm.categoryId" placeholder="请选择商品分类" style="width: 100%">
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
            :disabled="!category.enabled"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="详情描述" prop="description">
        <el-input v-model="dishForm.description" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="图片" prop="imageUrl">
        <div class="dish-image-selector">
          <div class="dish-image-preview-wrap" :class="{ empty: !dishForm.imageUrl }">
            <el-image v-if="dishForm.imageUrl" class="dish-image-preview" :src="dishForm.imageUrl" fit="cover">
              <template #error><div class="gallery-image-error">图片不可用</div></template>
            </el-image>
            <div v-else class="dish-image-empty">
              <el-icon><Picture /></el-icon>
              <span>暂未选择图片</span>
            </div>
          </div>
          <div class="dish-image-actions">
            <AppButton type="primary" plain :icon="Picture" @click="imagePickerVisible = true">
              {{ dishForm.imageUrl ? '更换图片' : '选择图片' }}
            </AppButton>
            <AppButton v-if="dishForm.imageUrl" type="danger" link @click="dishForm.imageUrl = ''">移除图片</AppButton>
            <small>从图库中选择商品展示图片</small>
          </div>
        </div>
      </el-form-item>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="价格" prop="price">
            <el-input-number v-model="dishForm.price" :min="0.01" :precision="2" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="库存" prop="stock">
            <el-input-number v-model="dishForm.stock" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="立即上架">
        <el-switch v-model="dishForm.available" />
      </el-form-item>
    </el-form>
    <template #footer>
      <AppButton @click="$emit('update:visible', false)">取消</AppButton>
      <AppButton type="primary" @click="$emit('submit')">保存</AppButton>
    </template>
  </el-dialog>

  <el-dialog v-model="imagePickerVisible" title="选择图库图片" width="760px">
    <el-empty v-if="!visibleImageAssets.length" description="暂无图库图片，请先到图库管理上传" />
    <div v-else class="image-picker-grid">
      <button
        v-for="asset in visibleImageAssets"
        :key="asset.id"
        type="button"
        class="image-picker-card"
        :class="{ active: dishForm.imageUrl === asset.imageUrl }"
        @click="selectImage(asset)"
      >
        <el-image class="image-picker-thumb" :src="asset.imageUrl" fit="cover">
          <template #error>
            <div class="gallery-image-error">图片不可用</div>
          </template>
        </el-image>
        <strong>{{ asset.name }}</strong>
        <span>{{ asset.folder || '图库根目录' }}</span>
      </button>
    </div>
  </el-dialog>
</template>
