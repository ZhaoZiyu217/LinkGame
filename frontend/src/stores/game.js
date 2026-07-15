import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const STAGE_LABELS = {
  stage_1: 'Ⅰ期',
  stage_2: 'Ⅱ期',
  stage_3: 'Ⅲ期',
  stage_4: 'Ⅳ期',
  unstage: '不可分期',
  dti: 'DTI',
}

export const STAGE_ICONS = {
  stage_1: '🔴',
  stage_2: '🟠',
  stage_3: '🟡',
  stage_4: '🟢',
  unstage: '⚪',
  dti: '🟣',
}

export const STAGE_KEYS = ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'unstage', 'dti']

export const STAGE_DETAIL = {
  stage_1: {
    key: 'stage_1',
    label: 'Ⅰ期',
    name: 'Ⅰ期压疮',
    enName: 'Stage 1 Pressure Injury',
    color: '#FF5252',
    criteria: '局部皮肤完整，出现指压不变白的红斑。深色皮肤可能没有明显的苍白变化，其颜色可能与周围区域不同。皮肤可能感觉温热、发凉、质地改变或伴有疼痛/瘙痒。',
    identification: ['皮肤完整无破损，红斑指压后不褪色', '多见于骨隆突处：骶尾、足跟、髋部、肘部', '与反应性充血区别：后者指压可变白', '与瘀伤区别：瘀伤压之不褪色，但为外伤所致', '深肤色人群需注意肤色变化'],
    care: ['立即减压：每2小时翻身一次', '使用减压垫避免骨隆突受压', '保持皮肤清洁干燥', '营养评估与支持', '避免按摩骨隆突处'],
  },
  stage_2: {
    key: 'stage_2',
    label: 'Ⅱ期',
    name: 'Ⅱ期压疮',
    enName: 'Stage 2 Pressure Injury',
    color: '#FF9800',
    criteria: '部分皮层缺损，真皮层暴露。创面床为粉色或红色、湿润，也可表现为完整或破裂的浆液性水疱。无腐肉、无瘀伤。脂肪组织及深层组织不可见。',
    identification: ['表皮和/或真皮部分缺损，创面表浅呈粉红色或红色', '可表现为完整或破裂的浆液性水疱', '无腐肉、无焦痂、无瘀伤', '与MASD区别：边界不规则', '与皮肤撕脱伤区别：机械性外力造成'],
    care: ['保护创面：使用水胶体或泡沫敷料', '小水疱保持完整，大水疱无菌抽吸', '避免创面继续受压', '控制渗出液', '每次换药评估创面变化'],
  },
  stage_3: {
    key: 'stage_3',
    label: 'Ⅲ期',
    name: 'Ⅲ期压疮',
    enName: 'Stage 3 Pressure Injury',
    color: '#FFEB3B',
    criteria: '全层皮肤缺损，皮下脂肪组织可见。可能存在腐肉和/或焦痂。可能存在潜行和窦道。骨骼、肌腱或肌肉未暴露。',
    identification: ['全层皮肤缺损，皮下脂肪组织暴露', '骨骼、肌腱、肌肉未暴露', '可伴有腐肉和/或焦痂', '创面边缘可能形成潜行腔隙或窦道', '无皮下组织部位可较浅'],
    care: ['清创去除坏死组织', '负压伤口治疗适用于渗出量大者', '控制感染：根据细菌培养选用抗菌敷料', '加强营养支持', '定期测量创面尺寸'],
  },
  stage_4: {
    key: 'stage_4',
    label: 'Ⅳ期',
    name: 'Ⅳ期压疮',
    enName: 'Stage 4 Pressure Injury',
    color: '#4CAF50',
    criteria: '全层皮肤和组织缺损，骨骼、肌腱或肌肉暴露。创面床可见腐肉或焦痂。常伴有潜行和窦道。深度因解剖位置差异而不同。',
    identification: ['骨骼、肌腱、韧带或肌肉直接暴露', '常伴有广泛潜行腔隙和/或多个窦道', '可触及骨质或探查到骨面', '与Ⅲ期关键区别：深部结构暴露', '警惕骨髓炎的发生'],
    care: ['多学科团队协作', '可能需要手术清创、植皮或皮瓣修复', '全身抗生素治疗', '换药前30分钟镇痛处理', '长期营养支持计划'],
  },
  unstage: {
    key: 'unstage',
    label: '不可分期',
    name: '不可分期压疮',
    enName: 'Unstageable Pressure Injury',
    color: '#607D8B',
    criteria: '全层皮肤和组织缺损，创面被腐肉和/或焦痂覆盖，无法判定实际深度。需去除足够腐肉或焦痂后才能暴露创面底部。',
    identification: ['创面完全被腐肉或焦痂覆盖', '清创前无法确定是Ⅲ期还是Ⅳ期', '干燥完整无波动感的焦痂可不做清创', '与Ⅲ/Ⅳ期区别：分期被覆盖物遮挡', '若焦痂下有波动感/感染征象则需清创'],
    care: ['足跟部干燥稳定的焦痂：保护性处理', '有感染征象的焦痂：清创后重新分期', '评估肢端灌注状态', '密切监测焦痂周围有无红肿渗液', '清创后根据深度调整治疗方案'],
  },
  dti: {
    key: 'dti',
    label: 'DTI',
    name: '深部组织损伤',
    enName: 'Deep Tissue Pressure Injury',
    color: '#9C27B0',
    criteria: '完整的或不完整的皮肤，局部区域呈现持续的指压不变白的深红色、褐红色或紫色，或表皮分离后呈现深色创面床或充血水疱。由下方软组织的压力和/或剪切力造成。',
    identification: ['皮肤局部呈深红色、褐红色、紫色，指压不变白', '可表现为充血性水疱（血疱）', '与Ⅰ期区别：颜色更深，常伴组织硬化', '与瘀伤区别：位于骨隆突处、与持续压力相关', '可迅速恶化：数日内可进展为全层缺损'],
    care: ['立即完全减压', '保护血疱完整：勿刺破', '密切观察变化：24-72小时内可迅速恶化', '若表皮破裂：轻柔清洁并用非粘连敷料', '记录颜色、硬度、温度变化'],
  },
}

