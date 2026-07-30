<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CirclePlus, Key, Refresh, Search, User, UserFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { AdminProfile } from '../auth'
import type { CustomerAccount, EmployeeAccount } from '../types'
import {
  createEmployeeAccount, listCustomerAccounts, listEmployeeAccounts, resetEmployeePassword,
  updateCustomerAccountStatus, updateEmployeeAccount,
} from '../api'
import { AppMessage } from '../components/AppMessage'
import AppButton from '../components/AppButton.vue'

const props = defineProps<{ currentAdmin: AdminProfile | null }>()
const activeTab = ref<'employees' | 'customers'>('employees')
const loading = ref(false)
const keyword = ref('')
const employees = ref<EmployeeAccount[]>([])
const customers = ref<CustomerAccount[]>([])
const employeeDialog = ref(false)
const resetDialog = ref(false)
const editingId = ref<number>()
const resettingEmployee = ref<EmployeeAccount>()
const employeeRef = ref<FormInstance>()
const resetRef = ref<FormInstance>()
const employeeForm = reactive({ username: '', displayName: '', password: '', role: 'STAFF' })
const resetForm = reactive({ password: '', confirmPassword: '' })
const isOwner = computed(() => props.currentAdmin?.role === 'OWNER')

const employeeRules: FormRules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  password: [{ required: true, min: 8, max: 72, message: '初始密码应为8到72位', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}
const resetRules: FormRules = {
  password: [{ required: true, min: 8, max: 72, message: '新密码应为8到72位', trigger: 'blur' }],
  confirmPassword: [{ validator: (_rule, value, callback) => value === resetForm.password ? callback() : callback(new Error('两次密码不一致')), trigger: 'blur' }],
}

const filteredEmployees = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return q ? employees.value.filter((item) => `${item.username} ${item.displayName}`.toLowerCase().includes(q)) : employees.value
})
const filteredCustomers = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return q ? customers.value.filter((item) => `${item.nickname || ''} ${item.phone || ''}`.toLowerCase().includes(q)) : customers.value
})
const enabledEmployees = computed(() => employees.value.filter((item) => item.enabled).length)
const activeCustomers = computed(() => customers.value.filter((item) => item.status === 'ACTIVE').length)

function roleText(role: string) {
  return ({ OWNER: '超级管理员', MANAGER: '店长', STAFF: '员工' } as Record<string, string>)[role] || role
}
function dateText(value: string) {
  return new Date(value).toLocaleDateString('zh-CN')
}
function displayAvatarUrl(value?: string) {
  if (!value) return ''
  if (value.startsWith('/assets/avatars/')) return value.replace('/assets/avatars/', '/avatars/')
  return value
}
async function refresh() {
  loading.value = true
  try {
    const [employeeData, customerData] = await Promise.all([listEmployeeAccounts(), listCustomerAccounts()])
    employees.value = employeeData
    customers.value = customerData
  } catch (error) {
    AppMessage.error(error instanceof Error ? error.message : '用户数据加载失败')
  } finally { loading.value = false }
}
function openCreate() {
  editingId.value = undefined
  Object.assign(employeeForm, { username: '', displayName: '', password: '', role: 'STAFF' })
  employeeDialog.value = true
}
function openEdit(row: EmployeeAccount) {
  editingId.value = row.id
  Object.assign(employeeForm, { username: row.username, displayName: row.displayName, password: '', role: row.role })
  employeeDialog.value = true
}
async function saveEmployee() {
  if (!(await employeeRef.value?.validate().catch(() => false))) return
  try {
    if (editingId.value) {
      const updated = await updateEmployeeAccount(editingId.value, { displayName: employeeForm.displayName, role: employeeForm.role })
      employees.value.splice(employees.value.findIndex((item) => item.id === updated.id), 1, updated)
      AppMessage.success('员工资料已更新')
    } else {
      employees.value.push(await createEmployeeAccount(employeeForm))
      AppMessage.success('员工账号已创建')
    }
    employeeDialog.value = false
  } catch (error) { AppMessage.error(error instanceof Error ? error.message : '保存失败') }
}
async function toggleEmployee(row: EmployeeAccount) {
  try {
    const updated = await updateEmployeeAccount(row.id, { enabled: !row.enabled })
    employees.value.splice(employees.value.findIndex((item) => item.id === updated.id), 1, updated)
    AppMessage.success(updated.enabled ? '员工账号已启用' : '员工账号已停用')
  } catch (error) { AppMessage.error(error instanceof Error ? error.message : '操作失败') }
}
function openReset(row: EmployeeAccount) {
  resettingEmployee.value = row
  resetForm.password = ''
  resetForm.confirmPassword = ''
  resetDialog.value = true
}
async function submitReset() {
  if (!(await resetRef.value?.validate().catch(() => false)) || !resettingEmployee.value) return
  try {
    await resetEmployeePassword(resettingEmployee.value.id, resetForm.password)
    resetDialog.value = false
    AppMessage.success(`已重置 ${resettingEmployee.value.displayName} 的密码`)
  } catch (error) { AppMessage.error(error instanceof Error ? error.message : '密码重置失败') }
}
async function toggleCustomer(row: CustomerAccount) {
  try {
    const status = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const updated = await updateCustomerAccountStatus(row.id, status)
    customers.value.splice(customers.value.findIndex((item) => item.id === updated.id), 1, updated)
    AppMessage.success(status === 'ACTIVE' ? '用户已启用' : '用户已停用')
  } catch (error) { AppMessage.error(error instanceof Error ? error.message : '操作失败') }
}
onMounted(refresh)
</script>

