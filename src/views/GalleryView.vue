<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  Delete,
  Folder,
  FolderAdd,
  FolderOpened,
  Grid,
  List,
  Picture,
  Refresh,
  Search,
  Sort,
  Upload,
  UploadFilled,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { GalleryResponse, ImageAsset } from '../types'

const props = defineProps<{
  gallery: GalleryResponse
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
  createFolder: [path: string]
  upload: [folder: string, file: File]
  delete: [imageAsset: ImageAsset]
  deleteMany: [imageAssets: ImageAsset[]]
}>()

const activeFolder = ref('')
const fileInput = ref<HTMLInputElement>()
const folderDialogVisible = ref(false)
const previewImage = ref<ImageAsset>()
const folderForm = reactive({ name: '' })
const keyword = ref('')
const sortMode = ref('nameAsc')
const selectedIds = ref<string[]>([])
const dragging = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const viewMode = ref<'grid' | 'list'>('grid')

const allFolderItems = computed(() => props.gallery.folders.filter((item) => item.path))
const folderItems = computed(() => allFolderItems.value.filter((item) => parentFolderPath(item.path) === activeFolder.value))
const currentFolderName = computed(() => activeFolder.value || '全部图片')
const currentFolderLabel = computed(() => folderDisplayName(activeFolder.value) || '全部图片')
const storagePercent = computed(() => {
  const maxStorageBytes = Number(props.gallery.maxStorageBytes || 0)
  const usedStorageBytes = Number(props.gallery.usedStorageBytes || 0)
  if (!maxStorageBytes) return 0
  return Math.min(100, Math.round((usedStorageBytes / maxStorageBytes) * 1000) / 10)
})
const todayUploadCount = computed(() => {
  const today = new Date().toDateString()
  return props.gallery.images.filter((image) => new Date(image.updatedAt).toDateString() === today).length
})
const displayedImages = computed(() => {
  const term = keyword.value.trim().toLowerCase()
  const images = props.gallery.images
    .filter((image) => !activeFolder.value || image.folder === activeFolder.value)
    .filter((image) => {
      if (!term) return true
      return image.fileName.toLowerCase().includes(term) || image.folder.toLowerCase().includes(term)
    })
  return [...images].sort((a, b) => {
    if (sortMode.value === 'timeDesc') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    if (sortMode.value === 'sizeDesc') return b.size - a.size
    return a.fileName.localeCompare(b.fileName, 'zh-CN')
  })
})
const pagedImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return displayedImages.value.slice(start, start + pageSize.value)
})
const selectedImages = computed(() => displayedImages.value.filter((image) => selectedIds.value.includes(image.id)))
const selectedPagedImages = computed(() => pagedImages.value.filter((image) => selectedIds.value.includes(image.id)))

watch(
  () => [activeFolder.value, keyword.value, sortMode.value],
  () => {
    selectedIds.value = []
    currentPage.value = 1
  },
)

watch(
  () => displayedImages.value.length,
  (total) => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize.value))
    if (currentPage.value > maxPage) currentPage.value = maxPage
  },
)

function openCreateFolder() {
  folderForm.name = ''
  folderDialogVisible.value = true
}

function submitFolder() {
  const name = folderForm.name.trim()
  if (!name) return
  if (name.includes('/') || name.includes('\\')) {
    ElMessage.warning('文件夹名称不能包含斜杠')
    return
  }
  const path = activeFolder.value ? `${activeFolder.value}/${name}` : name
  emit('createFolder', path)
  folderDialogVisible.value = false
}

function parentFolderPath(path: string) {
  const index = path.lastIndexOf('/')
  return index < 0 ? '' : path.slice(0, index)
}

function folderDisplayName(path: string) {
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] || ''
}

function playFolderSound(direction: 'open' | 'back' = 'open') {
  const legacyWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext }
  const AudioContextConstructor = window.AudioContext || legacyWindow.webkitAudioContext
  if (!AudioContextConstructor) return

  const context = new AudioContextConstructor()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const now = context.currentTime
  const startFrequency = direction === 'open' ? 520 : 430
  const endFrequency = direction === 'open' ? 760 : 330

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(startFrequency, now)
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + 0.11)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.16)
  oscillator.addEventListener('ended', () => context.close())
}

function selectFolder(path: string) {
  if (activeFolder.value === path) return
  activeFolder.value = path
  playFolderSound('open')
}

function goToParentFolder() {
  activeFolder.value = parentFolderPath(activeFolder.value)
  playFolderSound('back')
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = [...(input.files || [])]
  input.value = ''
  uploadFiles(files)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  uploadFiles([...(event.dataTransfer?.files || [])])
}

function uploadFiles(files: File[]) {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))
  if (!imageFiles.length) {
    ElMessage.warning('请选择图片文件')
    return
  }
  const oversized = imageFiles.find((file) => file.size > props.gallery.maxFileBytes)
  if (oversized) {
    ElMessage.warning(`单张图片不能超过 ${sizeText(props.gallery.maxFileBytes)}`)
    return
  }
  imageFiles.forEach((file) => emit('upload', activeFolder.value, file))
}

