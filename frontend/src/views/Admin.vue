<template>
  <div class="page-container">
    <div class="admin-header">
      <h3>⚙️ 管理员后台</h3>
      <p style="color: #999; font-size: 14px;">管理本院压疮图库、学习数据与系统配置</p>
    </div>

    <el-tabs v-model="activeTab" class="admin-tabs">
      <!-- ===== Tab1: 数据概览 ===== -->
      <el-tab-pane label="📊 数据概览" name="overview">
        <div class="overview-grid">
          <div class="overview-card">
            <div class="overview-number">{{ overview.totalUsers || 0 }}</div>
            <div class="overview-label">本院用户数</div>
          </div>
          <div class="overview-card">
            <div class="overview-number">{{ overview.totalExams || 0 }}</div>
            <div class="overview-label">总考试次数</div>
          </div>
          <div class="overview-card">
            <div class="overview-number">{{ overview.avgScore || 0 }}</div>
            <div class="overview-label">全院平均分</div>
          </div>
          <div class="overview-card">
            <div class="overview-number">{{ overview.totalImages || 0 }}</div>
            <div class="overview-label">图库图片数</div>
          </div>
        </div>

        <div class="recent-records">
          <h4>📋 近期考试记录</h4>
          <el-table :data="recentRecords" style="width: 100%;" v-loading="loading">
            <el-table-column prop="username" label="用户" />
            <el-table-column prop="real_name" label="姓名" />
            <el-table-column prop="score" label="成绩" />
            <el-table-column prop="duration" label="用时(秒)" />
            <el-table-column prop="wrong_count" label="错误数" />
            <el-table-column prop="created_at" label="考试时间" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- ===== Tab2: 图库管理 ===== -->
      <el-tab-pane label="🖼️ 图库管理" name="gallery">
        <div class="gallery-toolbar">
          <input
            type="file"
            ref="fileInput"
            accept="image/png,image/jpeg"
            style="display:none"
            @change="handleFileChange"
          />
          <input
            type="file"
            ref="batchFileInput"
            accept="image/png,image/jpeg"
            style="display:none"
            multiple
            @change="handleBatchFileChange"
          />
          <el-button type="primary" @click="triggerFileInput">
            <el-icon><Upload /></el-icon> 上传压疮图片
          </el-button>
          <el-button type="success" @click="triggerBatchFileInput">
            <el-icon><Folder /></el-icon> 批量上传
          </el-button>
          <el-select v-model="filterStage" placeholder="按分期筛选" clearable @change="loadImages">
            <el-option
              v-for="stage in stageOptions"
              :key="stage.key"
              :label="stage.label"
              :value="stage.key"
            />
          </el-select>
          <el-button @click="loadImages" size="small">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>

        <div class="gallery-grid" v-loading="loading">
          <div
            v-for="img in imageList"
            :key="img.id"
            class="gallery-item"
          >
            <img :src="img.image_url" :alt="img.name" @error="handleImageError" />
            <div class="gallery-info">
              <span class="gallery-name">{{ img.name }}</span>
              <span class="gallery-stage">{{ getStageLabel(img.stage) }}</span>
            </div>
            <div class="gallery-actions">
              <el-button size="small" type="primary" plain @click="openEditDialog(img)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" type="danger" plain @click="deleteImage(img.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div v-if="imageList.length === 0" class="gallery-empty">
            <el-icon :size="48" color="#ddd"><Picture /></el-icon>
            <p>暂无图片，点击「上传压疮图片」添加</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- ===== Tab3: 员工管理 ===== -->
      <el-tab-pane label="👥 员工管理" name="records">
        <div class="records-toolbar">
          <el-button type="success" @click="exportData">
            <el-icon><Download /></el-icon> 导出数据
          </el-button>
          <span style="color: #999; font-size: 13px;">共 {{ allRecords.length }} 名员工</span>
        </div>

        <el-table :data="allRecords" style="width: 100%;" v-loading="loading" max-height="500">
          <el-table-column prop="rank_num" label="排名" width="80" align="center">
            <template #default="{ row }">
              <span v-if="row.rank_num <= 3" style="font-size:20px;">
                {{ row.rank_num === 1 ? '🥇' : row.rank_num === 2 ? '🥈' : '🥉' }}
              </span>
              <span v-else>{{ row.rank_num || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="real_name" label="姓名" width="100" />
          <el-table-column prop="exam_count" label="考试次数" width="100" align="center" />
          <el-table-column prop="total_score" label="总积分" width="100" align="center" />
          <el-table-column prop="avg_score" label="平均分" width="100" align="center" />
          <el-table-column prop="max_score" label="最高分" width="100" align="center" />
        </el-table>
      </el-tab-pane>

      <!-- ===== Tab4: 考试管理 ===== -->
      <el-tab-pane label="📝 考试管理" name="exam">
        <div class="exam-setting">
          <div class="exam-toolbar">
            <el-button type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon> 发布考试
            </el-button>
            <el-button @click="loadExams" size="small">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>

          <el-table :data="examList" style="width: 100%;" v-loading="loading" max-height="500">
            <el-table-column prop="title" label="考试名称" width="180" />
            <el-table-column prop="difficulty" label="难度" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getDifficultyLabel(row.difficulty) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_time_str" label="开始时间" width="160" />
            <el-table-column prop="end_time_str" label="结束时间" width="160" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'published' ? 'success' : row.status === 'ended' ? 'danger' : 'info'" size="small">
                  {{ row.status === 'published' ? '进行中' : row.status === 'ended' ? '已结束' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button v-if="row.status === 'published'" size="small" type="danger" @click="endExam(row.id)">
                  结束考试
                </el-button>
                <span v-else style="color:#999;font-size:12px;">已结束</span>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="examList.length === 0" class="exam-empty-table">
            <p style="color:#999;">暂无考试，点击「发布考试」创建</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- ===== Tab5: 医院设置 ===== -->
      <el-tab-pane label="🏥 医院设置" name="hospital">
        <div class="hospital-setting">
          <el-form :model="hospitalForm" label-width="100px" style="max-width:500px;">
            <el-form-item label="医院名称" required>
              <el-input v-model="hospitalForm.name" placeholder="请输入医院名称" />
            </el-form-item>
            <el-form-item label="医院编码" required>
              <el-input v-model="hospitalForm.code" placeholder="请输入医院编码（如H001）" />
            </el-form-item>
            <el-form-item label="医院地址">
              <el-input v-model="hospitalForm.address" placeholder="请输入医院地址" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="hospitalForm.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="hospitalSaving" @click="saveHospital">
                保存设置
              </el-button>
              <el-button @click="loadHospitalInfo">重置</el-button>
            </el-form-item>
          </el-form>
          <div style="color:#999;font-size:13px;margin-top:12px;">
            <p>💡 医院编码用于用户注册时绑定医院，修改后请通知用户</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ===== 上传对话框 ===== -->
    <el-dialog v-model="uploadDialogVisible" title="上传压疮图片" width="450px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="图片名称" required>
          <el-input v-model="uploadForm.name" placeholder="请输入图片名称" />
        </el-form-item>
        <el-form-item label="所属分期" required>
          <el-select v-model="uploadForm.stage" placeholder="请选择分期" style="width:100%">
            <el-option
              v-for="stage in stageOptions"
              :key="stage.key"
              :label="stage.label"
              :value="stage.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="2" placeholder="可选填写图片描述" />
        </el-form-item>
        <el-form-item label="图片文件">
          <span style="color:#999;font-size:13px;">{{ uploadForm.fileName || '未选择文件' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="confirmUpload">确认上传</el-button>
      </template>
    </el-dialog>

    <!-- ===== 编辑对话框 ===== -->
    <el-dialog v-model="editDialogVisible" title="编辑图片信息" width="450px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="图片名称" required>
          <el-input v-model="editForm.name" placeholder="请输入图片名称" />
        </el-form-item>
        <el-form-item label="所属分期" required>
          <el-select v-model="editForm.stage" placeholder="请选择分期" style="width:100%">
            <el-option
              v-for="stage in stageOptions"
              :key="stage.key"
              :label="stage.label"
              :value="stage.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="2" placeholder="可选填写图片描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="confirmEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- ===== 创建考试对话框 ===== -->
    <el-dialog v-model="createDialogVisible" title="发布考试" width="500px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="考试名称" required>
          <el-input v-model="createForm.title" placeholder="请输入考试名称" />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="createForm.difficulty" style="width:100%">
            <el-option label="体验版" value="easy" />
            <el-option label="进阶版" value="medium" />
            <el-option label="终结版" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-input v-model="createForm.start_time" placeholder="格式：2026-01-15 14:00" />
          <span style="font-size:12px;color:#999;">格式：YYYY-MM-DD HH:mm</span>
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-input v-model="createForm.end_time" placeholder="格式：2026-01-15 15:00" />
          <span style="font-size:12px;color:#999;">格式：YYYY-MM-DD HH:mm</span>
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="createForm.duration" :min="60" :max="600" /> 秒
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreate">发布</el-button>
      </template>
    </el-dialog>

    <!-- ===== 批量上传对话框 ===== -->
    <el-dialog v-model="batchUploadDialogVisible" title="批量上传图片" width="500px">
      <div style="margin-bottom:16px;">
        <p style="font-weight:bold;color:#333;">已选择 {{ batchFiles.length }} 张图片</p>
        <p style="font-size:12px;color:#999;margin-top:4px;">所有图片将设置为同一分期</p>
      </div>
      <el-form :model="batchForm" label-width="80px">
        <el-form-item label="所属分期" required>
          <el-select v-model="batchForm.stage" placeholder="请选择分期" style="width:100%">
            <el-option
              v-for="stage in stageOptions"
              :key="stage.key"
              :label="stage.label"
              :value="stage.key"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchUploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchUploading" @click="confirmBatchUpload">
          确认上传 {{ batchFiles.length }} 张
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { adminAPI } from '@/api/admin'
import { libraryAPI } from '@/api/library'
import { examAPI } from '@/api/exam'

const userStore = useUserStore()
const activeTab = ref('overview')
const loading = ref(false)
const filterStage = ref('')
const fileInput = ref(null)
const batchFileInput = ref(null)

const uploadUrl = '/api/library/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

const stageOptions = [
  { key: 'stage_1', label: 'Ⅰ期' },
  { key: 'stage_2', label: 'Ⅱ期' },
  { key: 'stage_3', label: 'Ⅲ期' },
  { key: 'stage_4', label: 'Ⅳ期' },
  { key: 'unstage', label: '不可分期' },
  { key: 'dti', label: 'DTI' }
]

const overview = reactive({
  totalUsers: 0,
  totalExams: 0,
  avgScore: 0,
  totalImages: 0
})

const recentRecords = ref([])
const imageList = ref([])
const allRecords = ref([])

const uploadDialogVisible = ref(false)
const uploading = ref(false)
const uploadForm = reactive({
  name: '',
  stage: '',
  description: '',
  fileName: '',
  file: null
})

const editDialogVisible = ref(false)
const editing = ref(false)
const editForm = reactive({
  id: '',
  name: '',
  stage: '',
  description: ''
})

// ===== 批量上传 =====
const batchUploadDialogVisible = ref(false)
const batchUploading = ref(false)
const batchFiles = ref([])
const batchForm = reactive({
  stage: ''
})

// ===== 考试管理 =====
const examList = ref([])
const createDialogVisible = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  title: '',
  difficulty: 'hard',
  start_time: '',
  end_time: '',
  duration: 300
})

// ===== 医院设置 =====
const hospitalSaving = ref(false)
const hospitalForm = reactive({
  name: '',
  code: '',
  address: '',
  contact_phone: ''
})

function getStageLabel(key) {
  const map = {
    stage_1: 'Ⅰ期',
    stage_2: 'Ⅱ期',
    stage_3: 'Ⅲ期',
    stage_4: 'Ⅳ期',
    unstage: '不可分期',
    dti: 'DTI'
  }
  return map[key] || key
}

function getDifficultyLabel(key) {
  const map = { easy: '体验版', medium: '进阶版', hard: '终结版' }
  return map[key] || key
}

// ===== 单张上传 =====
function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('仅支持 JPG/PNG 格式')
    event.target.value = ''
    return
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    event.target.value = ''
    return
  }

  uploadForm.file = file
  uploadForm.fileName = file.name
  uploadForm.name = file.name.replace(/\.[^/.]+$/, '')
  uploadForm.stage = filterStage.value || ''
  uploadForm.description = ''
  uploadDialogVisible.value = true

  event.target.value = ''
}

async function confirmUpload() {
  if (!uploadForm.name) {
    ElMessage.warning('请输入图片名称')
    return
  }
  if (!uploadForm.stage) {
    ElMessage.warning('请选择所属分期')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', uploadForm.file)
    formData.append('name', uploadForm.name)
    formData.append('stage', uploadForm.stage)
    formData.append('description', uploadForm.description || '')

    const res = await libraryAPI.uploadImage(formData)
    if (res.code === 200) {
      ElMessage.success('上传成功')
      uploadDialogVisible.value = false
      uploadForm.file = null
      uploadForm.fileName = ''
      loadImages()
      loadOverview()
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

// ===== 批量上传 =====
function triggerBatchFileInput() {
  if (batchFileInput.value) {
    batchFileInput.value.click()
  }
}

function handleBatchFileChange(event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  let validFiles = []
  let invalidCount = 0
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
    const isLt5M = file.size / 1024 / 1024 < 5
    if (isImage && isLt5M) {
      validFiles.push(file)
    } else {
      invalidCount++
    }
  }

  if (invalidCount > 0) {
    ElMessage.warning(`${invalidCount} 个文件格式或大小不符合要求，已跳过`)
  }

  if (validFiles.length === 0) {
    ElMessage.error('没有有效的图片文件')
    event.target.value = ''
    return
  }

  batchFiles.value = validFiles
  batchForm.stage = filterStage.value || ''
  batchUploadDialogVisible.value = true
  event.target.value = ''
}

async function confirmBatchUpload() {
  if (!batchForm.stage) {
    ElMessage.warning('请选择所属分期')
    return
  }

  batchUploading.value = true
  let successCount = 0
  let failCount = 0

  for (const file of batchFiles.value) {
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''))
      formData.append('stage', batchForm.stage)
      formData.append('description', '')

      const res = await libraryAPI.uploadImage(formData)
      if (res.code === 200) {
        successCount++
      } else {
        failCount++
      }
    } catch (error) {
      failCount++
      console.error('上传失败:', file.name, error)
    }
  }

  batchUploading.value = false
  batchUploadDialogVisible.value = false
  batchFiles.value = []
  
  ElMessage.success(`上传完成：成功 ${successCount} 张，失败 ${failCount} 张`)
  loadImages()
  loadOverview()
}

function handleImageError(e) {
  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect width="200" height="150" fill="%23f5f5f5"/%3E%3Ctext x="50" y="80" font-size="14" fill="%23ccc"%3E图片加载失败%3C/text%3E%3C/svg%3E'
}

function openEditDialog(img) {
  editForm.id = img.id
  editForm.name = img.name
  editForm.stage = img.stage || ''
  editForm.description = img.description || ''
  editDialogVisible.value = true
}

async function confirmEdit() {
  if (!editForm.name) {
    ElMessage.warning('请输入图片名称')
    return
  }
  if (!editForm.stage) {
    ElMessage.warning('请选择所属分期')
    return
  }

  editing.value = true
  try {
    const index = imageList.value.findIndex(img => img.id === editForm.id)
    if (index !== -1) {
      imageList.value[index].name = editForm.name
      imageList.value[index].stage = editForm.stage
      imageList.value[index].description = editForm.description
    }
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    loadOverview()
  } catch (error) {
    console.error('编辑失败:', error)
    ElMessage.error('编辑失败')
  } finally {
    editing.value = false
  }
}

async function loadOverview() {
  loading.value = true
  try {
    const res = await adminAPI.getOverview()
    if (res.code === 200) {
      overview.totalUsers = res.data.totalUsers || 0
      overview.totalExams = res.data.totalExams || 0
      overview.avgScore = res.data.avgScore || 0
      overview.totalImages = res.data.totalImages || 0
      recentRecords.value = res.data.recentRecords || []
    }
  } catch (error) {
    console.error('加载概览失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadImages() {
  loading.value = true
  try {
    const params = { size: 100 }
    if (filterStage.value) {
      params.stage = filterStage.value
    }
    const res = await libraryAPI.getList(params)
    if (res.code === 200) {
      imageList.value = res.data.list || []
    }
  } catch (error) {
    console.error('加载图片失败:', error)
    ElMessage.error('加载图片失败')
  } finally {
    loading.value = false
  }
}

async function deleteImage(id) {
  ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await libraryAPI.deleteImage(id)
      if (res.code === 200) {
        imageList.value = imageList.value.filter(img => img.id !== id)
        ElMessage.success('删除成功')
        loadOverview()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

async function loadAllRecords() {
  loading.value = true
  try {
    const res = await adminAPI.getRecords({ page: 1, size: 100 })
    if (res.code === 200) {
      allRecords.value = res.data.list || []
    }
  } catch (error) {
    console.error('加载员工信息失败:', error)
  } finally {
    loading.value = false
  }
}

async function exportData() {
  try {
    const res = await adminAPI.exportData()
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `员工数据_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// ===== 考试管理 =====
async function loadExams() {
  loading.value = true
  try {
    const res = await examAPI.getList()
    if (res.code === 200) {
      examList.value = res.data || []
    }
  } catch (error) {
    console.error('加载考试列表失败:', error)
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  createForm.title = ''
  createForm.difficulty = 'hard'
  createForm.start_time = ''
  createForm.end_time = ''
  createForm.duration = 300
  createDialogVisible.value = true
}

async function submitCreate() {
  if (!createForm.title) {
    ElMessage.warning('请输入考试名称')
    return
  }
  if (!createForm.start_time) {
    ElMessage.warning('请选择开始时间')
    return
  }
  if (!createForm.end_time) {
    ElMessage.warning('请选择结束时间')
    return
  }

  createLoading.value = true
  try {
    const res = await examAPI.create({
      title: createForm.title,
      difficulty: createForm.difficulty,
      start_time: createForm.start_time,
      end_time: createForm.end_time,
      duration: createForm.duration
    })
    if (res.code === 200) {
      ElMessage.success('考试发布成功')
      createDialogVisible.value = false
      loadExams()
    }
  } catch (error) {
    console.error('发布考试失败:', error)
    ElMessage.error('发布失败')
  } finally {
    createLoading.value = false
  }
}

async function endExam(id) {
  ElMessageBox.confirm('确定要结束这场考试吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await examAPI.endExam(id)
      if (res.code === 200) {
        ElMessage.success('考试已结束')
        loadExams()
      }
    } catch (error) {
      ElMessage.error('结束失败')
    }
  }).catch(() => {})
}

// ===== 医院设置 =====
async function loadHospitalInfo() {
  try {
    const res = await adminAPI.getHospital()
    if (res.code === 200) {
      hospitalForm.name = res.data.name || ''
      hospitalForm.code = res.data.code || ''
      hospitalForm.address = res.data.address || ''
      hospitalForm.contact_phone = res.data.contact_phone || ''
    }
  } catch (error) {
    console.error('加载医院信息失败:', error)
    ElMessage.error('加载医院信息失败')
  }
}

async function saveHospital() {
  if (!hospitalForm.name) {
    ElMessage.warning('请输入医院名称')
    return
  }
  if (!hospitalForm.code) {
    ElMessage.warning('请输入医院编码')
    return
  }

  hospitalSaving.value = true
  try {
    const res = await adminAPI.updateHospital({
      name: hospitalForm.name,
      code: hospitalForm.code,
      address: hospitalForm.address,
      contact_phone: hospitalForm.contact_phone
    })
    if (res.code === 200) {
      ElMessage.success('医院信息保存成功')
      await userStore.refreshUserInfo()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存医院信息失败:', error)
    ElMessage.error('保存失败')
  } finally {
    hospitalSaving.value = false
  }
}

onMounted(() => {
  loadOverview()
  loadImages()
  loadAllRecords()
  loadHospitalInfo()
  loadExams()
})
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.admin-header {
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
.admin-header h3 {
  margin: 0;
  color: #333;
}
.admin-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.admin-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.overview-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.overview-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}
.overview-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}
.recent-records {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.recent-records h4 {
  margin: 0 0 16px;
  color: #333;
}
.gallery-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.gallery-item {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  position: relative;
}
.gallery-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}
.gallery-info {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.gallery-name {
  font-size: 13px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gallery-stage {
  font-size: 12px;
  color: #999;
  background: #f5f7fa;
  padding: 2px 10px;
  border-radius: 10px;
  flex-shrink: 0;
}
.gallery-actions {
  display: flex;
  gap: 4px;
  padding: 4px 12px 10px;
}
.gallery-actions .el-button {
  flex: 1;
}
.gallery-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #999;
}
.gallery-empty p {
  margin-top: 12px;
}
.records-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.exam-setting {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.exam-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.exam-empty-table {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
.hospital-setting {
  background: #fff;
  border-radius: 8px;
  padding: 24px 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr 1fr;
  }
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  .hospital-setting {
    padding: 16px;
  }
}
</style>