<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bowl, Lock, User } from '@element-plus/icons-vue'
import { type FormInstance, type FormRules } from 'element-plus'
import { loginAdmin } from '../api'
import {
  getBrowserCredential,
  getRememberLoginPreference,
  getRememberedUsername,
  saveAdminSession,
  saveBrowserCredential,
  setRememberLoginPreference,
} from '../auth'
import { AppMessage } from '../components/AppMessage'
import AppButton from '../components/AppButton.vue'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const usernameEditable = ref(false)
const passwordEditable = ref(false)
const form = reactive({
  username: getRememberedUsername(),
  password: '',
  remember: getRememberLoginPreference(),
})
const rules: FormRules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
}

async function submit() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    const session = await loginAdmin(form.username.trim(), form.password, form.remember)
    saveAdminSession(session, form.remember)
    if (form.remember) await saveBrowserCredential(form.username.trim(), form.password)
    AppMessage.success(`欢迎回来，${session.user.displayName}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    AppMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!form.remember) return
  const credential = await getBrowserCredential()
  if (!credential) return
  form.username = credential.username
  form.password = credential.password
  usernameEditable.value = true
  passwordEditable.value = true
})
</script>

<template>
  <main class="login-page">
    <section class="login-brand-panel">
      <div class="login-brand">
        <span><Bowl /></span>
        <strong>粉店经营后台</strong>
      </div>
      <div class="login-intro">
        <span>STORE OPERATIONS</span>
        <h1>把门店经营，<br />变成一件清晰的事。</h1>
        <p>订单、商品、图库与经营数据，在一个工作台里高效完成。</p>
      </div>
      <div class="login-decoration" aria-hidden="true"><i /><i /><i /></div>
    </section>

    <section class="login-form-panel">
      <div class="login-card">
        <header>
          <span>管理端登录</span>
          <h2>欢迎回来</h2>
          <p>请使用管理员账号进入经营后台</p>
        </header>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :autocomplete="form.remember ? 'on' : 'off'" @keyup.enter="submit">
          <el-form-item label="管理员账号" prop="username">
            <el-input
              v-model="form.username"
              name="admin_account_input"
              size="large"
              :prefix-icon="User"
              :readonly="!form.remember && !usernameEditable"
              :autocomplete="form.remember ? 'username' : 'off'"
              placeholder="请输入管理员账号"
              @focus="usernameEditable = true"
            />
          </el-form-item>
          <el-form-item label="登录密码" prop="password">
            <el-input
              v-model="form.password"
              name="admin_secret_input"
              size="large"
              :prefix-icon="Lock"
              :readonly="!form.remember && !passwordEditable"
              type="password"
              show-password
              :autocomplete="form.remember ? 'current-password' : 'one-time-code'"
              placeholder="请输入登录密码"
              @focus="passwordEditable = true"
            />
          </el-form-item>
          <div class="login-options">
            <el-checkbox v-model="form.remember" @change="setRememberLoginPreference(Boolean($event))">30 天内保持登录状态</el-checkbox>
            <span>不勾选则刷新页面后退出</span>
          </div>
          <AppButton class="login-submit" type="primary" size="large" :loading="loading" @click="submit">登录后台</AppButton>
        </el-form>
        <footer>© 2026 粉店经营后台 · 安全登录</footer>
      </div>
    </section>
  </main>
</template>
