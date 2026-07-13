/**
 * userCenter.js — 个人中心 / 签到日历 / 消息中心 完整业务逻辑
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  var C = global.AppConfig.CONFIG;
  var stageOrder = ['stage_1','stage_2','stage_3','stage_4','unstage','dti'];
  var stageShort = { stage_1:'Ⅰ期',stage_2:'Ⅱ期',stage_3:'Ⅲ期',stage_4:'Ⅳ期',unstage:'不可分期',dti:'DTI' };
  var diffLabels = { easy:'体验版',medium:'进阶版',hard:'终结版' };
  var stageColors = { stage_1:'#FF5252',stage_2:'#FF9800',stage_3:'#FFEB3B',stage_4:'#4CAF50',unstage:'#607D8B',dti:'#9C27B0' };

  // ==================== 消息存储（pc_game_messages） ====================
  function loadMessages() { try { return JSON.parse(localStorage.getItem('pu_game_messages')||'[]'); }catch(e){return[];} }
  function saveMessages(arr) { try { localStorage.setItem('pu_game_messages',JSON.stringify(arr)); }catch(e){} }
  function addMessage(type, title, text) {
    var msgs = loadMessages();
    msgs.unshift({ id:Date.now().toString(36)+Math.random().toString(36).slice(2,6), type:type, title:title, text:text, read:false, time:new Date().toISOString() });
    /* 保留最近 100 条 */
    if (msgs.length>100) msgs = msgs.slice(0,100);
    saveMessages(msgs);
  }

  // ==================== 视图切换 ====================
  var $ucHeaderView   = document.getElementById('ucHeaderView');
  var $signCalRoot    = document.getElementById('signCalRoot');
  var $msgCenterRoot  = document.getElementById('msgCenterRoot');

  function showUC()   { $ucHeaderView.classList.remove('u-hidden'); $signCalRoot.classList.add('u-hidden'); $msgCenterRoot.classList.add('u-hidden'); }
  function showSignCal(){ if (global.Nav && global.Nav.navigateTo) global.Nav.navigateTo('personal'); $ucHeaderView.classList.add('u-hidden'); $signCalRoot.classList.remove('u-hidden'); $msgCenterRoot.classList.add('u-hidden'); }
  function showMsg()   { if (global.Nav && global.Nav.navigateTo) global.Nav.navigateTo('personal'); $ucHeaderView.classList.add('u-hidden'); $signCalRoot.classList.add('u-hidden'); $msgCenterRoot.classList.remove('u-hidden'); }

  // ==================== ① 基础信息标签 ====================
  function refreshProfile() {
    var user = Storage.getUser();
    if (!user) return;

    var nick = user.nickname || '--';
    document.getElementById('profileNick').textContent = nick;
    /* 【新增】同步昵称到编辑输入框 */
    var $nickInput = document.getElementById('profileNickInput');
    if ($nickInput) $nickInput.value = user.nickname || '';

    document.getElementById('profileRegTime').textContent = user.createdAt ? new Date(user.createdAt).toLocaleString() : '--';
    document.getElementById('profileScore').textContent = user.totalScore || 0;
    document.getElementById('profileGold').textContent = user.gold || 0;
    document.getElementById('profileMinutes').textContent = (user.totalPracticeMinutes||0) + ' 分钟';
    document.getElementById('profileTrainCount').textContent = Storage.count('trainRecord');
    document.getElementById('profileExamCount').textContent = Storage.findAll('examRecord').filter(function(r){return r.completed;}).length;
    document.getElementById('profileMatchCount').textContent = Storage.count('matchRecord');

    var unlocked = user.unlockedDifficulty || ['easy'];
    var unlockedLabels = unlocked.map(function(k){return diffLabels[k]||k;}).join('、');
    document.getElementById('profileUnlocked').textContent = unlockedLabels;

    var signRecord = Storage.getSignRecord();
    var signDays = signRecord ? (signRecord.signDates||[]).length : 0;
    document.getElementById('profileSignDays').textContent = signDays + ' 天';
  }

  // ==================== 【新增】昵称编辑逻辑 ====================

  /** 进入编辑模式 */
  function enterNickEdit() {
    var user = Storage.getUser();
    var $display   = document.getElementById('profileNick');
    var $input     = document.getElementById('profileNickInput');
    var $btnEdit   = document.getElementById('btnEditNick');
    var $btnSave   = document.getElementById('btnSaveNick');
    var $btnCancel = document.getElementById('btnCancelNick');
    var $err       = document.getElementById('nickError');

    if (!$input || !$display) return;
    $input.value = user ? (user.nickname || '') : '';
    $input.style.display = 'inline-block';
    $input.focus();
    $display.style.display = 'none';
    if ($btnEdit)  $btnEdit.style.display = 'none';
    if ($btnSave)  $btnSave.style.display = 'inline-block';
    if ($btnCancel) $btnCancel.style.display = 'inline-block';
    if ($err) { $err.style.display = 'none'; $err.textContent = ''; }
  }

  /** 退出编辑模式（不保存） */
  function cancelNickEdit() {
    var $display   = document.getElementById('profileNick');
    var $input     = document.getElementById('profileNickInput');
    var $btnEdit   = document.getElementById('btnEditNick');
    var $btnSave   = document.getElementById('btnSaveNick');
    var $btnCancel = document.getElementById('btnCancelNick');
    var $err       = document.getElementById('nickError');

    $input.style.display = 'none';
    $display.style.display = 'inline';
    if ($btnEdit)  $btnEdit.style.display = 'inline-block';
    if ($btnSave)  $btnSave.style.display = 'none';
    if ($btnCancel) $btnCancel.style.display = 'none';
    if ($err) { $err.style.display = 'none'; $err.textContent = ''; }
  }

  /** 保存新昵称 */
  function saveNick() {
    var $input = document.getElementById('profileNickInput');
    var $err   = document.getElementById('nickError');
    var newNick = $input ? $input.value.trim() : '';

    /* 校验：禁止空白昵称 */
    if (!newNick) {
      if ($err) { $err.textContent = '昵称不能为空'; $err.style.display = 'block'; }
      return;
    }
    if (newNick.length > 10) {
      if ($err) { $err.textContent = '昵称最多 10 个字符'; $err.style.display = 'block'; }
      return;
    }

    /* 更新 userInfo.nickname */
    var user = Storage.getUser();
    if (!user) return;
    Storage.saveUser({ nickname: newNick });

    /* 同步所有展示位置 */
    var $display = document.getElementById('profileNick');
    if ($display) $display.textContent = newNick;

    /* 刷新顶部栏 */
    if (global.Nav && global.Nav.refreshTopBar) {
      global.Nav.refreshTopBar();
    }

    /* 刷新个人中心头部 */
    refreshHeader();

    cancelNickEdit();
    toast('昵称已更新为：' + newNick, 'success');
  }

  // ==================== ② 积分明细标签 ====================
  function refreshScoreLog() {
    var items = [];

    /* 练习得分 */
    var trainRecords = Storage.findAll('trainRecord','completedAt',true);
    trainRecords.forEach(function(r){
      if (r.scoreEarned>0) items.push({ icon:'✎', iconClass:'practice', desc:'练习模式（'+(diffLabels[r.difficulty]||r.difficulty)+'）', time:r.completedAt, amount:'+'+r.scoreEarned, type:'practice', source:'练习' });
    });

    /* 考试得分 */
    var examRecords = Storage.findAll('examRecord');
    examRecords.forEach(function(r){
      if (r.scoreEarned>0) items.push({ icon:'✐', iconClass:'exam', desc:'考试（第'+r.setIndex+'套）', time:r.createdAt||r.examDate, amount:'+'+r.scoreEarned, type:'exam', source:'考试' });
    });

    /* 比赛胜利 */
    var matchRecords = Storage.findAll('matchRecord','playedAt',true);
    matchRecords.forEach(function(r){
      var user = Storage.getUser();
      if (user && r.winner === user.nickname) {
        items.push({ icon:'⚔', iconClass:'match', desc:'比赛胜利（vs '+(r.player1Name===user.nickname?r.player2Name:r.player1Name)+'）', time:r.playedAt, amount:'+'+C.match.winScore, type:'match', source:'比赛' });
      }
    });

    /* 签到得分（从 signRecord 反推） */
    var sr = Storage.getSignRecord();
    if (sr && sr.signDates) {
      sr.signDates.forEach(function(d){
        /* 计算当日得分（简化处理：使用当天的连续天数） */
        items.push({ icon:'☀', iconClass:'sign', desc:'每日签到（'+d+'）', time:d, amount:'+'+(C.signIn.daily), type:'sign', source:'签到' });
      });
    }

    /* 按时间倒序 */
    items.sort(function(a,b){ return a.time < b.time ? 1 : -1; });
    items = items.slice(0, 50);

    var $list = document.getElementById('scoreLogList');
    if (items.length === 0) {
      $list.innerHTML = '<div class="empty-state" style="padding:30px;"><div class="empty-state__desc">暂无积分记录</div></div>';
      return;
    }

    var html = '';
    items.forEach(function(item){
      html += '<div class="uc-score-item">';
      html += '<div class="uc-score-item__icon uc-score-item__icon--'+item.iconClass+'">'+item.icon+'</div>';
      html += '<div class="uc-score-item__info">';
      html += '<div class="uc-score-item__desc">'+item.desc+'</div>';
      html += '<div class="uc-score-item__time">'+(item.time?new Date(item.time).toLocaleString():'')+'</div>';
      html += '</div>';
      html += '<div class="uc-score-item__amount uc-score-item__amount--plus">'+item.amount+'</div>';
      html += '</div>';
    });
    $list.innerHTML = html;
  }

  // ==================== ③ 学习统计标签（科研核心） ====================

  function refreshStats() {
    renderStageAccuracyChart();
    renderStageErrorPieChart();
    renderMasteryTable();
    renderExamHistory();
    renderMatchHistory();
  }

  /** 各分期平均正确率柱状图 */
  function renderStageAccuracyChart() {
    var records = Storage.findAll('trainRecord');
    if (records.length===0) {
      Charts.bar('#chartStageAccuracy',{data:[],title:'各分期平均正确率（%）'});
      return;
    }

    /* 聚合：每个分期统计 totalPairs + matchedPairs */
    var stageStats = {};
    stageOrder.forEach(function(sk){ stageStats[sk]={totalPairs:0,matched:0}; });

    records.forEach(function(r){
      if (!r.wrongStageMatch && !r.difficulty) return;
      /* 按难度推断分期分布（近似） */
    });

    /* 使用所有练习记录的整体正确率作为全局数据 */
    var allRecords = Storage.findAll('trainRecord');
    var diffKeys = ['easy','medium','hard'];
    var data = diffKeys.map(function(dk){
      var recs = Storage.getTrainRecordsByDifficulty(dk);
      var avg = Utils.calcAvgAccuracy(recs);
      return { label:diffLabels[dk]||dk, value:Math.round(avg*100), color: dk==='easy'?'#4CAF50':dk==='medium'?'#FF9800':'#C0392B' };
    });

    Charts.bar('#chartStageAccuracy',{data:data,title:'各难度平均正确率（%）'});
  }

  /** 易混淆分期错误占比饼图 */
  function renderStageErrorPieChart() {
    var records = Storage.findAll('trainRecord');
    var errCounts = {};
    stageOrder.forEach(function(sk){ errCounts[sk]=0; });

    records.forEach(function(r){
      if (r.wrongStageMatch) {
        r.wrongStageMatch.forEach(function(w){
          if (w.selected) errCounts[w.selected] = (errCounts[w.selected]||0)+1;
        });
      }
    });

    /* 也加入考试的错误 */
    var examRecords = Storage.findAll('examRecord');
    /* 考试记录没有 per-stage 详情，跳过 */

    var data = [];
    stageOrder.forEach(function(sk){
      if (errCounts[sk]>0) {
        data.push({ label:stageShort[sk]||sk, value:errCounts[sk], color:stageColors[sk] });
      }
    });

    Charts.pie('#chartStageErrors',{data:data,title:'易混淆分期错误占比',size:130});
  }

  /** 分期掌握评级表 */
  function renderMasteryTable() {
    var records = Storage.findAll('trainRecord');
    var stageStats = {};
    stageOrder.forEach(function(sk){ stageStats[sk]={correct:0,wrong:0}; });

    records.forEach(function(r){
      if (r.wrongStageMatch) {
        r.wrongStageMatch.forEach(function(w){
          if (w.selected) stageStats[w.selected].wrong++;
        });
      }
    });

    var tbody = document.querySelector('#masteryTable tbody');
    if (!tbody) return;
    var html = '';
    stageOrder.forEach(function(sk){
      var stat = stageStats[sk];
      var total = stat.correct + stat.wrong;
      var acc = total>0 ? Math.round((stat.correct/total)*100) : 100;
      var grade, gradeClass;
      if (acc>=90) { grade='精通'; gradeClass='good'; }
      else if (acc>=60) { grade='熟练'; gradeClass='ok'; }
      else { grade='薄弱'; gradeClass='newbie'; }

      html += '<tr>';
      html += '<td style="font-weight:600;">'+(stageShort[sk]||sk)+'</td>';
      html += '<td>'+acc+'%</td>';
      html += '<td>'+stat.wrong+'</td>';
      html += '<td><span class="uc-mastery-badge uc-mastery-badge--'+gradeClass+'">'+grade+'</span></td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  /** 考试历史 */
  function renderExamHistory() {
    var records = Storage.findAll('examRecord','createdAt',true).filter(function(r){return r.completed;});
    var $el = document.getElementById('examHistoryList');
    if (!records.length) { $el.innerHTML='<span style="color:#A8989E;font-size:12px;">暂无考试记录</span>'; return; }

    var html = '';
    records.slice(0,20).forEach(function(r){
      html += '<div class="uc-history-item">';
      html += '<span>第'+r.setIndex+'套 | 正确率 '+(r.accuracyRate*100).toFixed(0)+'% | 得分 '+r.scoreEarned+'</span>';
      html += '<span class="uc-history-item__tag uc-history-item__tag--exam">考试</span>';
      html += '</div>';
    });
    $el.innerHTML = html;
  }

  /** 比赛历史 */
  function renderMatchHistory() {
    var records = Storage.findAll('matchRecord','playedAt',true);
    var $el = document.getElementById('matchHistoryList');
    if (!records.length) { $el.innerHTML='<span style="color:#A8989E;font-size:12px;">暂无比赛记录</span>'; return; }

    var html = '';
    records.slice(0,20).forEach(function(r){
      html += '<div class="uc-history-item">';
      html += '<span>'+r.player1Name+' vs '+r.player2Name+' | '+r.player1Score+':'+r.player2Score+'</span>';
      html += '<span class="uc-history-item__tag uc-history-item__tag--match">'+(r.winner?'胜者:'+r.winner:'平局')+'</span>';
      html += '</div>';
    });
    $el.innerHTML = html;
  }

  // ==================== ④ 积分榜标签 ====================
  function refreshLeaderboard() {
    var records = Storage.findAll('trainRecord');
    var diffKeys = ['easy','medium','hard'];

    var html = '';
    diffKeys.forEach(function(dk){
      var recs = records.filter(function(r){return r.difficulty===dk;}).sort(function(a,b){return b.scoreEarned-a.scoreEarned;}).slice(0,5);
      html += '<div class="uc-leaderboard__section"><div class="uc-leaderboard__section-title">'+(diffLabels[dk]||dk)+' 最高分排行</div>';
      if (recs.length===0) { html += '<div style="font-size:12px;color:#A8989E;padding:12px;">暂无记录</div></div>'; return; }
      recs.forEach(function(r,idx){
        var rankClass = idx===0?'--1':idx===1?'--2':idx===2?'--3':'--n';
        html += '<div class="uc-leader-item">';
        html += '<div class="uc-leader-item__rank uc-leader-item__rank'+rankClass+'">'+(idx+1)+'</div>';
        html += '<div class="uc-leader-item__info"><div class="uc-leader-item__name">'+r.scoreEarned+' 分</div><div class="uc-leader-item__meta">正确率 '+(r.accuracyRate*100).toFixed(0)+'% | '+Utils.formatTime(r.durationSeconds)+'</div></div>';
        html += '</div>';
      });
      html += '</div>';
    });
    document.getElementById('leaderboardContent').innerHTML = html;
  }

  // ==================== 头部刷新 ====================
  function refreshHeader() {
    var user = Storage.getUser();
    if (!user) return;
    document.getElementById('ucAvatar').textContent = (user.nickname||'我').charAt(0);
    document.getElementById('ucNick').textContent = user.nickname||'护理学员';
    var unlocked = user.unlockedDifficulty||['easy'];
    var unlockedLabels = unlocked.map(function(k){return diffLabels[k]||k;}).join('、');
    document.getElementById('ucMeta').textContent = '注册时间 '+(user.createdAt?new Date(user.createdAt).toLocaleDateString():'--')+' | 已解锁 '+unlockedLabels;
    document.getElementById('ucHeaderScore').textContent = user.totalScore||0;
    document.getElementById('ucHeaderGold').textContent = user.gold||0;
    document.getElementById('ucHeaderMinutes').textContent = Math.floor((user.totalPracticeMinutes||0)/60)+'h';
  }

  // ==================== 重置操作 ====================
  function resetAll() {
    if (!confirm('确认清空全部数据？此操作不可恢复！\n\n将清除：用户信息、签到记录、练习/考试/比赛记录、收藏、错题')) return;
    if (!confirm('再次确认：清空全部数据？')) return;
    var tables = ['userInfo','signRecord','trainRecord','examRecord','matchRecord','pressureSoreLibrary'];
    tables.forEach(function(t){ Storage.clearTable(t); });
    localStorage.removeItem('pu_game_favorites');
    localStorage.removeItem('pu_game_mistakes');
    localStorage.removeItem('pu_game_messages');
    toast('全部数据已清空，即将刷新页面', 'warning');
    setTimeout(function(){ location.reload(); },1500);
  }
  function resetScore() {
    if (!confirm('确认清空所有积分和金币？记录保留，仅积分归零。')) return;
    var user = Storage.getUser();
    if (user) Storage.saveUser({ totalScore:0, gold:0 });
    toast('积分/金币已归零','info');
    refreshAll();
  }
  function resetMistakes() {
    if (!confirm('确认清空错题库和收藏？')) return;
    localStorage.setItem('pu_game_mistakes','[]');
    localStorage.setItem('pu_game_favorites','[]');
    toast('错题库和收藏已清空','info');
  }

  // ==================== ⑤ 签到日历 ====================
  var calYear, calMonth; /* 当前展示的年月 */

  function refreshSignCalendar() {
    var today = new Date();
    calYear = today.getFullYear();
    calMonth = today.getMonth() + 1;
    renderCalendar();
    updateCalStats();
  }

  function renderCalendar() {
    document.getElementById('calMonthLabel').textContent = calYear+' 年 '+calMonth+' 月';
    var signRecord = Storage.getSignRecord();
    var signedDates = signRecord ? (signRecord.signDates||[]) : [];
    var todayStr = Utils.todayStr();

    /* 第一天星期几（0=日） */
    var firstDay = new Date(calYear,calMonth-1,1).getDay();
    var daysInMonth = new Date(calYear,calMonth,0).getDate();
    var daysInPrev  = new Date(calYear,calMonth-1,0).getDate();

    /* 清空旧日期格 */
    var $grid = document.getElementById('signCalGrid');
    var oldDays = $grid.querySelectorAll('.sign-cal-day');
    oldDays.forEach(function(d){ d.remove(); });

    /* 上月填充 */
    for (var i=firstDay-1;i>=0;i--) {
      var d = daysInPrev - i;
      var ds = calYear+'-'+('0'+(calMonth===1?12:calMonth-1)).slice(-2)+'-'+('0'+d).slice(-2);
      var signed = signedDates.indexOf(ds)!==-1;
      $grid.appendChild(createDayEl(d,true,false,signed));
    }

    /* 当月 */
    for (var d2=1;d2<=daysInMonth;d2++) {
      var ds2 = calYear+'-'+('0'+calMonth).slice(-2)+'-'+('0'+d2).slice(-2);
      var isToday = ds2===todayStr;
      var signed2 = signedDates.indexOf(ds2)!==-1;
      $grid.appendChild(createDayEl(d2,false,isToday,signed2));
    }

    /* 下月填充 */
    var remaining = 42 - firstDay - daysInMonth;
    for (var j=1;j<=remaining;j++) {
      var ds3 = calYear+'-'+('0'+(calMonth===12?1:calMonth+1)).slice(-2)+'-'+('0'+j).slice(-2);
      var signed3 = signedDates.indexOf(ds3)!==-1;
      $grid.appendChild(createDayEl(j,true,false,signed3));
    }
  }

  function createDayEl(day, isOther, isToday, signed) {
    var el = document.createElement('div');
    el.className = 'sign-cal-day';
    if (isOther) el.classList.add('sign-cal-day--other');
    if (isToday) el.classList.add('sign-cal-day--today');
    if (signed)  el.classList.add('sign-cal-day--signed');
    el.textContent = day;
    return el;
  }

  function updateCalStats() {
    var sr = Storage.getSignRecord();
    var signedDates = sr ? (sr.signDates||[]) : [];
    /* 本月签到天数 */
    var thisMonth = calYear+'-'+('0'+calMonth).slice(-2);
    var monthCount = signedDates.filter(function(d){ return d.indexOf(thisMonth)===0; }).length;
    document.getElementById('signCalTotal').textContent = monthCount;
    var streak = Utils.calcStreakDays(signedDates);
    document.getElementById('signCalStreak').textContent = streak;
    var todayScore = Utils.calcSignInScore(streak+1);
    document.getElementById('signCalTodayScore').textContent = '+' + todayScore;

    /* 签到按钮状态 */
    var today = Utils.todayStr();
    var isSignedToday = signedDates.indexOf(today)!==-1;
    var $btn = document.getElementById('btnCalSignIn');
    $btn.disabled = isSignedToday;
    $btn.textContent = isSignedToday ? '今日已签到' : '签到打卡';
  }

  function doSignInFromCal() {
    var today = Utils.todayStr();
    var sr = Storage.getSignRecord();
    if (!sr) sr = Storage.insertOne('signRecord',{signDates:[],streakDays:0,lastSignDate:''});
    if (sr.signDates.indexOf(today)!==-1) { toast('今日已签到','warning'); return; }

    var dates = (sr.signDates||[]).slice();
    dates.push(today);
    var streak = Utils.calcStreakDays(dates);
    var earned = Utils.calcSignInScore(streak);
    Storage.updateOne('signRecord',sr.id,{signDates:dates,streakDays:streak,lastSignDate:today});

    var user = Storage.getUser();
    if (user) Storage.saveUser({ totalScore:(user.totalScore||0)+earned, gold:(user.gold||0)+earned });

    addMessage('sign','签到成功','获得 '+earned+' 积分，连续签到 '+streak+' 天！');
    toast('签到成功！+'+earned+' 积分','success');
    updateCalStats();
    renderCalendar();
    if (global.Nav && global.Nav.refreshTopBar) global.Nav.refreshTopBar();
  }

  // ==================== ⑥ 消息中心 ====================
  var msgFilter = 'all';

  function refreshMsgCenter() {
    var msgs = loadMessages();
    if (msgFilter!=='all') msgs = msgs.filter(function(m){return m.type===msgFilter;});

    var $list = document.getElementById('msgList');
    if (msgs.length===0) {
      $list.innerHTML = '<div class="empty-state" style="padding:40px;"><div class="empty-state__desc" style="color:rgba(255,255,255,0.4);">暂无消息</div></div>';
      return;
    }

    var html = '';
    msgs.forEach(function(m){
      var unreadClass = m.read ? '' : ' msg-item--unread';
      var dotClass = 'msg-item__dot--'+({sign:'sign',exam:'exam',mistake:'mistake',system:'system'}[m.type]||'system');
      html += '<div class="msg-item'+unreadClass+'">';
      html += '<div class="msg-item__dot '+dotClass+'"></div>';
      html += '<div class="msg-item__body">';
      html += '<div class="msg-item__title">'+m.title+'</div>';
      html += '<div class="msg-item__text">'+m.text+'</div>';
      html += '<div class="msg-item__time">'+new Date(m.time).toLocaleString()+'</div>';
      html += '</div></div>';
    });
    $list.innerHTML = html;

    /* 点击消息标记已读 */
    $list.querySelectorAll('.msg-item--unread').forEach(function(el,idx){
      el.addEventListener('click',function(){
        var actualIdx = msgFilter==='all' ? msgs.map(function(m_,i_){return m_.read?null:i_;}).filter(function(v){return v!==null;})[idx] : idx;
        if (actualIdx!==undefined) {
          var allMsgs = loadMessages();
          var mid = msgs[idx].id;
          allMsgs.forEach(function(am){ if(am.id===mid) am.read=true; });
          saveMessages(allMsgs);
          refreshMsgCenter();
        }
      });
    });
  }

  function markAllRead() {
    var msgs = loadMessages();
    msgs.forEach(function(m){ m.read=true; });
    saveMessages(msgs);
    refreshMsgCenter();
    toast('全部标记已读','info');
  }

  function clearAllMsgs() {
    if (!confirm('确认清空全部消息？')) return;
    localStorage.setItem('pu_game_messages','[]');
    refreshMsgCenter();
    toast('消息已清空','info');
  }

  // ==================== 导出 ====================
  function exportAllJSON() {
    var data = Storage.exportAll();
    Utils.exportJSON(data,'压疮连连看_全量数据_'+Utils.todayStr());
    toast('导出成功','success');
  }
  function exportTrainCSV() {
    var records = Storage.findAll('trainRecord');
    var rows = Utils.trainRecordsToTable(records);
    Utils.exportCSV(rows,'练习记录_'+Utils.todayStr());
    toast('导出成功','success');
  }
  function exportExamCSV() {
    var records = Storage.findAll('examRecord');
    var rows = Utils.examRecordsToTable(records);
    Utils.exportCSV(rows,'考试记录_'+Utils.todayStr());
    toast('导出成功','success');
  }

  // ==================== 全量刷新 ====================
  function refreshAll() {
    showUC();
    refreshHeader();
    refreshProfile();
  }

  // ==================== Initialize ====================
  function init() {
    /* 确保消息存储键 */
    if (!localStorage.getItem('pu_game_messages')) localStorage.setItem('pu_game_messages','[]');

    /* 头部 */
    refreshHeader();

    /* ===== 标签页切换 ===== */
    document.getElementById('ucTabs').addEventListener('click',function(e){
      var tab = e.target.closest('.uc-tab'); if (!tab) return;
      var tabKey = tab.getAttribute('data-tab');
      /* 切换激活态 */
      document.querySelectorAll('#ucTabs .uc-tab').forEach(function(t){t.classList.remove('uc-tab--active');});
      tab.classList.add('uc-tab--active');
      /* 切换内容 */
      document.querySelectorAll('#ucHeaderView .uc-tab-content').forEach(function(c){c.classList.remove('uc-tab-content--active');});
      var $content = document.getElementById('tab-'+tabKey);
      if ($content) $content.classList.add('uc-tab-content--active');
      /* 按需刷新 */
      if (tabKey==='profile') refreshProfile();
      if (tabKey==='scoreLog') refreshScoreLog();
      if (tabKey==='stats') refreshStats();
      if (tabKey==='leaderboard') refreshLeaderboard();
    });

    /* 默认加载 profile */
    refreshProfile();

    /* ===== 【新增】昵称编辑按钮 ===== */
    var $btnEN = document.getElementById('btnEditNick');   if ($btnEN) $btnEN.addEventListener('click', enterNickEdit);
    var $btnSN = document.getElementById('btnSaveNick');   if ($btnSN) $btnSN.addEventListener('click', saveNick);
    var $btnCN = document.getElementById('btnCancelNick'); if ($btnCN) $btnCN.addEventListener('click', cancelNickEdit);
    /* Enter 键快捷保存 */
    var $nickInp = document.getElementById('profileNickInput');
    if ($nickInp) $nickInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') saveNick(); });

    /* ===== 重置按钮 ===== */
    var $btnRA=document.getElementById('btnResetAll'); if($btnRA) $btnRA.addEventListener('click',resetAll);
    var $btnRS=document.getElementById('btnResetScore'); if($btnRS) $btnRS.addEventListener('click',resetScore);
    var $btnRM=document.getElementById('btnResetMistakes'); if($btnRM) $btnRM.addEventListener('click',resetMistakes);

    /* ===== 导出按钮 ===== */
    var $btEJ=document.getElementById('btnExportJSON'); if($btEJ) $btEJ.addEventListener('click',exportAllJSON);
    var $btEC=document.getElementById('btnExportCSV'); if($btEC) $btEC.addEventListener('click',exportTrainCSV);
    var $btEE=document.getElementById('btnExportExamCSV'); if($btEE) $btEE.addEventListener('click',exportExamCSV);

    /* ===== 签到日历按钮 ===== */
    var $btnCalSignIn = document.getElementById('btnCalSignIn');
    if ($btnCalSignIn) $btnCalSignIn.addEventListener('click', doSignInFromCal);
    var $btnCalPrev = document.getElementById('btnCalPrev');
    if ($btnCalPrev) $btnCalPrev.addEventListener('click', function(){ calMonth--; if(calMonth<1){calMonth=12;calYear--;} renderCalendar(); updateCalStats(); });
    var $btnCalNext = document.getElementById('btnCalNext');
    if ($btnCalNext) $btnCalNext.addEventListener('click', function(){ calMonth++; if(calMonth>12){calMonth=1;calYear++;} renderCalendar(); updateCalStats(); });
    var $btnSCB = document.getElementById('btnSignCalBack');
    if ($btnSCB) $btnSCB.addEventListener('click',function(){ showUC(); refreshHeader(); });

    /* ===== 消息中心按钮 ===== */
    var $btnMsgB = document.getElementById('btnMsgBack');
    if ($btnMsgB) $btnMsgB.addEventListener('click',function(){ showUC(); refreshHeader(); });
    var $btnReadAll = document.getElementById('btnMsgReadAll');
    if ($btnReadAll) $btnReadAll.addEventListener('click', markAllRead);
    var $btnClearAll = document.getElementById('btnMsgClearAll');
    if ($btnClearAll) $btnClearAll.addEventListener('click', clearAllMsgs);

    /* 消息筛选 */
    document.getElementById('msgFilterGroup').addEventListener('click',function(e){
      var btn = e.target.closest('.msg-filter-btn'); if (!btn) return;
      document.querySelectorAll('#msgFilterGroup .msg-filter-btn').forEach(function(b){b.classList.remove('msg-filter-btn--active');});
      btn.classList.add('msg-filter-btn--active');
      msgFilter = btn.getAttribute('data-filter');
      refreshMsgCenter();
    });

    /* ===== 初始化外部入口：头像点击 + 顶部消息按钮 ===== */
    /* 覆盖全局消息按钮行为 → 打开消息中心 */
    var globalMsgBtn = document.getElementById('btnMessage');
    if (globalMsgBtn) {
      globalMsgBtn.addEventListener('click',function(e){
        e.stopPropagation();
        showMsg();
        refreshMsgCenter();
      });
    }

    /* 覆盖签到按钮 → 打开签到日历 */
    var globalSignBtn = document.getElementById('btnSignIn');
    if (globalSignBtn) {
      globalSignBtn.addEventListener('click',function(e){
        e.stopPropagation();
        showSignCal();
        refreshSignCalendar();
      });
    }

    /* ===== 【新增】管理员后台入口按钮 ===== */
    var $btnAdminEntry = document.getElementById('btnAdminEntry');
    if ($btnAdminEntry) $btnAdminEntry.addEventListener('click', openAdminEntryModal);

    showUC();
    console.log('[userCenter] 初始化完成');
  }

  // ==================== 【新增】管理员后台入口逻辑 ====================

  /**
   * 弹出密码输入弹窗，校验通过后新标签页打开 admin.html
   * 固定管理员校验密码与 admin.js 共用 pu_admin_auth 存储
   */
  function openAdminEntryModal() {
    var adminPwd = localStorage.getItem('pu_admin_auth') || 'admin123';
    var userInput = prompt('请输入管理员密码：', '');
    if (userInput === null) return; /* 用户取消 */
    if (userInput.trim() === '') { toast('密码不能为空', 'warning'); return; }
    if (userInput !== adminPwd) { toast('密码错误，无法进入后台', 'error'); return; }

    toast('验证通过，正在跳转管理后台...', 'success');
    setTimeout(function () {
      window.open('admin.html', '_blank');
    }, 400);
  }

  /* ===== Toast ===== */
  function toast(msg,type){
    if (global.Nav && global.Nav.showToast) { global.Nav.showToast(msg,type); }
    else { console.log('['+(type||'info')+'] '+msg); }
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

  /* ===== 导出 ===== */
  global.UserCenter = {
    init:init, refreshAll:refreshAll,
    showSignCal:function(){showSignCal();refreshSignCalendar();},
    showMsg:function(){showMsg();refreshMsgCenter();},
    showUC:function(){showUC();refreshAll();},
    addMessage:addMessage,
  };

})(window);
