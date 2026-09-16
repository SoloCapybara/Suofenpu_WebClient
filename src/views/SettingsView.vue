<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, Delete, Picture, Plus, Setting } from '@element-plus/icons-vue'
import AppButton from '../components/AppButton.vue'
import DataListTabs from '../components/DataListTabs.vue'
import PageHeading from '../components/PageHeading.vue'
import { AppMessage } from '../components/AppMessage'
import type { HomeBanner } from '../api'
import type { ImageAsset } from '../types'

const props = defineProps<{
  settings: {
    storeName: string
    businessHours: string
    deliveryRange: string
    notice: string
  }
  banners: HomeBanner[]
  imageAssets: ImageAsset[]
}>()

const emit = defineEmits<{
  save: []
  'update:banners': [value: HomeBanner[]]
}>()

const activeTab = ref<'profile' | 'banners'>('profile')
const imagePickerVisible = ref(false)
const pickingBannerIndex = ref<number | null>(null)

const settingsTabItems = computed(() => [
  { key: 'profile' as const, label: '基础信息', icon: Setting },
  { key: 'banners' as const, label: '轮播图设置', count: props.banners.length, icon: Picture },
])

const pageDescription = computed(() => (
  activeTab.value === 'profile'
    ? '配置门店名称、营业时间与配送信息'
    : '从图库选择图片，配置小程序首页轮播展示'
))

const defaultBusinessHours: [string, string] = ['10:00', '22:00']

function parseBusinessHours(value: string): [string, string] {
  const match = value.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/)
  if (!match) return defaultBusinessHours
  return [match[1], match[2]]
}

function updateBusinessHours(start: string, end: string) {
  props.settings.businessHours = `${start} - ${end}`
}

const businessHoursStart = computed({
  get() {
    return parseBusinessHours(props.settings.businessHours)[0]
  },
  set(value: string) {
    if (!value) return
    const end = parseBusinessHours(props.settings.businessHours)[1]
    updateBusinessHours(value, end)
  },
})

const businessHoursEnd = computed({
  get() {
    return parseBusinessHours(props.settings.businessHours)[1]
  },
  set(value: string) {
    if (!value) return
    const start = parseBusinessHours(props.settings.businessHours)[0]
    updateBusinessHours(start, value)
  },
})

function updateBanners(next: HomeBanner[]) {
  emit('update:banners', next)
}

function addBanner() {
  if (props.banners.length >= 6) {
    AppMessage.warning('最多添加 6 张轮播图')
    return
  }
  updateBanners([
    ...props.banners,
    {
      imageUrl: '',
      title: '一碗好粉',
      highlight: '嗦出柳州味',
      badge: '欢迎光临',
      enabled: true,
    },
  ])
}

function removeBanner(index: number) {
  updateBanners(props.banners.filter((_, itemIndex) => itemIndex !== index))
}

function moveBanner(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= props.banners.length) return
  const next = [...props.banners]
  const current = next[index]
  next[index] = next[target]
  next[target] = current
  updateBanners(next)
}

function patchBanner(index: number, patch: Partial<HomeBanner>) {
  updateBanners(props.banners.map((banner, itemIndex) => (itemIndex === index ? { ...banner, ...patch } : banner)))
}

function openImagePicker(index: number) {
  pickingBannerIndex.value = index
  imagePickerVisible.value = true
}

function selectImage(imageAsset: ImageAsset) {
  if (pickingBannerIndex.value == null) return
  patchBanner(pickingBannerIndex.value, { imageUrl: imageAsset.imageUrl })
  imagePickerVisible.value = false
  pickingBannerIndex.value = null
}
</script>

