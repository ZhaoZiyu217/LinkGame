<template>
  <div class="page-container">
    <div class="knowledge-header">
      <h3>📚 知识库</h3>
      <p style="color: #999; font-size: 14px;">压疮分期知识学习 · 错题复习</p>
    </div>

    <el-tabs v-model="activeTab" class="knowledge-tabs">
      <!-- ===== 知识讲解 ===== -->
      <el-tab-pane label="📖 知识讲解" name="knowledge">
        <div class="knowledge-layout">
          <div class="stage-list">
            <div
              v-for="stage in stageList"
              :key="stage.key"
              class="stage-list-item"
              :class="{ active: selectedStage === stage.key }"
              :style="{ borderLeftColor: stage.color }"
              @click="selectStage(stage.key)"
            >
              <span class="stage-icon">{{ stage.icon }}</span>
              <span class="stage-label">{{ stage.label }}</span>
              <span class="stage-name">{{ stage.name }}</span>
              <el-icon class="stage-arrow"><ArrowRight /></el-icon>
            </div>
          </div>

          <div class="stage-detail-panel">
            <div v-if="selectedStageData" class="stage-detail-content">
              <div class="detail-header" :style="{ borderBottomColor: selectedStageData.color }">
                <span class="detail-icon">{{ selectedStageData.icon }}</span>
                <span class="detail-title">{{ selectedStageData.label }} {{ selectedStageData.name }}</span>
                <span class="detail-en">{{ selectedStageData.enName }}</span>
              </div>

              <div class="detail-image-section">
                <div class="detail-image-title">📸 示例图片</div>
                <div class="detail-image-grid">
                  <div class="detail-image-item">
                    <img 
                      :src="getStageImage(selectedStage)" 
                      :alt="selectedStageData.label + '示例'" 
                      @error="handleImageError" 
                    />
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <div class="detail-section-title">📋 判定标准</div>
                <p class="detail-section-text">{{ selectedStageData.criteria }}</p>
              </div>

              <div class="detail-section">
                <div class="detail-section-title">🔍 鉴别要点</div>
                <ul class="detail-section-list">
                  <li v-for="(item, idx) in selectedStageData.identification" :key="idx">
                    {{ item }}
                  </li>
                </ul>
              </div>

              <div class="detail-section">
                <div class="detail-section-title">💊 护理措施</div>
                <ul class="detail-section-list">
                  <li v-for="(item, idx) in selectedStageData.care" :key="idx">
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>

            <div v-else class="detail-empty">
              <el-icon :size="64" color="#ddd"><Reading /></el-icon>
              <p>请从左侧选择一个分期</p>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ===== 错题集 ===== -->
      <el-tab-pane label="📝 错题集" name="mistakes">
        <div class="mistakes-container">
          <div v-if="mistakesList.length > 0" class="mistakes-stats">
            <div class="stat-card">
              <span class="stat-number">{{ mistakesList.length }}</span>
              <span class="stat-label">总错题数</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ mistakeStageCount }}</span>
              <span class="stat-label">涉及分期数</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ mostMistakeStage }}</span>
              <span class="stat-label">错误最多分期</span>
            </div>
          </div>

          <div v-if="mistakesList.length === 0" class="empty-mistakes">
            <el-icon :size="64" color="#ddd"><Document /></el-icon>
            <p>暂无错题记录</p>
            <p style="font-size: 12px; color: #ccc;">完成练习后选择「保存错题」即可在此复习</p>
          </div>

          <div v-else class="mistakes-list">
            <div
              v-for="(item, index) in mistakesList"
              :key="index"
              class="mistake-item"
            >
              <div class="mistake-info-left">
                <div class="mistake-thumbnail">
                  <img 
                    v-if="item.imageUrl" 
                    :src="item.imageUrl" 
                    :alt="item.imageName || '错题图片'"
                    @error="handleThumbError"
                  />
                  <span v-else class="mistake-icon">{{ getStageIcon(item.stageKey) }}</span>
                </div>
                <div class="mistake-detail">
                  <div class="mistake-title">
                    <span class="mistake-stage">{{ getStageLabel(item.stageKey) }}</span>
                    <span class="mistake-name">{{ item.imageName || '未命名图片' }}</span>
                  </div>
                  <div class="mistake-meta">
                    <span class="mistake-count">❌ 错误 {{ item.count }} 次</span>
                    <span class="mistake-time">🕐 {{ item.lastTime }}</span>
                  </div>
                </div>
              </div>
              <div class="mistake-actions">
                <el-button size="small" type="primary" plain @click="viewStageKnowledge(item.stageKey)">
                  查看知识
                </el-button>
                <el-button size="small" type="danger" plain @click="deleteMistake(index)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { STAGE_DETAIL, STAGE_LABELS, STAGE_ICONS, STAGE_KEYS } from '@/stores/game'
