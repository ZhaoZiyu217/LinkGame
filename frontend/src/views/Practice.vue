<template>
  <div class="page-container">
    <div class="practice-header">
      <h3>📝 练习模式</h3>
      <p style="color: #999; font-size: 14px;">选择难度进行压疮识别练习</p>
    </div>

    <div class="difficulty-selector" v-if="showDifficulty">
      <div class="difficulty-row">
        <div
          v-for="diff in difficulties"
          :key="diff.key"
          class="difficulty-card"
          :class="{ active: selectedDifficulty === diff.key }"
          @click="selectedDifficulty = diff.key"
        >
          <div class="difficulty-icon">{{ diff.icon }}</div>
          <div class="difficulty-name">{{ diff.name }}</div>
          <div class="difficulty-desc">{{ diff.desc }}</div>
          <div class="difficulty-stages">
            <span v-for="stage in diff.stages" :key="stage" class="stage-tag">
              {{ stage }}
            </span>
          </div>
        </div>
      </div>

      <el-button type="primary" size="large" @click="startPractice" class="start-btn">
        开始练习
      </el-button>
    </div>

    <div v-else class="game-wrapper">
      <LinkGame 
        :key="gameKey" 
        mode="practice" 
        :difficulty="selectedDifficulty" 
        @switchMode="showDifficulty = true"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import LinkGame from '@/views/LinkGame.vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const gameKey = ref(0)
const selectedDifficulty = ref('easy')
const showDifficulty = ref(true)

const difficulties = [
  {
    key: 'easy',
    name: '体验版',
    icon: '🟢',
    desc: '3个分期 · 适合初学者',
    stages: ['Ⅰ期', 'Ⅱ期', 'Ⅲ期']
  },
  {
    key: 'medium',
    name: '进阶版',
    icon: '🟡',
    desc: '5个分期 · 适合进阶学习',
    stages: ['Ⅰ期', 'Ⅱ期', 'Ⅲ期', 'Ⅳ期', 'DTI']
  },
  {
    key: 'hard',
    name: '终结版',
    icon: '🔴',
    desc: '6个分期 · 全面挑战',
    stages: ['Ⅰ期', 'Ⅱ期', 'Ⅲ期', 'Ⅳ期', '不可分期', 'DTI']
  }
]

function startPractice() {
  showDifficulty.value = false
  gameKey.value += 1
  gameStore.initGame('practice', 5, 6)
  gameStore.startTimer()
}

onActivated(() => {
  gameStore.resetGame()
  showDifficulty.value = true
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

.practice-header {
  padding: 12px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 12px;
  flex-shrink: 0;
}

.practice-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.practice-header p {
  margin: 2px 0 0 0;
  font-size: 14px;
}

.difficulty-selector {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  background: #fff;
  border-radius: 12px;
  padding: 30px 40px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  min-height: 0;
}

.difficulty-row {
  display: flex;
  gap: 30px;
  width: 100%;
  max-width: 900px;
  justify-content: center;
  flex-wrap: wrap;
}

.difficulty-card {
  flex: 1;
  min-width: 200px;
  max-width: 280px;
  padding: 24px 28px;
  border-radius: 14px;
  border: 3px solid #e8ecf1;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.difficulty-card:hover {
  border-color: #409eff;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.10);
}

.difficulty-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.difficulty-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.difficulty-name {
  font-size: 22px;
  font-weight: bold;
  color: #333;
}

.difficulty-desc {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.difficulty-stages {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 10px;
  flex-wrap: wrap;
}

.stage-tag {
  background: #f5f7fa;
  padding: 3px 14px;
  border-radius: 12px;
  font-size: 13px;
  color: #666;
}

.start-btn {
  width: 240px;
  height: 52px;
  font-size: 18px;
  flex-shrink: 0;
}

.game-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@media (max-width: 768px) {
  .difficulty-selector {
    padding: 20px;
    gap: 20px;
  }
  .difficulty-row {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .difficulty-card {
    min-width: 100%;
    max-width: 100%;
    padding: 20px;
  }
  .difficulty-icon {
    font-size: 32px;
  }
  .difficulty-name {
    font-size: 18px;
  }
  .start-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
  }
}
</style>