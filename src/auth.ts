export interface AdminProfile {
  id: number
  username: string
  displayName: string
  role: string
  createdAt?: string
}

export interface AdminSession {
  token: string
  expiresAt: string
  user: AdminProfile
}

const TOKEN_KEY = 'admin-token'
const USER_KEY = 'admin-user'
const REMEMBER_PREFERENCE_KEY = 'admin-remember-login-preference'
const REMEMBERED_USERNAME_KEY = 'admin-remembered-username'
let transientToken = ''
let transientUser: AdminProfile | null = null

// Older versions used sessionStorage even when "remember me" was unchecked.
// Clear that legacy state so an unremembered login never survives a refresh.
sessionStorage.removeItem(TOKEN_KEY)
sessionStorage.removeItem(USER_KEY)

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || transientToken
}

export function getStoredAdmin(): AdminProfile | null {
  if (transientUser) return transientUser
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminProfile
  } catch {
    clearAdminSession()
    return null
  }
}

export function saveAdminSession(session: AdminSession, remember: boolean) {
  clearAdminSession()
  setRememberLoginPreference(remember)
  if (remember) {
    localStorage.setItem(TOKEN_KEY, session.token)
    localStorage.setItem(USER_KEY, JSON.stringify(session.user))
    localStorage.setItem(REMEMBERED_USERNAME_KEY, session.user.username)
  } else {
    transientToken = session.token
    transientUser = session.user
  }
  window.dispatchEvent(new CustomEvent('admin-auth-changed'))
}

export function getRememberLoginPreference() {
  return localStorage.getItem(REMEMBER_PREFERENCE_KEY) === 'true'
}

export function getRememberedUsername() {
  return getRememberLoginPreference() ? localStorage.getItem(REMEMBERED_USERNAME_KEY) || '' : ''
}

export function setRememberLoginPreference(remember: boolean) {
  if (remember) localStorage.setItem(REMEMBER_PREFERENCE_KEY, 'true')
  else {
    localStorage.removeItem(REMEMBER_PREFERENCE_KEY)
    localStorage.removeItem(REMEMBERED_USERNAME_KEY)
  }
}

interface BrowserPasswordCredential extends Credential {
  id: string
  password?: string
}

type PasswordCredentialConstructor = new (data: {
  id: string
  password: string
  name?: string
}) => Credential

export async function saveBrowserCredential(username: string, password: string) {
  const PasswordCredentialClass = (window as unknown as { PasswordCredential?: PasswordCredentialConstructor }).PasswordCredential
  if (!PasswordCredentialClass || !navigator.credentials?.store) return false
  try {
    const credential = new PasswordCredentialClass({ id: username, password, name: username })
    await navigator.credentials.store(credential)
    return true
  } catch {
    return false
  }
}

export async function getBrowserCredential() {
  if (!navigator.credentials?.get) return null
  try {
    const credential = await navigator.credentials.get({
      password: true,
      mediation: 'optional',
    } as CredentialRequestOptions) as BrowserPasswordCredential | null
    if (!credential?.id || !credential.password) return null
    return { username: credential.id, password: credential.password }
  } catch {
    return null
  }
}

export function updateStoredAdmin(user: AdminProfile) {
  if (localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else if (transientToken) {
    transientUser = user
  } else {
    return
  }
  window.dispatchEvent(new CustomEvent('admin-auth-changed'))
}

export function clearAdminSession() {
  transientToken = ''
  transientUser = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  window.dispatchEvent(new CustomEvent('admin-auth-changed'))
}
