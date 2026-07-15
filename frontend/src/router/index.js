import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: true },
      redirect: '/practice',
      children: [
        {
          path: '/practice',
          name: 'Practice',
          component: () => import('@/views/Practice.vue'),
          meta: { title: '练习' }
        },
        {
          path: '/exam',
          name: 'Exam',
          component: () => import('@/views/Exam.vue'),
          meta: { title: '考试' }
        },
        {
          path: '/knowledge',
          name: 'Knowledge',
          component: () => import('@/views/Knowledge.vue'),
          meta: { title: '知识库' }
        },
        {
          path: '/profile',
          name: 'Profile',
          component: () => import('@/views/Profile.vue'),
          meta: { title: '个人中心' }
        },
        {
          path: '/admin',
          name: 'Admin',
          component: () => import('@/views/Admin.vue'),
          meta: { 
            title: '管理员后台',
            requiresAdmin: true 
          }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  if (to.meta.requiresAdmin) {
    if (!token) {
      next('/login')
      return
    }
    if (userStore.userInfo?.role !== 'admin') {
      next('/practice')
      return
    }
  }

  if ((to.path === '/login' || to.path === '/register') && token) {
    next('/practice')
    return
  }

  next()
})

export default router