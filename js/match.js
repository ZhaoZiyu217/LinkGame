/**
 * match.js — 比赛模块完整离线对战逻辑
 * 模式选择 → 邀请码创建/加入 → 双人轮替棋盘 → 综合结算
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  var C  = global.AppConfig.CONFIG;
  var DI = global.AppConfig.DIFFICULTY;

  /** 对战会话 LocalStorage 键前缀 */
  var MATCH_PREFIX = 'pu_match_';
  /** 每局配对数 */
  var MATCH_PAIRS = C.board.pairs;
  /** 每局卡片数 */
  var MATCH_CARDS = C.board.totalCards;

  // ==================== 对战题库分期分布 ====================

  /**
   * 各难度对应的分期分布（与练习模式一致）
   * 15 对 = 30 张
   */
  var DIFF_DISTRIBUTION = {
    easy: [
      { stageKey: 'stage_1', count: 10 },
      { stageKey: 'stage_2', count: 10 },
      { stageKey: 'stage_3', count: 10 },
    ],
    medium: [
      { stageKey: 'stage_1', count: 6 },
      { stageKey: 'stage_2', count: 6 },
      { stageKey: 'stage_3', count: 6 },
      { stageKey: 'stage_4', count: 6 },
      { stageKey: 'dti',     count: 6 },
    ],
    hard: [
      { stageKey: 'stage_1',  count: 4 },
      { stageKey: 'stage_2',  count: 4 },
      { stageKey: 'stage_3',  count: 6 },
      { stageKey: 'stage_4',  count: 6 },
      { stageKey: 'unstage',  count: 4 },
      { stageKey: 'dti',      count: 6 },
    ],
  };

  /** 难度标签 */
  var diffLabels = { easy: '体验版', medium: '进阶版', hard: '终结版' };

  // ==================== DOM 引用 ====================

  var $matchModeView    = document.getElementById('matchModeView');
  var $matchCreateView  = document.getElementById('matchCreateView');
  var $matchJoinView    = document.getElementById('matchJoinView');
  var $matchReadyView   = document.getElementById('matchReadyView');
  var $matchBoardView   = document.getElementById('matchBoardView');
  var $matchSettleView  = document.getElementById('matchSettleView');
  var $matchHistoryView = document.getElementById('matchHistoryView');

  /* 棋盘 */
  var $matchBoardGrid  = document.getElementById('matchBoardGrid');
  var $matchTimer      = document.getElementById('matchTimer');
  var $matchMatched    = document.getElementById('matchMatched');
  var $matchAccuracy   = document.getElementById('matchAccuracy');
  var $matchPlayerTag  = document.getElementById('matchPlayerTag');
  var $matchPlayerLabel = document.getElementById('matchPlayerLabel');

  /* 切换过渡层 */
  var $matchSwitchOverlay = document.getElementById('matchSwitchOverlay');
  var $matchSwitchTitle   = document.getElementById('matchSwitchTitle');
  var $matchSwitchHint    = document.getElementById('matchSwitchHint');
  var $matchSwitchCard    = document.getElementById('matchSwitchCard');

  /* 难度选择按钮 */
  var $matchDiffSelector = document.getElementById('matchDiffSelector');

  // ==================== 对战状态 ====================

  var matchState = {
    mode: '',                    // 'random' | 'custom'
    sessionCode: '',             // 4 位邀请码
    session: null,               // 对战会话对象
    /** 当前玩家回合 */
    currentPlayer: '',           // 'p1' | 'p2'
    /** P1/P2 各自的游戏数据 */
    playerData: {
      p1: { matchedCount: 0, wrongCount: 0, totalAttempts: 0, wrongStages: [], accuracy: 0, elapsedSeconds: 0 },
      p2: { matchedCount: 0, wrongCount: 0, totalAttempts: 0, wrongStages: [], accuracy: 0, elapsedSeconds: 0 },
    },
    selectedCardEl: null,
    selectedCardData: null,
    isLocked: false,
    timer: null,
    /** P1/P2 各自的卡片排列（同题库，不同洗牌） */
    boardCards: { p1: [], p2: [] },
  };

  // ==================== 视图切换 ====================

  function hideAllMatchViews() {
    var views = [$matchModeView, $matchCreateView, $matchJoinView, $matchReadyView, $matchBoardView, $matchSettleView, $matchHistoryView];
    views.forEach(function (v) { v.classList.add('u-hidden'); });
  }

  function showModeView()    { hideAllMatchViews(); $matchModeView.classList.remove('u-hidden'); }
  function showCreateView()  { hideAllMatchViews(); $matchCreateView.classList.remove('u-hidden'); }
  function showJoinView()    { hideAllMatchViews(); $matchJoinView.classList.remove('u-hidden'); }
  function showReadyView()   { hideAllMatchViews(); $matchReadyView.classList.remove('u-hidden'); }
  function showBoardView()   { hideAllMatchViews(); $matchBoardView.classList.remove('u-hidden'); }
  function showSettleView()  { hideAllMatchViews(); $matchSettleView.classList.remove('u-hidden'); }
  function showHistoryView() { hideAllMatchViews(); $matchHistoryView.classList.remove('u-hidden'); }

  // ==================== ① 模式选择 ====================

  function bindModeEvents() {
    /* 随机挑战 */
    var $cardRandom = document.getElementById('cardRandomMatch');
    if ($cardRandom) {
      $cardRandom.addEventListener('click', function () {
        matchState.mode = 'random';
        // 随机选一个难度
        var diffs = ['easy', 'medium', 'hard'];
        var randomDiff = diffs[Utils.randomInt(0, diffs.length - 1)];
        matchState.session = null;
        setupCreateView(randomDiff, true);
        showCreateView();
      });
    }

    /* 自定义挑战 */
    var $cardCustom = document.getElementById('cardCustomMatch');
    if ($cardCustom) {
      $cardCustom.addEventListener('click', function () {
        matchState.mode = 'custom';
        matchState.session = null;
        setupCreateView('easy', false);
        showCreateView();
      });
    }
  }

  // ==================== ② 创建比赛 ====================

  /**
   * 初始化创建页
   * @param {string}  defaultDiff   - 默认难度
   * @param {boolean} isRandomMode  - 随机模式（难度不可选）
   */
  function setupCreateView(defaultDiff, isRandomMode) {
    // 重置
    var $input = document.getElementById('inputP1Nick');
    if ($input) $input.value = '';

    var $inviteArea = document.getElementById('inviteCodeArea');
    if ($inviteArea) $inviteArea.classList.add('u-hidden');

    var $btnGen = document.getElementById('btnGenerateCode');
    if ($btnGen) $btnGen.disabled = true;

    // 昵称输入 → 启用生成按钮
    if ($input) {
      var newInput = $input.cloneNode(true);
      $input.parentNode.replaceChild(newInput, $input);
      newInput.addEventListener('input', function () {
        var $b = document.getElementById('btnGenerateCode');
        if ($b) $b.disabled = !newInput.value.trim();
      });
    }

    // 难度选择器
    var diffBtns = $matchDiffSelector.querySelectorAll('.match-diff-btn');
    diffBtns.forEach(function (btn) {
      btn.classList.remove('match-diff-btn--selected');
      if (btn.getAttribute('data-diff') === defaultDiff) {
        btn.classList.add('match-diff-btn--selected');
      }
      if (isRandomMode) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    });

    // 难度选择事件
    var newSelector = $matchDiffSelector.cloneNode(true);
    $matchDiffSelector.parentNode.replaceChild(newSelector, $matchDiffSelector);
    $matchDiffSelector = newSelector;

    if (!isRandomMode) {
      $matchDiffSelector.addEventListener('click', function (e) {
        var btn = e.target.closest('.match-diff-btn');
        if (!btn || btn.disabled) return;
        $matchDiffSelector.querySelectorAll('.match-diff-btn').forEach(function (b) {
          b.classList.remove('match-diff-btn--selected');
        });
        btn.classList.add('match-diff-btn--selected');
      });
    }

    // 生成邀请码按钮
    var $btnGen2 = document.getElementById('btnGenerateCode');
    if ($btnGen2) {
      var newGen = $btnGen2.cloneNode(true);
      $btnGen2.parentNode.replaceChild(newGen, $btnGen2);
      newGen.addEventListener('click', generateInviteCode);
    }

    // 复制邀请码
    var $btnCopy = document.getElementById('btnCopyCode');
    if ($btnCopy) {
      var newCopy = $btnCopy.cloneNode(true);
      $btnCopy.parentNode.replaceChild(newCopy, $btnCopy);
      newCopy.addEventListener('click', copyInviteCode);
    }

    // P1 开始战斗
    var $btnStart = document.getElementById('btnP1StartAfterCode');
    if ($btnStart) {
      var newStart = $btnStart.cloneNode(true);
      $btnStart.parentNode.replaceChild(newStart, $btnStart);
      newStart.addEventListener('click', function () {
        if (!matchState.session) {
          toast('请先生成邀请码', 'warning');
          return;
        }
        // 标记会话状态为 p1 就绪
        matchState.session.status = 'p1_ready';
        saveMatchSession(matchState.session);
        showReadyViewPage();
      });
    }
  }

  /** 获取当前选中的难度 */
  function getSelectedDiff() {
    var selected = $matchDiffSelector.querySelector('.match-diff-btn--selected');
    return selected ? selected.getAttribute('data-diff') : 'easy';
  }

  /** 生成 4 位数字邀请码 + 创建对战会话 */
  function generateInviteCode() {
    var nick = document.getElementById('inputP1Nick').value.trim();
    if (!nick) { toast('请输入昵称', 'warning'); return; }

    var diff = getSelectedDiff();

    // 生成唯一 4 位数字码（避免冲突）
    var code;
    do {
      code = String(Utils.randomInt(1000, 9999));
    } while (localStorage.getItem(MATCH_PREFIX + code));

    // 生成对战题库（15 对 = 30 张卡片）
    var cardPairs = generateCardPairs(diff);

    // 创建会话
    var session = {
      code: code,
      mode: matchState.mode,
      difficulty: diff,
      cardPairs: cardPairs,
      p1Name: nick,
      p2Name: null,
      p1Result: null,
      p2Result: null,
      status: 'waiting',     // waiting → p1_ready → playing → finished
      createdAt: new Date().toISOString(),
    };

    // 持久化
    saveMatchSession(session);
    matchState.session = session;
    matchState.sessionCode = code;

    // 展示邀请码
    var $display = document.getElementById('inviteCodeDisplay');
    if ($display) {
      $display.innerHTML = code.split('').map(function (d) {
        return '<span class="match-invite-code__digit">' + d + '</span>';
      }).join('');
    }
    var $inviteArea = document.getElementById('inviteCodeArea');
    if ($inviteArea) $inviteArea.classList.remove('u-hidden');

    toast('邀请码已生成：' + code, 'success');
  }

  /** 复制邀请码到剪贴板 */
  function copyInviteCode() {
    var code = matchState.sessionCode;
    if (!code) { toast('邀请码不存在', 'error'); return; }

    // 使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function () {
        toast('邀请码已复制：' + code, 'success');
      }).catch(function () {
        fallbackCopy(code);
      });
    } else {
      fallbackCopy(code);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('邀请码已复制：' + text, 'success'); }
    catch (e) { toast('复制失败，请手动记录：' + text, 'warning'); }
    document.body.removeChild(ta);
  }

  // ==================== ③ 生成对战题库 ====================

  /**
   * 从图库选取 15 对卡片数据
   * @param {string} diff - 难度 key
   * @returns {Array} [{ pairId, stageKey, imageData }] 15 项
   */
  function generateCardPairs(diff) {
    var dist = DIFF_DISTRIBUTION[diff] || DIFF_DISTRIBUTION['easy'];
    var pairs = [];
    var pairId = 0;

    dist.forEach(function (d) {
      var images = Storage.getImagesByStage(d.stageKey);
      var pairsNeeded = d.count / 2;

      if (images.length === 0) {
        for (var i = 0; i < pairsNeeded; i++) {
          pairId++;
          pairs.push({ pairId: pairId, stageKey: d.stageKey, imageData: { id: '', stageKey: d.stageKey, imageDesc: '压疮分期图' } });
        }
        return;
      }

      var shuffled = Utils.shuffle(images);
      for (var p = 0; p < pairsNeeded; p++) {
        pairId++;
        pairs.push({ pairId: pairId, stageKey: d.stageKey, imageData: shuffled[p % shuffled.length] });
      }
    });

    return Utils.shuffle(pairs);
  }

  /**
   * 将 15 对展开为 30 张并洗牌
   * @param {Array} pairs - 15 对
   * @returns {Array} 30 张洗牌后的卡片
   */
  function pairsToCards(pairs) {
    var cards = [];
    pairs.forEach(function (pair) {
      cards.push({ pairId: pair.pairId, imageData: pair.imageData });
      cards.push({ pairId: pair.pairId, imageData: pair.imageData });
    });
    return Utils.shuffle(cards);
  }

  // ==================== ④ 加入比赛 ====================

  function setupJoinView() {
    // 重置输入
    var $inputs = document.querySelectorAll('#matchCodeInputs input');
    $inputs.forEach(function (inp) { inp.value = ''; });
    var $nickInput = document.getElementById('inputP2Nick');
    if ($nickInput) $nickInput.value = '';

    var $joinBtn = document.getElementById('btnJoinMatch');
    if ($joinBtn) $joinBtn.disabled = true;

    var $info = document.getElementById('matchJoinInfo');
    if ($info) $info.style.display = 'none';

    var $err = document.getElementById('matchJoinError');
    if ($err) $err.textContent = '';

    // 4 位码输入自动跳转 + 校验
    $inputs.forEach(function (inp, idx) {
      var newInp = inp.cloneNode(true);
      inp.parentNode.replaceChild(newInp, inp);

      newInp.addEventListener('input', function () {
        // 只允许数字
        newInp.value = newInp.value.replace(/[^0-9]/g, '');

        // 自动跳到下一个
        if (newInp.value && idx < 3) {
          var next = document.querySelector('#matchCodeInputs input[data-pos="' + (idx + 1) + '"]');
          if (next) next.focus();
        }

        // 4 位齐全 → 查找比赛
        checkInviteCode();
      });

      newInp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !newInp.value && idx > 0) {
          var prev = document.querySelector('#matchCodeInputs input[data-pos="' + (idx - 1) + '"]');
          if (prev) prev.focus();
        }
      });
    });

    // 昵称输入
    var $nick2 = document.getElementById('inputP2Nick');
    if ($nick2) {
      var newNick = $nick2.cloneNode(true);
      $nick2.parentNode.replaceChild(newNick, $nick2);
      newNick.addEventListener('input', checkInviteCode);
    }

    // 加入按钮
    var $join2 = document.getElementById('btnJoinMatch');
    if ($join2) {
      var newJoin = $join2.cloneNode(true);
      $join2.parentNode.replaceChild(newJoin, $join2);
      newJoin.addEventListener('click', joinMatch);
    }
  }

  /** 校验邀请码是否存在 */
  function checkInviteCode() {
    var $inputs = document.querySelectorAll('#matchCodeInputs input');
    var code = '';
    $inputs.forEach(function (inp) { code += inp.value; });

    var $err = document.getElementById('matchJoinError');
    var $info = document.getElementById('matchJoinInfo');
    var $btn = document.getElementById('btnJoinMatch');
    var nick = document.getElementById('inputP2Nick').value.trim();

    if (code.length < 4) {
      if ($info) $info.style.display = 'none';
      if ($err) $err.textContent = '';
      if ($btn) $btn.disabled = true;
      return;
    }

    // 查找会话
    var session = loadMatchSession(code);
    if (!session) {
      if ($err) $err.textContent = '未找到该邀请码对应的对战，请检查输入';
      if ($info) $info.style.display = 'none';
      if ($btn) $btn.disabled = true;
      return;
    }

    if (session.status === 'finished') {
      if ($err) $err.textContent = '该对战已结束';
      if ($info) $info.style.display = 'none';
      if ($btn) $btn.disabled = true;
      return;
    }

    if (session.p2Name && session.p2Name !== nick) {
      if ($err) $err.textContent = '该对战已被其他玩家加入';
      if ($info) $info.style.display = 'none';
      if ($btn) $btn.disabled = true;
      return;
    }

    // 匹配成功
    if ($err) $err.textContent = '';
    if ($info) {
      $info.style.display = 'block';
      $info.innerHTML =
        '<strong>对战信息：</strong><br>' +
        '创建者：' + session.p1Name + '<br>' +
        '难度：' + (diffLabels[session.difficulty] || session.difficulty) + '<br>' +
        '模式：' + (session.mode === 'random' ? '随机挑战' : '自定义挑战');
    }
    if ($btn) $btn.disabled = !nick;
  }

  /** 加入对战 */
  function joinMatch() {
    var $inputs = document.querySelectorAll('#matchCodeInputs input');
    var code = '';
    $inputs.forEach(function (inp) { code += inp.value; });

    var nick = document.getElementById('inputP2Nick').value.trim();
    if (!nick) { toast('请输入昵称', 'warning'); return; }

    var session = loadMatchSession(code);
    if (!session) { toast('邀请码无效', 'error'); return; }
    if (session.status === 'finished') { toast('该对战已结束', 'error'); return; }

    // 更新会话
    session.p2Name = nick;
    session.status = 'ready';
    saveMatchSession(session);

    matchState.sessionCode = code;
    matchState.session = session;
    matchState.mode = session.mode;

    showReadyViewPage();
  }

  // ==================== ⑤ 准备确认页 ====================

  function showReadyViewPage() {
    var s = matchState.session;
    if (!s) return;

    document.getElementById('readyP1Name').textContent = s.p1Name;
    document.getElementById('readyP1Avatar').textContent = s.p1Name.charAt(0);
    document.getElementById('readyP2Name').textContent = s.p2Name || '等待加入...';

    var p2Initial = s.p2Name ? s.p2Name.charAt(0) : '?';
    document.getElementById('readyP2Avatar').textContent = p2Initial;

    document.getElementById('matchReadyInfo').innerHTML =
      '<strong>难度：</strong>' + (diffLabels[s.difficulty] || s.difficulty) + '&nbsp;&nbsp;|&nbsp;&nbsp;' +
      '<strong>模式：</strong>' + (s.mode === 'random' ? '随机挑战' : '自定义挑战') + '<br>' +
      '<strong>规则：</strong>P1 先手完成全部配对后，将设备交给 P2。双方共用同一题库（卡片顺序不同）。<br>' +
      '正确率 × 70% + 速度分 × 30% 综合判定胜负。';

    var $btnStart = document.getElementById('btnReadyStart');
    if ($btnStart) {
      var newBtn = $btnStart.cloneNode(true);
      $btnStart.parentNode.replaceChild(newBtn, $btnStart);
      newBtn.addEventListener('click', startMatchForP1);
    }

    showReadyView();
  }

  // ==================== ⑥ 开始对战 ====================

  /** P1 先手开始 */
  function startMatchForP1() {
    matchState.currentPlayer = 'p1';

    // P1/P2 各生成一副洗牌不同的 30 张卡片（同题库）
    var pairs = matchState.session.cardPairs;
    matchState.boardCards.p1 = pairsToCards(pairs);
    matchState.boardCards.p2 = pairsToCards(pairs);

    // 重置 P1 数据
    matchState.playerData.p1 = { matchedCount: 0, wrongCount: 0, totalAttempts: 0, wrongStages: [], accuracy: 0, elapsedSeconds: 0 };

    // 更新会话状态
    matchState.session.status = 'playing';
    saveMatchSession(matchState.session);

    // 渲染棋盘
    renderMatchBoard();
    startMatchTimer();
    bindMatchBoardEvents();

    // 更新 UI
    $matchPlayerTag.textContent = 'P1';
    $matchPlayerTag.className = 'match-current-player-tag match-current-player-tag--p1';
    $matchPlayerLabel.textContent = matchState.session.p1Name;
    $matchTimer.textContent = '00:00';
    $matchMatched.textContent = '0 / ' + MATCH_PAIRS;
    $matchAccuracy.textContent = '100%';

    showBoardView();
  }

  /** P2 接手开始 */
  function startMatchForP2() {
    matchState.currentPlayer = 'p2';

    // 重置 P2 数据
    matchState.playerData.p2 = { matchedCount: 0, wrongCount: 0, totalAttempts: 0, wrongStages: [], accuracy: 0, elapsedSeconds: 0 };

    // 渲染 P2 的棋盘（同题库不同洗牌）
    renderMatchBoard();
    startMatchTimer();
    bindMatchBoardEvents();

    // 更新 UI
    $matchPlayerTag.textContent = 'P2';
    $matchPlayerTag.className = 'match-current-player-tag match-current-player-tag--p2';
    $matchPlayerLabel.textContent = matchState.session.p2Name;
    $matchTimer.textContent = '00:00';
    $matchMatched.textContent = '0 / ' + MATCH_PAIRS;
    $matchAccuracy.textContent = '100%';

    showBoardView();
  }

  /** 渲染当前玩家的棋盘 */
  function renderMatchBoard() {
    var player = matchState.currentPlayer;
    var cards = matchState.boardCards[player];

    $matchBoardGrid.innerHTML = '';

    cards.forEach(function (card, idx) {
      var sk = card.imageData.stageKey;
      var el = document.createElement('div');
      el.className = 'match-card';
      el.setAttribute('data-index', idx);
      el.setAttribute('data-pair-id', card.pairId);
      el.setAttribute('data-stage-key', sk);

      var shortDesc = card.imageData.imageDesc
        ? card.imageData.imageDesc.substring(0, 16) + '...'
        : '压疮分期图';

      /* 【新增】优先加载库内存储的压疮图片，图片路径为空/加载失败自动降级为文字展示 */
      var imgSrc = card.imageData.imgDataUrl || card.imageData.imgUrl || '';
      var imgHtml = imgSrc ? '<img src="' + imgSrc + '" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:10px;opacity:0.7;">' : '';

      el.innerHTML =
        '<div class="match-card__inner match-card__inner--' + sk + '">' +
        imgHtml +
        '<span class="match-card__desc">' + shortDesc + '</span>' +
        '</div>';

      $matchBoardGrid.appendChild(el);
    });
  }

  // ==================== ⑦ 对战计时器 ====================

  function startMatchTimer() {
    if (matchState.timer) {
      matchState.timer.reset();
    }
    matchState.timer = Utils.Timer();
    matchState.timer.onTick(function (elapsed) {
      $matchTimer.textContent = Utils.formatTime(elapsed);
    });
    matchState.timer.start();
  }

  function stopMatchTimer() {
    if (matchState.timer) {
      matchState.timer.pause();
    }
  }

  // ==================== ⑧ 棋盘匹配逻辑 ====================

  function bindMatchBoardEvents() {
    var newGrid = $matchBoardGrid.cloneNode(true);
    $matchBoardGrid.parentNode.replaceChild(newGrid, $matchBoardGrid);
    $matchBoardGrid = newGrid;

    $matchBoardGrid.addEventListener('click', function (e) {
      if (matchState.isLocked) return;

      var $card = e.target.closest('.match-card');
      if (!$card) return;
      if ($card.classList.contains('match-card--matched')) return;

      var index = parseInt($card.getAttribute('data-index'), 10);
      var player = matchState.currentPlayer;
      var cards = matchState.boardCards[player];
      var cardData = cards[index];

      // 点击已选中 → 取消选中
      if ($card === matchState.selectedCardEl) {
        $card.classList.remove('match-card--selected');
        matchState.selectedCardEl = null;
        matchState.selectedCardData = null;
        return;
      }

      // 第一张
      if (!matchState.selectedCardEl) {
        $card.classList.add('match-card--selected');
        matchState.selectedCardEl = $card;
        matchState.selectedCardData = { index: index, data: cardData };
        return;
      }

      // 第二张 → 匹配判定
      var firstIdx = parseInt(matchState.selectedCardEl.getAttribute('data-index'), 10);
      var firstData = cards[firstIdx];
      var secondData = cardData;
      var $firstEl = matchState.selectedCardEl;

      var pd = matchState.playerData[player];
      pd.totalAttempts++;

      if (Utils.isStageMatch(firstData.imageData.stageKey, secondData.imageData.stageKey)) {
        handleMatchPairSuccess($firstEl, $card);
      } else {
        handleMatchPairFail($firstEl, $card, secondData.imageData.stageKey);
      }

      matchState.selectedCardEl = null;
      matchState.selectedCardData = null;
    });
  }

  function handleMatchPairSuccess($el1, $el2) {
    matchState.isLocked = true;

    $el1.classList.remove('match-card--selected');
    $el1.classList.add('match-card--matched');
    $el2.classList.add('match-card--matched');

    var pd = matchState.playerData[matchState.currentPlayer];
    pd.matchedCount++;
    updateMatchBoardStats();

    setTimeout(function () {
      matchState.isLocked = false;

      // 全部消除？
      if (pd.matchedCount >= MATCH_PAIRS) {
        onPlayerFinished();
      }
    }, 400);
  }

  function handleMatchPairFail($el1, $el2, selectedStageKey) {
    matchState.isLocked = true;

    $el1.classList.remove('match-card--selected');
    $el1.classList.add('match-card--shake');
    $el2.classList.add('match-card--shake');

    var pd = matchState.playerData[matchState.currentPlayer];
    pd.wrongCount++;
    pd.wrongStages.push({ selected: selectedStageKey });
    updateMatchBoardStats();

    setTimeout(function () {
      $el1.classList.remove('match-card--shake');
      $el2.classList.remove('match-card--shake');
      matchState.isLocked = false;
    }, 450);
  }

  function updateMatchBoardStats() {
    var pd = matchState.playerData[matchState.currentPlayer];
    $matchMatched.textContent = pd.matchedCount + ' / ' + MATCH_PAIRS;
    var acc = Utils.calcAccuracy(pd.totalAttempts, pd.wrongCount);
    $matchAccuracy.textContent = (acc * 100).toFixed(0) + '%';
    pd.accuracy = acc;
  }

  /** 当前玩家完成全部配对 */
  function onPlayerFinished() {
    stopMatchTimer();
    var player = matchState.currentPlayer;
    var pd = matchState.playerData[player];
    pd.elapsedSeconds = matchState.timer.elapsed();
    pd.accuracy = Utils.calcAccuracy(pd.totalAttempts, pd.wrongCount);

    // 保存结果到会话
    if (player === 'p1') {
      matchState.session.p1Result = {
        matchedCount: pd.matchedCount,
        wrongCount: pd.wrongCount,
        accuracy: pd.accuracy,
        elapsedSeconds: pd.elapsedSeconds,
        wrongStages: pd.wrongStages.slice(),
      };
      matchState.session.status = 'p1_done';
      saveMatchSession(matchState.session);

      // 展示 P1 完成 → P2 接手过渡
      showPlayerSwitchOverlay();
    } else {
      matchState.session.p2Result = {
        matchedCount: pd.matchedCount,
        wrongCount: pd.wrongCount,
        accuracy: pd.accuracy,
        elapsedSeconds: pd.elapsedSeconds,
        wrongStages: pd.wrongStages.slice(),
      };
      matchState.session.status = 'finished';
      saveMatchSession(matchState.session);

      // 进入结算
      settleMatch();
    }
  }

  // ==================== ⑨ 玩家切换过渡 ====================

  function showPlayerSwitchOverlay() {
    var pd = matchState.playerData.p1;
    $matchSwitchTitle.textContent = matchState.session.p1Name + ' 已完成！';
    $matchSwitchHint.textContent =
      '正确率 ' + (pd.accuracy * 100).toFixed(0) + '% | 用时 ' + Utils.formatTime(pd.elapsedSeconds) + ' | ' +
      '请将设备交给 ' + (matchState.session.p2Name || 'P2');

    $matchSwitchOverlay.classList.remove('u-hidden');

    var $btn = document.getElementById('btnMatchPlayerSwitch');
    if ($btn) {
      var newBtn = $btn.cloneNode(true);
      $btn.parentNode.replaceChild(newBtn, $btn);
      newBtn.addEventListener('click', function () {
        $matchSwitchOverlay.classList.add('u-hidden');
        startMatchForP2();
      });
    }
  }

  // ==================== ⑩ 综合结算 ====================

  function settleMatch() {
    stopMatchTimer();

    var s = matchState.session;
    var p1r = s.p1Result;
    var p2r = s.p2Result;

    // 综合得分：正确率 × 70 + 速度分 × 30
    var p1Score = calcCompositeScore(p1r.accuracy, p1r.elapsedSeconds);
    var p2Score = calcCompositeScore(p2r.accuracy, p2r.elapsedSeconds);

    var winner = '';
    var loser = '';
    if (p1Score > p2Score) { winner = s.p1Name; loser = s.p2Name; }
    else if (p2Score > p1Score) { winner = s.p2Name; loser = s.p1Name; }
    else { winner = ''; } // 平局

    // 写入 matchRecord
    var record = Storage.insertOne('matchRecord', {
      player1Name: s.p1Name,
      player2Name: s.p2Name,
      player1Score: p1r.matchedCount,
      player2Score: p2r.matchedCount,
      winner: winner,
      difficulty: s.difficulty,
      durationSeconds: Math.floor(p1r.elapsedSeconds + p2r.elapsedSeconds),
      playedAt: new Date().toISOString(),
    });

    // 胜利方 +50 积分
    if (winner) {
      var user = Storage.getUser();
      if (user) {
        Storage.saveUser({
          totalScore: (user.totalScore || 0) + C.match.winScore,
          gold: (user.gold || 0) + C.match.winScore,
        });
      }
    }

    // 渲染结算页
    renderSettlement(p1r, p2r, p1Score, p2Score, winner);

    // 刷新顶部栏
    if (global.Nav && global.Nav.refreshTopBar) {
      global.Nav.refreshTopBar();
    }

    showSettleView();
  }

  /**
   * 综合得分计算
   * 权重：正确率 70%，速度分 30%
   * 速度分 = (1 - playerTime / maxTime) 归一化，慢者折合
   */
  function calcCompositeScore(accuracy, elapsedSeconds) {
    var maxTime = Math.max(
      matchState.playerData.p1.elapsedSeconds || elapsedSeconds,
      matchState.playerData.p2.elapsedSeconds || elapsedSeconds
    );
    if (maxTime <= 0) maxTime = 1;

    var accuracyComponent = accuracy * 70;
    var speedComponent = Math.max(0, (1 - elapsedSeconds / maxTime)) * 30;

    return Math.round((accuracyComponent + speedComponent) * 10) / 10;
  }

  /** 渲染结算页 */
  function renderSettlement(p1r, p2r, p1Score, p2Score, winner) {
    var s = matchState.session;

    // 标题和图标
    if (winner) {
      document.getElementById('matchSettleIcon').innerHTML = '&#127942;';
      document.getElementById('matchSettleTitle').textContent = '对战结束';
      document.getElementById('matchSettleSubtitle').textContent = diffLabels[s.difficulty] + ' | ' + (s.mode === 'random' ? '随机挑战' : '自定义挑战');
    } else {
      document.getElementById('matchSettleIcon').innerHTML = '&#129309;';
      document.getElementById('matchSettleTitle').textContent = '势均力敌！';
      document.getElementById('matchSettleSubtitle').textContent = '双方综合得分相同，握手言和';
    }

    // 胜负宣告
    if (winner) {
      var loserName = (winner === s.p1Name) ? s.p2Name : s.p1Name;
      document.getElementById('matchWinnerIcon').innerHTML = '&#127942;';
      document.getElementById('matchWinnerText').innerHTML =
        '<strong>' + winner + '</strong> 获胜！';
      document.getElementById('matchWinnerScore').textContent =
        '胜利方 +' + C.match.winScore + ' 积分已到账';
    } else {
      document.getElementById('matchWinnerIcon').innerHTML = '&#129309;';
      document.getElementById('matchWinnerText').textContent = '平局 — 势均力敌！';
      document.getElementById('matchWinnerScore').textContent = '双方各有所长，胜负未分';
    }

    // 表头
    document.getElementById('matchColP1Name').textContent = s.p1Name;
    document.getElementById('matchColP2Name').textContent = s.p2Name;

    // 配对数
    document.getElementById('matchRowP1Matched').textContent = p1r.matchedCount + ' / ' + MATCH_PAIRS;
    document.getElementById('matchRowP2Matched').textContent = p2r.matchedCount + ' / ' + MATCH_PAIRS;

    // 错误数
    document.getElementById('matchRowP1Wrong').textContent = p1r.wrongCount;
    document.getElementById('matchRowP2Wrong').textContent = p2r.wrongCount;

    // 正确率
    document.getElementById('matchRowP1Acc').textContent = (p1r.accuracy * 100).toFixed(0) + '%';
    document.getElementById('matchRowP2Acc').textContent = (p2r.accuracy * 100).toFixed(0) + '%';

    // 耗时
    document.getElementById('matchRowP1Time').textContent = Utils.formatTime(p1r.elapsedSeconds);
    document.getElementById('matchRowP2Time').textContent = Utils.formatTime(p2r.elapsedSeconds);

    // 综合得分
    document.getElementById('matchRowP1Total').textContent = p1Score;
    document.getElementById('matchRowP2Total').textContent = p2Score;

    // 高亮胜者行
    if (winner === s.p1Name) {
      document.getElementById('matchRowP1Total').className = 'match-compare-table--winner';
      document.getElementById('matchRowP2Total').className = '';
    } else if (winner === s.p2Name) {
      document.getElementById('matchRowP2Total').className = 'match-compare-table--winner';
      document.getElementById('matchRowP1Total').className = '';
    }

    // 错题对比
    var stageLabels = {
      stage_1: 'Ⅰ期', stage_2: 'Ⅱ期', stage_3: 'Ⅲ期',
      stage_4: 'Ⅳ期', unstage: '不可分期', dti: 'DTI',
    };

    document.getElementById('matchWrongP1Title').textContent = s.p1Name + ' 错误分期';
    document.getElementById('matchWrongP2Title').textContent = s.p2Name + ' 错误分期';

    document.getElementById('matchWrongP1Tags').innerHTML = renderWrongTags(p1r.wrongStages, stageLabels);
    document.getElementById('matchWrongP2Tags').innerHTML = renderWrongTags(p2r.wrongStages, stageLabels);

    // 结算按钮
    bindSettleButtons();
  }

  function renderWrongTags(wrongStages, stageLabels) {
    if (!wrongStages || wrongStages.length === 0) {
      return '<span style="font-size:12px;color:#A8989E;">无错误配对</span>';
    }

    // 统计
    var countMap = {};
    wrongStages.forEach(function (w) {
      var sk = w.selected;
      if (!countMap[sk]) countMap[sk] = 0;
      countMap[sk]++;
    });

    var html = '';
    Object.keys(countMap).forEach(function (sk) {
      html += '<span class="match-wrong-tag">' + (stageLabels[sk] || sk) + ' ×' + countMap[sk] + '</span>';
    });
    return html;
  }

  function bindSettleButtons() {
    var $btnBack = document.getElementById('btnMatchBackToMode');
    if ($btnBack) {
      var n1 = $btnBack.cloneNode(true);
      $btnBack.parentNode.replaceChild(n1, $btnBack);
      n1.addEventListener('click', function () { showModeView(); });
    }

    var $btnRematch = document.getElementById('btnMatchRematch');
    if ($btnRematch) {
      var n2 = $btnRematch.cloneNode(true);
      $btnRematch.parentNode.replaceChild(n2, $btnRematch);
      n2.addEventListener('click', function () {
        // 用相同规则生成新邀请码 → 回到创建页
        var diff = matchState.session.difficulty;
        matchState.session = null;
        matchState.sessionCode = '';
        setupCreateView(diff, matchState.mode === 'random');
        showCreateView();
      });
    }
  }

  // ==================== ⑪ 对战历史 ====================

  function renderHistory() {
    var records = Storage.findAll('matchRecord', 'playedAt', true);
    var $list = document.getElementById('matchHistoryList');

    if (records.length === 0) {
      $list.innerHTML = '<div class="empty-state" style="padding:40px;"><div class="empty-state__desc">暂无对战记录</div></div>';
      return;
    }

    var html = '';
    records.forEach(function (r) {
      var winnerText = r.winner
        ? '<span class="match-history-card__winner">胜者：' + r.winner + '</span>'
        : '<span class="match-history-card__winner">平局</span>';

      html +=
        '<div class="match-history-card">' +
        '<div>' +
        '<span class="match-history-card__players">' +
        r.player1Name + '<span class="match-history-card__vs"> VS </span>' + r.player2Name +
        '</span>&nbsp;&nbsp;' + winnerText +
        '</div>' +
        '<div class="match-history-card__meta">' +
        (diffLabels[r.difficulty] || r.difficulty) + ' | ' +
        r.player1Score + ':' + r.player2Score + ' | ' +
        new Date(r.playedAt).toLocaleDateString() +
        '</div>' +
        '</div>';
    });

    $list.innerHTML = html;

    // 导出按钮
    var $btnExport = document.getElementById('btnExportMatchHistory');
    if ($btnExport) {
      var newExp = $btnExport.cloneNode(true);
      $btnExport.parentNode.replaceChild(newExp, $btnExport);
      newExp.addEventListener('click', function () {
        var rows = [['玩家1', '玩家2', 'P1配对', 'P2配对', '胜者', '难度', '时长(秒)', '日期']];
        records.forEach(function (r) {
          rows.push([
            r.player1Name, r.player2Name, r.player1Score, r.player2Score,
            r.winner || '平局', r.difficulty, r.durationSeconds,
            new Date(r.playedAt).toLocaleString(),
          ]);
        });
        Utils.exportCSV(rows, '对战记录_' + Utils.todayStr());
      });
    }
  }

  // ==================== ⑫ 会话持久化 ====================

  /** 保存对战会话到 LocalStorage */
  function saveMatchSession(session) {
    try {
      localStorage.setItem(MATCH_PREFIX + session.code, JSON.stringify(session));
    } catch (e) {
      console.error('[match] 保存会话失败:', e);
      toast('存储空间不足，请清理旧数据', 'error');
    }
  }

  /** 从 LocalStorage 加载对战会话 */
  function loadMatchSession(code) {
    try {
      var raw = localStorage.getItem(MATCH_PREFIX + code);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /** 清理过期会话（超过 24 小时） */
  function cleanExpiredSessions() {
    var now = Date.now();
    var maxAge = 24 * 60 * 60 * 1000;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(MATCH_PREFIX) === 0) {
        try {
          var session = JSON.parse(localStorage.getItem(key));
          if (session && session.createdAt) {
            var age = now - new Date(session.createdAt).getTime();
            if (age > maxAge) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) { /* skip */ }
      }
    }
  }

  // ==================== ⑬ Toast ====================

  function toast(msg, type) {
    if (global.Nav && global.Nav.showToast) {
      global.Nav.showToast(msg, type);
    } else {
      console.log('[' + (type || 'info') + '] ' + msg);
    }
  }

  // ==================== 初始化 ====================

  function init() {
    // 清理过期会话
    cleanExpiredSessions();

    // 确保图库有数据
    if (Storage.count('pressureSoreLibrary') === 0) {
      // 借用练习模块的种子数据逻辑：复制一份简单种子
      seedLibraryForMatch();
    }

    // 绑定模式选择事件
    bindModeEvents();

    // 创建页返回按钮
    var $back1 = document.getElementById('btnCreateBack');
    if ($back1) $back1.addEventListener('click', showModeView);

    // 加入页返回按钮
    var $back2 = document.getElementById('btnJoinBack');
    if ($back2) {
      $back2.addEventListener('click', showModeView);
      setupJoinView();
    }

    // 历史页
    var $btnHistory = document.getElementById('btnMatchHistory');
    if ($btnHistory) {
      $btnHistory.addEventListener('click', function () {
        renderHistory();
        showHistoryView();
      });
    }
    var $back3 = document.getElementById('btnHistoryBack');
    if ($back3) $back3.addEventListener('click', showModeView);

    showModeView();

    console.log('[match] 比赛模块初始化完成');
  }

  /** 简易图库种子（确保 match.html 独立运行时也有数据） */
  function seedLibraryForMatch() {
    var seed = [
      { stageKey: 'stage_1', imageDesc: '骶尾部皮肤完整，指压不变白红斑约3cm×2cm' },
      { stageKey: 'stage_1', imageDesc: '足跟处完整皮肤局限性红斑，指压不褪色' },
      { stageKey: 'stage_1', imageDesc: '右髋部完整暗红皮肤区域与周围界限分明' },
      { stageKey: 'stage_1', imageDesc: '肘部伸侧完整皮肤，指压不变白红斑伴疼痛' },
      { stageKey: 'stage_1', imageDesc: '枕部局限性红斑约2.5cm，深肤色呈紫蓝色变' },
      { stageKey: 'stage_2', imageDesc: '骶尾部浅表开放创面粉红湿润约2cm×1.5cm' },
      { stageKey: 'stage_2', imageDesc: '臀部完整浆液性水疱直径约1.5cm' },
      { stageKey: 'stage_2', imageDesc: '足跟水疱破裂真皮暴露粉红湿润面' },
      { stageKey: 'stage_2', imageDesc: '髂嵴处部分皮层缺损创面鲜红湿润' },
      { stageKey: 'stage_2', imageDesc: '膝内侧表浅糜烂真皮暴露呈红色少量渗出' },
      { stageKey: 'stage_3', imageDesc: '骶尾部全层缺损皮下脂肪可见附黄色腐肉' },
      { stageKey: 'stage_3', imageDesc: '坐骨结节深度创面脂肪暴露创缘潜行1cm' },
      { stageKey: 'stage_3', imageDesc: '大转子处全层缺损脂肪颗粒可见少量渗出' },
      { stageKey: 'stage_4', imageDesc: '骶尾部深部创面骶骨骨膜暴露广泛潜行约5cm' },
      { stageKey: 'stage_4', imageDesc: '坐骨结节骨骼暴露肌腱可见组织坏死' },
      { stageKey: 'stage_4', imageDesc: '大转子处骨质外露直径2cm大量脓性渗出' },
      { stageKey: 'unstage', imageDesc: '骶尾部创面被黑色焦痂完全覆盖无法判深' },
      { stageKey: 'unstage', imageDesc: '髋部全层缺损被黄色腐肉棕色焦痂覆盖' },
      { stageKey: 'unstage', imageDesc: '臀部创面被灰绿腐肉覆盖散发异味需清创' },
      { stageKey: 'dti', imageDesc: '骶尾部椭圆形深紫区4cm×3cm指压不褪色' },
      { stageKey: 'dti', imageDesc: '足跟处褐红区域皮温低触感坚实表皮完整' },
      { stageKey: 'dti', imageDesc: '臀部直径3cm充血水疱周围皮肤深红色' },
      { stageKey: 'dti', imageDesc: '骶尾部血疱破裂深红创面床边界不清' },
      { stageKey: 'dti', imageDesc: '大转子处紫褐变触诊深层组织硬化广泛' },
      { stageKey: 'stage_3', imageDesc: '骶尾部全层缺损少量腐肉周围暗红' },
      { stageKey: 'stage_3', imageDesc: '足背全层组织缺损皮下暴露骨骼未露' },
      { stageKey: 'stage_4', imageDesc: '骶尾部全层缺损骨骼暴露多窦道大量渗液' },
      { stageKey: 'stage_4', imageDesc: '足跟全层缺损跟骨暴露周围肿胀疑似骨髓炎' },
      { stageKey: 'unstage', imageDesc: '骶尾部黑色硬痂覆盖可触及波动感创周红肿' },
      { stageKey: 'unstage', imageDesc: '足跟干燥黑色焦痂完整覆盖无渗液无异味' },
    ];
    seed.forEach(function (item) { Storage.insertOne('pressureSoreLibrary', item); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== 导出 ====================

  global.Match = { init: init, showModeView: showModeView };

})(window);
