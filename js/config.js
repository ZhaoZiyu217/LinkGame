/**
 * config.js — 全局配置参数文件
 * 所有可后台自定义的业务参数均抽离至此，方便统一修改
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  /**
   * ==================== 全局常量 ====================
   */

  /** 压疮六分期（NPUAP-EPUAP-PPPIA 2021 国际标准） */
  const STAGE = Object.freeze({
    I:    { id: 1,  key: 'stage_1',  label: 'Ⅰ期',   desc: '皮肤完整，指压不变白的红斑' },
    II:   { id: 2,  key: 'stage_2',  label: 'Ⅱ期',   desc: '部分皮层缺损，真皮层暴露' },
    III:  { id: 3,  key: 'stage_3',  label: 'Ⅲ期',   desc: '全层皮肤缺损，可见皮下脂肪' },
    IV:   { id: 4,  key: 'stage_4',  label: 'Ⅳ期',   desc: '全层组织缺损，骨骼/肌腱/肌肉暴露' },
    U:    { id: 5,  key: 'unstage',  label: '不可分期', desc: '腐肉或焦痂覆盖，无法判定深度' },
    DTI:  { id: 6,  key: 'dti',      label: '深部组织损伤（DTI）', desc: '局部紫色/褐红色血疱或充血水疱' }
  });

  /** 难度等级 */
  const DIFFICULTY = Object.freeze({
    EASY:     { level: 1, key: 'easy',   label: '体验版' },
    MEDIUM:   { level: 2, key: 'medium', label: '进阶版' },
    HARD:     { level: 3, key: 'hard',   label: '终结版' }
  });

  /** 游戏模式 */
  const MODE = Object.freeze({
    PRACTICE:  { key: 'practice',  label: '练习模式' },
    EXAM:      { key: 'exam',      label: '考试模式' },
    MATCH:     { key: 'match',     label: '离线对战' }
  });

  /**
   * ==================== 可修改配置参数 ====================
   * 以下参数均可在后台管理界面动态调整
   */

  const CONFIG = {

    /* ---------- 练习分值 ---------- */
    practice: {
      /** 体验版 通关得分 */
      scoreEasy: 1,
      /** 进阶版 通关得分 */
      scoreMedium: 3,
      /** 终结版 通关得分 */
      scoreHard: 5,
      /** 正确率 ≥ 此阈值时触发额外加分 */
      accuracyBonusThreshold: 0.90,
      /** 正确率达标额外加分 */
      accuracyBonusScore: 5,
    },

    /* ---------- 比赛分值 ---------- */
    match: {
      /** 比赛胜利固定加分 */
      winScore: 50,
    },

    /* ---------- 签到分值 ---------- */
    signIn: {
      /** 每日签到基础分 */
      daily: 1,
      /** 梯度加分规则：连续天数 -> 额外加分 */
      streakBonus: [
        { days: 3,  bonus: 2 },   // 连续3天 额外+2
        { days: 7,  bonus: 5 },   // 连续7天 额外+5
        { days: 30, bonus: 15 },  // 连续30天 额外+15
      ],
    },

    /* ---------- 配对规则 ---------- */
    matchRule: {
      /** 错误配对 单次扣减 当局正确率百分比（0.05 = 5%） */
      wrongMatchDeductRate: 0.05,
    },

    /* ---------- 解锁条件 ---------- */
    unlock: {
      /** 当前难度历史平均正确率 ≥ 此值 解锁下一级难度 */
      accuracyRequired: 0.90,
    },

    /* ---------- 棋盘规格 ---------- */
    board: {
      /** 单局总图片数 */
      totalCards: 30,
      /** 对数（同一分期任意两张配对） */
      pairs: 15,
    },

    /* ---------- 考试规则 ---------- */
    exam: {
      /** 双周（14天）累计练习门槛（分钟） */
      practiceMinThreshold: 180,
      /** 单场考试时长限制（分钟） */
      timeLimitMinutes: 10,
      /** 考试套题数 */
      examSetCount: 3,
      /** 每套题图片数 */
      cardsPerSet: 36,
      /** 单日最大考试次数 */
      maxAttemptsPerDay: 1,
      /** 中途退出是否计分 */
      scoreOnQuit: false,
    },

    /* ---------- 每日练习上限 ---------- */
    dailyLimit: {
      /** 每日最大练习次数（0 = 不限） */
      maxPracticeTimes: 0,
    },

    /* ---------- 存储版本号 ---------- */
    storage: {
      /** LocalStorage 数据版本，结构变更时递增 */
      version: '1.0.0',
      /** 存储键前缀 */
      keyPrefix: 'pu_game_',
    },

    /* ---------- 动画 ---------- */
    animation: {
      /** 淡入淡出时长（ms） */
      fadeDuration: 300,
    },
  };

  /**
   * ==================== 导出 ====================
   */
  global.AppConfig = {
    STAGE,
    DIFFICULTY,
    MODE,
    CONFIG,
  };

})(window);
