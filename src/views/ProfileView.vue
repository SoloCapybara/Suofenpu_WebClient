<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Key, Lock, User, UserFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { AdminProfile } from '../auth'
import { updateStoredAdmin } from '../auth'
import { changeAdminPassword, updateAdminProfile } from '../api'
import { AppMessage } from '../components/AppMessage'
import AppButton from '../components/AppButton.vue'

const props = defineProps<{ profile: AdminProfile | null }>()
const emit = defineEmits<{ updated: [profile: AdminProfile] }>()
const profileRef = ref<FormInstance>()
const passwordRef = ref<FormInstance>()
const profileLoading = ref(false)
const passwordLoading = ref(false)
const profileForm = reactive({ displayName: props.profile?.displayName || '' })
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

watch(() => props.profile?.displayName, (value) => { profileForm.displayName = value || '' })

const roleName = computed(() => props.profile?.role === 'OWNER' ? '超级管理员' : '管理员')
const createdAt = computed(() => props.profile?.createdAt
  ? new Date(props.profile.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  : '—')

const profileRules: FormRules = {
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { max: 80, message: '显示名称不能超过80个字符', trigger: 'blur' },
  ],
}

const passwordRules: FormRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 72, message: '密码长度应为8到72位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: (_rule, value, callback) => value === passwordForm.newPassword ? callback() : callback(new Error('两次输入的新密码不一致')), trigger: 'blur' },
  ],
}

async function saveProfile() {
  if (!(await profileRef.value?.validate().catch(() => false))) return
  profileLoading.value = true
  try {
    const profile = await updateAdminProfile(profileForm.displayName.trim())
    updateStoredAdmin(profile)
    emit('updated', profile)
    AppMessage.success('个人资料已更新')
  } catch (error) {
    AppMessage.error(error instanceof Error ? error.message : '资料更新失败')
  } finally {
    profileLoading.value = false
  }
}

async function savePassword() {
  if (!(await passwordRef.value?.validate().catch(() => false))) return
  passwordLoading.value = true
  try {
    await changeAdminPassword(passwordForm.currentPassword, passwordForm.newPassword)
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordRef.value?.clearValidate()
    AppMessage.success('密码已修改，其他设备的登录已失效')
  } catch (error) {
    AppMessage.error(error instanceof Error ? error.message : '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <section class="profile-page">
    <header class="profile-heading">
      <div>
        <span>ACCOUNT</span>
        <h1>个人中心</h1>
        <p>管理你的管理员资料与账号安全</p>
      </div>
    </header>

    <section class="profile-overview">
      <div class="profile-avatar-large">{{ profile?.displayName?.slice(0, 1) || '管' }}</div>
      <div class="profile-identity">
        <h2>{{ profile?.displayName || '管理员' }}</h2>
        <div><span>{{ roleName }}</span><b>账号状态正常</b></div>
        <p>@{{ profile?.username }} · 加入于 {{ createdAt }}</p>
      </div>
      <div class="profile-security-status">
        <span><el-icon><Lock /></el-icon></span>
        <div><strong>账号安全</strong><small>密码保护已启用</small></div>
      </div>
    </section>

    <div class="profile-grid">
      <section class="profile-card">
        <header>
          <span class="profile-card-icon"><el-icon><UserFilled /></el-icon></span>
          <div><h3>基础资料</h3><p>用于后台顶栏和操作记录中的身份展示</p></div>
        </header>
        <el-form ref="profileRef" :model="profileForm" :rules="profileRules" label-position="top">
          <el-form-item label="登录账号">
            <el-input :model-value="profile?.username" :prefix-icon="User" disabled />
            <small class="profile-field-tip">登录账号由系统创建，暂不支持修改</small>
          </el-form-item>
          <el-form-item label="显示名称" prop="displayName">
            <el-input v-model="profileForm.displayName" :prefix-icon="UserFilled" maxlength="80" placeholder="请输入显示名称" />
          </el-form-item>
          <div class="profile-form-actions"><AppButton type="primary" :loading="profileLoading" @click="saveProfile">保存资料</AppButton></div>
        </el-form>
      </section>

      <section class="profile-card security-card">
        <header>
          <span class="profile-card-icon amber"><el-icon><Key /></el-icon></span>
          <div><h3>修改密码</h3><p>定期更新密码可以降低账号被盗风险</p></div>
        </header>
        <el-form ref="passwordRef" :model="passwordForm" :rules="passwordRules" label-position="top">
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input v-model="passwordForm.currentPassword" :prefix-icon="Lock" type="password" show-password autocomplete="current-password" />
          </el-form-item>
          <div class="profile-password-row">
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" :prefix-icon="Lock" type="password" show-password autocomplete="new-password" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" :prefix-icon="Lock" type="password" show-password autocomplete="new-password" />
            </el-form-item>
          </div>
          <div class="profile-form-actions"><AppButton type="primary" :loading="passwordLoading" @click="savePassword">更新密码</AppButton></div>
        </el-form>
      </section>
    </div>
  </section>
</template>