import { mistakeAPI } from '@/api/mistake'

const activeTab = ref('knowledge')
const selectedStage = ref('stage_1')
const mistakesList = ref([])
const loading = ref(false)

const stageList = computed(() => {
  return STAGE_KEYS.map(key => {
    const detail = STAGE_DETAIL[key]
    return {
      key: key,
      label: detail.label,
      name: detail.name,
      enName: detail.enName,
      color: detail.color,
      icon: STAGE_ICONS[key] || '📌',
      criteria: detail.criteria,
      identification: detail.identification || [],
      care: detail.care || []
    }
  })
})

const selectedStageData = computed(() => {
  return stageList.value.find(s => s.key === selectedStage.value) || null
})

const mistakeStageCount = computed(() => {
  const stages = new Set(mistakesList.value.map(item => item.stageKey))
  return stages.size
})

const mostMistakeStage = computed(() => {
  if (mistakesList.value.length === 0) return '-'
  const stageCount = {}
  mistakesList.value.forEach(item => {
    stageCount[item.stageKey] = (stageCount[item.stageKey] || 0) + item.count
  })
  let maxKey = ''
  let maxCount = 0
  for (const [key, count] of Object.entries(stageCount)) {
    if (count > maxCount) {
      maxCount = count
      maxKey = key
    }
  }
  return getStageLabel(maxKey)
})

function getStageImage(key) {
  const imageMap = {
    stage_1: '/images/stage1.jpg',
    stage_2: '/images/stage2.jpg',
    stage_3: '/images/stage3.jpg',
    stage_4: '/images/stage4.jpg',
    unstage: '/images/unstage.jpg',
    dti: '/images/dti.jpg'
  }
  return imageMap[key] || '/images/placeholder.jpg'
}

function getStageIcon(key) {
  return STAGE_ICONS[key] || '📌'
}

function getStageLabel(key) {
  return STAGE_LABELS[key] || key
}

function selectStage(key) {
  selectedStage.value = key
}

function handleImageError(e) {
  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect width="200" height="150" fill="%23f5f5f5"/%3E%3Ctext x="50" y="80" font-size="14" fill="%23ccc"%3E图片加载失败%3C/text%3E%3C/svg%3E'
}

function handleThumbError(e) {
  e.target.style.display = 'none'
}

function viewStageKnowledge(key) {
  activeTab.value = 'knowledge'
  selectedStage.value = key
}

