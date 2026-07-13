/**
 * nav.js — 页面骨架公共交互逻辑
 * 侧边栏路由切换、顶部数据渲染、头像/签到/消息/公众号交互
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  // ==================== DOM 引用缓存 ====================

  /** 侧边栏 */
  var sidebarItems = document.querySelectorAll('#sidebarNav .sidebar__item');

  /** 主内容区所有面板 */
  var panels = {
    practice:  document.getElementById('panel-practice'),
    exam:      document.getElementById('panel-exam'),
    match:     document.getElementById('panel-match'),
    knowledge: document.getElementById('panel-knowledge'),
    personal:  document.getElementById('panel-personal'),
  };

  /** 顶部数据展示 */
  var elDuration = document.getElementById('headerDuration');
  var elGold     = document.getElementById('headerGold');
  var elScore    = document.getElementById('headerScore');

  /** 顶部按钮 */
  var btnMessage  = document.getElementById('btnMessage');
  var btnSignIn   = document.getElementById('btnSignIn');
  var btnOfficial = document.getElementById('btnOfficial');

  /** 右下角头像 */
  var btnAvatar = document.getElementById('btnAvatar');

  /** Toast 容器 */
  var toastContainer = document.getElementById('toastContainer');

  /* -- 签到弹窗 -- */
  var signInModal      = document.getElementById('signInModal');
  var signInModalBody  = document.getElementById('signInModalBody');
  var btnDoSignIn      = document.getElementById('btnDoSignIn');
  var signInModalClose = document.getElementById('signInModalClose');

  /* -- 消息弹窗 -- */
  var messageModal       = document.getElementById('messageModal');
  var messageModalClose  = document.getElementById('messageModalClose');
  var messageModalClose2 = document.getElementById('messageModalClose2');

  /* -- 公众号弹窗 -- */
  var officialModal       = document.getElementById('officialModal');
  var officialModalClose  = document.getElementById('officialModalClose');
  var officialModalClose2 = document.getElementById('officialModalClose2');

  // ==================== 页面路由 ====================

  /** 当前页面标识 */
  var currentPage = 'practice';

  /**
   * 切换到指定页面
   * @param {string} pageKey - practice | exam | match | knowledge | personal
   */
  function navigateTo(pageKey) {
    if (currentPage === pageKey) return;
    if (!panels[pageKey]) return;

    // 隐藏所有面板
    Object.keys(panels).forEach(function (k) {
      panels[k].classList.remove('page-panel--active');
    });

    // 展示目标面板
    panels[pageKey].classList.add('page-panel--active');
    currentPage = pageKey;

    // 更新侧边栏高亮
    sidebarItems.forEach(function (item) {
      var dp = item.getAttribute('data-page');
      if (dp === pageKey) {
        item.classList.add('sidebar__item--active');
      } else {
        item.classList.remove('sidebar__item--active');
      }
    });

    // 进入个人中心时自动刷新数据
    if (pageKey === 'personal' && global.UserCenter && global.UserCenter.refreshAll) {
      global.UserCenter.refreshAll();
    }
  }

  /* -- 侧边栏点击事件 -- */
  sidebarItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var page = item.getAttribute('data-page');
      if (page) navigateTo(page);
    });
  });

  /* -- 头像点击 → 个人中心 -- */
  btnAvatar.addEventListener('click', function () {
    navigateTo('personal');
  });

  // ==================== 顶部数据刷新 ====================

  /**
   * 从 Storage 读取用户数据并渲染到顶部栏
   * 练习时长、金币、积分
   */
  function refreshTopBar() {
    var user = Storage.getUser();
    if (!user) {
      // 无用户数据：显示默认值
      elDuration.textContent = '00:00';
      elGold.textContent     = '0';
      elScore.textContent    = '0';
      return;
    }

    // 练习时长 → 格式化 "HH:MM:SS"（存储单位：分钟 → 转换秒）
    var totalSeconds = (user.totalPracticeMinutes || 0) * 60;
    elDuration.textContent = Utils.formatTime(totalSeconds);

    // 金币
    elGold.textContent = user.gold || 0;

    // 积分
    elScore.textContent = user.totalScore || 0;
  }

  // ==================== 签到逻辑 ====================

  /**
   * 打开签到弹窗并渲染签到状态
   */
  function openSignInModal() {
    var today = Utils.todayStr();
    var signRecord = Storage.getSignRecord();
    var isSignedToday = false;

    if (signRecord && signRecord.signDates) {
      isSignedToday = signRecord.signDates.indexOf(today) !== -1;
    }

    var streakDays = signRecord
      ? Utils.calcStreakDays(signRecord.signDates)
      : 0;

    // 拼接弹窗内容
    var html = '';
    if (isSignedToday) {
      html += '<div class="sign-modal__check">&#10003;</div>';
      html += '<p style="margin-top:8px;font-size:15px;">今日已签到</p>';
      html += '<p style="margin-top:4px;font-size:13px;color:#7A6A72;">';
      html += '连续签到 <span class="sign-modal__streak">' + streakDays + '</span> 天';
      html += '</p>';
    } else {
      html += '<p style="font-size:15px;margin-bottom:4px;">今日签到可获得</p>';
      html += '<p style="font-size:28px;font-weight:700;color:#D4A843;">';
      html += '+' + Utils.calcSignInScore(streakDays + 1) + ' 积分</p>';
      html += '<p style="font-size:13px;color:#7A6A72;margin-top:4px;">';
      html += '连续签到 <span class="sign-modal__streak">' + streakDays + '</span> 天';
      if (streakDays + 1 >= 3) {
        html += '（已达梯度加成）';
      }
      html += '</p>';
    }

    signInModalBody.innerHTML = html;

    // 已签到则禁用按钮
    btnDoSignIn.disabled = isSignedToday;
    btnDoSignIn.textContent = isSignedToday ? '已签到' : '签到打卡';

    signInModal.classList.remove('u-hidden');
  }

  /** 关闭签到弹窗 */
  function closeSignInModal() {
    signInModal.classList.add('u-hidden');
  }

  /** 执行签到 */
  function doSignIn() {
    var today = Utils.todayStr();
    var signRecord = Storage.getSignRecord();
    var user = Storage.getUser();

    // 确保有签到记录
    if (!signRecord) {
      signRecord = Storage.insertOne('signRecord', {
        signDates: [],
        streakDays: 0,
        lastSignDate: '',
      });
    }

    // 检查今日是否已签
    if (signRecord.signDates && signRecord.signDates.indexOf(today) !== -1) {
      showToast('今日已签到，请勿重复操作', 'warning');
      closeSignInModal();
      return;
    }

    // 更新签到日期集合
    var dates = (signRecord.signDates || []).slice();
    dates.push(today);
    var streakDays = Utils.calcStreakDays(dates);
    var earnedScore = Utils.calcSignInScore(streakDays);

    Storage.updateOne('signRecord', signRecord.id, {
      signDates: dates,
      streakDays: streakDays,
      lastSignDate: today,
    });

    // 更新用户积分和金币
    if (user) {
      Storage.saveUser({
        totalScore: (user.totalScore || 0) + earnedScore,
        gold: (user.gold || 0) + earnedScore,
      });
    }

    // 刷新顶部栏
    refreshTopBar();

    // 更新弹窗为已签到状态
    openSignInModal();
    showToast('签到成功！+' + earnedScore + ' 积分', 'success');
  }

  // ==================== 弹窗控制 ====================

  /** 打开消息弹窗 */
  function openMessageModal() {
    messageModal.classList.remove('u-hidden');
  }

  /** 关闭消息弹窗 */
  function closeMessageModal() {
    messageModal.classList.add('u-hidden');
  }

  /** 打开公众号弹窗 */
  function openOfficialModal() {
    officialModal.classList.remove('u-hidden');
  }

  /** 关闭公众号弹窗 */
  function closeOfficialModal() {
    officialModal.classList.add('u-hidden');
  }

  // ==================== Toast 提示 ====================

  /**
   * 显示 Toast 提示
   * @param {string} msg  - 提示文字
   * @param {string} type - info | success | warning | error
   */
  function showToast(msg, type) {
    type = type || 'info';
    var el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.textContent = msg;
    toastContainer.appendChild(el);

    // 3秒后自动移除
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  // ==================== 事件绑定 ====================

  /* 顶部按钮——优先使用 UserCenter 完整页面（如果存在） */
  btnMessage.addEventListener('click', function (e) {
    if (global.UserCenter && global.UserCenter.showMsg) {
      global.UserCenter.showMsg();
    } else {
      openMessageModal();
    }
  });
  btnSignIn.addEventListener('click', function (e) {
    if (global.UserCenter && global.UserCenter.showSignCal) {
      global.UserCenter.showSignCal();
    } else {
      openSignInModal();
    }
  });
  btnOfficial.addEventListener('click', openOfficialModal);

  /* 签到弹窗 */
  signInModalClose.addEventListener('click', closeSignInModal);
  signInModal.addEventListener('click', function (e) {
    if (e.target === signInModal) closeSignInModal();
  });
  btnDoSignIn.addEventListener('click', doSignIn);

  /* 消息弹窗 */
  messageModalClose.addEventListener('click', closeMessageModal);
  messageModalClose2.addEventListener('click', closeMessageModal);
  messageModal.addEventListener('click', function (e) {
    if (e.target === messageModal) closeMessageModal();
  });

  /* 公众号弹窗 */
  officialModalClose.addEventListener('click', closeOfficialModal);
  officialModalClose2.addEventListener('click', closeOfficialModal);
  officialModal.addEventListener('click', function (e) {
    if (e.target === officialModal) closeOfficialModal();
  });

  // ==================== 初始化 ====================

  /**
   * 首次启动：初始化数据表，自动创建示例用户
   */
  function init() {
    // 确保所有数据表存在
    Storage.initAllTables();

    // 如果无用户，创建默认用户
    var user = Storage.getUser();
    if (!user) {
      Storage.insertOne('userInfo', {
        nickname: '护理学员',
        avatarIndex: 0,
        gold: 0,
        totalScore: 0,
        totalPracticeMinutes: 0,
        unlockedDifficulty: ['easy'],
      });
    }

    // 如果无签到记录，创建空记录
    var signRecord = Storage.getSignRecord();
    if (!signRecord) {
      Storage.insertOne('signRecord', {
        signDates: [],
        streakDays: 0,
        lastSignDate: '',
      });
    }

    // 渲染顶部数据
    refreshTopBar();
  }

  init();

  // ==================== 导出 ====================

  /**
   * 向全局暴露导航能力，供子页面调用
   * 四大模块可通过 Nav.navigateTo() 跳转
   */
  global.Nav = {
    navigateTo:      navigateTo,
    refreshTopBar:   refreshTopBar,
    showToast:       showToast,
    /** 当前页面标识 */
    get currentPage() { return currentPage; },
  };

})(window);