<template>
  <section class="module-view content-scroll-page settings-page">
    <PageHeading title="系统设置" :description="pageDescription">
      <template #actions>
        <AppButton v-if="activeTab === 'banners'" type="primary" plain :icon="Plus" @click="addBanner">添加轮播图</AppButton>
        <AppButton type="primary" @click="$emit('save')">保存设置</AppButton>
      </template>
    </PageHeading>

    <section class="settings-workbench">
      <DataListTabs
        v-model="activeTab"
        class="settings-tabs"
        aria-label="系统设置分类"
        :items="settingsTabItems"
      />

      <div class="settings-panel">
        <div v-if="activeTab === 'profile'" class="settings-panel-section">
          <el-form label-width="100px" class="settings-form">
            <el-form-item label="门店名称"><el-input v-model="settings.storeName" /></el-form-item>
            <el-form-item label="营业时间">
              <div class="business-hours-row">
                <el-time-select
                  v-model="businessHoursStart"
                  start="06:00"
                  step="00:30"
                  end="23:30"
                  placeholder="开始营业"
                  :max-time="businessHoursEnd"
                  :clearable="false"
                />
                <span class="business-hours-separator">至</span>
                <el-time-select
                  v-model="businessHoursEnd"
                  start="06:30"
                  step="00:30"
                  end="24:00"
                  placeholder="结束营业"
                  :min-time="businessHoursStart"
                  :clearable="false"
                />
              </div>
            </el-form-item>
            <el-form-item label="配送范围"><el-input v-model="settings.deliveryRange" /></el-form-item>
            <el-form-item label="门店公告"><el-input v-model="settings.notice" type="textarea" :rows="4" /></el-form-item>
          </el-form>
        </div>

        <div v-else class="settings-panel-section settings-banner-panel">
          <div class="settings-banner-intro">
            <strong>首页轮播图</strong>
            <p>最多 6 张，启用的轮播图会按顺序展示在小程序首页顶部。</p>
          </div>

          <el-empty v-if="!banners.length" description="暂无轮播图，点击右上角添加" />
          <div v-else class="settings-banner-list">
            <article v-for="(banner, index) in banners" :key="`${banner.id || 'new'}-${index}`" class="settings-banner-item">
              <div class="settings-banner-toolbar">
                <strong>轮播 {{ index + 1 }}</strong>
                <div class="settings-banner-toolbar-actions">
                  <el-switch
                    :model-value="banner.enabled"
                    active-text="启用"
                    inactive-text="停用"
                    inline-prompt
                    @update:model-value="patchBanner(index, { enabled: $event })"
                  />
                  <AppButton :icon="ArrowUp" link :disabled="index === 0" @click="moveBanner(index, -1)" />
                  <AppButton :icon="ArrowDown" link :disabled="index === banners.length - 1" @click="moveBanner(index, 1)" />
                  <AppButton type="danger" link :icon="Delete" @click="removeBanner(index)" />
                </div>
              </div>

              <div class="settings-banner-body">
                <div class="dish-image-selector settings-banner-image">
                  <div class="dish-image-preview-wrap" :class="{ empty: !banner.imageUrl }">
                    <el-image v-if="banner.imageUrl" class="dish-image-preview" :src="banner.imageUrl" fit="cover">
                      <template #error><div class="gallery-image-error">图片不可用</div></template>
                    </el-image>
                    <div v-else class="dish-image-empty">
                      <el-icon><Picture /></el-icon>
                      <span>请选择图片</span>
                    </div>
                  </div>
                  <div class="dish-image-actions">
                    <AppButton type="primary" plain :icon="Picture" @click="openImagePicker(index)">
                      {{ banner.imageUrl ? '更换图片' : '从图库选择' }}
                    </AppButton>
                    <AppButton v-if="banner.imageUrl" type="danger" link @click="patchBanner(index, { imageUrl: '' })">移除</AppButton>
                  </div>
                </div>

                <div class="settings-banner-fields">
                  <el-form label-width="72px">
                    <el-form-item label="主标题"><el-input v-model="banner.title" maxlength="80" show-word-limit /></el-form-item>
                    <el-form-item label="强调语"><el-input v-model="banner.highlight" maxlength="80" show-word-limit /></el-form-item>
                    <el-form-item label="角标文案"><el-input v-model="banner.badge" maxlength="120" show-word-limit /></el-form-item>
                  </el-form>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  </section>

  <el-dialog v-model="imagePickerVisible" title="选择图库图片" width="760px" class="settings-image-picker-dialog">
    <el-empty v-if="!imageAssets.length" description="暂无图库图片，请先到图库管理上传" />
    <div v-else class="image-picker-grid">
      <button
        v-for="asset in imageAssets"
        :key="asset.id"
        type="button"
        class="image-picker-card"
        :class="{ active: pickingBannerIndex != null && banners[pickingBannerIndex]?.imageUrl === asset.imageUrl }"
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