function toggleSelect(image: ImageAsset, selected: boolean) {
  if (selected) {
    selectedIds.value = [...new Set([...selectedIds.value, image.id])]
  } else {
    selectedIds.value = selectedIds.value.filter((id) => id !== image.id)
  }
}

function toggleSelectAll(selected: boolean) {
  selectedIds.value = selected ? pagedImages.value.map((image) => image.id) : []
}

function batchDelete() {
  if (!selectedImages.value.length) return
  emit('deleteMany', selectedImages.value)
  selectedIds.value = []
}

async function copyImageUrl(image: ImageAsset) {
  await navigator.clipboard.writeText(image.imageUrl)
  ElMessage.success('图片地址已复制')
}

function sizeText(size: number) {
  if (!Number.isFinite(size) || size < 0) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function dateText(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <section class="gallery-page">
    <header class="gallery-topbar">
      <div>
        <h1>图库管理</h1>
        <p>当前位置：全部图片 / {{ currentFolderName }}</p>
      </div>
      <div class="gallery-toolbar">
        <el-input v-model="keyword" :prefix-icon="Search" placeholder="搜索文件名" clearable />
        <el-select v-model="sortMode" class="gallery-sort">
          <template #prefix><el-icon><Sort /></el-icon></template>
          <el-option label="默认排序" value="nameAsc" />
          <el-option label="最新上传" value="timeDesc" />
          <el-option label="文件最大" value="sizeDesc" />
        </el-select>
        <el-button type="primary" :icon="Upload" @click="triggerFileInput">上传图片</el-button>
        <el-button :icon="Refresh" :loading="loading" @click="$emit('refresh')">刷新</el-button>
        <input ref="fileInput" class="hidden-file-input" type="file" accept="image/*" multiple @change="onFileChange" />
      </div>
    </header>

    <div class="gallery-manager">
      <aside class="gallery-sidebar">
        <div class="gallery-sidebar-title">
          <div class="gallery-sidebar-heading">
            <span><el-icon><FolderOpened /></el-icon></span>
            <div>
              <strong>文件目录</strong>
              <small>{{ allFolderItems.length }} 个文件夹</small>
            </div>
          </div>
          <el-button class="gallery-sidebar-add" type="primary" plain :icon="FolderAdd" @click="openCreateFolder">新建</el-button>
        </div>
        <div class="gallery-folder-scroll">
          <button class="gallery-tree-item" :class="{ active: activeFolder === '' }" type="button" @click="selectFolder('')">
            <span class="gallery-folder-icon all"><el-icon><Picture /></el-icon></span>
            <span>全部图片</span>
            <b>{{ gallery.images.length }}</b>
          </button>
          <button v-if="activeFolder" class="gallery-tree-back" type="button" @click="goToParentFolder">
            <span>←</span> 返回上一级
          </button>
          <div v-if="activeFolder" class="gallery-current-folder">
            <span class="gallery-folder-icon"><el-icon><FolderOpened /></el-icon></span>
            <div><small>当前文件夹</small><strong>{{ currentFolderLabel }}</strong></div>
          </div>
          <button
            v-for="folder in folderItems"
            :key="folder.path"
            class="gallery-tree-item"
            :class="{ active: activeFolder === folder.path }"
            type="button"
            @click="selectFolder(folder.path)"
          >
            <span class="gallery-folder-icon"><el-icon><FolderOpened v-if="activeFolder === folder.path" /><Folder v-else /></el-icon></span>
            <span>{{ folderDisplayName(folder.path) }}</span>
            <b>{{ folder.imageCount }}</b>
          </button>
          <button v-if="!folderItems.length" class="gallery-folder-empty" type="button" @click="openCreateFolder">
            <span class="gallery-folder-empty-icon"><el-icon><FolderAdd /></el-icon></span>
            <strong>{{ activeFolder ? '新建子文件夹' : '新建第一个文件夹' }}</strong>
            <small>{{ activeFolder ? `创建在「${currentFolderLabel}」中` : '按商品或用途整理图片' }}</small>
          </button>
        </div>

        <div class="gallery-storage-card">
          <strong>存储空间</strong>
          <span>已使用 {{ sizeText(gallery.usedStorageBytes) }} / {{ sizeText(gallery.maxStorageBytes) }}</span>
          <el-progress :percentage="storagePercent" :show-text="false" />
          <small>{{ storagePercent }}%</small>
        </div>
      </aside>

      <main class="gallery-content-card">
        <div class="gallery-breadcrumb">
          <strong>全部图片</strong>
          <span>/</span>
          <b>{{ currentFolderName }}</b>
        </div>

        <div class="gallery-stat-grid">
          <div class="gallery-stat-card blue">
            <el-icon><Picture /></el-icon>
            <span>图片总数</span>
            <strong>{{ gallery.images.length }}</strong>
          </div>
          <div class="gallery-stat-card orange">
            <el-icon><Folder /></el-icon>
            <span>文件夹总数</span>
            <strong>{{ allFolderItems.length }}</strong>
          </div>
          <div class="gallery-stat-card green">
            <el-icon><Grid /></el-icon>
            <span>已使用空间</span>
            <strong>{{ sizeText(gallery.usedStorageBytes) }}</strong>
          </div>
          <div class="gallery-stat-card purple">
            <el-icon><UploadFilled /></el-icon>
            <span>今日上传</span>
            <strong>{{ todayUploadCount }}</strong>
          </div>
        </div>

        <div
          class="gallery-dropzone"
          :class="{ active: dragging }"
          @click="triggerFileInput"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <el-icon><UploadFilled /></el-icon>
          <span>点击上传或将图片拖拽到此处，支持 JPG、PNG、WEBP、GIF，单个文件不超过 {{ sizeText(gallery.maxFileBytes) }}</span>
        </div>

        <div class="gallery-action-row">
          <div class="gallery-selection-summary">
            <el-checkbox
              :model-value="selectedPagedImages.length > 0 && selectedPagedImages.length === pagedImages.length"
              @change="(value: string | number | boolean) => toggleSelectAll(Boolean(value))"
            />
            <div>
              <strong>{{ selectedImages.length ? `已选择 ${selectedImages.length} 项` : '选择当前页' }}</strong>
              <span>当前文件夹共 {{ displayedImages.length }} 项</span>
            </div>
          </div>
          <div class="gallery-action-buttons">
            <el-button
              class="gallery-batch-delete"
              type="danger"
              plain
              :icon="Delete"
              :disabled="!selectedImages.length"
              @click="batchDelete"
            >
              {{ selectedImages.length ? `删除选中（${selectedImages.length}）` : '删除选中' }}
            </el-button>
            <span class="gallery-action-divider" />
            <div class="gallery-view-switch" aria-label="切换查看方式">
              <button type="button" :class="{ active: viewMode === 'grid' }" title="宫格视图" @click="viewMode = 'grid'">
                <el-icon><Grid /></el-icon><span>宫格</span>
              </button>
              <button type="button" :class="{ active: viewMode === 'list' }" title="列表视图" @click="viewMode = 'list'">
                <el-icon><List /></el-icon><span>列表</span>
              </button>
            </div>
          </div>
        </div>

        <div class="gallery-files-scroll">
          <el-empty v-if="!displayedImages.length && !loading" description="当前文件夹暂无图片" />
          <div v-else v-loading="loading" class="gallery-file-grid" :class="`${viewMode}-view`">
            <article v-for="asset in pagedImages" :key="asset.id" class="gallery-file-card">
              <el-checkbox
                class="gallery-card-check"
                :model-value="selectedIds.includes(asset.id)"
                @change="(value: string | number | boolean) => toggleSelect(asset, Boolean(value))"
              />
              <el-image class="gallery-file-image" :src="asset.imageUrl" fit="cover">
                <template #error>
                  <div class="gallery-image-error">图片不可用</div>
                </template>
              </el-image>
              <div class="gallery-file-body">
                <strong>{{ asset.fileName }}</strong>
                <span>{{ sizeText(asset.size) }} <template v-if="asset.width && asset.height"> | {{ asset.width }} x {{ asset.height }}</template></span>
                <span>{{ dateText(asset.updatedAt) }}</span>
              </div>
              <div class="gallery-file-actions">
                <el-button link @click="previewImage = asset">预览</el-button>
                <el-button link @click="copyImageUrl(asset)">复制地址</el-button>
                <el-button link type="danger" @click="$emit('delete', asset)">删除</el-button>
              </div>
            </article>
          </div>
        </div>

        <div class="gallery-pagination">
          <span>共 {{ displayedImages.length }} 项</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :total="displayedImages.length"
            layout="sizes, prev, pager, next, jumper"
          />
        </div>
      </main>
    </div>

    <el-dialog v-model="folderDialogVisible" title="新建文件夹" width="440px">
      <el-form :model="folderForm" label-width="84px">
        <el-form-item label="创建位置">
          <span class="gallery-create-location">{{ currentFolderName }}</span>
        </el-form-item>
        <el-form-item label="文件夹名称" required>
          <el-input v-model="folderForm.name" placeholder="例如：螺蛳粉主图" maxlength="40" show-word-limit @keyup.enter="submitFolder" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderDialogVisible = false">取消</el-button>
        <el-button type="primary" :icon="FolderAdd" @click="submitFolder">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog :model-value="Boolean(previewImage)" title="图片预览" width="760px" @update:model-value="previewImage = undefined">
      <el-image v-if="previewImage" class="gallery-preview-image" :src="previewImage.imageUrl" fit="contain" />
      <p v-if="previewImage" class="gallery-preview-path">{{ previewImage.imageUrl }}</p>
    </el-dialog>
  </section>
</template>
