/**
 * exam.js — 考试模块完整业务逻辑
 * 规则校验 → 限时棋盘（3套） → 解析报告结算
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  var C  = global.AppConfig.CONFIG;
  var ST = global.AppConfig.STAGE;

  /** 每套试题配对数：36 张 = 18 对 */
  var EXAM_PAIRS = C.exam.cardsPerSet / 2;  // 18

  // ==================== 3 套试题分期分布 ====================

  /**
   * 每套 36 张 = 18 对，按难度递进设计
   * 套1：Ⅰ~Ⅲ期（基础分期），套2：Ⅰ~Ⅵ期（全分期），套3：Ⅳ/不可分期/DTI（高混淆）
   */
  var SET_DISTRIBUTIONS = [
    /* 套1：Ⅰ~Ⅲ 期，各 6 对 = 各 12 张 */
    [
      { stageKey: 'stage_1', count: 12 },
      { stageKey: 'stage_2', count: 12 },
      { stageKey: 'stage_3', count: 12 },
    ],
    /* 套2：全 6 分期，各 3 对 = 各 6 张 */
    [
      { stageKey: 'stage_1', count: 6 },
      { stageKey: 'stage_2', count: 6 },
      { stageKey: 'stage_3', count: 6 },
      { stageKey: 'stage_4', count: 6 },
      { stageKey: 'unstage', count: 6 },
      { stageKey: 'dti',     count: 6 },
    ],
    /* 套3：Ⅳ/不可分期/DTI，各 6 对 = 各 12 张 */
    [
      { stageKey: 'stage_4', count: 12 },
      { stageKey: 'unstage', count: 12 },
      { stageKey: 'dti',     count: 12 },
    ],
  ];

  // ==================== DOM 引用 ====================

  var $examRulesView   = document.getElementById('examRulesView');
  var $examBoardView   = document.getElementById('examBoardView');
  var $examReportView  = document.getElementById('examReportView');

  /* 规则页 */
  var $qualifyPractice = document.getElementById('qualifyPractice');
  var $qualifyToday    = document.getElementById('qualifyToday');
  var $btnStartExam    = document.getElementById('btnStartExam');
  var $examStartHint   = document.getElementById('examStartHint');

  /* 棋盘 */
  var $examBoardGrid   = document.getElementById('examBoardGrid');
  var $examCountdown   = document.getElementById('examCountdown');
  var $examMatched     = document.getElementById('examMatched');
  var $examAccuracy    = document.getElementById('examAccuracy');
  var $examSetLabel    = document.getElementById('examSetLabel');
  var $examSetIndicator = document.getElementById('examSetIndicator');

  /* 报告 */
  var $examReportIcon    = document.getElementById('examReportIcon');
  var $examReportTitle   = document.getElementById('examReportTitle');
  var $examReportSubtitle = document.getElementById('examReportSubtitle');
  var $examTotalScore    = document.getElementById('examTotalScore');
  var $examSetResults    = document.getElementById('examSetResults');
  var $examConfusionList = document.getElementById('examConfusionList');

  /* 套题过渡层 */
  var $examSetTransition     = document.getElementById('examSetTransition');
  var $examTransitionTitle   = document.getElementById('examTransitionTitle');
  var $examTransitionAccuracy = document.getElementById('examTransitionAccuracy');
  var $examTransitionHint    = document.getElementById('examTransitionHint');

  /* 弹窗 */
  var $examBlockedModal  = document.getElementById('examBlockedModal');
  var $examBlockedBody   = document.getElementById('examBlockedBody');
  var $examBlockedTitle  = document.getElementById('examBlockedTitle');
  var $examQuitModal     = document.getElementById('examQuitModal');

  // ==================== 考试状态 ====================

  var examState = {
    currentSet: 0,                 // 当前套题索引 0/1/2
    /** 每套独立数据 */
    sets: [
      { matchedCount: 0, wrongCount: 0, totalAttempts: 0, wrongStageMatches: [], accuracy: 0, completed: false, cards: [] },
      { matchedCount: 0, wrongCount: 0, totalAttempts: 0, wrongStageMatches: [], accuracy: 0, completed: false, cards: [] },
      { matchedCount: 0, wrongCount: 0, totalAttempts: 0, wrongStageMatches: [], accuracy: 0, completed: false, cards: [] },
    ],
    selectedCardEl: null,
    selectedCardData: null,
    isLocked: false,
    countdownSeconds: 0,          // 剩余秒数
    countdownInterval: null,      // setInterval ID
    examStarted: false,           // 是否已开始
    examDate: '',                 // 考试日期 YYYY-MM-DD
    forfeited: false,             // 是否弃考
    timedOut: false,              // 是否超时交卷
  };

  /** 当前套的快捷引用 */
  function currentSetData() {
    return examState.sets[examState.currentSet];
  }

  // ==================== 视图切换 ====================

  function hideAllExamViews() {
    $examRulesView.classList.add('u-hidden');
    $examBoardView.classList.add('u-hidden');
    $examReportView.classList.add('u-hidden');
  }

  function showRulesView() {
    hideAllExamViews();
    $examRulesView.classList.remove('u-hidden');
  }

  function showBoardView() {
    hideAllExamViews();
    $examBoardView.classList.remove('u-hidden');
  }

  function showReportView() {
    hideAllExamViews();
    $examReportView.classList.remove('u-hidden');
  }

  // ==================== ① 规则首页 & 资格校验 ====================

  /**
   * 刷新规则页资格状态
   * @returns {{ canExam: boolean, reason: string }}
   */
  function refreshQualification() {
    // 校验1：双周累计练习时长
    var allTrainRecords = Storage.findAll('trainRecord');
    var biweeklyMinutes = Utils.calcBiweeklyPracticeMinutes(allTrainRecords);
    var threshold = C.exam.practiceMinThreshold;
    var hasEnoughPractice = biweeklyMinutes >= threshold;

    // 校验2：今日是否已考
    var today = Utils.todayStr();
    var todayRecords = Storage.getExamRecordsByDate(today);
    var hasTakenToday = todayRecords.length > 0;
    var hasAttemptedToday = todayRecords.some(function (r) { return !r.completed || r.scoreEarned === 0; });
    // 只要有今天的记录就算"已参加"（包括弃考记录）
    var todayBlocked = todayRecords.length > 0;

    // 渲染资格状态
    $qualifyPractice.textContent = biweeklyMinutes + ' / ' + threshold + ' 分钟';
    $qualifyPractice.className = hasEnoughPractice
      ? 'exam-qualify-row__value exam-qualify-row__value--pass'
      : 'exam-qualify-row__value exam-qualify-row__value--fail';

    $qualifyToday.textContent = todayBlocked ? '已参加（今日不可再考）' : '未参加';
    $qualifyToday.className = todayBlocked
      ? 'exam-qualify-row__value exam-qualify-row__value--fail'
      : 'exam-qualify-row__value exam-qualify-row__value--pass';

    var canExam = hasEnoughPractice && !todayBlocked;

    $btnStartExam.disabled = !canExam;
    if (!canExam) {
      if (!hasEnoughPractice) {
        $examStartHint.textContent = '双周练习时长不足 ' + threshold + ' 分钟，请前往练习模式提升';
      } else if (todayBlocked) {
        $examStartHint.textContent = '今日已参加考试，请明天再来';
      }
    } else {
      $examStartHint.textContent = '满足考试资格，点击按钮开始考核';
    }

    return { canExam: canExam, biweeklyMinutes: biweeklyMinutes, todayBlocked: todayBlocked };
  }

  /**
   * 点击"开始考试"按钮 → 弹出资格确认或直接开始
   */
  function onStartExamClick() {
    var qual = refreshQualification();

    if (!qual.canExam) {
      showBlockedModal(qual);
      return;
    }

    // 最终确认
    if (!confirm('确认开始考试？\n\n• 3 套试题，每套 36 张压疮分期图\n• 全场限时 10 分钟\n• 中途退出视为弃考，今日不可再考\n\n确认后计时即刻开始。')) {
      return;
    }

    startExam();
  }

  /** 资格未达标弹窗 */
  function showBlockedModal(qual) {
    var threshold = C.exam.practiceMinThreshold;
    var html = '';

    if (qual.biweeklyMinutes < threshold) {
      $examBlockedTitle.textContent = '练习时长不足';
      html += '<div class="exam-blocked-modal__icon">&#9200;</div>';
      html += '<p class="exam-blocked-modal__text">双周累计练习时长不足</p>';
      html += '<p class="exam-blocked-modal__hint">';
      html += '当前：<strong>' + qual.biweeklyMinutes + ' 分钟</strong><br>';
      html += '要求：<strong>' + threshold + ' 分钟</strong><br>';
      html += '请前往练习模式积累更多练习时长后再参加考试。';
      html += '</p>';
    } else if (qual.todayBlocked) {
      $examBlockedTitle.textContent = '今日已参加考试';
      html += '<div class="exam-blocked-modal__icon">&#128683;</div>';
      html += '<p class="exam-blocked-modal__text">今日已参加考试</p>';
      html += '<p class="exam-blocked-modal__hint">';
      html += '每日仅限 <strong>1 次</strong>考试机会。<br>请明天再来挑战！';
      html += '</p>';
    }

    $examBlockedBody.innerHTML = html;
    $examBlockedModal.classList.remove('u-hidden');
  }

  // ==================== ② 开始考试 ====================

  function startExam() {
    // 初始化状态
    examState.currentSet = 0;
    examState.forfeited = false;
    examState.timedOut = false;
    examState.examStarted = true;
    examState.examDate = Utils.todayStr();
    examState.selectedCardEl = null;
    examState.selectedCardData = null;
    examState.isLocked = false;

    // 重置三套数据
    for (var s = 0; s < 3; s++) {
      examState.sets[s] = {
        matchedCount: 0,
        wrongCount: 0,
        totalAttempts: 0,
        wrongStageMatches: [],
        accuracy: 0,
        completed: false,
        cards: [],
      };
    }

    // 初始化倒计时（分钟 → 秒）
    examState.countdownSeconds = C.exam.timeLimitMinutes * 60;

    // 渲染第一套棋盘
    renderExamSet(0);

    // 启动倒计时
    startCountdown();

    // 更新套题指示器
    updateSetIndicator();

    // 绑定棋盘事件
    bindExamBoardEvents();

    showBoardView();
  }

  // ==================== ③ 棋盘生成 ====================

  /** 渲染指定套题的棋盘 */
  function renderExamSet(setIndex) {
    examState.currentSet = setIndex;
    var setData = currentSetData();
    var dist = SET_DISTRIBUTIONS[setIndex];

    // 从图库选取卡片
    setData.cards = pickExamCards(dist);
    setData.matchedCount = 0;
    setData.wrongCount = 0;
    setData.totalAttempts = 0;
    setData.wrongStageMatches = [];
    setData.accuracy = 1;

    // 渲染 DOM
    $examBoardGrid.innerHTML = '';

    setData.cards.forEach(function (card, idx) {
      var sk = card.imageData.stageKey;
      var $el = document.createElement('div');
      $el.className = 'exam-card';
      $el.setAttribute('data-index', idx);
      $el.setAttribute('data-pair-id', card.pairId);
      $el.setAttribute('data-stage-key', sk);

      // 考试卡片不显示分期标签，仅显示压疮创面简述（模拟真实阅片）
      var shortDesc = card.imageData.imageDesc
        ? card.imageData.imageDesc.substring(0, 18) + '...'
        : '压疮分期图';

      /* 【新增】优先加载库内存储的压疮图片，图片路径为空/加载失败自动降级为文字展示 */
      var imgSrc = card.imageData.imgDataUrl || card.imageData.imgUrl || '';
      var imgHtml = imgSrc ? '<img src="' + imgSrc + '" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:10px;opacity:0.7;">' : '';

      $el.innerHTML =
        '<div class="exam-card__inner exam-card__inner--' + sk + '">' +
        imgHtml +
        '<span class="exam-card__desc">' + shortDesc + '</span>' +
        '</div>';

      $examBoardGrid.appendChild($el);
    });

    // 更新信息栏
    updateBoardStats();
    updateSetIndicator();
    $examSetLabel.textContent = '第 ' + (setIndex + 1) + ' / 3 套';
  }

  /** 从图库选取 36 张卡片 */
  function pickExamCards(distribution) {
    var cards = [];
    var pairId = 0;

    distribution.forEach(function (dist) {
      var images = Storage.getImagesByStage(dist.stageKey);

      // 如果图库该分期数据不足，用占位数据补齐
      if (images.length === 0) {
        for (var i = 0; i < dist.count / 2; i++) {
          pairId++;
          var placeholder = { id: '', stageKey: dist.stageKey, imageName: '', imageDesc: '压疮分期图', source: '' };
          cards.push({ pairId: pairId, imageData: placeholder });
          cards.push({ pairId: pairId, imageData: placeholder });
        }
        return;
      }

      var pairsNeeded = dist.count / 2;
      var shuffled = Utils.shuffle(images);

      for (var p = 0; p < pairsNeeded; p++) {
        pairId++;
        var img = shuffled[p % shuffled.length];
        cards.push({ pairId: pairId, imageData: img });
        cards.push({ pairId: pairId, imageData: img });
      }
    });

    return Utils.shuffle(cards);
  }

  /** 更新套题进度指示器圆点 */
  function updateSetIndicator() {
    var dots = $examSetIndicator.querySelectorAll('.exam-set-dot');
    dots.forEach(function (dot, i) {
      dot.classList.remove('exam-set-dot--current', 'exam-set-dot--done');
      if (i < examState.currentSet) {
        dot.classList.add('exam-set-dot--done');
      } else if (i === examState.currentSet) {
        dot.classList.add('exam-set-dot--current');
      }
    });
  }

  // ==================== ④ 倒计时 ====================

  function startCountdown() {
    updateCountdownDisplay();

    examState.countdownInterval = setInterval(function () {
      examState.countdownSeconds--;

      updateCountdownDisplay();

      if (examState.countdownSeconds <= 0) {
        // 超时自动交卷
        handleTimeout();
      }
    }, 1000);
  }

  function updateCountdownDisplay() {
    var sec = examState.countdownSeconds;
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    $examCountdown.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;

    // 最后 60 秒红色闪烁
    if (sec <= 60) {
      $examCountdown.classList.remove('exam-countdown--normal');
      $examCountdown.classList.add('exam-countdown--urgent');
    } else {
      $examCountdown.classList.remove('exam-countdown--urgent');
      $examCountdown.classList.add('exam-countdown--normal');
    }
  }

  function stopCountdown() {
    if (examState.countdownInterval) {
      clearInterval(examState.countdownInterval);
      examState.countdownInterval = null;
    }
  }

  /** 超时自动交卷 */
  function handleTimeout() {
    stopCountdown();
    examState.timedOut = true;

    // 当前套若未完成，标记为未完成
    var setData = currentSetData();
    if (!setData.completed) {
      setData.accuracy = Utils.calcAccuracy(setData.totalAttempts, setData.wrongCount);
    }

    var toastMsg = '考试时间到！已自动交卷';
    if (global.Nav && global.Nav.showToast) {
      global.Nav.showToast(toastMsg, 'warning');
    }

    finishExam();
  }

  // ==================== ⑤ 配对匹配逻辑 ====================

  function bindExamBoardEvents() {
    var newGrid = $examBoardGrid.cloneNode(true);
    $examBoardGrid.parentNode.replaceChild(newGrid, $examBoardGrid);
    $examBoardGrid = newGrid;

    $examBoardGrid.addEventListener('click', function (e) {
      if (examState.isLocked) return;

      var $card = e.target.closest('.exam-card');
      if (!$card) return;

      // 已消除的卡片不可点击（考试模式下不弹详情）
      if ($card.classList.contains('exam-card--matched')) return;

      var index = parseInt($card.getAttribute('data-index'), 10);
      var setData = currentSetData();
      var cardData = setData.cards[index];

      // 点击已选中卡片 → 取消选中
      if ($card === examState.selectedCardEl) {
        $card.classList.remove('exam-card--selected');
        examState.selectedCardEl = null;
        examState.selectedCardData = null;
        return;
      }

      // 第一张选中
      if (!examState.selectedCardEl) {
        $card.classList.add('exam-card--selected');
        examState.selectedCardEl = $card;
        examState.selectedCardData = { index: index, data: cardData };
        return;
      }

      // 第二张选中 → 匹配判定
      var firstIndex  = parseInt(examState.selectedCardEl.getAttribute('data-index'), 10);
      var firstData   = setData.cards[firstIndex];
      var secondData  = cardData;
      var $firstEl    = examState.selectedCardEl;

      setData.totalAttempts++;

      if (Utils.isStageMatch(firstData.imageData.stageKey, secondData.imageData.stageKey)) {
        handleExamMatchSuccess($firstEl, $card);
      } else {
        handleExamMatchFail($firstEl, $card, secondData.imageData.stageKey);
      }

      examState.selectedCardEl = null;
      examState.selectedCardData = null;
    });
  }

  /** 考试正确配对 */
  function handleExamMatchSuccess($el1, $el2) {
    examState.isLocked = true;

    $el1.classList.remove('exam-card--selected');
    $el1.classList.add('exam-card--matched');
    $el2.classList.add('exam-card--matched');

    var setData = currentSetData();
    setData.matchedCount++;
    updateBoardStats();

    setTimeout(function () {
      examState.isLocked = false;

      // 本套 18 对全部消除？
      if (setData.matchedCount >= EXAM_PAIRS) {
        setData.completed = true;
        setData.accuracy = Utils.calcAccuracy(setData.totalAttempts, setData.wrongCount);

        // 检查是否是最后一套
        if (examState.currentSet >= 2) {
          // 全部完成
          stopCountdown();
          finishExam();
        } else {
          // 进入下一套
          showSetTransition(function () {
            renderExamSet(examState.currentSet + 1);
            bindExamBoardEvents();
          });
        }
      }
    }, 400);
  }

  /** 考试错误配对 — 仅抖动动画，无弹窗 */
  function handleExamMatchFail($el1, $el2, selectedStageKey) {
    examState.isLocked = true;

    $el1.classList.remove('exam-card--selected');
    $el1.classList.add('exam-card--shake');
    $el2.classList.add('exam-card--shake');

    var setData = currentSetData();
    setData.wrongCount++;
    setData.wrongStageMatches.push({ selected: selectedStageKey });
    updateBoardStats();

    setTimeout(function () {
      $el1.classList.remove('exam-card--shake');
      $el2.classList.remove('exam-card--shake');
      examState.isLocked = false;
    }, 450);
  }

  /** 更新棋盘统计数据 */
  function updateBoardStats() {
    var setData = currentSetData();
    $examMatched.textContent = setData.matchedCount + ' / ' + EXAM_PAIRS;
    var acc = Utils.calcAccuracy(setData.totalAttempts, setData.wrongCount);
    $examAccuracy.textContent = (acc * 100).toFixed(0) + '%';
    setData.accuracy = acc;
  }

  // ==================== ⑥ 套题过渡 ====================

  /**
   * 展示套题过渡动画，2.5 秒后自动进入下一套
   * @param {Function} callback - 过渡结束后回调
   */
  function showSetTransition(callback) {
    var setIdx = examState.currentSet;
    var setData = currentSetData();
    var setLabels = ['第一套', '第二套', '第三套'];

    $examTransitionTitle.textContent = setLabels[setIdx] + ' 完成！';
    $examTransitionAccuracy.innerHTML = '正确率：<strong>' + (setData.accuracy * 100).toFixed(0) + '%</strong>';
    $examTransitionHint.textContent = '即将进入 ' + setLabels[setIdx + 1] + '，请做好准备...';

    $examSetTransition.classList.remove('u-hidden');

    setTimeout(function () {
      $examSetTransition.classList.add('u-hidden');
      if (callback) callback();
    }, 2500);
  }

  // ==================== ⑦ 退出 / 弃考 ====================

  /** 点击退出考试按钮 */
  function onQuitExamClick() {
    $examQuitModal.classList.remove('u-hidden');
  }

  /** 确认弃考 */
  function confirmQuitExam() {
    $examQuitModal.classList.add('u-hidden');
    stopCountdown();

    examState.forfeited = true;

    // 将当前及未完成的套题标记为未完成
    for (var s = examState.currentSet; s < 3; s++) {
      var sd = examState.sets[s];
      sd.accuracy = Utils.calcAccuracy(sd.totalAttempts, sd.wrongCount);
      sd.completed = false;
    }

    // 写入弃考记录（计入当日考试次数，阻止重考）
    persistExamRecords();

    if (global.Nav && global.Nav.showToast) {
      global.Nav.showToast('已弃考，今日不可再参加考试', 'error');
    }

    // 返回规则首页
    refreshQualification();
    showRulesView();
  }

  // ==================== ⑧ 结算 & 报告 ====================

  /** 考试结束（正常完成/超时）→ 写入记录 + 展示报告 */
  function finishExam() {
    stopCountdown();
    examState.isLocked = true;

    // 对未开始的套题补标记
    for (var s = 0; s < 3; s++) {
      var sd = examState.sets[s];
      // 如果该套 0 次尝试且未完成 → 未触及（超时在到达前发生）
      if (sd.totalAttempts === 0 && !sd.completed) {
        sd.accuracy = 0;
      }
    }

    // 持久化
    persistExamRecords();

    // 更新用户积分
    updateUserAfterExam();

    // 刷新顶部栏
    if (global.Nav && global.Nav.refreshTopBar) {
      global.Nav.refreshTopBar();
    }

    // 渲染报告
    renderReport();

    showReportView();
  }

  /** 将考试数据写入 examRecord 表（每套一条记录） */
  function persistExamRecords() {
    var today = examState.examDate;
    var timePerSet = Math.floor((C.exam.timeLimitMinutes * 60 - examState.countdownSeconds) / 3);

    for (var s = 0; s < 3; s++) {
      var sd = examState.sets[s];
      var isCompleted = sd.completed && !examState.forfeited;

      Storage.insertOne('examRecord', {
        examDate: today,
        setIndex: s + 1,
        totalCards: C.exam.cardsPerSet,
        answeredCorrect: sd.matchedCount,
        answeredWrong: sd.wrongCount,
        accuracyRate: sd.accuracy,
        timeUsedSeconds: timePerSet,
        completed: isCompleted,
        scoreEarned: Utils.calcExamScore(sd.matchedCount, EXAM_PAIRS, isCompleted),
        createdAt: new Date().toISOString(),
      });
    }
  }

  /** 更新用户积分 */
  function updateUserAfterExam() {
    if (examState.forfeited) return;

    var user = Storage.getUser();
    if (!user) return;

    var totalScore = 0;
    for (var s = 0; s < 3; s++) {
      var sd = examState.sets[s];
      if (sd.completed) {
        totalScore += Utils.calcExamScore(sd.matchedCount, EXAM_PAIRS, true);
      }
    }

    // 练习时长也累加（考试也算训练时间）
    var minutesUsed = Math.ceil((C.exam.timeLimitMinutes * 60 - examState.countdownSeconds) / 60);

    Storage.saveUser({
      totalScore: (user.totalScore || 0) + totalScore,
      gold: (user.gold || 0) + totalScore,
      totalPracticeMinutes: (user.totalPracticeMinutes || 0) + minutesUsed,
    });
  }

  /** 渲染解析报告 */
  function renderReport() {
    // 总分
    var totalScore = 0;
    for (var s = 0; s < 3; s++) {
      var sd = examState.sets[s];
      if (sd.completed && !examState.forfeited) {
        totalScore += Utils.calcExamScore(sd.matchedCount, EXAM_PAIRS, true);
      }
    }

    // 标题和图标
    if (examState.forfeited) {
      $examReportIcon.innerHTML = '&#10060;';
      $examReportTitle.textContent = '考试弃考';
      $examReportSubtitle.textContent = '本次不计分，今日考试资格已作废';
    } else if (examState.timedOut) {
      $examReportIcon.innerHTML = '&#9200;';
      $examReportTitle.textContent = '考试时间到';
      $examReportSubtitle.textContent = '已自动交卷，已完成部分正常计分';
    } else {
      $examReportIcon.innerHTML = '&#127942;';
      $examReportTitle.textContent = '考试完成';
      $examReportSubtitle.textContent = 'NPUAP 2021 六分期识别能力考核';
    }

    $examTotalScore.textContent = examState.forfeited ? '--' : totalScore;

    // 三套题各成绩
    var setLabels = ['第一套（Ⅰ~Ⅲ期）', '第二套（Ⅰ~Ⅵ期）', '第三套（Ⅳ/不可分期/DTI）'];
    var htmlSets = '';

    for (var s2 = 0; s2 < 3; s2++) {
      var sd2 = examState.sets[s2];
      var accPct = (sd2.accuracy * 100).toFixed(0);
      var cssClass = 'exam-set-result';

      if (!sd2.completed && sd2.totalAttempts === 0) {
        // 未触及的套题
        cssClass += ' exam-set-result--forfeit';
        htmlSets +=
          '<div class="' + cssClass + '">' +
          '<span class="exam-set-result__label">' + setLabels[s2] + '</span>' +
          '<span class="exam-set-result__stats">' +
          '<span style="color:#A8989E;">未作答</span>' +
          '<span class="exam-set-result__accuracy exam-set-result__accuracy--low">--</span></span></div>';
        continue;
      }

      if (!sd2.completed && examState.forfeited) {
        cssClass += ' exam-set-result--forfeit';
      }

      var accClass = accPct >= 90 ? 'exam-set-result__accuracy--high'
        : accPct >= 70 ? 'exam-set-result__accuracy--mid'
        : 'exam-set-result__accuracy--low';

      var statusText = sd2.completed ? '' : '（未完成）';

      htmlSets +=
        '<div class="' + cssClass + '">' +
        '<span class="exam-set-result__label">' + setLabels[s2] + statusText + '</span>' +
        '<span class="exam-set-result__stats">' +
        '<span>配对 ' + sd2.matchedCount + ' / ' + EXAM_PAIRS + '</span>' +
        '<span>错误 ' + sd2.wrongCount + '</span>' +
        '<span class="exam-set-result__accuracy ' + accClass + '">' + accPct + '%</span></span></div>';
    }
    $examSetResults.innerHTML = htmlSets;

    // 高频混淆分期 TOP5
    renderConfusionTop5();

    // 绑定结算按钮
    bindReportEvents();
  }

  /** 汇总全部错误分期匹配，生成 TOP5 混淆列表 */
  function renderConfusionTop5() {
    // 汇总所有套题的 wrongStageMatches
    var allWrong = [];
    for (var s = 0; s < 3; s++) {
      allWrong = allWrong.concat(examState.sets[s].wrongStageMatches);
    }

    if (allWrong.length === 0) {
      $examConfusionList.innerHTML =
        '<p class="u-text-muted" style="font-size:13px;">本次考试无混淆记录，分期辨别准确</p>';
      return;
    }

    // 统计每个分期被错误选中的次数
    var countMap = {};
    var stageLabels = {
      stage_1: 'Ⅰ期', stage_2: 'Ⅱ期', stage_3: 'Ⅲ期',
      stage_4: 'Ⅳ期', unstage: '不可分期', dti: 'DTI',
    };

    allWrong.forEach(function (w) {
      var sk = w.selected;
      if (!countMap[sk]) countMap[sk] = 0;
      countMap[sk]++;
    });

    // 按次数降序排序
    var sorted = Object.keys(countMap).sort(function (a, b) {
      return countMap[b] - countMap[a];
    });

    // 取 TOP5
    var top5 = sorted.slice(0, 5);
    var html = '';

    top5.forEach(function (sk, i) {
      var rankClass = i === 0 ? ' exam-confusion-item__rank--gold' : '';
      html +=
        '<div class="exam-confusion-item">' +
        '<div class="exam-confusion-item__rank' + rankClass + '">' + (i + 1) + '</div>' +
        '<div class="exam-confusion-item__info">' +
        '被误判为 <strong>' + (stageLabels[sk] || sk) + '</strong> 的分期特征' +
        '</div>' +
        '<div class="exam-confusion-item__count">' + countMap[sk] + ' 次</div>' +
        '</div>';
    });

    $examConfusionList.innerHTML = html;
  }

  /** 结算按钮事件绑定 */
  function bindReportEvents() {
    /* 返回考试首页 */
    var $btnBack = document.getElementById('btnExamBackToRules');
    if ($btnBack) {
      var n1 = $btnBack.cloneNode(true);
      $btnBack.parentNode.replaceChild(n1, $btnBack);
      n1.addEventListener('click', function () {
        refreshQualification();
        showRulesView();
      });
    }

    /* 跳转错题库复盘 → 切换到练习模块的错题库（暂用 Nav 导航） */
    var $btnMistakes = document.getElementById('btnExamReviewMistakes');
    if ($btnMistakes) {
      var n2 = $btnMistakes.cloneNode(true);
      $btnMistakes.parentNode.replaceChild(n2, $btnMistakes);

      n2.addEventListener('click', function () {
        // 收集所有错误涉及的分期 key
        var allWrong = [];
        for (var s = 0; s < 3; s++) {
          allWrong = allWrong.concat(examState.sets[s].wrongStageMatches);
        }

        if (allWrong.length === 0) {
          if (global.Nav && global.Nav.showToast) {
            global.Nav.showToast('本次考试无错题', 'info');
          }
          return;
        }

        // 将错误分期图存入错题库
        var stageSet = {};
        allWrong.forEach(function (w) { stageSet[w.selected] = true; });
        var mistakes = JSON.parse(localStorage.getItem('pu_game_mistakes') || '[]');

        Object.keys(stageSet).forEach(function (sk) {
          var imgs = Storage.getImagesByStage(sk);
          imgs.forEach(function (img) {
            var exists = mistakes.some(function (m) { return m.id === img.id; });
            if (!exists) {
              mistakes.push({ id: img.id, stageKey: sk, savedAt: new Date().toISOString(), source: 'exam' });
            }
          });
        });

        localStorage.setItem('pu_game_mistakes', JSON.stringify(mistakes));

        if (global.Nav && global.Nav.showToast) {
          global.Nav.showToast('已存入错题库（' + Object.keys(stageSet).length + ' 个分期）', 'success');
        }
      });
    }
  }

  // ==================== ⑨ 弹窗事件 ====================

  function setupModals() {
    /* 资格未达标弹窗 */
    function closeBlocked() { $examBlockedModal.classList.add('u-hidden'); }
    var bc1 = document.getElementById('examBlockedClose');
    var bc2 = document.getElementById('examBlockedClose2');
    if (bc1) bc1.addEventListener('click', closeBlocked);
    if (bc2) bc2.addEventListener('click', closeBlocked);
    $examBlockedModal.addEventListener('click', function (e) {
      if (e.target === $examBlockedModal) closeBlocked();
    });

    /* 去练习按钮 */
    var $btnGoPractice = document.getElementById('btnExamGoPractice');
    if ($btnGoPractice) {
      $btnGoPractice.addEventListener('click', function () {
        closeBlocked();
        if (global.Nav && global.Nav.navigateTo) {
          global.Nav.navigateTo('practice');
        }
      });
    }

    /* 退出确认弹窗 */
    function closeQuit() { $examQuitModal.classList.add('u-hidden'); }
    var qc1 = document.getElementById('examQuitClose');
    var qc2 = document.getElementById('examQuitClose2');
    if (qc1) qc1.addEventListener('click', closeQuit);
    if (qc2) qc2.addEventListener('click', closeQuit);
    $examQuitModal.addEventListener('click', function (e) {
      if (e.target === $examQuitModal) closeQuit();
    });

    var $btnConfirmQuit = document.getElementById('btnExamConfirmQuit');
    if ($btnConfirmQuit) {
      $btnConfirmQuit.addEventListener('click', confirmQuitExam);
    }
  }

  // ==================== 初始化 ====================

  function init() {
    // 确保错题库存储键存在
    if (!localStorage.getItem('pu_game_mistakes')) {
      localStorage.setItem('pu_game_mistakes', '[]');
    }

    // 刷新资格
    refreshQualification();

    // 监听侧边栏切换到考试面板 → 自动刷新资格状态
    var examSidebarItem = document.querySelector('#sidebarNav .sidebar__item[data-page="exam"]');
    if (examSidebarItem) {
      examSidebarItem.addEventListener('click', function () {
        // 如果在考试中不刷新（防止意外重置）
        if (!examState.examStarted) {
          refreshQualification();
          showRulesView();
        }
      });
    }

    // 绑定事件
    var $btnStart = document.getElementById('btnStartExam');
    if ($btnStart) {
      var newStartBtn = $btnStart.cloneNode(true);
      $btnStart.parentNode.replaceChild(newStartBtn, $btnStart);
      newStartBtn.addEventListener('click', onStartExamClick);
      $btnStartExam = newStartBtn;
    }

    var $btnQuit = document.getElementById('btnQuitExam');
    if ($btnQuit) {
      $btnQuit.addEventListener('click', onQuitExamClick);
    }

    // 弹窗
    setupModals();

    showRulesView();

    console.log('[exam] 考试模块初始化完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== 导出 ====================

  global.Exam = {
    init: init,
    refreshQualification: refreshQualification,
  };

})(window);
