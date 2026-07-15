<template>
  <div class="page-container">
    <div class="game-header">
      <div class="game-stats">
        <div class="stat-item">
          <span class="stat-label">⏱️ 时间</span>
          <span class="stat-value">{{ gameStore.elapsedTime }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">⭐ 得分</span>
          <span class="stat-value">{{ gameStore.score }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📊 进度</span>
          <span class="stat-value">{{ gameStore.pairs }}/{{ gameStore.totalPairs }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📈 完成率</span>
          <span class="stat-value">{{ gameStore.progress }}%</span>
        </div>
        <div class="stat-item" v-if="mode === 'exam'">
          <span class="stat-label">📝 成绩</span>
          <span class="stat-value" :style="{ color: gameStore.examScore >= 60 ? '#67c23a' : '#f56c6c' }">
            {{ gameStore.examScore }}分
          </span>
        </div>
        <div class="stat-item" v-if="mode === 'exam'">
          <span class="stat-label">❌ 错误</span>
          <span class="stat-value" style="color: #f56c6c;">{{ gameStore.wrongCount }}</span>
        </div>
        <div class="stat-item" v-if="mode === 'exam'">
          <span class="stat-label">⏰ 剩余</span>
          <span class="stat-value" style="color: #f56c6c;">{{ examTimeLeft }}s</span>
        </div>
      </div>

      <div class="game-actions">
        <el-tag :type="mode === 'exam' ? 'danger' : 'success'" size="large">
          {{ mode === 'exam' ? '📋 考试模式' : '📝 练习模式' }}
        </el-tag>
        <el-button v-if="!gameStore.isPlaying && !gameStore.isFinished" type="primary" @click="startGame">
          开始游戏
        </el-button>
        <el-button v-if="gameStore.isPlaying" type="warning" @click="resetGame">
          重新开始
        </el-button>
      </div>
    </div>

    <div class="game-board" v-if="gameStore.grid.length > 0">
      <div
        v-for="(row, i) in gameStore.grid"
        :key="i"
        class="board-row"
      >
        <div
          v-for="(cell, j) in row"
          :key="j"
          class="board-cell"
          :class="{
            'is-empty': cell === 0,
            'is-selected': gameStore.selected && gameStore.selected.x === i && gameStore.selected.y === j,
            'is-matched': isMatched(i, j)
          }"
          @click="handleCellClick(i, j)"
        >
          <span v-if="cell !== 0" class="cell-content" v-html="getCellDisplay(cell)"></span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-icon :size="64" color="#ddd"><Grid /></el-icon>
      <p>点击「开始游戏」进行挑战</p>
    </div>

    <el-dialog
      v-model="showResultDialog"
      :title="gameResult.title"
      width="460px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="result-content">
        <div class="result-icon">{{ gameResult.icon }}</div>
        <div class="result-stats">
          <div class="result-stat">
            <span>配对得分</span>
            <strong>{{ gameStore.score }}</strong>
          </div>
          <div class="result-stat" v-if="mode === 'exam'">
            <span>考试成绩</span>
            <strong :style="{ color: gameStore.examScore >= 60 ? '#67c23a' : '#f56c6c' }">
              {{ gameStore.examScore }}分
            </strong>
          </div>
          <div class="result-stat">
            <span>用时</span>
            <strong>{{ gameStore.elapsedTime }}</strong>
          </div>
          <div class="result-stat" v-if="gameStore.wrongCount > 0">
            <span>错误次数</span>
            <strong style="color: #f56c6c;">{{ gameStore.wrongCount }}</strong>
          </div>
        </div>

        <div v-if="gameStore.wrongRecords.length > 0" class="wrong-summary">
          <p style="font-size:13px;color:#999;margin-top:12px;">错误分期汇总：</p>
          <div class="wrong-tags">
            <span 
              v-for="(count, stageKey) in wrongStageSummary" 
              :key="stageKey"
              class="wrong-tag"
            >
              {{ getStageLabelByKey(stageKey) }} × {{ count }}
            </span>
          </div>
        </div>

        <div v-if="mode === 'practice' && gameStore.wrongRecords.length > 0" class="save-mistakes-option">
          <el-checkbox v-model="saveMistakes">将错题保存到错题库</el-checkbox>
          <p style="font-size:12px;color:#999;margin-top:4px;">保存后可在「知识库 → 错题集」中查看复习</p>
        </div>

        <div v-if="mode === 'exam'" class="auto-save-tip">
          <el-icon color="#67c23a"><CircleCheck /></el-icon>
          <span>考试记录已自动保存</span>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="handleRetry">
          <el-icon><RefreshRight /></el-icon> 再来一局
        </el-button>
        <el-button v-if="mode === 'practice'" @click="handleSwitchMode">
          <el-icon><Switch /></el-icon> 切换模式
        </el-button>
        <el-button @click="handleClose">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useGameStore, STAGE_LABELS, STAGE_ICONS } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { mistakeAPI } from '@/api/mistake'
import { recordAPI } from '@/api/record'
import { libraryAPI } from '@/api/library'

const props = defineProps({
  mode: {
    type: String,
    default: 'practice',
  },
  difficulty: {
    type: String,
    default: 'easy',
  }
})

const emit = defineEmits(['switchMode'])

const gameStore = useGameStore()
const userStore = useUserStore()
const showResultDialog = ref(false)
const saveMistakes = ref(true)
const timerStarted = ref(false)

const imageCache = ref({})

const EXAM_TIME_LIMIT = 300
const examTimeLeft = ref(EXAM_TIME_LIMIT)
let examTimer = null

const gameResult = computed(() => {
  const isWin = gameStore.pairs === gameStore.totalPairs && gameStore.totalPairs > 0
  const modeName = props.mode === 'exam' ? '考试' : '练习'
  return {
    title: isWin ? `🎉 ${modeName}通关！` : `⏰ ${modeName}结束`,
    icon: isWin ? '🏆' : '😅'
  }
})

const wrongStageSummary = computed(() => {
  const summary = {}
  gameStore.wrongRecords.forEach(record => {
    const key = record.stageKey || 'unknown'
    summary[key] = (summary[key] || 0) + 1
  })
  return summary
})

function isMatched(x, y) {
  return gameStore.matchedPairs.some(pair => 
    (pair.x1 === x && pair.y1 === y) || (pair.x2 === x && pair.y2 === y)
  )
}

function getStageLabelByKey(key) {
  return STAGE_LABELS[key] || key
}

async function loadStageImages() {
  console.log('📸 开始加载图片...')
  try {
    const res = await libraryAPI.getList({ size: 500 })
    if (res.code === 200) {
      const list = res.data.list || []
      const grouped = {}
      list.forEach(img => {
        if (!grouped[img.stage]) {
          grouped[img.stage] = []
        }
        grouped[img.stage].push(img.image_url)
      })
      
      imageCache.value = grouped
      gameStore.setImageLibrary(grouped)
      
      console.log('📸 图片缓存加载完成:', Object.keys(grouped).length, '个分期')
      console.log('📸 各分期图片数量:', Object.keys(grouped).map(k => `${k}: ${grouped[k].length}张`).join(', '))
    }
  } catch (error) {
    console.error('加载图库图片失败:', error)
  }
}

function getCellDisplay(value) {
  const stageKey = gameStore.getStageKey(value)
  if (!stageKey) return '❓'
  
  const images = imageCache.value[stageKey] || []
  if (images.length > 0) {
    const index = (value - 1) % images.length
    const imgUrl = images[index]
    return `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" />`
  }
  
  const icon = STAGE_ICONS[stageKey] || ''
  const label = STAGE_LABELS[stageKey] || ''
  return `${icon} ${label}`
}

function handleCellClick(x, y) {
  if (!gameStore.isPlaying || gameStore.isFinished) {
    ElMessage.warning('游戏未开始或已结束，请重新开始')
    return
  }
  gameStore.selectCell(x, y)
}

async function startGame() {
  console.log('🚀 startGame 被调用, 模式:', props.mode, '难度:', props.difficulty)
  
  await loadStageImages()
  
  if (props.mode === 'practice') {
    gameStore.setDifficulty(props.difficulty || 'easy')
  } else {
    gameStore.setDifficulty('exam')
  }

  if (props.mode === 'exam') {
    examTimeLeft.value = EXAM_TIME_LIMIT
    if (examTimer) {
      clearInterval(examTimer)
      examTimer = null
    }
  }

  await gameStore.initGame(props.mode, 5, 6)
  
  // 启动计时器
  if (!timerStarted.value) {
    console.log('⏱️ startGame 启动计时器')
    gameStore.startTimer()
    timerStarted.value = true
  }
  
  showResultDialog.value = false
  saveMistakes.value = true

  if (props.mode === 'exam') {
    examTimer = setInterval(() => {
      examTimeLeft.value -= 1
      if (examTimeLeft.value <= 0) {
        clearInterval(examTimer)
        examTimer = null
        if (gameStore.isPlaying) {
          ElMessage.warning('⏰ 考试时间到！')
          gameStore.finishGame(false)
          showResultDialog.value = true
        }
      }
    }, 1000)
  }
}

function resetGame() {
  if (examTimer) {
    clearInterval(examTimer)
    examTimer = null
  }
  timerStarted.value = false
  gameStore.resetGame()
  showResultDialog.value = false
}

async function saveMistakesToLibrary() {
  try {
    const wrongData = gameStore.wrongRecords.map(record => ({
      stageKey: record.stageKey || record.stageKey1 || 'stage_1',
      imageUrl: record.imageUrl || null,
      imageName: record.imageName || ''
    }))
    
    console.log('📝 准备保存错题:', JSON.stringify(wrongData, null, 2))
    
    const validData = wrongData.filter(item => item.imageUrl)
    if (validData.length === 0) {
      ElMessage.warning('没有可保存的错题')
      return
    }
    
    const res = await mistakeAPI.saveMistakes({
      wrongRecords: validData
    })
    
    console.log('📝 保存结果:', res)
    
    if (res.code === 200) {
      ElMessage.success(`已保存 ${res.data?.saved || validData.length} 条错题到错题库`)
    } else {
      ElMessage.error(res.message || '保存错题失败')
    }
  } catch (error) {
    console.error('保存错题失败:', error)
    ElMessage.error('保存错题失败：' + error.message)
  }
}

async function saveExamRecord() {
  try {
    const data = {
      examScore: gameStore.examScore,
      duration: gameStore.time,
      wrongCount: gameStore.wrongCount,
      wrongQuestions: gameStore.wrongRecords.map(record => ({
        stageKey: record.stageKey || record.stageKey1 || 'stage_1',
        value: record.value || record.value1 || 1
      }))
    }
    
    const res = await recordAPI.saveExamRecord(data)
    if (res.code === 200) {
      console.log('📋 考试记录已保存，奖励积分:', res.data?.bonusScore)
      ElMessage.success(`考试记录已保存，获得 ${res.data?.bonusScore || 0} 积分`)
    }
  } catch (error) {
    console.error('保存考试记录失败:', error)
  }
}

async function savePracticeScore() {
  try {
    const res = await recordAPI.savePracticeScore({
      duration: gameStore.time,
      pairs: gameStore.pairs
    })
    if (res.code === 200) {
      console.log('📝 练习积分已保存，+5分')
      ElMessage.success('练习完成，获得 5 积分')
    }
  } catch (error) {
    console.error('保存练习积分失败:', error)
  }
}

function handleRetry() {
  console.log('📝 点击再来一局')
  if (props.mode === 'practice' && saveMistakes.value && gameStore.wrongRecords.length > 0) {
    saveMistakesToLibrary()
  }
  timerStarted.value = false
  showResultDialog.value = false
  startGame()
}

function handleSwitchMode() {
  console.log('📝 点击切换模式')
  if (props.mode === 'practice' && saveMistakes.value && gameStore.wrongRecords.length > 0) {
    saveMistakesToLibrary()
  }
  showResultDialog.value = false
  timerStarted.value = false
  gameStore.resetGame()
  emit('switchMode')
}

function handleClose() {
  console.log('📝 点击关闭，保存错题')
  handleResultConfirm()
}

async function handleResultConfirm() {
  console.log('📝 结果确认，模式:', props.mode, '错题数:', gameStore.wrongRecords.length, '保存错题:', saveMistakes.value)
  
  if (props.mode === 'practice' && saveMistakes.value && gameStore.wrongRecords.length > 0) {
    console.log('📝 开始保存错题...')
    await saveMistakesToLibrary()
  }
  
  if (props.mode === 'exam') {
    await saveExamRecord()
  }
  
  if (props.mode === 'practice') {
    await savePracticeScore()
  }
  
  await userStore.refreshUserInfo()
  console.log('📊 用户信息已刷新，当前积分:', userStore.userInfo?.score)
  
  showResultDialog.value = false
}

watch(() => gameStore.isFinished, (val) => {
  if (val) {
    if (examTimer) {
      clearInterval(examTimer)
      examTimer = null
    }
    showResultDialog.value = true
  }
})

onMounted(async () => {
  await loadStageImages()
  if (gameStore.isPlaying && !gameStore.isFinished && !timerStarted.value) {
    console.log('⏱️ onMounted 启动计时器')
    gameStore.startTimer()
    timerStarted.value = true
  }
})
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.game-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  color: #999;
  font-size: 12px;
}

