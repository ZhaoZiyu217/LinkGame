/**
 * practice.js — 练习模块完整游戏逻辑
 * 难度选择 → 连连看棋盘 → 结算落地
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  var C  = global.AppConfig.CONFIG;
  var ST = global.AppConfig.STAGE;
  var DI = global.AppConfig.DIFFICULTY;

  // ==================== 压疮分期医学知识库 ====================

  /** 六分期详细医学资料（用于分期详情弹窗） */
  var STAGE_DETAIL = {};

  STAGE_DETAIL[ST.I.key] = {
    name: 'Ⅰ期压疮',
    enName: 'Stage 1 Pressure Injury',
    criteria: '局部皮肤完整，出现指压不变白的红斑（通常位于骨隆突处）。深色皮肤可能没有明显的苍白变化，其颜色可能与周围区域不同。皮肤可能感觉温热、发凉、质地改变或伴有疼痛/瘙痒。',
    identification: [
      '皮肤完整无破损，红斑指压后不褪色（不变白）',
      '多见于骨隆突处：骶尾、足跟、髋部、肘部',
      '与反应性充血（暂时性红斑）区别：后者指压可变白，通常30分钟内消退',
      '与瘀伤区别：瘀伤压之不褪色，但为外伤/撞击所致',
      '深肤色人群需注意肤色变化：可能呈紫色、蓝色或比周围皮肤更深的颜色',
    ],
    care: [
      '立即减压：每2小时翻身一次，使用翻身时间表',
      '使用减压垫（泡沫垫、气垫床）避免骨隆突受压',
      '保持皮肤清洁干燥，使用pH平衡的皮肤清洁剂',
      '营养评估与支持：蛋白质、维生素C、锌的摄入',
      '避免按摩骨隆突处，按摩可导致组织损伤加重',
    ],
  };

  STAGE_DETAIL[ST.II.key] = {
    name: 'Ⅱ期压疮',
    enName: 'Stage 2 Pressure Injury',
    criteria: '部分皮层缺损，真皮层暴露。创面床为粉色或红色、湿润，也可表现为完整或破裂的浆液性水疱。无腐肉、无瘀伤。脂肪组织及深层组织不可见。',
    identification: [
      '表皮和/或真皮部分缺损，创面表浅呈粉红色或红色',
      '可表现为完整或破裂的浆液性水疱（非血疱）',
      '无腐肉、无焦痂、无瘀伤、无皮下脂肪暴露',
      '与潮湿相关性皮肤损伤(MASD)区别：MASD边界不规则、呈浅表糜烂',
      '与皮肤撕脱伤区别：皮肤撕脱伤为机械性外力造成的全层或部分层皮肤分离',
    ],
    care: [
      '保护创面：使用水胶体敷料或泡沫敷料覆盖',
      '小水疱保持完整不要刺破；大水疱可在无菌条件下抽吸',
      '避免创面继续受压：继续执行减压方案',
      '控制渗出液：根据渗液多少选择合适吸收能力的敷料',
      '每次更换敷料时评估创面变化，记录大小、颜色、渗液性状',
    ],
  };

  STAGE_DETAIL[ST.III.key] = {
    name: 'Ⅲ期压疮',
    enName: 'Stage 3 Pressure Injury',
    criteria: '全层皮肤缺损，皮下脂肪组织可见。可能存在腐肉和/或焦痂。可能存在潜行和窦道。骨骼、肌腱或肌肉未暴露。深度因解剖位置差异而不同（鼻梁、耳廓、枕部、踝部无皮下组织，Ⅲ期压疮在这些部位可能较浅）。',
    identification: [
      '全层皮肤缺损，皮下脂肪组织暴露/可见',
      '骨骼、肌腱、肌肉未暴露（这是与Ⅳ期的关键区别）',
      '可伴有腐肉（黄色/灰色）和/或焦痂覆盖',
      '创面边缘可能形成潜行腔隙或窦道',
      '需注意鼻梁、耳廓等无皮下组织部位，Ⅲ期可较浅',
    ],
    care: [
      '清创：机械性、自溶性或酶学清创去除坏死组织',
      '负压伤口治疗(NPWT)适用于渗出量大的Ⅲ期压疮',
      '控制感染：根据细菌培养结果选用局部抗菌敷料',
      '加强营养支持：高蛋白饮食、补充微量元素',
      '定期测量创面尺寸并拍照记录，评估愈合趋势',
    ],
  };

  STAGE_DETAIL[ST.IV.key] = {
    name: 'Ⅳ期压疮',
    enName: 'Stage 4 Pressure Injury',
    criteria: '全层皮肤和组织缺损，骨骼、肌腱或肌肉暴露。创面床可见腐肉或焦痂。常伴有潜行和窦道。深度因解剖位置差异而不同。可延伸至肌肉和/或支撑结构（筋膜、肌腱、关节囊），可能导致骨髓炎。',
    identification: [
      '骨骼、肌腱、韧带或肌肉直接暴露于创面',
      '常伴有广泛潜行腔隙和/或多个窦道形成',
      '可触及骨质或探查到骨面',
      '与Ⅲ期关键区别：深部结构（骨骼/肌腱/肌肉）暴露',
      '警惕骨髓炎的发生：骨质暴露>2周风险显著增高',
    ],
    care: [
      '多学科团队协作：伤口造口师、骨科、感染科、营养师',
      '外科干预：可能需要手术清创、植皮或皮瓣修复',
      '感染控制：全身抗生素治疗联合局部抗菌处理',
      '疼痛管理：换药前30分钟给予镇痛处理',
      '长期营养支持计划，定期监测白蛋白和前白蛋白水平',
    ],
  };

  STAGE_DETAIL[ST.U.key] = {
    name: '不可分期压疮',
    enName: 'Unstageable Pressure Injury',
    criteria: '全层皮肤和组织缺损，创面被腐肉（黄色、棕色、灰色或绿色）和/或焦痂（棕色、棕褐色或黑色）覆盖，无法判定实际深度。需去除足够腐肉或焦痂后才能暴露创面底部从而进行分期。',
    identification: [
      '创面完全被腐肉或焦痂覆盖，无法看清创面底部',
      '清创前无法确定是Ⅲ期还是Ⅳ期',
      '干燥、完整、无波动感的焦痂（尤其在足跟部）可不做清创',
      '与Ⅲ/Ⅳ期的区别：分期被覆盖物遮挡，无从判断',
      '若焦痂下有波动感、渗液、红肿等感染征象，则需清创',
    ],
    care: [
      '足跟部干燥稳定的焦痂：采取保护性措施，不做清创',
      '其他部位或有感染征象的焦痂：进行清创暴露创面后重新分期',
      '评估肢端灌注状态（踝肱指数ABI），缺血肢体避免激进清创',
      '清创后根据创面深度（Ⅲ期或Ⅳ期）调整治疗方案',
      '密切监测焦痂周围有无红肿、渗液、异味等感染迹象',
    ],
  };

  STAGE_DETAIL[ST.DTI.key] = {
    name: '深部组织损伤（DTI）',
    enName: 'Deep Tissue Pressure Injury',
    criteria: '完整的或不完整的皮肤，局部区域呈现持续的指压不变白的深红色、褐红色或紫色，或表皮分离后呈现深色创面床或充血水疱。由下方软组织的压力和/或剪切力造成。此分期不可用于描述血管性、创伤性、神经性或皮肤病性创面。',
    identification: [
      '皮肤局部呈深红色、褐红色、紫色，指压不变白',
      '可表现为充血性水疱（血疱），破裂后露出深色创面床',
      '与Ⅰ期区别：DTI颜色更深（紫/褐红 vs 鲜红），常伴组织硬化',
      '与瘀伤区别：DTI位于骨隆突处、与持续压力/剪切力相关',
      'DTI可迅速恶化：表面看似轻微但深层已坏死，数日内可进展为全层缺损',
    ],
    care: [
      '立即完全减压：绝对避免该区域任何压力、摩擦和剪切力',
      '保护血疱完整：勿刺破，让其自然吸收',
      '密切观察变化：DTI可在24-72小时内迅速恶化',
      '若表皮破裂：轻柔清洁并使用非粘连敷料保护',
      '记录颜色、硬度、温度变化；拍照留存对比',
    ],
  };

  // ==================== 图库种子数据 ====================

  /**
   * 若 pressureSoreLibrary 为空，自动填充种子数据
   * 每分期 5 张模拟压疮分期图，共 30 张
   */
  function seedLibraryIfEmpty() {
    if (Storage.count('pressureSoreLibrary') > 0) return;

    var seedData = [
      /* Ⅰ期 — 5张 */
      { stageKey: 'stage_1', imageDesc: '骶尾部皮肤完整，局部可见指压不变白的淡红斑，边界清晰约3cm×2cm' },
      { stageKey: 'stage_1', imageDesc: '足跟处皮肤完整，局限性红斑区，指压不褪色，伴局部皮温升高' },
      { stageKey: 'stage_1', imageDesc: '右髋部骨隆突上完整皮肤，暗红色区域，与周围皮肤界限分明' },
      { stageKey: 'stage_1', imageDesc: '肘部伸侧完整皮肤，可见指压不变白红斑，患者主诉局部疼痛' },
      { stageKey: 'stage_1', imageDesc: '枕部头皮完整，局限性红斑区约2.5cm直径，深肤色患者呈紫蓝色变' },

      /* Ⅱ期 — 5张 */
      { stageKey: 'stage_2', imageDesc: '骶尾部浅表开放创面，创面床粉红色湿润，无腐肉，约2cm×1.5cm' },
      { stageKey: 'stage_2', imageDesc: '臀部完整浆液性水疱，直径约1.5cm，周围皮肤无红肿' },
      { stageKey: 'stage_2', imageDesc: '足跟处水疱已破，真皮暴露呈粉红色湿润面，边界清楚' },
      { stageKey: 'stage_2', imageDesc: '髂嵴处部分皮层缺损，创面鲜红色、有光泽、湿润，无坏死组织' },
      { stageKey: 'stage_2', imageDesc: '膝内侧表浅糜烂面，真皮层暴露呈红色，少量浆液渗出' },

      /* Ⅲ期 — 5张 */
      { stageKey: 'stage_3', imageDesc: '骶尾部全层皮肤缺损，皮下脂肪清晰可见，边缘有黄色腐肉附着' },
      { stageKey: 'stage_3', imageDesc: '坐骨结节处深度创面，脂肪组织暴露，创缘下方可探及1cm潜行' },
      { stageKey: 'stage_3', imageDesc: '大转子处全层缺损，可见黄色脂肪颗粒，少量浆液性渗出' },
      { stageKey: 'stage_3', imageDesc: '骶尾部全层缺损伴少量腐肉覆盖，创面周围皮肤呈暗红色' },
      { stageKey: 'stage_3', imageDesc: '足背全层组织缺损，皮下组织暴露，骨骼未暴露，无异味' },

      /* Ⅳ期 — 5张 */
      { stageKey: 'stage_4', imageDesc: '骶尾部巨大深部创面，骶骨骨膜暴露，创缘广泛潜行约5cm' },
      { stageKey: 'stage_4', imageDesc: '坐骨结节处骨骼暴露，肌腱可见，周围组织坏死呈黑色焦痂' },
      { stageKey: 'stage_4', imageDesc: '大转子处骨质外露直径约2cm，伴大量脓性渗出和恶臭' },
      { stageKey: 'stage_4', imageDesc: '骶尾部Ⅳ期压疮，骶骨暴露，多个窦道向深层延伸，大量渗液' },
      { stageKey: 'stage_4', imageDesc: '足跟处全层组织缺损，跟骨暴露，周围组织肿胀发热，疑似骨髓炎' },

      /* 不可分期 — 5张 */
      { stageKey: 'unstage', imageDesc: '骶尾部创面被黑色焦痂完全覆盖，厚约0.5cm，干燥无波动，无法判断深度' },
      { stageKey: 'unstage', imageDesc: '髋部全层缺损被黄色腐肉和棕色焦痂覆盖，创缘红肿，无法判定实际深度' },
      { stageKey: 'unstage', imageDesc: '臀部创面被灰绿色腐肉覆盖约80%，散发异味，需清创后重新分期' },
      { stageKey: 'unstage', imageDesc: '骶尾部厚层黑色硬痂覆盖，痂下可触及波动感，创周皮肤红肿发热' },
      { stageKey: 'unstage', imageDesc: '足跟处干燥黑色焦痂完整覆盖，无渗液无异味，踝肱指数正常' },

      /* DTI — 5张 */
      { stageKey: 'dti', imageDesc: '骶尾部椭圆形深紫色区域约4cm×3cm，指压不褪色，皮肤完整但触之发硬' },
      { stageKey: 'dti', imageDesc: '足跟处皮肤完整，局部区域呈褐红色，皮温低于周围组织，触感坚实' },
      { stageKey: 'dti', imageDesc: '臀部可见直径3cm充血性水疱（血疱），周围皮肤呈深红色，表皮完整' },
      { stageKey: 'dti', imageDesc: '骶尾部血疱破裂，暴露出深红色创面床，边界不清，深层组织坏死' },
      { stageKey: 'dti', imageDesc: '大转子处皮肤表面仅见紫褐色变，但触诊可及深部组织硬化，提示广泛深层损伤' },
    ];

    seedData.forEach(function (item) {
      Storage.insertOne('pressureSoreLibrary', item);
    });
  }

  // ==================== DOM 引用 ====================

  /** 三个子视图 */
  var $difficultyView  = document.getElementById('difficultyView');
  var $boardView       = document.getElementById('boardView');
  var $settlementView  = document.getElementById('settlementView');
  var $practiceRoot    = document.getElementById('practiceRoot');

  /** 难度卡片容器 */
  var $diffCardList = document.getElementById('diffCardList');

  /** 棋盘 */
  var $boardGrid      = document.getElementById('boardGrid');
  var $boardTimer     = document.getElementById('boardTimer');
  var $boardMatched   = document.getElementById('boardMatched');
  var $boardWrong     = document.getElementById('boardWrong');
  var $boardAccuracy  = document.getElementById('boardAccuracy');
  var $boardDiffTag   = document.getElementById('boardDiffTag');
  var $boardLegend    = document.getElementById('boardLegend');

  /** 结算 */
  var $settleDiff     = document.getElementById('settleDiff');
  var $settleTime     = document.getElementById('settleTime');
  var $settleAccuracy = document.getElementById('settleAccuracy');
  var $settleScore    = document.getElementById('settleScore');
  var $settleWrong    = document.getElementById('settleWrong');
  var $settleWrongList     = document.getElementById('settleWrongList');
  var $settleWrongActions  = document.getElementById('settleWrongActions');

  /** 弹窗 */
  var $stageDetailModal  = document.getElementById('stageDetailModal');
  var $stageDetailTitle  = document.getElementById('stageDetailTitle');
  var $stageDetailBody   = document.getElementById('stageDetailBody');
  var $unlockHintModal   = document.getElementById('unlockHintModal');
  var $unlockHintBody    = document.getElementById('unlockHintBody');

  // ==================== 游戏状态 ====================

  var gameState = {
    difficulty: '',               // 当前难度 key
    cards: [],                    // 棋盘卡片 [{ id, pairId, stageKey, imageData, matched, selected }]
    selectedCardEl: null,         // 当前选中卡片DOM
    selectedCardData: null,       // 当前选中卡片数据
    matchedCount: 0,             // 已配对数
    wrongCount: 0,               // 错误次数
    totalAttempts: 0,            // 总尝试次数
    wrongStageMatches: [],       // 错误分期记录 [{ selected: 'stage_1' }]
    timer: null,                 // Timer 实例
    isLocked: false,             // 是否锁定操作（动画期间）
  };

  // ==================== 视图切换 ====================

  /** 隐藏所有视图 */
  function hideAllViews() {
    $difficultyView.classList.add('u-hidden');
    $boardView.classList.add('u-hidden');
    $settlementView.classList.add('u-hidden');
  }

  /** 显示难度选择页 */
  function showDifficultyView() {
    hideAllViews();
    $difficultyView.classList.remove('u-hidden');
  }

  /** 显示棋盘页 */
  function showBoardView() {
    hideAllViews();
    $boardView.classList.remove('u-hidden');
  }

  /** 显示结算页 */
  function showSettlementView() {
    hideAllViews();
    $settlementView.classList.remove('u-hidden');
  }

  // ==================== ① 难度选择页 ====================

  /**
   * 刷新难度卡片状态（解锁/锁定 + 平均正确率）
   * 在进入难度选择页时调用
   */
  function refreshDifficultyCards() {
    var user = Storage.getUser();
    var unlocked = user ? (user.unlockedDifficulty || ['easy']) : ['easy'];

    var allRecords = Storage.findAll('trainRecord');

    // 逐难度刷新卡片
    var difficulties = [
      { key: DI.EASY.key,   prevKey: null },
      { key: DI.MEDIUM.key, prevKey: DI.EASY.key },
      { key: DI.HARD.key,   prevKey: DI.MEDIUM.key },
    ];

    difficulties.forEach(function (d) {
      var $card = $diffCardList.querySelector('[data-difficulty="' + d.key + '"]');
      if (!$card) return;

      var isUnlocked = unlocked.indexOf(d.key) !== -1;
      var records = Storage.getTrainRecordsByDifficulty(d.key);
      var avgAcc = Utils.calcAvgAccuracy(records);

      // 更新状态标签
      var $status = $card.querySelector('.diff-card__status');
      var $btn    = $card.querySelector('.diff-card__btn');
      var $overlay = $card.querySelector('.diff-card__lock-overlay');

      if (isUnlocked) {
        $card.classList.remove('diff-card--locked');
        $card.classList.add('diff-card--unlocked');
        $status.textContent = '已解锁';
        $status.className = 'diff-card__status diff-card__status--unlocked';
        $btn.disabled = false;
        $btn.className = 'btn btn--primary diff-card__btn';
        $overlay.classList.add('u-hidden');

        // 显示该难度平均正确率
        if (records.length > 0) {
          $status.textContent = '已解锁 | 均正确率 ' + (avgAcc * 100).toFixed(0) + '%';
        }
      } else {
        $card.classList.remove('diff-card--unlocked');
        $card.classList.add('diff-card--locked');
        $status.textContent = '未解锁';
        $status.className = 'diff-card__status diff-card__status--locked';
        $btn.disabled = true;
        $btn.className = 'btn btn--outline diff-card__btn';
        $overlay.classList.remove('u-hidden');

        // 解锁条件提示
        var prevRecords = d.prevKey ? Storage.getTrainRecordsByDifficulty(d.prevKey) : [];
        var prevAvg = Utils.calcAvgAccuracy(prevRecords);
        var threshold = (C.unlock.accuracyRequired * 100).toFixed(0);
        var prevLabel = d.prevKey === 'easy' ? '体验版' : '进阶版';
        $overlay.querySelector('p').textContent =
          prevLabel + '平均正确率 ≥ ' + threshold + '% 解锁（当前 ' + (prevAvg * 100).toFixed(0) + '%）';
      }
    });
  }

  /** 绑定难度卡片点击 */
  function bindDifficultyEvents() {
    $diffCardList.addEventListener('click', function (e) {
      var $card = e.target.closest('.diff-card');
      if (!$card) return;

      var diffKey = $card.getAttribute('data-difficulty');
      var isLocked = $card.classList.contains('diff-card--locked');

      if (isLocked) {
        // 弹出解锁条件提示
        showUnlockHint(diffKey);
        return;
      }

      // 已解锁 → 进入棋盘
      startGame(diffKey);
    });
  }

  /** 解锁条件弹窗 */
  function showUnlockHint(diffKey) {
    var labels = { easy: '体验版', medium: '进阶版', hard: '终结版' };
    var prevKeys = { easy: null, medium: 'easy', hard: 'medium' };
    var prevLabels = { easy: '', medium: '体验版', hard: '进阶版' };
    var threshold = (C.unlock.accuracyRequired * 100).toFixed(0);

    var prevKey = prevKeys[diffKey];
    var prevRecords = prevKey ? Storage.getTrainRecordsByDifficulty(prevKey) : [];
    var avg = Utils.calcAvgAccuracy(prevRecords);
    var currentRate = prevRecords.length > 0 ? (avg * 100).toFixed(0) + '%' : '暂无记录';

    $unlockHintBody.innerHTML =
      '<p style="font-size:15px;margin-bottom:12px;">「' + labels[diffKey] + '」需要解锁条件</p>' +
      '<div style="background:#F9F2F4;border-radius:8px;padding:12px;margin-bottom:8px;">' +
      '<p style="font-size:14px;color:#5A1B28;">' +
      prevLabels[diffKey] + ' 历史平均正确率 ≥ ' + threshold + '%</p>' +
      '<p style="font-size:13px;color:#7A6A72;margin-top:4px;">' +
      '当前 ' + prevLabels[diffKey] + ' 平均正确率：<strong>' + currentRate + '</strong></p>' +
      '</div>' +
      '<p style="font-size:12px;color:#A8989E;">多练习提高正确率即可自动解锁</p>';

    $unlockHintModal.classList.remove('u-hidden');
  }

  // ==================== ② 棋盘生成 ====================

  /**
   * 根据难度生成 30 张卡片的分期分布
   * @param {string} diffKey - 难度 key
   * @returns {Array} [{ stageKey, count }] 每个分期需要的卡片张数
   */
  function getStageDistribution(diffKey) {
    /* 15 对 = 30 张，每对同一分期的 2 张 */
    switch (diffKey) {
      case 'easy':
        /* 体验版：3 分期，差异大（Ⅰ、Ⅱ、Ⅲ），各 5 对 = 各 10 张 */
        return [
          { stageKey: 'stage_1', count: 10 },
          { stageKey: 'stage_2', count: 10 },
          { stageKey: 'stage_3', count: 10 },
        ];
      case 'medium':
        /* 进阶版：5 分期，混入易混淆创面（Ⅰ~Ⅳ + DTI），各 3 对 = 各 6 张 */
        return [
          { stageKey: 'stage_1', count: 6 },
          { stageKey: 'stage_2', count: 6 },
          { stageKey: 'stage_3', count: 6 },
          { stageKey: 'stage_4', count: 6 },
          { stageKey: 'dti',     count: 6 },
        ];
      case 'hard':
        /* 终结版：全 6 分期高混淆，分布 2~3对 不等 */
        return [
          { stageKey: 'stage_1',  count: 4 },
          { stageKey: 'stage_2',  count: 4 },
          { stageKey: 'stage_3',  count: 6 },
          { stageKey: 'stage_4',  count: 6 },
          { stageKey: 'unstage',  count: 4 },
          { stageKey: 'dti',      count: 6 },
        ];
      default:
        return [
          { stageKey: 'stage_1', count: 10 },
          { stageKey: 'stage_2', count: 10 },
          { stageKey: 'stage_3', count: 10 },
        ];
    }
  }

  /**
   * 从图库中按需选取卡片数据
   * @param {Array} distribution - 分期分布
   * @returns {Array} 30 张卡片数据
   */
  function pickCardsFromLibrary(distribution) {
    var cards = [];
    var pairId = 0;

    distribution.forEach(function (dist) {
      var images = Storage.getImagesByStage(dist.stageKey);
      if (images.length === 0) {
        // 图库无该分期数据：生成占位卡片
        for (var i = 0; i < dist.count / 2; i++) {
          pairId++;
          var placeholder = { id: '', stageKey: dist.stageKey, imageName: '', imageDesc: '压疮分期图（占位）', source: '' };
          cards.push({ pairId: pairId, imageData: placeholder });
          cards.push({ pairId: pairId, imageData: placeholder });
        }
        return;
      }

      // 需要多少对
      var pairsNeeded = dist.count / 2;
      // 从图库中随机选取不同图片作为"对"（同一分期不同图片可配对）
      var shuffled = Utils.shuffle(images);

      for (var p = 0; p < pairsNeeded; p++) {
        pairId++;
        var img = shuffled[p % shuffled.length];
        // 每对两张同分期图
        cards.push({ pairId: pairId, imageData: img });
        cards.push({ pairId: pairId, imageData: img });
      }
    });

    // 全部洗牌
    return Utils.shuffle(cards);
  }

  /** 渲染棋盘卡片 */
  function renderBoard(cards) {
    $boardGrid.innerHTML = '';
    var stageKeys = ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'unstage', 'dti'];
    var stageLabels = {
      stage_1: 'Ⅰ期', stage_2: 'Ⅱ期', stage_3: 'Ⅲ期',
      stage_4: 'Ⅳ期', unstage: '不可分期', dti: 'DTI',
    };
    var stageIcons = {
      stage_1: '&#128308;', stage_2: '&#128992;', stage_3: '&#128993;',
      stage_4: '&#128994;', unstage: '&#9898;', dti: '&#128995;',
    };

    cards.forEach(function (card, index) {
      var sk = card.imageData.stageKey;

      var $el = document.createElement('div');
      $el.className = 'game-card';
      $el.setAttribute('data-index', index);
      $el.setAttribute('data-pair-id', card.pairId);
      $el.setAttribute('data-stage-key', sk);

      /* 【新增】优先加载库内存储的压疮图片，图片路径为空/加载失败自动降级为文字展示 */
      var imgSrc = card.imageData.imgDataUrl || card.imageData.imgUrl || '';
      var imgHtml = imgSrc ? '<img src="' + imgSrc + '" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:12px;opacity:0.75;">' : '';

      $el.innerHTML =
        '<div class="game-card__inner game-card__inner--' + sk + '">' +
        imgHtml +
        '<span class="game-card__corner">' + card.pairId + '</span>' +
        '<span class="game-card__stage-icon">' + (stageIcons[sk] || '') + '</span>' +
        '<span class="game-card__stage-label">' + (stageLabels[sk] || sk) + '</span>' +
        '<span class="game-card__stage-name">' + card.imageData.imageDesc.substring(0, 12) + '...</span>' +
        '</div>';

      $boardGrid.appendChild($el);
    });

    // 渲染图例
    renderLegend(stageKeys, stageLabels);
  }

  /** 渲染底部图例 */
  function renderLegend(stageKeys, stageLabels) {
    var colors = ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#607D8B', '#9C27B0'];
    $boardLegend.innerHTML = '';
    stageKeys.forEach(function (sk, i) {
      var $item = document.createElement('div');
      $item.className = 'board-legend__item';
      $item.innerHTML =
        '<span class="board-legend__dot" style="background:' + colors[i] + ';"></span>' +
        '<span>' + (stageLabels[sk] || sk) + '</span>';
      $boardLegend.appendChild($item);
    });
  }

  // ==================== ③ 游戏核心逻辑 ====================

  /** 开始一盘新游戏 */
  function startGame(diffKey) {
    // 重置状态
    gameState.difficulty = diffKey;
    gameState.matchedCount = 0;
    gameState.wrongCount = 0;
    gameState.totalAttempts = 0;
    gameState.wrongStageMatches = [];
    gameState.selectedCardEl = null;
    gameState.selectedCardData = null;
    gameState.isLocked = false;

    // 生成卡片
    var dist = getStageDistribution(diffKey);
    gameState.cards = pickCardsFromLibrary(dist);

    // 渲染棋盘
    renderBoard(gameState.cards);

    // 更新顶部信息栏
    var diffLabels = { easy: '体验版', medium: '进阶版', hard: '终结版' };
    $boardDiffTag.textContent = diffLabels[diffKey] || diffKey;
    $boardDiffTag.className = 'board-diff-tag board-diff-tag--' + diffKey;
    $boardTimer.textContent = '00:00';
    $boardMatched.textContent = '0 / 15';
    $boardWrong.textContent = '0';
    $boardAccuracy.textContent = '100%';

    // 启动计时器
    gameState.timer = Utils.Timer();
    gameState.timer.onTick(function (elapsed) {
      $boardTimer.textContent = Utils.formatTime(elapsed);
    });
    gameState.timer.start();

    // 绑定棋盘事件
    bindBoardEvents();

    // 切换视图
    showBoardView();
  }

  /** 棋盘点击事件 */
  function bindBoardEvents() {
    // 移除旧事件（通过克隆节点）
    var newGrid = $boardGrid.cloneNode(true);
    $boardGrid.parentNode.replaceChild(newGrid, $boardGrid);
    $boardGrid = newGrid;

    $boardGrid.addEventListener('click', function (e) {
      if (gameState.isLocked) return;

      var $card = e.target.closest('.game-card');
      if (!$card) return;

      // 【修改】对局棋盘内不再弹出分期详情弹窗，仅知识库/结算页保留；已消除卡片直接忽略
      if ($card.classList.contains('game-card--matched')) return;

      var index = parseInt($card.getAttribute('data-index'), 10);
      var cardData = gameState.cards[index];

      // 如果点击的是已选中的卡片，取消选中
      if ($card === gameState.selectedCardEl) {
        $card.classList.remove('game-card--selected');
        gameState.selectedCardEl = null;
        gameState.selectedCardData = null;
        return;
      }

      // 第一张选中
      if (!gameState.selectedCardEl) {
        $card.classList.add('game-card--selected');
        gameState.selectedCardEl = $card;
        gameState.selectedCardData = { index: index, data: cardData };
        return;
      }

      // 第二张选中 → 进行匹配判定
      var firstIndex = gameState.selectedCardEl.getAttribute('data-index');
      var firstData  = gameState.cards[parseInt(firstIndex, 10)];
      var secondData = cardData;
      var $firstEl   = gameState.selectedCardEl;

      gameState.totalAttempts++;

      if (Utils.isStageMatch(firstData.imageData.stageKey, secondData.imageData.stageKey)) {
        // 正确配对：消除两张卡片
        handleMatchSuccess($firstEl, $card, firstData, secondData);
      } else {
        // 错误配对：抖动动画 + 扣正确率
        handleMatchFail($firstEl, $card, firstData.imageData.stageKey, secondData.imageData.stageKey);
      }

      // 清除选中状态
      gameState.selectedCardEl = null;
      gameState.selectedCardData = null;
    });
  }

  /** 正确配对 */
  function handleMatchSuccess($el1, $el2, data1, data2) {
    gameState.isLocked = true;

    $el1.classList.remove('game-card--selected');
    $el1.classList.add('game-card--matched');
    $el2.classList.add('game-card--matched');

    gameState.matchedCount++;
    updateBoardStats();

    // 动画结束后解除锁定
    setTimeout(function () {
      gameState.isLocked = false;

      // 检查是否全部消除
      if (gameState.matchedCount >= C.board.pairs) {
        endGame();
      }
    }, 400);
  }

  /** 错误配对 */
  function handleMatchFail($el1, $el2, stageKey1, stageKey2) {
    gameState.isLocked = true;

    $el1.classList.remove('game-card--selected');
    $el1.classList.add('game-card--shake');
    $el2.classList.add('game-card--shake');

    gameState.wrongCount++;
    gameState.wrongStageMatches.push({ selected: stageKey2 });
    updateBoardStats();

    setTimeout(function () {
      $el1.classList.remove('game-card--shake');
      $el2.classList.remove('game-card--shake');
      gameState.isLocked = false;
    }, 450);
  }

  /** 更新棋盘统计数字 */
  function updateBoardStats() {
    $boardMatched.textContent = gameState.matchedCount + ' / ' + C.board.pairs;
    $boardWrong.textContent = gameState.wrongCount;
    var acc = Utils.calcAccuracy(gameState.totalAttempts, gameState.wrongCount);
    $boardAccuracy.textContent = (acc * 100).toFixed(0) + '%';
  }

  // ==================== ④ 结算逻辑 ====================

  /** 游戏结束 → 展示结算页 */
  function endGame() {
    gameState.timer.pause();
    var elapsed = gameState.timer.elapsed();

    // 计算数据
    var accuracy = Utils.calcAccuracy(gameState.totalAttempts, gameState.wrongCount);
    var score = Utils.calcPracticeScore(gameState.difficulty, accuracy);
    var durationMinutes = Math.ceil(elapsed / 60);

    // 汇总错误分期
    var wrongStageSummary = {};
    gameState.wrongStageMatches.forEach(function (w) {
      var sk = w.selected;
      if (!wrongStageSummary[sk]) wrongStageSummary[sk] = 0;
      wrongStageSummary[sk]++;
    });

    // 写入训练记录
    var record = Storage.insertOne('trainRecord', {
      difficulty: gameState.difficulty,
      totalPairs: C.board.pairs,
      matchedPairs: gameState.matchedCount,
      wrongPairs: gameState.wrongCount,
      accuracyRate: accuracy,
      scoreEarned: score,
      durationSeconds: Math.floor(elapsed),
      wrongStageMatch: gameState.wrongStageMatches,
      completedAt: new Date().toISOString(),
    });

    // 更新用户数据
    var user = Storage.getUser();
    if (user) {
      Storage.saveUser({
        totalScore: (user.totalScore || 0) + score,
        gold: (user.gold || 0) + score,
        totalPracticeMinutes: (user.totalPracticeMinutes || 0) + durationMinutes,
      });
    }

    // 检查解锁
    checkAndAutoUnlock();

    // 渲染结算页
    renderSettlement(elapsed, accuracy, score, wrongStageSummary);

    // 刷新顶部栏
    if (global.Nav && global.Nav.refreshTopBar) {
      global.Nav.refreshTopBar();
    }

    showSettlementView();
  }

  /** 结算后自动检查是否满足下一级解锁条件 */
  function checkAndAutoUnlock() {
    var user = Storage.getUser();
    if (!user) return;

    var unlocked = user.unlockedDifficulty || ['easy'];

    // 体验版 → 进阶版
    if (unlocked.indexOf('medium') === -1) {
      var easyRecords = Storage.getTrainRecordsByDifficulty('easy');
      var easyAvg = Utils.calcAvgAccuracy(easyRecords);
      if (easyAvg >= C.unlock.accuracyRequired) {
        unlocked.push('medium');
      }
    }

    // 进阶版 → 终结版
    if (unlocked.indexOf('hard') === -1 && unlocked.indexOf('medium') !== -1) {
      var mediumRecords = Storage.getTrainRecordsByDifficulty('medium');
      var mediumAvg = Utils.calcAvgAccuracy(mediumRecords);
      if (mediumAvg >= C.unlock.accuracyRequired) {
        unlocked.push('hard');
      }
    }

    Storage.saveUser({ unlockedDifficulty: unlocked });
  }

  /** 渲染结算页 */
  function renderSettlement(elapsedSeconds, accuracy, score, wrongStageSummary) {
    var diffLabels = { easy: '体验版', medium: '进阶版', hard: '终结版' };
    $settleDiff.textContent = diffLabels[gameState.difficulty] || gameState.difficulty;
    $settleTime.textContent = Utils.formatTime(elapsedSeconds);
    $settleAccuracy.textContent = (accuracy * 100).toFixed(0) + '%';
    $settleScore.textContent = '+' + score;
    $settleWrong.textContent = gameState.wrongCount;

    // 错误分期汇总
    var wrongStageKeys = Object.keys(wrongStageSummary);
    if (wrongStageKeys.length === 0) {
      $settleWrongList.innerHTML =
        '<p class="u-text-muted" style="font-size:13px;">本次练习无错误配对，继续保持！</p>';
      $settleWrongActions.classList.add('u-hidden');
    } else {
      var stageLabels = {
        stage_1: 'Ⅰ期', stage_2: 'Ⅱ期', stage_3: 'Ⅲ期',
        stage_4: 'Ⅳ期', unstage: '不可分期', dti: 'DTI',
      };
      var tagsHTML = '';
      wrongStageKeys.forEach(function (sk) {
        tagsHTML += '<span class="settle-wrong-tag">' +
          (stageLabels[sk] || sk) + ' ×' + wrongStageSummary[sk] +
          '</span>';
      });
      $settleWrongList.innerHTML = tagsHTML;
      $settleWrongActions.classList.remove('u-hidden');
    }

    // 绑定结算按钮
    bindSettlementEvents(wrongStageKeys);
  }

  /** 结算按钮事件 */
  function bindSettlementEvents(wrongStageKeys) {
    /* 一���将错题存入错题库 — 利用收藏机制暂存 */
    var $btnSave = document.getElementById('btnSaveMistakes');
    if ($btnSave) {
      var newBtn = $btnSave.cloneNode(true);
      $btnSave.parentNode.replaceChild(newBtn, $btnSave);

      newBtn.addEventListener('click', function () {
        // 将本次错误分期涉及的卡片存为"错题标记"
        // 通过更新图库记录的描述加标记（实际项目可建独立错题库表）
        if (wrongStageKeys.length === 0) {
          Nav && Nav.showToast('无错题需要保存', 'info');
          return;
        }
        // 保存为 localStorage 中的错题集
        var mistakes = Storage.readTable('pu_game_mistakes') || [];
        wrongStageKeys.forEach(function (sk) {
          var imgs = Storage.getImagesByStage(sk);
          imgs.forEach(function (img) {
            // 去重
            var exists = mistakes.some(function (m) { return m.id === img.id; });
            if (!exists) {
              mistakes.push({ id: img.id, stageKey: sk, savedAt: new Date().toISOString() });
            }
          });
        });
        localStorage.setItem('pu_game_mistakes', JSON.stringify(mistakes));
        Nav && Nav.showToast('已存入错题库（' + wrongStageKeys.length + ' 个分期）', 'success');
      });
    }

    /* 返回难度选择 */
    var $btnBack = document.getElementById('btnBackToDiff');
    if ($btnBack) {
      var newBack = $btnBack.cloneNode(true);
      $btnBack.parentNode.replaceChild(newBack, $btnBack);
      newBack.addEventListener('click', function () {
        if (gameState.timer && gameState.timer.isRunning()) {
          gameState.timer.pause();
        }
        refreshDifficultyCards();
        showDifficultyView();
      });
    }

    /* 再来一局 */
    var $btnRetry = document.getElementById('btnRetryPractice');
    if ($btnRetry) {
      var newRetry = $btnRetry.cloneNode(true);
      $btnRetry.parentNode.replaceChild(newRetry, $btnRetry);
      newRetry.addEventListener('click', function () {
        startGame(gameState.difficulty);
      });
    }
  }

  // ==================== ⑤ 分期详情弹窗 ====================

  /**
   * 展示压疮分期详情弹窗
   * @param {string} stageKey - 分期 key
   * @param {Object} imageData - 图片数据（可选，用于展示具体图片信息）
   */
  function showStageDetail(stageKey, imageData) {
    var detail = STAGE_DETAIL[stageKey];
    if (!detail) return;

    var stageInfo = Utils.getStageByKey(stageKey);
    $stageDetailTitle.textContent = (stageInfo ? stageInfo.label : '') + ' — ' + detail.name;

    var html = '';

    // 图片信息（如有）
    if (imageData && imageData.imageDesc) {
      html += '<div class="stage-detail__section">';
      html += '<div class="stage-detail__section-title">压疮创面描述</div>';
      html += '<p>' + imageData.imageDesc + '</p>';
      html += '</div>';
    }

    // 分期判定标准
    html += '<div class="stage-detail__section">';
    html += '<div class="stage-detail__section-title">判定标准</div>';
    html += '<p>' + detail.criteria + '</p>';
    html += '</div>';

    // 鉴别要点
    html += '<div class="stage-detail__section">';
    html += '<div class="stage-detail__section-title">鉴别要点</div>';
    html += '<ul style="list-style:disc;padding-left:18px;">';
    detail.identification.forEach(function (item) {
      html += '<li style="font-size:13px;color:#5A4A52;padding:3px 0;line-height:1.6;">' + item + '</li>';
    });
    html += '</ul>';
    html += '</div>';

    // 护理措施
    html += '<div class="stage-detail__section">';
    html += '<div class="stage-detail__section-title">护理措施</div>';
    html += '<ul style="list-style:disc;padding-left:18px;">';
    detail.care.forEach(function (item) {
      html += '<li style="font-size:13px;color:#5A4A52;padding:3px 0;line-height:1.6;">' + item + '</li>';
    });
    html += '</ul>';
    html += '</div>';

    $stageDetailBody.innerHTML = html;

    // 收藏按钮 — 存入收藏集
    var $btnFav = document.getElementById('btnFavStage');
    if ($btnFav) {
      var newFav = $btnFav.cloneNode(true);
      $btnFav.parentNode.replaceChild(newFav, $btnFav);
      newFav.addEventListener('click', function () {
        if (!imageData) {
          Nav && Nav.showToast('请从棋盘卡片打开以收藏具体压疮分期图', 'warning');
          return;
        }
        var favorites = JSON.parse(localStorage.getItem('pu_game_favorites') || '[]');
        var exists = favorites.some(function (f) { return f.id === imageData.id; });
        if (exists) {
          Nav && Nav.showToast('该压疮分期图已收藏', 'info');
          return;
        }
        favorites.push({
          id: imageData.id,
          stageKey: stageKey,
          imageDesc: imageData.imageDesc,
          savedAt: new Date().toISOString(),
        });
        localStorage.setItem('pu_game_favorites', JSON.stringify(favorites));
        Nav && Nav.showToast('已收藏该压疮分期图', 'success');
      });
    }

    $stageDetailModal.classList.remove('u-hidden');
  }

  /** 关闭分期详情弹窗 */
  function closeStageDetail() {
    $stageDetailModal.classList.add('u-hidden');
  }

  // ==================== ⑥ 退出确认 ====================

  /** 棋盘页退出 → 确认后返回难度选择 */
  function quitPractice() {
    if (gameState.matchedCount > 0 && gameState.matchedCount < C.board.pairs) {
      // 有进行中的游戏 → 弹窗确认
      if (!confirm('确定退出当前练习吗？当前进度不会保存。')) return;
    }
    if (gameState.timer && gameState.timer.isRunning()) {
      gameState.timer.pause();
    }
    refreshDifficultyCards();
    showDifficultyView();
  }

  // ==================== 初始化 ====================

  /**
   * 练习模块入口
   * 在 index.html 中由 nav.js 加载后调用，或在 standalone 模式下自动运行
   */
  function init() {
    // 确保图库有数据
    seedLibraryIfEmpty();

    // 确保错题库、收藏集存储键存在
    if (!localStorage.getItem('pu_game_mistakes')) {
      localStorage.setItem('pu_game_mistakes', '[]');
    }
    if (!localStorage.getItem('pu_game_favorites')) {
      localStorage.setItem('pu_game_favorites', '[]');
    }

    // 刷新难度卡片
    refreshDifficultyCards();

    // 绑定事件
    bindDifficultyEvents();

    // 退出按钮
    var $btnQuit = document.getElementById('btnQuitPractice');
    if ($btnQuit) {
      $btnQuit.addEventListener('click', quitPractice);
    }

    // 分期详情弹窗关闭
    var $close1 = document.getElementById('stageDetailClose');
    var $close2 = document.getElementById('stageDetailClose2');
    if ($close1) $close1.addEventListener('click', closeStageDetail);
    if ($close2) $close2.addEventListener('click', closeStageDetail);
    $stageDetailModal.addEventListener('click', function (e) {
      if (e.target === $stageDetailModal) closeStageDetail();
    });

    // 解锁提示弹窗关闭
    var $unlockClose1 = document.getElementById('unlockHintClose');
    var $unlockClose2 = document.getElementById('unlockHintClose2');
    function closeUnlockHint() { $unlockHintModal.classList.add('u-hidden'); }
    if ($unlockClose1) $unlockClose1.addEventListener('click', closeUnlockHint);
    if ($unlockClose2) $unlockClose2.addEventListener('click', closeUnlockHint);
    $unlockHintModal.addEventListener('click', function (e) {
      if (e.target === $unlockHintModal) closeUnlockHint();
    });

    // 默认展示难度选择页
    showDifficultyView();
    $practiceRoot.classList.add('practice-root--active');

    console.log('[practice] 练习模块初始化完成');
  }

  // ==================== 启动 ====================

  /**
   * 检测运行环境并初始化：
   * - SPA 模式（index.html）：practiceRoot 已在 #panel-practice 中，直接 init
   * - 独立模式（practice.html）：同样直接 init
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }

  // ==================== 导出到全局 ====================

  global.Practice = {
    init: init,
    refreshDifficultyCards: refreshDifficultyCards,
    showDifficultyView: showDifficultyView,
  };

})(window);
