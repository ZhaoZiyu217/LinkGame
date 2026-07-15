<template>
  <div class="page-container">
    <div class="exam-header">
      <h3>📋 考试模式</h3>
      <p style="color: #999; font-size: 14px;">参加医院发布的统一考试</p>
    </div>

    <div v-if="loading" class="exam-loading">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="currentExam" class="exam-card">
      <div class="exam-info">
        <h2>{{ currentExam.title }}</h2>
        <div class="exam-meta">
          <span class="exam-tag">{{ getDifficultyLabel(currentExam.difficulty) }}</span>
          <span>🕐 {{ currentExam.duration }}秒</span>
        </div>
        <div class="exam-time">
          <div>开始时间：{{ currentExam.start_time_str }}</div>
          <div>结束时间：{{ currentExam.end_time_str }}</div>
        </div>
        <div class="exam-status" :style="{ color: examStatus.color }">
          {{ examStatus.text }}
        </div>
      </div>

      <el-button 
        type="primary" 
        size="large" 
        :disabled="!examStatus.canStart"
        @click="enterExam"
      >
        {{ examStatus.canStart ? '进入考试' : '暂不可参加' }}
      </el-button>
    </div>

    <div v-else class="exam-empty">
      <el-icon :size="64" color="#ddd"><Document /></el-icon>
      <p>暂无考试</p>
      <p style="font-size: 12px; color: #ccc;">请等待管理员发布考试</p>
    </div>

    <div v-if="showGame" class="game-wrapper">
      <LinkGame 
        :key="gameKey" 
        mode="exam" 
        difficulty="hard" 
        @switchMode="showGame = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import LinkGame from '@/views/LinkGame.vue'
import { examAPI } from '@/api/exam'

const loading = ref(false)
const currentExam = ref(null)
const showGame = ref(false)
const gameKey = ref(0)

const difficultyLabels = {
  easy: '体验版',
  medium: '进阶版',
  hard: '终结版'
}

function getDifficultyLabel(key) {
  return difficultyLabels[key] || key
}

const examStatus = computed(() => {
  if (!currentExam.value) return { text: '无考试', color: '#999', canStart: false }
  
  const now = new Date()
  const start = new Date(currentExam.value.start_time)
  const end = new Date(currentExam.value.end_time)
  
  if (now < start) {
    return { text: '⏳ 考试尚未开始', color: '#f59c6c', canStart: false }
  } else if (now > end) {
    return { text: '⏰ 考试已结束', color: '#f56c6c', canStart: false }
  } else {
    return { text: '🟢 考试进行中', color: '#67c23a', canStart: true }
  }
})

async function loadCurrentExam() {
  loading.value = true
  try {
    const res = await examAPI.getCurrent()
    if (res.code === 200) {
      currentExam.value = res.data
    }
  } catch (error) {
    console.error('加载考试失败:', error)
  } finally {
    loading.value = false
  }
}

function enterExam() {
  showGame.value = true
  gameKey.value += 1
}

onMounted(() => {
  loadCurrentExam()
})

onActivated(() => {
  loadCurrentExam()
  showGame.value = false
})
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.exam-header {
  padding: 12px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 12px;
  flex-shrink: 0;
}

.exam-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.exam-header p {
  margin: 2px 0 0 0;
  font-size: 13px;
}

.exam-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #999;
}

.exam-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 12px;
  padding: 30px 40px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  gap: 20px;
}

.exam-info {
  text-align: center;
}

.exam-info h2 {
  font-size: 22px;
  color: #333;
  margin-bottom: 10px;
}

.exam-meta {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 10px;
}

.exam-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.exam-time {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}

.exam-status {
  font-size: 18px;
  font-weight: bold;
  margin-top: 10px;
}

.exam-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 12px;
}

.game-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@media (max-width: 768px) {
  .exam-card {
    padding: 20px;
  }
  .exam-info h2 {
    font-size: 18px;
  }
}
</style>