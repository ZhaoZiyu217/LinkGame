/**
 * common.js — 全局工具函数
 * 计时统计、正确率计算、积分核算、分期匹配校验、数据导出
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  var C = global.AppConfig.CONFIG;
  var STAGES = global.AppConfig.STAGE;

  // ==================== 计时工具 ====================

  /**
   * Timer — 秒级计时器
   * 用法：
   *   var t = Timer();
   *   t.start();
   *   setTimeout(function () { t.pause(); console.log(t.elapsed()); }, 5000);
   */
  function Timer() {
    var startTime = 0;
    var accumulated = 0;   // 累计已跑秒数（pause 时累加）
    var running = false;
    var intervalId = null;
    var onTick = null;     // 每秒回调 fn(elapsedSeconds)

    function _tick() {
      if (onTick) onTick(_elapsed());
    }

    return {
      /** 开始/继续计时 */
      start: function () {
        if (running) return;
        running = true;
        startTime = Date.now();
        intervalId = setInterval(_tick, 1000);
      },
      /** 暂停计时，保留已跑秒数 */
      pause: function () {
        if (!running) return;
        running = false;
        accumulated += (Date.now() - startTime) / 1000;
        startTime = 0;
        clearInterval(intervalId);
        intervalId = null;
      },
      /** 重置归零 */
      reset: function () {
        running = false;
        accumulated = 0;
        startTime = 0;
        clearInterval(intervalId);
        intervalId = null;
      },
      /** 获取当前已计秒数（保留1位小数） */
      elapsed: function () {
        return Math.round(_elapsed() * 10) / 10;
      },
      /** 设置每秒回调 */
      onTick: function (fn) {
        onTick = fn;
      },
      /** 是否运行中 */
      isRunning: function () {
        return running;
      },
    };

    function _elapsed() {
      var extra = running ? (Date.now() - startTime) / 1000 : 0;
      return accumulated + extra;
    }
  }

  /**
   * 将秒数格式化为 "MM:SS" 或 "HH:MM:SS"
   */
  function formatTime(seconds) {
    var s = Math.floor(seconds);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    if (h > 0) return pad(h) + ':' + pad(m) + ':' + pad(sec);
    return pad(m) + ':' + pad(sec);
  }

  /**
   * 将分钟转为秒
   */
  function minutesToSeconds(minutes) {
    return Math.round(minutes * 60);
  }

  /**
   * 获取今日日期字符串 "YYYY-MM-DD"
   */
  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  // ==================== 正确率计算 ====================

  /**
   * 计算单局正确率
   * @param {number} totalAttempts - 总尝试次数（正确+错误）
   * @param {number} wrongCount    - 错误次数
   * @returns {number} 正确率 0~1，保留2位小数
   */
  function calcAccuracy(totalAttempts, wrongCount) {
    if (totalAttempts <= 0) return 1;
    var rate = (totalAttempts - wrongCount) / totalAttempts;
    return Math.round(Math.max(0, rate) * 100) / 100;
  }

  /**
   * 根据错误配对次数扣减正确率
   * @param {number} baseAccuracy  - 基础正确率
   * @param {number} wrongTimes    - 错误次数
   * @returns {number} 扣减后正确率
   */
  function deductAccuracy(baseAccuracy, wrongTimes) {
    var deduct = C.matchRule.wrongMatchDeductRate * wrongTimes;
    return Math.round(Math.max(0, baseAccuracy - deduct) * 100) / 100;
  }

  /**
   * 计算历史平均正确率（多局综合）
   * @param {Array} records - 练习记录数组（trainRecord[]）
   * @returns {number} 平均正确率 0~1
   */
  function calcAvgAccuracy(records) {
    if (!records || records.length === 0) return 0;
    var sum = records.reduce(function (s, r) { return s + (r.accuracyRate || 0); }, 0);
    return Math.round((sum / records.length) * 100) / 100;
  }

  // ==================== 积分核算 ====================

  /**
   * 练习模式得分计算
   * @param {string} difficultyKey - 难度 key
   * @param {number} accuracyRate   - 单局正确率
   * @returns {number} 当局得分
   */
  function calcPracticeScore(difficultyKey, accuracyRate) {
    var scores = {
      easy:   C.practice.scoreEasy,
      medium: C.practice.scoreMedium,
      hard:   C.practice.scoreHard,
    };
    var base = scores[difficultyKey] || 0;
    if (accuracyRate >= C.practice.accuracyBonusThreshold) {
      base += C.practice.accuracyBonusScore;
    }
    return base;
  }

  /**
   * 比赛胜利得分
   * @returns {number}
   */
  function calcMatchWinScore() {
    return C.match.winScore;
  }

  /**
   * 签到得分计算（含梯度加成）
   * @param {number} streakDays - 当前连续签到天数
   * @returns {number} 当日签到得分
   */
  function calcSignInScore(streakDays) {
    var base = C.signIn.daily;
    var bonus = 0;
    var rules = C.signIn.streakBonus;
    for (var i = 0; i < rules.length; i++) {
      if (streakDays >= rules[i].days) {
        bonus = rules[i].bonus; // 取最高梯度
      }
    }
    return base + bonus;
  }

  /**
   * 考试得分（完成时按正确率计分，中途退出0分）
   * @param {number}  correct       - 答对数
   * @param {number}  totalCards    - 总题数
   * @param {boolean} completed     - 是否完成
   * @returns {number}
   */
  function calcExamScore(correct, totalCards, completed) {
    if (!completed) return 0;
    if (totalCards <= 0) return 0;
    return Math.round((correct / totalCards) * 100);
  }

  // ==================== 分期匹配校验 ====================

  /**
   * 判断两张压疮分期图是否属于同一分期（可配对消除）
   * @param {string} stageKeyA - 图片A的分期 key
   * @param {string} stageKeyB - 图片B的分期 key
   * @returns {boolean}
   */
  function isStageMatch(stageKeyA, stageKeyB) {
    return stageKeyA === stageKeyB;
  }

  /**
   * 获取分期完整信息
   * @param {string} stageKey - 分期 key
   * @returns {Object|null}
   */
  function getStageByKey(stageKey) {
    var keys = Object.keys(STAGES);
    for (var i = 0; i < keys.length; i++) {
      if (STAGES[keys[i]].key === stageKey) {
        return STAGES[keys[i]];
      }
    }
    return null;
  }

  // ==================== 解锁判定 ====================

  /**
   * 判断当前难度下是否满足解锁下一级条件
   * @param {string} currentDifficultyKey - 当前难度 key
   * @param {Array}  records              - 该难度下历史练习记录
   * @returns {Object} { canUnlock: boolean, nextDifficulty: key|null, avgAccuracy: number }
   */
  function checkUnlock(currentDifficultyKey, records) {
    var DIFF = global.AppConfig.DIFFICULTY;
    var avg = calcAvgAccuracy(records);
    var canUnlock = avg >= C.unlock.accuracyRequired;

    var nextKey = null;
    if (currentDifficultyKey === DIFF.EASY.key)   nextKey = DIFF.MEDIUM.key;
    if (currentDifficultyKey === DIFF.MEDIUM.key) nextKey = DIFF.HARD.key;

    return {
      canUnlock: canUnlock,
      nextDifficulty: canUnlock ? nextKey : null,
      avgAccuracy: avg,
    };
  }

  // ==================== 练习时长统计 ====================

  /**
   * 统计双周（最近14天）累计练习时长（分钟）
   * @param {Array} records - 全部练习记录
   * @returns {number} 总分钟数
   */
  function calcBiweeklyPracticeMinutes(records) {
    if (!records || records.length === 0) return 0;
    var now = Date.now();
    var fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    var cutoff = now - fourteenDaysMs;

    var totalSeconds = records.reduce(function (sum, r) {
      var ts = new Date(r.completedAt).getTime();
      if (ts >= cutoff) return sum + (r.durationSeconds || 0);
      return sum;
    }, 0);

    return Math.floor(totalSeconds / 60);
  }

  /**
   * 判断是否满足考试练习门槛
   * @param {Array} records - 全部练习记录
   * @returns {boolean}
   */
  function canTakeExam(records) {
    return calcBiweeklyPracticeMinutes(records) >= C.exam.practiceMinThreshold;
  }

  // ==================== 数据导出工具 ====================

  /**
   * 导出为 JSON 文件并触发下载
   * @param {Object} data     - 要导出的数据
   * @param {string} filename - 文件名（不含扩展名）
   */
  function exportJSON(data, filename) {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    _download(url, (filename || 'export') + '.json');
    URL.revokeObjectURL(url);
  }

  /**
   * 将二维数组数据导出为 CSV（表格）文件
   * @param {Array<Array>} rows    - 二维数组，第一行为表头
   * @param {string}       filename
   */
  function exportCSV(rows, filename) {
    if (!rows || rows.length === 0) return;
    var csvContent = rows.map(function (row) {
      return row.map(function (cell) {
        var val = (cell == null) ? '' : String(cell);
        // 含逗号/引号/换行的字段用引号包裹
        if (/[",\n\r]/.test(val)) {
          return '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(',');
    }).join('\n');

    // BOM 解决 Excel 中文乱码
    var blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    _download(url, (filename || 'export') + '.csv');
    URL.revokeObjectURL(url);
  }

  /**
   * 将练习记录转为表格二维数组（供导出）
   * @param {Array} records - 练习记录数组
   * @returns {Array<Array>}
   */
  function trainRecordsToTable(records) {
    var header = ['编号', '难度', '配对数', '正确配对', '错误配对', '正确率', '得分', '耗时(秒)', '时间'];
    var rows = [header];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      rows.push([
        i + 1,
        r.difficulty,
        r.totalPairs,
        r.matchedPairs,
        r.wrongPairs,
        (r.accuracyRate * 100).toFixed(1) + '%',
        r.scoreEarned,
        r.durationSeconds,
        r.completedAt ? new Date(r.completedAt).toLocaleString() : '',
      ]);
    }
    return rows;
  }

  /**
   * 将考试记录转为表格二维数组
   */
  function examRecordsToTable(records) {
    var header = ['编号', '日期', '套题', '正确', '错误', '正确率', '耗时(秒)', '完成', '得分'];
    var rows = [header];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      rows.push([
        i + 1,
        r.examDate,
        '第' + r.setIndex + '套',
        r.answeredCorrect,
        r.answeredWrong,
        (r.accuracyRate * 100).toFixed(1) + '%',
        r.timeUsedSeconds,
        r.completed ? '是' : '中途退出',
        r.scoreEarned,
      ]);
    }
    return rows;
  }

  /** 触发浏览器下载 */
  function _download(url, filename) {
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ==================== 通用工具 ====================

  /** 防抖 */
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  /** 节流 */
  function throttle(fn, interval) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= interval) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  /** 深拷贝（基于 JSON，仅处理纯数据） */
  function deepClone(obj) {
    if (obj == null) return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  /** 随机整数 [min, max] */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** 洗牌 Fisher-Yates */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /** 按百分比随机抽样（返回新数组） */
  function sample(arr, count) {
    return shuffle(arr).slice(0, count);
  }

  /** 判断两个日期是否同一天 "YYYY-MM-DD" */
  function isSameDay(dateStr1, dateStr2) {
    return dateStr1 === dateStr2;
  }

  /** 计算连续签到天数（从末次签到往前推） */
  function calcStreakDays(signDates) {
    if (!signDates || signDates.length === 0) return 0;

    // 排序取最新日期
    var sorted = signDates.slice().sort(function (a, b) { return a > b ? -1 : 1; });
    var lastDate = new Date(sorted[sorted.length - 1]);
    var today = new Date(todayStr());

    // 如果最后签到不是今天或昨天，连续中断
    var diffFromToday = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    if (diffFromToday > 1) return 0;

    var streak = 1;
    for (var i = sorted.length - 2; i >= 0; i--) {
      var prev = new Date(sorted[i]);
      var curr = new Date(sorted[i + 1]);
      var diff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // ==================== 导出 ====================

  global.Utils = {
    /* 计时 */
    Timer:               Timer,
    formatTime:          formatTime,
    minutesToSeconds:    minutesToSeconds,
    todayStr:            todayStr,

    /* 计算 */
    calcAccuracy:        calcAccuracy,
    deductAccuracy:      deductAccuracy,
    calcAvgAccuracy:     calcAvgAccuracy,
    calcPracticeScore:   calcPracticeScore,
    calcMatchWinScore:   calcMatchWinScore,
    calcSignInScore:     calcSignInScore,
    calcExamScore:       calcExamScore,

    /* 分期 */
    isStageMatch:        isStageMatch,
    getStageByKey:       getStageByKey,

    /* 解锁 & 考试门槛 */
    checkUnlock:         checkUnlock,
    calcBiweeklyPracticeMinutes: calcBiweeklyPracticeMinutes,
    canTakeExam:         canTakeExam,

    /* 数据导出 */
    exportJSON:          exportJSON,
    exportCSV:           exportCSV,
    trainRecordsToTable: trainRecordsToTable,
    examRecordsToTable:  examRecordsToTable,

    /* 通用 */
    debounce:            debounce,
    throttle:            throttle,
    deepClone:           deepClone,
    randomInt:           randomInt,
    shuffle:             shuffle,
    sample:              sample,
    isSameDay:           isSameDay,
    calcStreakDays:      calcStreakDays,
  };

})(window);
