<template>
  <div class="side-menu">
    <div class="logo">
      <span>🏥</span>
      <span class="logo-text">压疮连连看</span>
    </div>

    <el-menu
      :default-active="activeMenu"
      router
      background-color="#1e3c72"
      text-color="#a8c8e8"
      active-text-color="#fff"
      class="menu"
    >
      <el-menu-item index="/practice">
        <el-icon><Edit /></el-icon>
        <span>练习</span>
      </el-menu-item>

      <el-menu-item index="/exam">
        <el-icon><Document /></el-icon>
        <span>考试</span>
      </el-menu-item>

      <el-menu-item index="/knowledge">
        <el-icon><Reading /></el-icon>
        <span>知识库</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => {
  // 如果路由是 /practice 或 /exam 或 /knowledge，返回对应的路径
  const path = route.path
  if (path === '/practice' || path === '/exam' || path === '/knowledge') {
    return path
  }
  return '/practice'  // 默认返回 /practice
})
</script>

<style scoped>
.side-menu {
  width: 220px;
  height: 100vh;
  background: #1e3c72;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 20px;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}

.logo-text {
  font-weight: bold;
  font-size: 16px;
}

.menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  padding-top: 8px;
}

.menu :deep(.el-menu-item.is-active) {
  background-color: rgba(255,255,255,0.15) !important;
}

.menu :deep(.el-menu-item:hover) {
  background-color: rgba(255,255,255,0.08) !important;
}
</style>