<template>
  <section class="user-management-page">
    <header class="user-management-heading">
      <div><span>ACCOUNT MANAGEMENT</span><h1>用户管理</h1><p>后台员工账号与小程序普通用户分开管理</p></div>
      <AppButton v-if="activeTab === 'employees' && isOwner" type="primary" :icon="CirclePlus" @click="openCreate">新增员工</AppButton>
    </header>

    <section class="user-stat-row">
      <div><span class="user-stat-icon blue"><UserFilled /></span><p>员工账号<strong>{{ employees.length }}</strong><small>{{ enabledEmployees }} 个正常使用</small></p></div>
      <div><span class="user-stat-icon green"><User /></span><p>小程序用户<strong>{{ customers.length }}</strong><small>{{ activeCustomers }} 个状态正常</small></p></div>
      <div><span class="user-stat-icon amber"><Key /></span><p>当前权限<strong>{{ isOwner ? '超管' : '员工' }}</strong><small>{{ isOwner ? '可管理所有账号' : '仅可查看账号' }}</small></p></div>
    </section>

    <section class="user-management-card">
      <div class="user-management-tabs">
        <button :class="{ active: activeTab === 'employees' }" @click="activeTab = 'employees'; keyword = ''"><UserFilled />员工账号<span>{{ employees.length }}</span></button>
        <button :class="{ active: activeTab === 'customers' }" @click="activeTab = 'customers'; keyword = ''"><User />小程序用户<span>{{ customers.length }}</span></button>
      </div>
      <div class="user-management-toolbar">
        <el-input v-model="keyword" :prefix-icon="Search" clearable :placeholder="activeTab === 'employees' ? '搜索员工姓名或登录账号' : '搜索用户昵称或手机号'" />
        <AppButton :icon="Refresh" :loading="loading" @click="refresh">刷新</AppButton>
      </div>

      <el-table v-if="activeTab === 'employees'" v-loading="loading" :data="filteredEmployees" empty-text="暂无员工账号">
        <el-table-column label="员工" min-width="230"><template #default="{ row }"><div class="account-cell"><span>{{ row.displayName.slice(0, 1) }}</span><div><strong>{{ row.displayName }}</strong><small>@{{ row.username }}</small></div></div></template></el-table-column>
        <el-table-column label="角色" width="150"><template #default="{ row }"><span class="account-role" :class="row.role.toLowerCase()">{{ roleText(row.role) }}</span></template></el-table-column>
        <el-table-column label="状态" width="130"><template #default="{ row }"><span class="account-status" :class="{ disabled: !row.enabled }"><i />{{ row.enabled ? '正常' : '已停用' }}</span></template></el-table-column>
        <el-table-column label="创建时间" width="150"><template #default="{ row }">{{ dateText(row.createdAt) }}</template></el-table-column>
        <el-table-column label="操作" width="250" align="left"><template #default="{ row }"><div class="account-actions"><AppButton link :disabled="!isOwner" @click="openEdit(row)">编辑</AppButton><AppButton link :disabled="!isOwner" @click="openReset(row)">重置密码</AppButton><AppButton link :type="row.enabled ? 'danger' : 'success'" :disabled="!isOwner || row.id === currentAdmin?.id" @click="toggleEmployee(row)">{{ row.enabled ? '停用' : '启用' }}</AppButton></div></template></el-table-column>
      </el-table>

      <el-table v-else v-loading="loading" :data="filteredCustomers" empty-text="暂无小程序用户">
        <el-table-column label="用户" min-width="250"><template #default="{ row }"><div class="account-cell customer"><el-avatar :src="displayAvatarUrl(row.avatarUrl)" :size="38">{{ row.nickname?.slice(0, 1) || '用' }}</el-avatar><div><strong>{{ row.nickname || '微信用户' }}</strong><small>用户编号 #{{ row.id }}</small></div></div></template></el-table-column>
        <el-table-column label="手机号" min-width="170"><template #default="{ row }">{{ row.phone || '未绑定' }}</template></el-table-column>
        <el-table-column label="注册时间" width="150"><template #default="{ row }">{{ dateText(row.createdAt) }}</template></el-table-column>
        <el-table-column label="状态" width="130"><template #default="{ row }"><span class="account-status" :class="{ disabled: row.status !== 'ACTIVE' }"><i />{{ row.status === 'ACTIVE' ? '正常' : '已停用' }}</span></template></el-table-column>
        <el-table-column label="操作" width="120"><template #default="{ row }"><AppButton link :type="row.status === 'ACTIVE' ? 'danger' : 'success'" :disabled="!isOwner" @click="toggleCustomer(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</AppButton></template></el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="employeeDialog" :title="editingId ? '编辑员工' : '新增员工'" width="480px">
      <el-form ref="employeeRef" :model="employeeForm" :rules="employeeRules" label-position="top">
        <el-form-item label="登录账号" prop="username"><el-input v-model="employeeForm.username" :disabled="Boolean(editingId)" placeholder="用于登录管理后台" /></el-form-item>
        <el-form-item label="显示名称" prop="displayName"><el-input v-model="employeeForm.displayName" /></el-form-item>
        <el-form-item v-if="!editingId" label="初始密码" prop="password"><el-input v-model="employeeForm.password" type="password" show-password autocomplete="new-password" /></el-form-item>
        <el-form-item label="账号角色" prop="role"><el-select v-model="employeeForm.role" style="width:100%"><el-option label="超级管理员" value="OWNER" /><el-option label="店长" value="MANAGER" /><el-option label="普通员工" value="STAFF" /></el-select></el-form-item>
      </el-form>
      <template #footer><AppButton @click="employeeDialog = false">取消</AppButton><AppButton type="primary" @click="saveEmployee">保存</AppButton></template>
    </el-dialog>

    <el-dialog v-model="resetDialog" title="重置员工密码" width="440px">
      <p class="reset-password-tip">正在为「{{ resettingEmployee?.displayName }}」设置新密码，完成后其他设备的登录会失效。</p>
      <el-form ref="resetRef" :model="resetForm" :rules="resetRules" label-position="top">
        <el-form-item label="新密码" prop="password"><el-input v-model="resetForm.password" type="password" show-password autocomplete="new-password" /></el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword"><el-input v-model="resetForm.confirmPassword" type="password" show-password autocomplete="new-password" /></el-form-item>
      </el-form>
      <template #footer><AppButton @click="resetDialog = false">取消</AppButton><AppButton type="primary" @click="submitReset">确认重置</AppButton></template>
    </el-dialog>
  </section>
</template>
