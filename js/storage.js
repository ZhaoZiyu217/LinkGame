/**
 * storage.js — LocalStorage 增删改查工具函数
 * 封装 6 张核心数据表，统一管理持久化逻辑
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  const VERSION = '1.0.0';
  const PREFIX = 'pu_game_';

  // ==================== 数据表结构定义 ====================

  /**
   * 表结构模板（字段注释见各表下方）
   * 用途：初始化默认值、字段校验
   */
  const SCHEMA = {

    /** ① 用户账号表 userInfo */
    userInfo: {
      id: '',               // string  用户唯一标识（UUID）
      nickname: '',         // string  昵称
      avatarIndex: 0,       // number  头像编号 (0-5)
      gold: 0,              // number  金币总数
      totalScore: 0,        // number  累计积分
      totalPracticeMinutes: 0, // number 累计练习时长（分钟）
      unlockedDifficulty: ['easy'], // string[] 已解锁难度
      createdAt: '',        // string  ISO时间戳
      updatedAt: '',        // string  ISO时间戳
    },

    /** ② 签到记录表 signRecord */
    signRecord: {
      id: '',               // string  记录ID
      signDates: [],        // string[] "YYYY-MM-DD" 签到日期集合
      streakDays: 0,        // number  当前连续签到天数
      lastSignDate: '',     // string  "YYYY-MM-DD" 末次签到日期
      updatedAt: '',        // string  ISO时间戳
    },

    /** ③ 练习记录表 trainRecord（含 wrongStageMatch 混淆分期字段） */
    trainRecord: {
      id: '',               // string  记录ID（UUID）
      difficulty: '',       // string  难度 key: easy | medium | hard
      totalPairs: 0,        // number  当局配对数（对）
      matchedPairs: 0,      // number  正确配对数
      wrongPairs: 0,        // number  错误配对数
      accuracyRate: 0,      // number  单局正确率（0~1）
      scoreEarned: 0,       // number  当局得分
      durationSeconds: 0,   // number  当局耗时（秒）
      /** 混淆分期记录：记录每次错误匹配时选错的分期 key */
      wrongStageMatch: [],  // { selected: 'stage_1' }[]
      completedAt: '',      // string  ISO时间戳
    },

    /** ④ 考试记录表 examRecord */
    examRecord: {
      id: '',               // string  记录ID（UUID）
      examDate: '',         // string  "YYYY-MM-DD" 考试日期
      setIndex: 0,          // number  套题序号 (1~3)
      totalCards: 0,        // number  本套题图片总数
      answeredCorrect: 0,   // number  答对数
      answeredWrong: 0,     // number  答错数
      accuracyRate: 0,      // number  正确率（0~1）
      timeUsedSeconds: 0,   // number  耗时（秒）
      completed: false,     // boolean 是否完成（false=中途退出）
      scoreEarned: 0,       // number  得分（中途退出为0）
      createdAt: '',        // string  ISO时间戳
    },

    /** ⑤ 离线比赛对战记录表 matchRecord */
    matchRecord: {
      id: '',               // string  记录ID（UUID）
      player1Name: '',      // string  玩家1昵称
      player2Name: '',      // string  玩家2昵称
      player1Score: 0,      // number  玩家1配对数
      player2Score: 0,      // number  玩家2配对数
      winner: '',           // string  胜方昵称（平局为空）
      difficulty: '',       // string  难度 key
      durationSeconds: 0,   // number  比赛总时长（秒）
      playedAt: '',         // string  ISO时间戳
    },

    /** ⑥ 压疮分期图库表 pressureSoreLibrary */
    pressureSoreLibrary: {
      id: '',               // string  图片ID（UUID）
      stageKey: '',         // string  分期 key: stage_1 ~ dti
      imageName: '',        // string  图片文件名
      imageDesc: '',        // string  压疮创面描述
      /** 来源标注 */
      source: '',           // string  图片来源（如：公开数据集/医院授权）
      addedAt: '',          // string  ISO入库时间
    },
  };

  // ==================== 底层读写封装 ====================

  /** 构造完整存储键名 */
  function key(table) {
    return PREFIX + table;
  }

  /** 读取整表数据（返回数组，无数据返回 []） */
  function readTable(table) {
    try {
      const raw = localStorage.getItem(key(table));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[storage] 读取表失败:', table, e);
      return [];
    }
  }

  /** 覆写整表数据 */
  function writeTable(table, rows) {
    try {
      localStorage.setItem(key(table), JSON.stringify(rows));
    } catch (e) {
      console.error('[storage] 写入表失败:', table, e);
    }
  }

  // ==================== 通用增删改查 API ====================

  /** 查询单条记录 */
  function findOne(table, id) {
    const rows = readTable(table);
    return rows.find(function (r) { return r.id === id; }) || null;
  }

  /** 查询全部记录（支持按字段排序） */
  function findAll(table, sortField, desc) {
    var rows = readTable(table).slice();
    if (sortField) {
      rows.sort(function (a, b) {
        var va = a[sortField], vb = b[sortField];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (va < vb) return desc ? 1 : -1;
        if (va > vb) return desc ? -1 : 1;
        return 0;
      });
    }
    return rows;
  }

  /** 条件查询（简单字段匹配） */
  function findBy(table, conditions) {
    var rows = readTable(table);
    var keys = Object.keys(conditions);
    return rows.filter(function (row) {
      return keys.every(function (k) { return row[k] === conditions[k]; });
    });
  }

  /** 插入一条记录（自动生成 id 与 时间戳） */
  function insertOne(table, data) {
    var rows = readTable(table);
    var record = Object.assign({}, SCHEMA[table], data);
    if (!record.id) {
      record.id = generateUUID();
    }
    record.createdAt = record.createdAt || new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    rows.push(record);
    writeTable(table, rows);
    return record;
  }

  /** 更新一条记录（按 id 匹配） */
  function updateOne(table, id, patch) {
    var rows = readTable(table);
    var idx = -1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return null;
    var updated = Object.assign({}, rows[idx], patch, { updatedAt: new Date().toISOString() });
    rows[idx] = updated;
    writeTable(table, rows);
    return updated;
  }

  /** 删除一条记录 */
  function deleteOne(table, id) {
    var rows = readTable(table);
    var idx = -1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return false;
    rows.splice(idx, 1);
    writeTable(table, rows);
    return true;
  }

  /** 清空整表 */
  function clearTable(table) {
    writeTable(table, []);
  }

  /** 获取表行数 */
  function count(table) {
    return readTable(table).length;
  }

  // ==================== 业务专用 API ====================

  /* -- 用户 -- */

  /** 获取当前用户信息（单用户系统，取第一条） */
  function getUser() {
    var rows = readTable('userInfo');
    return rows.length > 0 ? rows[0] : null;
  }

  /** 创建或更新用户 */
  function saveUser(userData) {
    var rows = readTable('userInfo');
    if (rows.length === 0) {
      return insertOne('userInfo', userData);
    }
    return updateOne('userInfo', rows[0].id, userData);
  }

  /* -- 签到 -- */

  /** 获取签到记录 */
  function getSignRecord() {
    var rows = readTable('signRecord');
    return rows.length > 0 ? rows[0] : null;
  }

  /** 保存签到记录 */
  function saveSignRecord(data) {
    var rows = readTable('signRecord');
    if (rows.length === 0) {
      return insertOne('signRecord', data);
    }
    return updateOne('signRecord', rows[0].id, data);
  }

  /* -- 练习 -- */

  /** 按难度查询练习记录 */
  function getTrainRecordsByDifficulty(difficultyKey) {
    return findBy('trainRecord', { difficulty: difficultyKey });
  }

  /* -- 考试 -- */

  /** 按日期查考试记录 */
  function getExamRecordsByDate(dateStr) {
    return findBy('examRecord', { examDate: dateStr });
  }

  /* -- 离���对战 -- */

  /** 查最近N场对战 */
  function getRecentMatches(n) {
    var rows = findAll('matchRecord', 'playedAt', true);
    return rows.slice(0, n);
  }

  /* -- 图库 -- */

  /** 按分期查图片 */
  function getImagesByStage(stageKey) {
    return findBy('pressureSoreLibrary', { stageKey: stageKey });
  }

  // ==================== 数据导出 / 导入 ====================

  /** 导出全部数据为 JSON 对象（用于备份/科研导出） */
  function exportAll() {
    return {
      version: VERSION,
      exportedAt: new Date().toISOString(),
      tables: {
        userInfo: readTable('userInfo'),
        signRecord: readTable('signRecord'),
        trainRecord: readTable('trainRecord'),
        examRecord: readTable('examRecord'),
        matchRecord: readTable('matchRecord'),
        pressureSoreLibrary: readTable('pressureSoreLibrary'),
      },
    };
  }

  /** 导入 JSON 备份（覆盖式） */
  function importAll(jsonData) {
    if (!jsonData || !jsonData.tables) throw new Error('无效的备份数据');
    var tables = jsonData.tables;
    for (var t in tables) {
      if (SCHEMA.hasOwnProperty(t)) {
        writeTable(t, tables[t]);
      }
    }
  }

  // ==================== 迁移 / 初始化 ====================

  /** 首次运行初始化空表 */
  function initAllTables() {
    for (var t in SCHEMA) {
      if (!localStorage.getItem(PREFIX + t)) {
        writeTable(t, []);
      }
    }
  }

  // ==================== UUID 生成 ====================

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ==================== 导出 ====================

  global.Storage = {
    /* 通用 */
    readTable:   readTable,
    writeTable:  writeTable,
    findOne:     findOne,
    findAll:     findAll,
    findBy:      findBy,
    insertOne:   insertOne,
    updateOne:   updateOne,
    deleteOne:   deleteOne,
    clearTable:  clearTable,
    count:       count,
    /* 业务 */
    getUser:                  getUser,
    saveUser:                 saveUser,
    getSignRecord:            getSignRecord,
    saveSignRecord:           saveSignRecord,
    getTrainRecordsByDifficulty: getTrainRecordsByDifficulty,
    getExamRecordsByDate:     getExamRecordsByDate,
    getRecentMatches:         getRecentMatches,
    getImagesByStage:         getImagesByStage,
    /* 导入导出 */
    exportAll:   exportAll,
    importAll:   importAll,
    /* 初始化 */
    initAllTables: initAllTables,
    /** 表 Schema（只读） */
    SCHEMA: SCHEMA,
  };

})(window);
