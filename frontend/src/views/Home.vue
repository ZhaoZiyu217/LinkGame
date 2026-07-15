<template>
  <div class="home-container">
    <SideMenu />
    <div class="main-wrapper">
      <HeaderBar />
      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import SideMenu from '@/components/SideMenu.vue'
import HeaderBar from '@/components/HeaderBar.vue'
</script>

<style scoped>
.home-container {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  min-width: 0;
}

.page-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>