async function deleteMistake(index) {
  const item = mistakesList.value[index]
  ElMessageBox.confirm('确定要删除这条错题记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await mistakeAPI.deleteMistake(item.id)
      if (res.code === 200) {
        mistakesList.value.splice(index, 1)
        ElMessage.success('已删除')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

async function loadMistakes() {
  loading.value = true
  try {
    console.log('📋 开始加载错题...')
    const res = await mistakeAPI.getMistakes()
    console.log('📋 API返回:', res)
    if (res.code === 200) {
      const data = res.data || []
      console.log('📋 错题数量:', data.length)
      mistakesList.value = data.map(item => ({
        id: item.id,
        stageKey: item.stage_key,
        imageName: item.image_name || '未命名图片',
        imageUrl: item.image_url || '',
        count: item.count || 1,
        lastTime: item.last_time || '未知时间'
      }))
    }
  } catch (error) {
    console.error('加载错题失败:', error)
    mistakesList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMistakes()
})
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 20px;
  flex-shrink: 0;
}

.knowledge-header h3 {
  margin: 0;
  color: #333;
}

.knowledge-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.knowledge-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.knowledge-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.knowledge-layout {
  display: flex;
  gap: 20px;
  height: 100%;
  min-height: 500px;
}

.stage-list {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 8px 0;
  overflow-y: auto;
  max-height: 100%;
}

.stage-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.stage-list-item:hover {
  background: #f5f7fa;
}

.stage-list-item.active {
  background: #ecf5ff;
  border-left-color: #409eff;
}

.stage-list-item .stage-icon {
  font-size: 18px;
}

.stage-list-item .stage-label {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.stage-list-item .stage-name {
  font-size: 13px;
  color: #999;
  flex: 1;
}

.stage-list-item .stage-arrow {
  font-size: 14px;
  color: #ccc;
}

.stage-list-item.active .stage-arrow {
  color: #409eff;
}

.stage-detail-panel {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 24px 28px;
  overflow-y: auto;
  min-height: 400px;
}

.stage-detail-content {
  height: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 3px solid #409eff;
  margin-bottom: 20px;
}

.detail-icon {
  font-size: 28px;
}

.detail-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.detail-en {
  font-size: 14px;
  color: #999;
  margin-left: auto;
}

.detail-image-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-image-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.detail-image-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-image-item {
  width: 200px;
  height: 150px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #e8ecf1;
  flex-shrink: 0;
}

.detail-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-section {
  margin-bottom: 18px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.detail-section-text {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin: 0;
}

.detail-section-list {
  padding-left: 20px;
  margin: 0;
}

.detail-section-list li {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  gap: 12px;
}

.detail-empty p {
  margin: 0;
}

.mistakes-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mistakes-stats {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.mistakes-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-bottom: 8px;
}

.mistake-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s;
}

.mistake-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.mistake-info-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.mistake-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mistake-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mistake-thumbnail .mistake-icon {
  font-size: 28px;
}

.mistake-detail {
  flex: 1;
  min-width: 0;
}

.mistake-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.mistake-stage {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.mistake-name {
  font-size: 14px;
  color: #555;
}

.mistake-meta {
  display: flex;
  gap: 20px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.mistake-count {
  font-size: 13px;
  color: #f56c6c;
}

.mistake-time {
  font-size: 13px;
  color: #999;
}

.mistake-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.empty-mistakes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #999;
  gap: 12px;
}

.empty-mistakes p {
  margin: 0;
}

@media (max-width: 768px) {
  .knowledge-layout {
    flex-direction: column;
  }

  .stage-list {
    width: 100%;
    max-height: 200px;
    display: flex;
    flex-wrap: wrap;
    padding: 8px;
    gap: 4px;
  }

  .stage-list-item {
    padding: 8px 12px;
    border-left: none;
    border-bottom: 2px solid transparent;
    flex: 1;
    min-width: 80px;
    justify-content: center;
  }

  .stage-list-item .stage-name {
    display: none;
  }

  .stage-list-item .stage-arrow {
    display: none;
  }

  .stage-list-item.active {
    border-bottom-color: #409eff;
  }

  .stage-detail-panel {
    padding: 16px;
  }

  .detail-image-item {
    width: 100%;
    height: 120px;
  }

  .mistake-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .mistake-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .mistakes-stats {
    flex-direction: column;
  }

  .stat-card {
    padding: 12px 16px;
  }

  .detail-header {
    flex-wrap: wrap;
  }

  .detail-en {
    margin-left: 0;
    width: 100%;
  }
}
</style>