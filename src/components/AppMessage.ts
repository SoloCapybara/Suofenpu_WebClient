import { ElMessage } from 'element-plus'

type AppMessageType = 'success' | 'warning' | 'error' | 'info'
type AppMessageOptions = Partial<{
  duration: number
  showClose: boolean
  grouping: boolean
  offset: number
}>

function show(type: AppMessageType, message: string, options: AppMessageOptions = {}) {
  return ElMessage({
    message,
    type,
    duration: type === 'error' ? 4200 : 2800,
    showClose: false,
    grouping: true,
    offset: 22,
    customClass: 'app-message',
    ...options,
  })
}

export const AppMessage = {
  success: (message: string, options?: AppMessageOptions) => show('success', message, options),
  warning: (message: string, options?: AppMessageOptions) => show('warning', message, options),
  error: (message: string, options?: AppMessageOptions) => show('error', message, options),
  info: (message: string, options?: AppMessageOptions) => show('info', message, options),
}