export const useGameStore = defineStore('game', () => {
  const grid = ref([])
  const rows = ref(5)
  const cols = ref(6)
  const score = ref(0)
  const time = ref(0)
  const pairs = ref(0)
  const totalPairs = ref(0)
  const wrongRecords = ref([])
  const isPlaying = ref(false)
  const isFinished = ref(false)
  const gameType = ref('practice')
  const selected = ref(null)
  const matchedPairs = ref([])
  const timerInterval = ref(null)
  const isProcessing = ref(false)
  const examScore = ref(100)
  const wrongCount = ref(0)

  let imageLibrary = {}
  let currentDifficulty = 'easy'
  
  let imageLoadResolve = null
  let imageLoadPromise = null

  // ===== 每个分期独立的值范围，扩大避免重复 =====
  const stageRanges = {
    stage_1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    stage_2: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    stage_3: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    stage_4: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
    unstage: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
    dti: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72],
  }

  const progress = computed(() => {
    if (totalPairs.value === 0) return 0
    return Math.round((pairs.value / totalPairs.value) * 100)
  })

  const elapsedTime = computed(() => {
    const minutes = Math.floor(time.value / 60)
    const seconds = time.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  function waitForImages() {
    if (Object.keys(imageLibrary).length > 0) {
      return Promise.resolve()
    }
    if (!imageLoadPromise) {
      imageLoadPromise = new Promise((resolve) => {
        imageLoadResolve = resolve
      })
    }
    return imageLoadPromise
  }

  function setImageLibrary(library) {
    imageLibrary = library
    if (imageLoadResolve) {
      imageLoadResolve()
      imageLoadResolve = null
      imageLoadPromise = null
    }
    console.log('📸 图片库已更新:', Object.keys(library).length, '个分期')
  }

  function setDifficulty(diff) {
    currentDifficulty = diff
    console.log('🎯 难度设置为:', diff)
  }

  // ===== 根据值获取分期key（更新后的范围） =====
  function getStageKey(value) {
    if (value >= 1 && value <= 12) return 'stage_1'
    if (value >= 13 && value <= 24) return 'stage_2'
    if (value >= 25 && value <= 36) return 'stage_3'
    if (value >= 37 && value <= 48) return 'stage_4'
    if (value >= 49 && value <= 60) return 'unstage'
    if (value >= 61 && value <= 72) return 'dti'
    return null
  }

  function getStageLabel(value) {
    const key = getStageKey(value)
    return key ? STAGE_LABELS[key] : '未知'
  }

  function getStageColor(value) {
    const key = getStageKey(value)
    return key ? STAGE_DETAIL[key]?.color : '#999'
  }

  function getStageDetail(stageKey) {
    return STAGE_DETAIL[stageKey] || null
  }

  async function initGame(type = 'practice', gameRows = 5, gameCols = 6) {
    console.log('⏳ 等待图片加载...')
    await waitForImages()
    
    console.log('🔥 initGame 被调用, 类型:', type, '难度:', currentDifficulty)
    gameType.value = type
    rows.value = gameRows
    cols.value = gameCols
    score.value = 0
    time.value = 0
    pairs.value = 0
    totalPairs.value = 0
    wrongRecords.value = []
    isPlaying.value = true
    isFinished.value = false
    selected.value = null
    matchedPairs.value = []
    isProcessing.value = false
    examScore.value = 100
    wrongCount.value = 0

    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }

    generateGrid()
  }

  function generateGrid() {
    console.log('🔨 generateGrid 被调用')
    console.log('📸 当前图片库分期:', Object.keys(imageLibrary))
    
    const total = rows.value * cols.value
    const pairCount = total / 2

    let stageKeys = []
    
    if (gameType.value === 'practice') {
      const diff = currentDifficulty || 'easy'
      if (diff === 'easy') {
        stageKeys = ['stage_1', 'stage_2', 'stage_3']
        console.log('🎯 体验版：3个分期')
      } else if (diff === 'medium') {
        stageKeys = ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'dti']
        console.log('🎯 进阶版：5个分期')
      } else if (diff === 'hard') {
        stageKeys = ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'unstage', 'dti']
        console.log('🎯 终结版：6个分期')
      } else {
        stageKeys = ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'unstage', 'dti']
      }
    } else {
      stageKeys = ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'unstage', 'dti']
      console.log('🎯 考试模式：6个分期')
    }

    console.log('📋 计划使用的分期:', stageKeys)

    const finalAvailableStages = stageKeys.filter(key => {
      const images = imageLibrary[key] || []
      const hasEnough = images.length >= 2
      if (!hasEnough) {
        console.warn(`⚠️ ${key} 只有 ${images.length} 张图片，不足2张，跳过`)
      }
      return hasEnough
    })

    if (finalAvailableStages.length === 0) {
      console.error('❌ 没有分期有足够的图片，使用默认值')
      const defaultValues = []
      for (let i = 1; i <= pairCount; i++) {
        defaultValues.push(i, i)
      }
      for (let i = defaultValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[defaultValues[i], defaultValues[j]] = [defaultValues[j], defaultValues[i]]
      }
      const newGrid = []
      let index = 0
      for (let i = 0; i < rows.value; i++) {
        const row = []
        for (let j = 0; j < cols.value; j++) {
          row.push(defaultValues[index++])
        }
        newGrid.push(row)
      }
      grid.value = newGrid
      totalPairs.value = pairCount
      return
    }

    console.log('📋 实际可用分期:', finalAvailableStages)

    const totalPairsNeeded = pairCount
    const stageCount = finalAvailableStages.length
    const pairsPerStage = Math.floor(totalPairsNeeded / stageCount)
    let remaining = totalPairsNeeded - (pairsPerStage * stageCount)
    
    const stageAllocation = {}
    finalAvailableStages.forEach(key => {
      stageAllocation[key] = pairsPerStage + (remaining > 0 ? 1 : 0)
      if (remaining > 0) remaining--
    })
    
    console.log('📊 各分期分配对数:', stageAllocation)

    // ===== 新的抽取和配对逻辑 =====
    const allPairs = []
    
    for (const stageKey of finalAvailableStages) {
      const pairCountForStage = stageAllocation[stageKey] || 1
      const images = imageLibrary[stageKey] || []
      const totalAvailable = images.length
      const range = stageRanges[stageKey] || [1, 2, 3, 4]
      
      console.log(`📸 ${stageKey}: 需要 ${pairCountForStage} 对，共 ${totalAvailable} 张图片`)
      
      // 需要的图片数量
      const neededImages = pairCountForStage * 2
      
      // 从图片池中抽取不重复的图片
      let selectedImages = []
      if (totalAvailable >= neededImages) {
        // 图片够用：随机抽取不重复的
        const shuffled = [...images].sort(() => Math.random() - 0.5)
        selectedImages = shuffled.slice(0, neededImages)
      } else {
        // 图片不够：循环使用
        const shuffled = [...images].sort(() => Math.random() - 0.5)
        const fullCopies = Math.floor(neededImages / totalAvailable)
        const remainder = neededImages % totalAvailable
        
        for (let i = 0; i < fullCopies; i++) {
          selectedImages.push(...shuffled)
        }
        selectedImages.push(...shuffled.slice(0, remainder))
      }
      
      console.log(`📸 ${stageKey}: 抽取了 ${selectedImages.length} 张图片`)
      
      // 随机打乱选中的图片，然后两两配对
      const shuffledSelected = [...selectedImages].sort(() => Math.random() - 0.5)
      
      // 从 range 中取不重复的值分配给每对
      // 如果需要的值超过 range 长度，循环使用但确保同一对中不同
      for (let i = 0; i < shuffledSelected.length; i += 2) {
        if (i + 1 >= shuffledSelected.length) break
        
        // 用 i 作为种子取两个不同的值
        const idx1 = i % range.length
        let idx2 = (i + 1) % range.length
        // 确保 idx1 和 idx2 不同
        if (idx1 === idx2) {
          idx2 = (idx1 + 1) % range.length
        }
        
        const v1 = range[idx1]
        const v2 = range[idx2]
        
        allPairs.push({
          stageKey: stageKey,
          value1: v1,
          value2: v2,
        })
      }
    }

    console.log('📊 共生成', allPairs.length, '对')

    // 打乱所有配对
    const shuffledPairs = [...allPairs].sort(() => Math.random() - 0.5)

    // 填充棋盘
    const values = []
    for (const pair of shuffledPairs) {
      values.push(pair.value1, pair.value2)
    }

    // 补全（理论上不会）
    while (values.length < total) {
      values.push(1, 1)
    }

    const newGrid = []
    let index = 0
    for (let i = 0; i < rows.value; i++) {
      const row = []
      for (let j = 0; j < cols.value; j++) {
        row.push(values[index++])
      }
      newGrid.push(row)
    }

    grid.value = newGrid
    totalPairs.value = pairCount
    console.log('📊 棋盘生成完成，总对数:', pairCount)
    console.log('📊 棋盘值示例:', newGrid[0]?.slice(0, 4))
  }

  function selectCell(x, y) {
    console.log('🔥 selectCell 被调用了!', x, y)
    
    if (!isPlaying.value || isFinished.value) {
      console.log('❌ 游戏未进行或已结束')
      return
    }
    if (isProcessing.value) {
      console.log('⏳ 正在处理中...')
      return
    }
    if (grid.value[x][y] === 0) {
      console.log('⬜ 空格子')
      return
    }

    if (matchedPairs.value.some(p => (p.x1 === x && p.y1 === y) || (p.x2 === x && p.y2 === y))) {
      console.log('✅ 已匹配过的格子')
      return
    }

    if (selected.value === null) {
      console.log('🎯 选中第一个格子:', x, y)
      selected.value = { x, y }
      return
    }

    if (selected.value.x === x && selected.value.y === y) {
      console.log('🔄 取消选中')
      selected.value = null
      return
    }

    const first = selected.value
    const firstValue = grid.value[first.x][first.y]
    const secondValue = grid.value[x][y]

    const firstStage = getStageKey(firstValue)
    const secondStage = getStageKey(secondValue)

    console.log('🔍 匹配尝试:', firstValue, '→', firstStage, 'vs', secondValue, '→', secondStage)

    if (firstStage !== null && firstStage === secondStage) {
      console.log('✅ 同期配对成功！', STAGE_LABELS[firstStage])
      
      grid.value[first.x][first.y] = 0
      grid.value[x][y] = 0
      
      pairs.value += 1
      score.value += 10 + Math.max(0, 20 - Math.floor(time.value / 10))
      matchedPairs.value.push({
        x1: first.x,
        y1: first.y,
        x2: x,
        y2: y,
        value1: firstValue,
        value2: secondValue,
        stageKey: firstStage,
      })
      
      selected.value = null
      isProcessing.value = false

      if (pairs.value === totalPairs.value) {
        finishGame(true)
      }
    } else {
      console.log('❌ 分期不同，匹配失败')
      wrongCount.value += 1
      examScore.value = Math.max(0, examScore.value - 5)
      console.log('📝 当前成绩:', examScore.value, '错误次数:', wrongCount.value)

      const secondImages = imageLibrary[secondStage] || []
      const secondImageUrl = secondImages.length > 0 
        ? secondImages[(secondValue - 1) % secondImages.length] 
        : null

      const finalImageUrl = secondImageUrl || '/images/placeholder.jpg'

      wrongRecords.value.push({
        value1: firstValue,
        value2: secondValue,
        stageKey1: firstStage,
        stageKey2: secondStage,
        stageKey: secondStage,
        value: secondValue,
        x1: first.x,
        y1: first.y,
        x2: x,
        y2: y,
        time: time.value,
        imageUrl: finalImageUrl,
        imageName: STAGE_LABELS[secondStage] || '未知图片'
      })
      
      selected.value = null
      isProcessing.value = false
      
      if (examScore.value === 0) {
        console.log('💀 成绩归零，游戏结束')
        finishGame(false)
      }
    }
  }

  function startTimer() {
    console.log('⏱️ 开始计时')
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
    timerInterval.value = setInterval(() => {
      time.value += 1
    }, 1000)
  }

  function finishGame(win = true) {
    console.log('🏁 游戏结束:', win ? '胜利' : '失败', '成绩:', examScore.value)
    isPlaying.value = false
    isFinished.value = true
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  function resetGame() {
    console.log('🔄 重置游戏')
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    grid.value = []
    score.value = 0
    time.value = 0
    pairs.value = 0
    totalPairs.value = 0
    wrongRecords.value = []
    isPlaying.value = false
    isFinished.value = false
    selected.value = null
    matchedPairs.value = []
    isProcessing.value = false
    examScore.value = 100
    wrongCount.value = 0
  }

  return {
    grid,
    rows,
    cols,
    score,
    time,
    pairs,
    totalPairs,
    wrongRecords,
    isPlaying,
    isFinished,
    gameType,
    selected,
    matchedPairs,
    examScore,
    wrongCount,
    progress,
    elapsedTime,
    getStageKey,
    getStageLabel,
    getStageColor,
    getStageDetail,
    setImageLibrary,
    setDifficulty,
    waitForImages,
    initGame,
    selectCell,
    startTimer,
    finishGame,
    resetGame,
  }
})