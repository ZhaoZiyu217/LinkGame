/**
 * admin.js — 管理员后台完整业务逻辑
 * 登录校验 / 图库CRUD / 全局参数配置 / 科研导出 / 考试管理 / 系统设置
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  var C = global.AppConfig.CONFIG;
  var STAGE_ORDER = ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'unstage', 'dti'];
  var STAGE_SHORT = { stage_1: 'Ⅰ期', stage_2: 'Ⅱ期', stage_3: 'Ⅲ期', stage_4: 'Ⅳ期', unstage: '不可分期', dti: 'DTI' };
  var PER_PAGE = 12;

  /* 管理员存储键 */
  var ADMIN_KEY = 'pu_admin_auth';
  var ADMIN_CONFIG_KEY = 'pu_admin_config_override';
  var EXAM_SET_KEY = 'pu_exam_set_config';
  var EXAM_OPEN_KEY = 'pu_exam_open';

  /* ===== 状态 ===== */
  var libPage = 1;
  var libSearch = '';
  var libStage = 'all';
  var libBatchMode = false;
  var libSelectedIds = {};
  var currentPanel = 'panelLibrary';

  /* ===== DOM 引用 ===== */
  var $loginView = document.getElementById('adminLoginView');
  var $mainView  = document.getElementById('adminMainView');
  var $pwdInput  = document.getElementById('adminPwdInput');
  var $loginError = document.getElementById('adminLoginError');

  /* ===== Toast ===== */
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'admin-toast admin-toast--' + (type || 'info');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
  }

  /* ===== 确认弹窗 ===== */
  function confirmDialog(msg, onOk) {
    if (window.confirm(msg)) { onOk(); }
  }

  // ==================== ① 登录逻辑 ====================

  function getAdminPwd() {
    return localStorage.getItem(ADMIN_KEY) || 'admin123';
  }
  function setAdminPwd(newPwd) {
    localStorage.setItem(ADMIN_KEY, newPwd);
  }
  function isLoggedIn() {
    return sessionStorage.getItem(ADMIN_KEY) === '1';
  }
  function setLoggedIn(v) {
    if (v) sessionStorage.setItem(ADMIN_KEY, '1');
    else sessionStorage.removeItem(ADMIN_KEY);
  }

  function doLogin() {
    var pwd = $pwdInput.value.trim();
    if (!pwd) { $loginError.textContent = '请输入密码'; return; }
    if (pwd !== getAdminPwd()) { $loginError.textContent = '密码错误'; return; }
    $loginError.textContent = '';
    setLoggedIn(true);
    showMain();
    toast('登录成功', 'success');
  }

  function doLogout() {
    setLoggedIn(false);
    $loginView.style.display = 'flex';
    $mainView.classList.remove('admin-main--active');
    $pwdInput.value = '';
  }

  function showMain() {
    $loginView.style.display = 'none';
    $mainView.classList.add('admin-main--active');
    updateClock();
    setInterval(updateClock, 60000);
    switchPanel('panelLibrary');
  }

  function updateClock() {
    var now = new Date();
    var str = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2) + ' ' +
              ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    var el = document.getElementById('adminClock'); if (el) el.textContent = str;
  }

  // ==================== ② 侧边栏导航 ====================

  function switchPanel(panelId) {
    var navItems = document.querySelectorAll('#adminSidebar .admin-nav-item');
    navItems.forEach(function (n) { n.classList.remove('admin-nav-item--active'); });
    var navEl = document.querySelector('#adminSidebar .admin-nav-item[data-panel="' + panelId + '"]');
    if (navEl) navEl.classList.add('admin-nav-item--active');

    document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('admin-panel--active'); });
    var panel = document.getElementById(panelId);
    if (panel) panel.classList.add('admin-panel--active');

    currentPanel = panelId;

    if (panelId === 'panelLibrary') refreshLibrary();
    if (panelId === 'panelConfig') renderConfigPanel();
    if (panelId === 'panelExport') refreshExportPanel();
    if (panelId === 'panelExam') renderExamPanel();
    if (panelId === 'panelSettings') renderSettingsPanel();
  }

  // ==================== ③ 图库管理面板 ====================

  function refreshLibrary() {
    refreshLibStats();
    renderLibTable();
  }

  function refreshLibStats() {
    var all = Storage.findAll('pressureSoreLibrary');
    document.getElementById('libStatTotal').textContent = all.length;
    STAGE_ORDER.forEach(function (sk) {
      var count = all.filter(function (img) { return img.stageKey === sk; }).length;
      var idMap = { stage_1: 'libStatI', stage_2: 'libStatII', stage_3: 'libStatIII', stage_4: 'libStatIV', unstage: 'libStatU', dti: 'libStatDTI' };
      var el = document.getElementById(idMap[sk]); if (el) el.textContent = count;
    });
    document.getElementById('libResultCount').textContent = '共 ' + all.length + ' 张';
  }

  function getFilteredImages() {
    var images = Storage.findAll('pressureSoreLibrary');
    if (libStage !== 'all') images = images.filter(function (img) { return img.stageKey === libStage; });
    if (libSearch.trim()) {
      var kw = libSearch.trim().toLowerCase();
      images = images.filter(function (img) { return (img.imageDesc || '').toLowerCase().indexOf(kw) >= 0; });
    }
    return images;
  }

  function renderLibTable() {
    var images = getFilteredImages();
    var total = images.length;
    var totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (libPage > totalPages) libPage = totalPages;
    var start = (libPage - 1) * PER_PAGE;
    var pageImages = images.slice(start, start + PER_PAGE);

    var html = '';
    if (pageImages.length === 0) {
      html = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#A8989E;">暂无压疮分期图数据</td></tr>';
    }
    pageImages.forEach(function (img, idx) {
      var checked = libSelectedIds[img.id] ? ' checked' : '';
      var diffTag = (img.difficultyTag || 'all').replace(/,/g, '、');
      html += '<tr>';
      html += '<td><input type="checkbox" class="lib-check-row" data-id="' + (img.id || '') + '"' + checked + '></td>';
      html += '<td>' + (start + idx + 1) + '</td>';
      html += '<td><input class="admin-table-input" value="' + escapeHtml(img.imageDesc || '') + '" data-id="' + img.id + '" data-field="imageDesc"></td>';
      html += '<td><select class="admin-table-select" data-id="' + img.id + '" data-field="stageKey">';
      STAGE_ORDER.forEach(function (sk) {
        html += '<option value="' + sk + '"' + (img.stageKey === sk ? ' selected' : '') + '>' + (STAGE_SHORT[sk] || sk) + '</option>';
      });
      html += '</select></td>';
      html += '<td>' + (diffTag || '全部') + '</td>';
      /* 【新增】图片来源列：有 imgUrl/imgDataUrl 则展示缩略图 + 路径输入框 */
      var imgSrc = img.imgDataUrl || img.imgUrl || '';
      if (imgSrc) {
        html += '<td style="min-width:120px;">';
        html += '<img src="' + imgSrc + '" onerror="this.style.display=\'none\'" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #E8D8DD;margin-bottom:4px;display:block;">';
        html += '<input class="admin-table-input" value="' + escapeHtml(img.source || '') + '" data-id="' + img.id + '" data-field="source" style="font-size:10px;">';
        html += '</td>';
      } else {
        html += '<td><input class="admin-table-input" value="' + escapeHtml(img.source || '') + '" data-id="' + img.id + '" data-field="source"></td>';
      }
      html += '<td style="font-size:11px;color:#A8989E;">' + (img.addedAt ? new Date(img.addedAt).toLocaleDateString() : '--') + '</td>';
      html += '<td>';
      html += '<button class="admin-btn-xs admin-btn-xs--info" data-action="edit" data-id="' + img.id + '">编辑</button>';
      html += '<button class="admin-btn-xs admin-btn-xs--danger" data-action="delete" data-id="' + img.id + '">删除</button>';
      html += '</td></tr>';
    });
    document.getElementById('libTableBody').innerHTML = html;

    /* 全选checkbox */
    var $selectAll = document.getElementById('libSelectAll');
    if ($selectAll) $selectAll.checked = pageImages.length > 0 && pageImages.every(function (img) { return libSelectedIds[img.id]; });

    /* 分页 */
    renderPagination('libPagination', libPage, totalPages, function (p) { libPage = p; renderLibTable(); });

    /* 表格内联编辑事件 */
    bindLibTableEvents();

    /* 批量操作栏 */
    updateBatchBar();
  }

  function bindLibTableEvents() {
    /* 全选 */
    var $selectAll = document.getElementById('libSelectAll');
    if ($selectAll) {
      var nsa = $selectAll.cloneNode(true);
      $selectAll.parentNode.replaceChild(nsa, $selectAll);
      nsa.addEventListener('change', function () {
        var pageImages = getFilteredImages().slice((libPage - 1) * PER_PAGE, libPage * PER_PAGE);
        pageImages.forEach(function (img) {
          if (nsa.checked) libSelectedIds[img.id] = true; else delete libSelectedIds[img.id];
        });
        renderLibTable();
      });
    }

    /* 行 checkbox */
    document.querySelectorAll('.lib-check-row').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-id');
        if (cb.checked) libSelectedIds[id] = true; else delete libSelectedIds[id];
        updateBatchBar();
        var $sa = document.getElementById('libSelectAll');
        if ($sa) {
          var pageImages = getFilteredImages().slice((libPage - 1) * PER_PAGE, libPage * PER_PAGE);
          $sa.checked = pageImages.every(function (img) { return libSelectedIds[img.id]; });
        }
      });
    });

    /* 行内编辑 input/select */
    document.querySelectorAll('#libTableBody [data-field]').forEach(function (el) {
      el.addEventListener('change', function () {
        var id = el.getAttribute('data-id');
        var field = el.getAttribute('data-field');
        var value = el.value;
        Storage.updateOne('pressureSoreLibrary', id, {});
        var record = Storage.findOne('pressureSoreLibrary', id);
        if (record) {
          var patch = {}; patch[field] = field === 'imageDesc' ? value : value;
          Storage.updateOne('pressureSoreLibrary', id, patch);
        }
        refreshLibStats();
        toast('已更新', 'success');
      });
    });

    /* 编辑按钮 → 弹窗 */
    document.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        openImageEditModal(id);
      });
    });

    /* 删除按钮 */
    document.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        confirmDialog('确认删除该压疮分期图？', function () {
          Storage.deleteOne('pressureSoreLibrary', id);
          delete libSelectedIds[id];
          refreshLibrary();
          toast('已删除', 'warning');
        });
      });
    });
  }

  function updateBatchBar() {
    var count = Object.keys(libSelectedIds).length;
    var $bar = document.getElementById('libBatchBar');
    document.getElementById('libBatchText').textContent = '已选 ' + count + ' 张';
    if (count > 0) $bar.classList.remove('admin-hidden'); else $bar.classList.add('admin-hidden');
  }

  /* ===== 图片编辑弹窗 ===== */
  function openImageEditModal(id) {
    var img = id ? Storage.findOne('pressureSoreLibrary', id) : null;
    var $modal = document.getElementById('modalImageEdit');
    document.getElementById('editImageId').value = id || '';
    document.getElementById('editImageDesc').value = img ? (img.imageDesc || '') : '';
    document.getElementById('editImageStage').value = img ? (img.stageKey || 'stage_1') : 'stage_1';
    document.getElementById('editImageSource').value = img ? (img.source || '') : '';

    /* 【新增】图片回填：有 imgDataUrl 或 imgUrl 则展示预览；清空 file input */
    var $fileInput = document.getElementById('editImageFile');
    if ($fileInput) $fileInput.value = '';
    var $preview = document.getElementById('editImagePreview');
    var $previewImg = document.getElementById('editImagePreviewImg');
    if ($preview) $preview.style.display = 'none';
    if (img && img.imgDataUrl) {
      if ($previewImg) { $previewImg.src = img.imgDataUrl; }
      if ($preview) $preview.style.display = 'block';
    } else if (img && img.imgUrl) {
      if ($previewImg) { $previewImg.src = img.imgUrl; }
      if ($preview) $preview.style.display = 'block';
    }

    /* 【新增】绑定文件选择事件 */
    if ($fileInput) {
      var newFileInput = $fileInput.cloneNode(true);
      $fileInput.parentNode.replaceChild(newFileInput, $fileInput);
      newFileInput.addEventListener('change', onImageFileSelected);
    }

    var diffTag = img && img.difficultyTag ? img.difficultyTag.split(',') : ['easy', 'medium', 'hard'];
    document.getElementById('editDiffEasy').checked = diffTag.indexOf('easy') !== -1;
    document.getElementById('editDiffMedium').checked = diffTag.indexOf('medium') !== -1;
    document.getElementById('editDiffHard').checked = diffTag.indexOf('hard') !== -1;

    document.getElementById('modalImageEditTitle').textContent = id ? '编辑压疮分期图' : '新增压疮分期图';
    $modal.classList.remove('admin-hidden');
  }

  /**
   * 【新增】文件选中回调 — 生成相对路径 + base64 预览数据
   * 自动回填到「图片来源」输入框，生成缩略预览
   */
  function onImageFileSelected(e) {
    var file = e.target.files[0];
    if (!file) return;

    /* 校验类型 */
    var validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (validTypes.indexOf(file.type) === -1) {
      toast('仅支持 jpg / png 格式', 'warning');
      e.target.value = '';
      return;
    }

    /* 生成相对路径：assets/sore-img/文件名 */
    var relPath = 'assets/sore-img/' + file.name;
    document.getElementById('editImageSource').value = relPath;

    /* 生成 base64 数据用于即时预览和存储（纯前端方案，无需服务端） */
    var reader = new FileReader();
    reader.onload = function (ev) {
      /* 存到临时变量供保存时读取 */
      window._admin_tempImgDataUrl = ev.target.result;
      var $preview = document.getElementById('editImagePreview');
      var $previewImg = document.getElementById('editImagePreviewImg');
      if ($previewImg) $previewImg.src = ev.target.result;
      if ($preview) $preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    toast('已选择图片：' + file.name, 'info');
  }

  function closeImageEditModal() {
    document.getElementById('modalImageEdit').classList.add('admin-hidden');
  }

  function saveImageFromModal() {
    var id = document.getElementById('editImageId').value;
    var desc = document.getElementById('editImageDesc').value.trim();
    var stage = document.getElementById('editImageStage').value;
    var source = document.getElementById('editImageSource').value.trim();

    if (!desc) { toast('请输入压疮创面描述', 'warning'); return; }

    var diffTags = [];
    if (document.getElementById('editDiffEasy').checked) diffTags.push('easy');
    if (document.getElementById('editDiffMedium').checked) diffTags.push('medium');
    if (document.getElementById('editDiffHard').checked) diffTags.push('hard');
    var diffTagStr = diffTags.join(',');

    /* 【新增】获取图片 URL 和 base64 数据 */
    var imgUrl = source; /* 图片来源输入框即 imgUrl */
    var imgDataUrl = window._admin_tempImgDataUrl || null;
    /* 读取已有数据（编辑场景未重新选图时保留原有 dataUrl） */
    if (!imgDataUrl && id) {
      var existing = Storage.findOne('pressureSoreLibrary', id);
      if (existing) imgDataUrl = existing.imgDataUrl || null;
    }

    var patch = {
      imageDesc: desc, stageKey: stage, source: source, imgUrl: imgUrl,
      difficultyTag: diffTagStr, imageName: imgUrl ? imgUrl.split('/').pop() : '',
    };
    if (imgDataUrl) patch.imgDataUrl = imgDataUrl;

    if (id) {
      Storage.updateOne('pressureSoreLibrary', id, patch);
      toast('已更新', 'success');
    } else {
      Storage.insertOne('pressureSoreLibrary', patch);
      toast('已新增', 'success');
    }

    /* 清理临时数据 */
    window._admin_tempImgDataUrl = null;

    closeImageEditModal();
    refreshLibrary();
  }

  /* ===== 批量删除 ===== */
  function batchDelete() {
    var ids = Object.keys(libSelectedIds);
    if (ids.length === 0) { toast('请先选中图片', 'warning'); return; }
    confirmDialog('确认删除 ' + ids.length + ' 张压疮分期图？此操作不可恢复。', function () {
      ids.forEach(function (id) { Storage.deleteOne('pressureSoreLibrary', id); });
      libSelectedIds = {};
      refreshLibrary();
      toast('已删除 ' + ids.length + ' 张', 'warning');
    });
  }

  /* ===== 批量设置分期 ===== */
  function batchSetStage() {
    var ids = Object.keys(libSelectedIds);
    if (ids.length === 0) { toast('请先选中图片', 'warning'); return; }
    var stage = prompt('请输入目标分期 key（stage_1 ~ dti）：', 'stage_1');
    if (!stage || STAGE_ORDER.indexOf(stage) === -1) { toast('无效的分期 key', 'warning'); return; }
    ids.forEach(function (id) { Storage.updateOne('pressureSoreLibrary', id, { stageKey: stage }); });
    refreshLibrary();
    toast('已更新 ' + ids.length + ' 张', 'success');
  }

  /* ===== 批量取消选择 ===== */
  function batchCancelSelection() {
    libSelectedIds = {};
    renderLibTable();
  }

  // ==================== ④ 全局参数配置面板 ====================

  function getConfigOverride() {
    try { return JSON.parse(localStorage.getItem(ADMIN_CONFIG_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveConfigOverride(obj) {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(obj));
    /* 实时合并到运行中 CONFIG */
    deepMerge(C, obj);
  }

  function deepMerge(target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  function renderConfigPanel() {
    var override = getConfigOverride();
    /* 构建要编辑的配置项扁平列表 */
    var items = flattenConfig(C, '', override);

    var html = '';
    var currentSection = '';
    items.forEach(function (item) {
      if (item.isSection && item.label !== currentSection) {
        if (currentSection) html += '</div>';
        currentSection = item.label;
        html += '<div class="config-section"><div class="config-section__title">' + item.label + '</div>';
      } else if (!item.isSection) {
        html += '<div class="config-item">';
        html += '<div><div class="config-item__label">' + item.label + '</div><div class="config-item__hint">' + (item.hint || '') + '</div></div>';
        html += '<div style="display:flex;align-items:center;">';
        html += '<input class="config-item__input" data-key="' + item.key + '" data-type="' + item.type + '" value="' + item.value + '">';
        html += '<span class="config-item__unit">' + (item.unit || '') + '</span>';
        html += '</div></div>';
      }
    });
    if (currentSection) html += '</div>';

    html += '<div style="text-align:center;padding:16px;font-size:12px;color:#A8989E;">修改后点击「保存全部配置」写入 LocalStorage 并即时生效</div>';
    document.getElementById('configForm').innerHTML = html;
  }

  /** 将嵌套 CONFIG 扁平化用于表单渲染 */
  function flattenConfig(obj, prefix, override) {
    var items = [];
    var sectionMap = {
      practice: '练习分值', match: '比赛分值', signIn: '签到分值', matchRule: '配对规则',
      unlock: '解锁条件', board: '棋盘规格', exam: '考试规则', dailyLimit: '每日上限',
      storage: '存储配置', animation: '动画配置',
    };
    var keyLabels = {
      scoreEasy: '体验版通关得分', scoreMedium: '进阶版通关得分', scoreHard: '终结版通关得分',
      accuracyBonusThreshold: '正确率达标阈值', accuracyBonusScore: '正确率达标额外加分',
      winScore: '比赛胜利固定加分', daily: '每日签到基础分',
      wrongMatchDeductRate: '错误配对单次扣减比例', accuracyRequired: '解锁下一级所需正确率',
      totalCards: '单局总图片数', pairs: '单局配对数',
      practiceMinThreshold: '双周练习门槛（分钟）', timeLimitMinutes: '单场考试限时（分钟）',
      examSetCount: '考试套题数', cardsPerSet: '每套图片数',
      maxAttemptsPerDay: '单日最大考试次数', scoreOnQuit: '中途退出计分',
      maxPracticeTimes: '每日最大练习次数', version: '存储版本号', keyPrefix: '存储键前缀',
      fadeDuration: '淡入淡出时长(ms)',
    };
    var keyUnits = {
      accuracyBonusThreshold: '%', accuracyRequired: '%', wrongMatchDeductRate: '%',
      timeLimitMinutes: '分钟', practiceMinThreshold: '分钟', fadeDuration: 'ms',
      totalCards: '张', pairs: '对', cardsPerSet: '张',
    };

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var val = obj[key];
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          var secName = sectionMap[key] || key;
          items.push({ isSection: true, label: secName });
          var subItems = flattenConfig(val, prefix ? prefix + '.' + key : key, override);
          items = items.concat(subItems);
        } else if (typeof val !== 'function') {
          var fullKey = prefix ? prefix + '.' + key : key;
          /* 检查 override */
          var overrideVal = getOverrideVal(override, fullKey);
          var displayVal = overrideVal !== undefined ? overrideVal : val;
          items.push({
            key: fullKey, label: keyLabels[key] || key, value: displayVal,
            type: typeof val === 'boolean' ? 'boolean' : (typeof val === 'number' ? 'number' : 'string'),
            unit: keyUnits[key] || '', hint: '(' + fullKey + ')',
          });
        }
      }
    }
    return items;
  }

  function getOverrideVal(override, dottedKey) {
    var parts = dottedKey.split('.');
    var cur = override;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function setOverrideVal(override, dottedKey, value) {
    var parts = dottedKey.split('.');
    var cur = override;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function collectConfigForm() {
    var override = getConfigOverride();
    document.querySelectorAll('#configForm .config-item__input').forEach(function (input) {
      var key = input.getAttribute('data-key');
      var type = input.getAttribute('data-type');
      var rawVal = input.value;
      var val;
      if (type === 'number') val = parseFloat(rawVal) || 0;
      else if (type === 'boolean') val = rawVal === 'true';
      else val = rawVal;
      setOverrideVal(override, key, val);
    });
    return override;
  }

  function saveConfig() {
    var override = collectConfigForm();
    saveConfigOverride(override);
    toast('配置已保存并生效', 'success');
  }

  function resetConfigToDefault() {
    confirmDialog('确认恢复全部参数为默认值？当前覆盖配置将清空。', function () {
      localStorage.removeItem(ADMIN_CONFIG_KEY);
      renderConfigPanel();
      toast('已恢复默认值', 'warning');
    });
  }

  // ==================== ⑤ 科研数据导出面板 ====================

  function refreshExportPanel() {
    var trainRecords = Storage.findAll('trainRecord');
    var examRecords = Storage.findAll('examRecord');
    document.getElementById('exportTrainCount').textContent = trainRecords.length + ' 条记录';
    document.getElementById('exportExamCount').textContent = examRecords.length + ' 条记录';

    /* 混淆类型统计 */
    var confusions = {};
    trainRecords.forEach(function (r) {
      if (r.wrongStageMatch) {
        r.wrongStageMatch.forEach(function (w) {
          if (w.selected) confusions[w.selected] = (confusions[w.selected] || 0) + 1;
        });
      }
    });
    document.getElementById('exportConfusionTypes').textContent = Object.keys(confusions).length + ' 种混淆类型';

    /* 全量大小 */
    var data = Storage.exportAll();
    var size = JSON.stringify(data).length;
    document.getElementById('exportTotalSize').textContent = size > 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + ' MB' : size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B';
  }

  function exportTrainJSON_() {
    var data = Storage.findAll('trainRecord');
    Utils.exportJSON(data, '练习记录_全部_' + Utils.todayStr());
  }
  function exportTrainCSV_() {
    var data = Storage.findAll('trainRecord');
    Utils.exportCSV(Utils.trainRecordsToTable(data), '练习记录_全部_' + Utils.todayStr());
  }
  function exportExamJSON_() {
    var data = Storage.findAll('examRecord');
    Utils.exportJSON(data, '考试记录_全部_' + Utils.todayStr());
  }
  function exportExamCSV_() {
    var data = Storage.findAll('examRecord');
    Utils.exportCSV(Utils.examRecordsToTable(data), '考试记录_全部_' + Utils.todayStr());
  }
  function exportConfusionCSV() {
    var trainRecords = Storage.findAll('trainRecord');
    var countMap = {};
    trainRecords.forEach(function (r) {
      if (r.wrongStageMatch) {
        r.wrongStageMatch.forEach(function (w) {
          if (w.selected) countMap[w.selected] = (countMap[w.selected] || 0) + 1;
        });
      }
    });
    var rows = [['分期', '分期名称', '误判次数']];
    STAGE_ORDER.forEach(function (sk) {
      rows.push([sk, STAGE_SHORT[sk] || sk, countMap[sk] || 0]);
    });
    Utils.exportCSV(rows, '分期误判汇总_' + Utils.todayStr());
  }
  function exportFullBackup() {
    var data = {
      exportedAt: new Date().toISOString(),
      configOverride: getConfigOverride(),
      data: Storage.exportAll(),
      favorites: JSON.parse(localStorage.getItem('pu_game_favorites') || '[]'),
      mistakes: JSON.parse(localStorage.getItem('pu_game_mistakes') || '[]'),
      messages: JSON.parse(localStorage.getItem('pu_game_messages') || '[]'),
    };
    Utils.exportJSON(data, '压疮连连看_全量备份_' + Utils.todayStr());
    toast('全量备份已下载', 'success');
  }
  function importBackup() {
    document.getElementById('backupFileInput').click();
  }

  /* ===== 批量清空 ===== */
  function resetTable(table) {
    confirmDialog('确认清空 ' + table + ' 数据？此操作不可恢复。', function () {
      Storage.clearTable(table);
      toast('已清空：' + table, 'warning');
      refreshExportPanel();
    });
  }

  // ==================== ⑥ 考试批量管理面板 ====================

  function getExamSetConfig() {
    try { return JSON.parse(localStorage.getItem(EXAM_SET_KEY) || 'null'); } catch (e) { return null; }
  }
  function saveExamSetConfig(cfg) {
    localStorage.setItem(EXAM_SET_KEY, JSON.stringify(cfg));
  }
  function getExamOpen() {
    return localStorage.getItem(EXAM_OPEN_KEY) !== '0';
  }
  function setExamOpen(open) {
    localStorage.setItem(EXAM_OPEN_KEY, open ? '1' : '0');
  }

  function renderExamPanel() {
    /* 开关 */
    document.getElementById('examOpenToggle').checked = getExamOpen();

    /* 3 套分布 */
    var cfg = getExamSetConfig();
    /* 默认分布 */
    var defaults = [
      [{ stageKey: 'stage_1', count: 12 }, { stageKey: 'stage_2', count: 12 }, { stageKey: 'stage_3', count: 12 }],
      [{ stageKey: 'stage_1', count: 6 }, { stageKey: 'stage_2', count: 6 }, { stageKey: 'stage_3', count: 6 }, { stageKey: 'stage_4', count: 6 }, { stageKey: 'unstage', count: 6 }, { stageKey: 'dti', count: 6 }],
      [{ stageKey: 'stage_4', count: 12 }, { stageKey: 'unstage', count: 12 }, { stageKey: 'dti', count: 12 }],
    ];
    var distributions = cfg || defaults;

    var setLabels = ['第一套（Ⅰ~Ⅲ期基础）', '第二套（Ⅰ~Ⅵ全分期）', '第三套（Ⅳ/不可分期/DTI 高混淆）'];
    var html = '';
    distributions.forEach(function (dist, si) {
      html += '<div style="margin-bottom:14px;"><strong style="font-size:14px;color:#2C1A20;">' + setLabels[si] + '</strong>';
      html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">';
      STAGE_ORDER.forEach(function (sk) {
        var existing = dist.find(function (d) { return d.stageKey === sk; });
        var val = existing ? existing.count : 0;
        html += '<div class="exam-set-dist-row">';
        html += '<span style="font-size:12px;width:70px;">' + (STAGE_SHORT[sk] || sk) + '</span>';
        html += '<input type="number" class="exam-dist-input" data-set="' + si + '" data-stage="' + sk + '" value="' + val + '" min="0" max="36" step="2" style="width:50px;">';
        html += '<span style="font-size:11px;color:#A8989E;">张</span>';
        html += '</div>';
      });
      html += '<span style="font-size:11px;color:#A8989E;margin-left:8px;">（总计须为 36 张 = 18 对）</span>';
      html += '</div></div>';
    });
    document.getElementById('examSetEditor').innerHTML = html;
  }

  function saveExamConfig() {
    var distributions = [[], [], []];
    document.querySelectorAll('.exam-dist-input').forEach(function (inp) {
      var si = parseInt(inp.getAttribute('data-set'), 10);
      var sk = inp.getAttribute('data-stage');
      var count = parseInt(inp.value, 10) || 0;
      if (count > 0) distributions[si].push({ stageKey: sk, count: count });
    });

    /* 校验每套 36 张 */
    for (var s = 0; s < 3; s++) {
      var total = distributions[s].reduce(function (sum, d) { return sum + d.count; }, 0);
      if (total !== 36) { toast('第 ' + (s + 1) + ' 套总计 ' + total + ' 张（需 36 张）', 'error'); return; }
    }

    saveExamSetConfig(distributions);
    setExamOpen(document.getElementById('examOpenToggle').checked);
    toast('考试配置已保存', 'success');
  }

  function regenExamSets() {
    confirmDialog('将根据当前图库随机重新生成 3 套考试题库的分期分布，确认？', function () {
      var allImages = Storage.findAll('pressureSoreLibrary');
      /* 简单策略：检查每个分期是否有足够图片 */
      var counts = {};
      STAGE_ORDER.forEach(function (sk) { counts[sk] = allImages.filter(function (img) { return img.stageKey === sk; }).length; });

      var defaults = [
        [{ stageKey: 'stage_1', count: 12 }, { stageKey: 'stage_2', count: 12 }, { stageKey: 'stage_3', count: 12 }],
        [{ stageKey: 'stage_1', count: 6 }, { stageKey: 'stage_2', count: 6 }, { stageKey: 'stage_3', count: 6 }, { stageKey: 'stage_4', count: 6 }, { stageKey: 'unstage', count: 6 }, { stageKey: 'dti', count: 6 }],
        [{ stageKey: 'stage_4', count: 12 }, { stageKey: 'unstage', count: 12 }, { stageKey: 'dti', count: 12 }],
      ];

      saveExamSetConfig(defaults);
      renderExamPanel();
      toast('已重新生成 3 套考试题库分布', 'success');
    });
  }

  // ==================== ⑦ 系统设置面板 ====================

  function renderSettingsPanel() {
    /* 存储概览 */
    var tables = ['userInfo', 'signRecord', 'trainRecord', 'examRecord', 'matchRecord', 'pressureSoreLibrary'];
    var extraKeys = ['pu_game_favorites', 'pu_game_mistakes', 'pu_game_messages', ADMIN_CONFIG_KEY, EXAM_SET_KEY, EXAM_OPEN_KEY, ADMIN_KEY];
    var totalSize = 0;

    var html = '';
    tables.forEach(function (t) {
      var rows = Storage.readTable(t);
      var size = JSON.stringify(rows).length;
      totalSize += size;
      html += '<tr><td>pu_game_' + t + '</td><td>' + (Array.isArray(rows) ? rows.length : 1) + ' 条</td><td>' + formatBytes(size) + '</td></tr>';
    });
    extraKeys.forEach(function (k) {
      var raw = localStorage.getItem(k);
      if (raw) {
        var sz = raw.length;
        totalSize += sz;
        html += '<tr><td>' + k + '</td><td>1 项</td><td>' + formatBytes(sz) + '</td></tr>';
      }
    });
    document.getElementById('storageOverviewTbody').innerHTML = html;
    document.getElementById('storageTotalSize').textContent = '总占用空间：约 ' + formatBytes(totalSize);
  }

  function changePassword() {
    var newPwd = document.getElementById('newAdminPwd').value.trim();
    if (!newPwd) { toast('请输入新密码', 'warning'); return; }
    if (newPwd.length < 4) { toast('密码至少 4 位', 'warning'); return; }
    setAdminPwd(newPwd);
    document.getElementById('newAdminPwd').value = '';
    toast('密码已更新', 'success');
  }

  // ==================== ⑧ 通用分页 ====================

  function renderPagination(containerId, current, total, callback) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (total <= 1) { el.innerHTML = ''; return; }

    var html = '';
    html += '<button class="admin-page-btn" ' + (current === 1 ? 'disabled' : '') + ' data-page="' + (current - 1) + '">上一页</button>';
    for (var p = 1; p <= total; p++) {
      if (p === 1 || p === total || (p >= current - 2 && p <= current + 2)) {
        html += '<button class="admin-page-btn' + (p === current ? ' admin-page-btn--active' : '') + '" data-page="' + p + '">' + p + '</button>';
      } else if (p === current - 3 || p === current + 3) {
        html += '<span style="padding:0 4px;color:#A8989E;">...</span>';
      }
    }
    html += '<button class="admin-page-btn" ' + (current === total ? 'disabled' : '') + ' data-page="' + (current + 1) + '">下一页</button>';

    el.innerHTML = html;
    el.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        callback(parseInt(btn.getAttribute('data-page'), 10));
      });
    });
  }

  // ==================== ⑨ 辅助 ====================

  function escapeHtml(str) { return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function formatBytes(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b > 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B'; }

  // ==================== ⑩ 初始化 ====================

  function init() {
    /* 存储键初始化 */
    if (!localStorage.getItem(ADMIN_KEY)) localStorage.setItem(ADMIN_KEY, 'admin123');
    if (!localStorage.getItem(EXAM_OPEN_KEY)) localStorage.setItem(EXAM_OPEN_KEY, '1');

    /* 加载配置覆盖 */
    var override = getConfigOverride();
    if (Object.keys(override).length > 0) {
      deepMerge(C, override);
    }

    /* 检查登录态 */
    if (isLoggedIn()) {
      showMain();
    } else {
      $loginView.style.display = 'flex';
      $mainView.classList.remove('admin-main--active');
    }

    /* ===== 事件绑定 ===== */

    /* 登录 */
    document.getElementById('btnAdminLogin').addEventListener('click', doLogin);
    $pwdInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    document.getElementById('btnAdminLogout').addEventListener('click', doLogout);
    /* 【新增】返回学习首页按钮 */
    var $btnBackIdx = document.getElementById('btnBackToIndex');
    if ($btnBackIdx) $btnBackIdx.addEventListener('click', function () { window.location.href = 'index.html'; });

    /* 侧边导航 */
    document.getElementById('adminSidebar').addEventListener('click', function (e) {
      var item = e.target.closest('.admin-nav-item');
      if (!item) return;
      switchPanel(item.getAttribute('data-panel'));
    });

    /* ===== 图库管理事件 ===== */
    document.getElementById('btnAddImage').addEventListener('click', function () { openImageEditModal(null); });
    document.getElementById('modalImageEditClose').addEventListener('click', closeImageEditModal);
    document.getElementById('modalImageEditClose2').addEventListener('click', closeImageEditModal);
    document.getElementById('btnSaveImage').addEventListener('click', saveImageFromModal);
    document.getElementById('libSearchInput').addEventListener('input', Utils.debounce(function () {
      libSearch = document.getElementById('libSearchInput').value;
      libPage = 1;
      renderLibTable();
    }, 300));
    document.getElementById('libStageFilter').addEventListener('change', function () {
      libStage = document.getElementById('libStageFilter').value;
      libPage = 1;
      renderLibTable();
    });
    document.getElementById('btnBatchDelete').addEventListener('click', batchDelete);
    document.getElementById('btnBatchStageSet').addEventListener('click', batchSetStage);
    document.getElementById('btnBatchCancel').addEventListener('click', batchCancelSelection);

    /* modal 背景点击关闭 */
    document.getElementById('modalImageEdit').addEventListener('click', function (e) {
      if (e.target.closest('.admin-modal-overlay') && !e.target.closest('.admin-modal')) closeImageEditModal();
    });

    /* ===== 配置面板事件 ===== */
    document.getElementById('btnSaveConfig').addEventListener('click', saveConfig);
    document.getElementById('btnResetConfig').addEventListener('click', resetConfigToDefault);

    /* ===== 导出面板事件 ===== */
    document.getElementById('btnExportTrainJSON').addEventListener('click', exportTrainJSON_);
    document.getElementById('btnExportTrainCSV').addEventListener('click', exportTrainCSV_);
    document.getElementById('btnExportExamJSON').addEventListener('click', exportExamJSON_);
    document.getElementById('btnExportExamCSV').addEventListener('click', exportExamCSV_);
    document.getElementById('btnExportConfusion').addEventListener('click', exportConfusionCSV);
    document.getElementById('btnExportFullBackup').addEventListener('click', exportFullBackup);
    document.getElementById('btnImportBackup').addEventListener('click', importBackup);

    var $backupInput = document.getElementById('backupFileInput');
    $backupInput.addEventListener('change', function () {
      var file = $backupInput.files[0];
      if (!file) return;
      confirmDialog('确认从备份文件恢复全部数据？当前数据将被覆盖。', function () {
        var reader = new FileReader();
        reader.onload = function (ev) {
          try {
            var json = JSON.parse(ev.target.result);
            if (json.data) Storage.importAll(json.data);
            if (json.configOverride) localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(json.configOverride));
            if (json.favorites !== undefined) localStorage.setItem('pu_game_favorites', JSON.stringify(json.favorites));
            if (json.mistakes !== undefined) localStorage.setItem('pu_game_mistakes', JSON.stringify(json.mistakes));
            if (json.messages !== undefined) localStorage.setItem('pu_game_messages', JSON.stringify(json.messages));
            window.location.reload();
          } catch (e) { toast('备份文件格式错误', 'error'); }
        };
        reader.readAsText(file);
      });
      $backupInput.value = '';
    });

    /* 清空按钮 */
    document.getElementById('btnResetLibrary').addEventListener('click', function () { resetTable('pressureSoreLibrary'); });
    document.getElementById('btnResetTrainRecords').addEventListener('click', function () { resetTable('trainRecord'); });
    document.getElementById('btnResetExamRecords').addEventListener('click', function () { resetTable('examRecord'); });
    document.getElementById('btnResetMatchRecords').addEventListener('click', function () { resetTable('matchRecord'); });
    document.getElementById('btnResetAllRecords').addEventListener('click', function () {
      confirmDialog('确认清空全部记录（保留图库）？', function () {
        ['userInfo', 'signRecord', 'trainRecord', 'examRecord', 'matchRecord'].forEach(function (t) { Storage.clearTable(t); });
        toast('全部记录已清空', 'warning');
        refreshExportPanel();
      });
    });

    /* ===== 考试管理事件 ===== */
    document.getElementById('btnSaveExamConfig').addEventListener('click', saveExamConfig);
    document.getElementById('btnRegenExamSets').addEventListener('click', regenExamSets);

    /* ===== 系统设置事件 ===== */
    document.getElementById('btnChangePwd').addEventListener('click', changePassword);

    console.log('[admin] 后台初始化完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ===== 导出 ===== */
  global.Admin = { init: init };

})(window);