.stat-value {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.game-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.game-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  gap: 4px;
  min-height: 0;
  overflow: hidden;
}

.board-row {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.board-cell {
  width: 76px;
  height: 76px;
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  user-select: none;
  overflow: hidden;
  flex-shrink: 0;
}

.board-cell:hover:not(.is-empty) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.board-cell.is-empty {
  background: transparent;
  cursor: default;
  border-color: transparent;
}

.board-cell.is-selected {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
  transform: scale(1.08);
}

.board-cell.is-matched {
  background: #67c23a;
  animation: matchPop 0.3s ease;
}

@keyframes matchPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(0); opacity: 0; }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #999;
}

.empty-state p {
  font-size: 14px;
}

.cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
}

.result-content {
  text-align: center;
  padding: 20px 0;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.result-stat {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
}

.result-stat span {
  display: block;
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
}

.result-stat strong {
  font-size: 20px;
  color: #333;
}

.wrong-summary {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.wrong-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.wrong-tag {
  background: #fef0f0;
  color: #f56c6c;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.save-mistakes-option {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  text-align: left;
}

.auto-save-tip {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #67c23a;
  font-size: 14px;
}

@media (max-width: 768px) {
  .game-stats {
    gap: 10px;
  }
  .stat-item {
    font-size: 12px;
  }
  .game-header {
    padding: 10px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .game-actions {
    justify-content: center;
  }
  .board-cell {
    width: 50px;
    height: 50px;
  }
  .cell-content {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .board-cell {
    width: 42px;
    height: 42px;
  }
  .game-board {
    padding: 8px;
    gap: 2px;
  }
  .board-row {
    gap: 2px;
  }
}
</style>