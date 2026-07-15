import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const hospitalId = computed(() => userInfo.value?.hospital_id)
  const username = computed(() => userInfo.value?.username)
  const realName = computed(() => userInfo.value?.real_name)

  function setUser(data) {
    token.value = data.token
    userInfo.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data.user))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function updateUserInfo(data) {
    userInfo.value = { ...userInfo.value, ...data }
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  async function refreshUserInfo() {
    try {
      const res = await authAPI.getCurrentUser()
      if (res.code === 200) {
        userInfo.value = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        return res.data
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    hospitalId,
    username,
    realName,
    setUser,
    logout,
    updateUserInfo,
    refreshUserInfo
  }
})