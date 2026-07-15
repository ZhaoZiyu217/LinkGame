<template>
  <div class="page-container">
    <div class="profile-layout">
      <!-- 左侧：个人信息 -->
      <div class="profile-left">
        <div class="profile-card">
          <div class="avatar-section">
            <el-avatar :size="80" icon="UserFilled" />
            <h3>{{ userStore.realName || userStore.username }}</h3>
            <p class="username">@{{ userStore.username }}</p>
            <el-tag size="small" :type="userStore.isAdmin ? 'danger' : 'success'">
              {{ userStore.isAdmin ? '管理员' : '普通用户' }}
            </el-tag>
            <p class="hospital">🏥 {{ userStore.userInfo?.hospital_name || '未绑定医院' }}</p>
          </div>

          <div class="info-divider"></div>

          <div class="stats-grid">
            <div class="stats-item">
              <span class="stats-number">{{ userStore.userInfo?.score || 0 }}</span>
              <span class="stats-label">总积分</span>
            </div>
            <div class="stats-item">
              <span class="stats-number">{{ statistics.totalExams || 0 }}</span>
              <span class="stats-label">考试次数</span>
            </div>
            <div class="stats-item">
              <span class="stats-number">{{ statistics.avgScore || 0 }}</span>
              <span class="stats-label">平均分</span>
            </div>
            <div class="stats-item">
              <span class="stats-number">{{ statistics.maxScore || 0 }}</span>
              <span class="stats-label">最高分</span>
            </div>
          </div>
        </div>

        <!-- 管理员入口 -->
        <div v-if="userStore.isAdmin" class="admin-entry">
          <el-button type="danger" size="large" @click="enterAdmin">
            <el-icon><Setting /></el-icon> 进入管理员后台
          </el-button>
          <p style="font-size: 12px; color: #999; margin-top: 8px;">需要二次密码验证</p>
        </div>
      </div>

      <!-- 右侧：排行榜 -->
      <div class="profile-right">
        <div class="ranking-card">
          <h4>🏆 本院排行榜（按平均分）</h4>
          <div v-if="rankingList.length === 0" class="empty-ranking">
            <p>暂无排名数据</p>
          </div>
          <div v-else class="ranking-list">
            <div
              v-for="(item, index) in rankingList"
              :key="item.id"
              class="ranking-item"
              :class="{ 'is-me': item.id === userStore.userInfo?.id }"
            >
              <span class="ranking-index">{{ index + 1 }}</span>
              <span class="ranking-name">{{ item.real_name || item.username }}</span>
              <span class="ranking-score">{{ item.avg_score || 0 }}分</span>
              <span class="ranking-badge" v-if="index === 0">🥇</span>
              <span class="ranking-badge" v-else-if="index === 1">🥈</span>
              <span class="ranking-badge" v-else-if="index === 2">🥉</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { recordAPI } from '@/api/record'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const statistics = ref({
  totalExams: 0,
  avgScore: 0,
  maxScore: 0,
  minScore: 0
})

const rankingList = ref([])

async function loadStatistics() {
  try {
    const res = await recordAPI.getStatistics()
    console.log('📊 统计返回数据:', res)
    if (res.code === 200) {
      statistics.value = {
        totalExams: res.data.totalExams || 0,
        avgScore: res.data.avgScore || 0,
        maxScore: res.data.maxScore || 0,
        minScore: res.data.minScore || 0
      }
    }
  } catch (error) {
    console.error('加载统计失败:', error)
    statistics.value = {
      totalExams: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0
    }
  }
}

async function loadRanking() {
  try {
    const res = await recordAPI.getRanking()
    console.log('🏆 排行榜返回数据:', res)
    if (res.code === 200) {
      rankingList.value = res.data || []
    }
  } catch (error) {
    console.error('加载排行榜失败:', error)
    rankingList.value = []
  }
}

function enterAdmin() {
  ElMessageBox.prompt('请输入管理员密码', '管理员验证', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password',
    inputPlaceholder: '请输入管理员密码',
  }).then(({ value }) => {
    if (value === 'admin123') {
      router.push('/admin')
    } else {
      ElMessage.error('密码错误')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadStatistics()
  loadRanking()
})
</script>

<style scoped>
.page-container {
  height: 100%;
}

.profile-layout {
  display: flex;
  gap: 20px;
  height: 100%;
}

.profile-left {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-right {
  flex: 1;
  min-width: 0;
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px 24px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.avatar-section {
  text-align: center;
}

.avatar-section h3 {
  margin: 12px 0 4px;
  font-size: 18px;
  color: #333;
}

.avatar-section .username {
  color: #999;
  font-size: 14px;
  margin: 0 0 8px;
}

.avatar-section .hospital {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}

.info-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 16px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stats-item {
  text-align: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stats-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stats-label {
  font-size: 12px;
  color: #999;
}

.admin-entry {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.admin-entry .el-button {
  width: 100%;
}

.ranking-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  height: 100%;
}

.ranking-card h4 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.2s;
}

.ranking-item.is-me {
  background: #ecf5ff;
  border: 1px solid #409eff;
}

.ranking-index {
  width: 30px;
  font-weight: bold;
  color: #999;
  font-size: 14px;
}

.ranking-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.ranking-score {
  font-weight: bold;
  color: #409eff;
  margin-right: 8px;
}

.ranking-badge {
  font-size: 18px;
}

.empty-ranking {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

@media (max-width: 768px) {
  .profile-layout {
    flex-direction: column;
  }
  
  .profile-left {
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>