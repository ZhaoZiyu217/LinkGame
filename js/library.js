/**
 * library.js — 知识库模块完整业务逻辑
 * 教学图库 / 个人收藏 / 错题题库 三板块
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  var ST = global.AppConfig.STAGE;
  var PER_PAGE = 12;

  // ==================== 分期医学资料 ====================

  var STAGE_DETAIL = {};
  STAGE_DETAIL[ST.I.key] = {
    name:'Ⅰ期压疮', enName:'Stage 1',
    criteria:'局部皮肤完整，出现指压不变白的红斑（通常位于骨隆突处）。深色皮肤可能没有明显的苍白变化。',
    identification:['皮肤完整无破损，红斑指压后不褪色','多见于骨隆突处：骶尾/足跟/髋部/肘部','与反应性充血区别：后者指压可变白，30分钟内消退','与瘀伤区别：瘀伤为外伤/撞击所致，非持续压力','深肤色人群需注意肤色变化：呈紫色/蓝色/更深颜色'],
    care:['每2小时翻身减压，使用翻身时间表','使用减压垫（泡沫垫/气垫床）避免骨隆突受压','保持皮肤清洁干燥，使用pH平衡皮肤清洁剂','营养评估：蛋白质/维生素C/锌的摄入','避免按摩骨隆突处，按摩可导致组织损伤加重'],
  };
  STAGE_DETAIL[ST.II.key] = {
    name:'Ⅱ期压疮', enName:'Stage 2',
    criteria:'部分皮层缺损，真皮层暴露。创面床为粉色或红色、湿润，也可表现为完整或破裂的浆液性水疱。无腐肉、无瘀伤。',
    identification:['表皮/真皮部分缺损，创面表浅呈粉红色或红色','可表现为完整或破裂的浆液性水疱（非血疱）','无腐肉/焦痂/瘀伤/皮下脂肪暴露','与潮湿相关性皮肤损伤(MASD)区别：边界不规则','与皮肤撕脱伤区别：为机械性外力造成','小水疱勿刺破；大水疱可在无菌条件下抽吸'],
    care:['保护创面：使用水胶体敷料或泡沫敷料覆盖','避免创面继续受压：继续执行减压方案','控制渗出液：根据渗液选择合适吸收能力的敷料','每次更换敷料时评估创面变化并记录','协助刺激局部血运促进上皮化'],
  };
  STAGE_DETAIL[ST.III.key] = {
    name:'Ⅲ期压疮', enName:'Stage 3',
    criteria:'全层皮肤缺损，皮下脂肪组织可见。可能存在腐肉和/或焦痂。骨骼、肌腱或肌肉未暴露。',
    identification:['全层皮肤缺损，皮下脂肪组织暴露/可见','骨骼/肌腱/肌肉未暴露（与Ⅳ期关键区别）','可伴腐肉（黄色/灰色）和/或焦痂覆盖','创面边缘可能形成潜行腔隙或窦道','鼻梁/耳廓等无皮下组织部位Ⅲ期可较浅'],
    care:['清创：机械性/自溶性/酶学清创去除坏死组织','负压伤口治疗(NPWT)适用于渗出量大的Ⅲ期压疮','控制感染：根据细菌培养选用局部抗菌敷料','加强营养支持：高蛋白饮食/补充微量元素','定期测量创面尺寸并拍照记录评估愈合趋势'],
  };
  STAGE_DETAIL[ST.IV.key] = {
    name:'Ⅳ期压疮', enName:'Stage 4',
    criteria:'全层皮肤和组织缺损，骨骼、肌腱或肌肉暴露。常伴有潜行和窦道。可能延伸至肌肉和/或支撑结构，可能导致骨髓炎。',
    identification:['骨骼/肌腱/韧带/肌肉直接暴露于创面','常伴有广泛潜行腔隙和/或多个窦道形成','可触及骨质或探查到骨面','与Ⅲ期关键区别：深部结构暴露','警惕骨髓炎：骨质暴露超2周风险显著增高'],
    care:['多学科团队协作：伤口造口师/骨科/感染科/营养师','外科干预：可能需要手术清创/植皮或皮瓣修复','感染控制：全身抗生素治疗联合局部抗菌处理','疼痛管理：换药前30分钟给予镇痛处理','长期营养支持计划，定期监测白蛋白和前白蛋白水平'],
  };
  STAGE_DETAIL[ST.U.key] = {
    name:'不可分期压疮', enName:'Unstageable',
    criteria:'全层皮肤和组织缺损，创面被腐肉和/或焦痂覆盖，无法判定实际深度。需去除足够腐肉或焦痂后才能分期。',
    identification:['创面完全被腐肉或焦痂覆盖，无法看清底部','清创前无法确定是Ⅲ期还是Ⅳ期','干燥/完整/无波动感的足跟焦痂可不做清创','与Ⅲ/Ⅳ期区别：分期被覆盖物遮挡','若焦痂下有波动感/渗液/红肿等感染征象则需清创'],
    care:['足跟部干燥稳定焦痂：采取保护性措施不做清创','其他部位或有感染征象焦痂：清创暴露后重新分期','评估肢端灌注状态（踝肱指数ABI），缺血肢体避免激进清创','清创后根据创面深度（Ⅲ期或Ⅳ期）调整治疗方案','密切监测焦痂周围有无红肿/渗液/异味等感染迹象'],
  };
  STAGE_DETAIL[ST.DTI.key] = {
    name:'深部组织损伤（DTI）', enName:'Deep Tissue Pressure Injury',
    criteria:'完整的或不完整的皮肤，局部区域呈现持续的指压不变白的深红色、褐红色或紫色，或表皮分离后呈现深色创面床或充血水疱。',
    identification:['皮肤局部呈深红色/褐红色/紫色，指压不变白','可表现为充血性水疱（血疱），破裂后露出深色创面床','与Ⅰ期区别：颜色更深（紫/褐红 vs 鲜红），常伴组织硬化','与瘀伤区别：位于骨隆突处，与持续压力/剪切力相关','可迅速恶化：表面看似轻微但深层已坏死'],
    care:['立即完全减压：绝对避免该区域任何压力/摩擦/剪切力','保护血疱完整：勿刺破，让其自然吸收','密切观察：DTI可在24-72小时内迅速恶化','若表皮破裂：轻柔清洁并使用非粘连敷料保护','记录颜色/硬度/温度变化，拍照留存对比'],
  };

  // ==================== 分期颜色映射 ====================
  var stageColors = {
    stage_1:'#FF5252', stage_2:'#FF9800', stage_3:'#FFEB3B',
    stage_4:'#4CAF50', unstage:'#607D8B', dti:'#9C27B0',
  };
  var stageShortLabels = {
    stage_1:'Ⅰ期', stage_2:'Ⅱ期', stage_3:'Ⅲ期',
    stage_4:'Ⅳ期', unstage:'不可分期', dti:'DTI',
  };
  var stageOrder = ['stage_1','stage_2','stage_3','stage_4','unstage','dti'];

  // ==================== DOM 引用 ====================

  var $hubView       = document.getElementById('libraryHubView');
  var $galleryView   = document.getElementById('libraryGalleryView');
  var $favoritesView = document.getElementById('libraryFavoritesView');
  var $mistakesView  = document.getElementById('libraryMistakesView');

  /* 图库 */
  var $galleryStageList  = document.getElementById('galleryStageList');
  var $galleryImageGrid  = document.getElementById('galleryImageGrid');
  var $galleryResultCount = document.getElementById('galleryResultCount');
  var $galleryPagination = document.getElementById('galleryPagination');
  var $gallerySearchInput = document.getElementById('gallerySearchInput');

  /* 收藏 */
  var $favImageGrid   = document.getElementById('favImageGrid');
  var $favResultCount  = document.getElementById('favResultCount');
  var $favPagination   = document.getElementById('favPagination');
  var $favStageFilter  = document.getElementById('favStageFilter');
  var $favBatchBar     = document.getElementById('favBatchBar');
  var $favBatchSelected = document.getElementById('favBatchSelected');

  /* 错题 */
  var $mistakesList     = document.getElementById('mistakesList');
  var $mistakeResultCount = document.getElementById('mistakeResultCount');
  var $mistakeSourceFilter = document.getElementById('mistakeSourceFilter');
  var $mistakeStageFilter  = document.getElementById('mistakeStageFilter');

  /* 弹窗 */
  var $libraryDetailModal  = document.getElementById('libraryStageDetailModal');
  var $libraryDetailTitle  = document.getElementById('libraryDetailTitle');
  var $libraryDetailBody   = document.getElementById('libraryDetailBody');
  var $libraryPracticeGenModal = document.getElementById('libraryPracticeGenModal');
  var $libraryPracGenBody     = document.getElementById('libraryPracGenBody');

  // ==================== 状态 ====================

  var state = {
    /* 图库 */
    galleryFilterStage: 'all',
    gallerySearchText: '',
    galleryPage: 1,
    /* 收藏 */
    favFilterStage: 'all',
    favPage: 1,
    favBatchMode: false,
    favSelectedIds: {},
    /* 错题 */
    mistakeFilterSource: 'all',
    mistakeFilterStage: 'all',
    /* 当前选中的图片（供弹窗操作） */
    currentDetailImage: null,
  };

  // ==================== 视图切换 ====================

  function hideAllViews() {
    [$hubView,$galleryView,$favoritesView,$mistakesView].forEach(function(v){v.classList.add('u-hidden');});
  }
  function showHub()        { hideAllViews(); $hubView.classList.remove('u-hidden'); }
  function showGallery()    { hideAllViews(); $galleryView.classList.remove('u-hidden'); }
  function showFavorites()  { hideAllViews(); $favoritesView.classList.remove('u-hidden'); }
  function showMistakes()   { hideAllViews(); $mistakesView.classList.remove('u-hidden'); }

  // ==================== 数据读写 ====================

  function loadFavorites() {
    try { return JSON.parse(localStorage.getItem('pu_game_favorites') || '[]'); }
    catch(e) { return []; }
  }
  function saveFavorites(arr) {
    try { localStorage.setItem('pu_game_favorites', JSON.stringify(arr)); }
    catch(e) { toast('存储空间不足', 'error'); }
  }
  function loadMistakes() {
    try { return JSON.parse(localStorage.getItem('pu_game_mistakes') || '[]'); }
    catch(e) { return []; }
  }

  function isFavorited(imageId) {
    if (!imageId) return false;
    return loadFavorites().some(function(f){return f.id === imageId;});
  }

  function toggleFav(imageData) {
    if (!imageData || !imageData.id) { toast('无法标识该压疮分期图', 'warning'); return; }
    var favs = loadFavorites();
    var idx = -1;
    for (var i=0;i<favs.length;i++) { if(favs[i].id===imageData.id) { idx=i; break; } }
    if (idx >= 0) {
      favs.splice(idx,1);
      saveFavorites(favs);
      toast('已取消收藏', 'info');
      return false;
    } else {
      /* 【新增】收藏时同步存储 imgDataUrl，方便收藏页直接展示图片 */
      favs.push({ id:imageData.id, stageKey:imageData.stageKey, imageDesc:imageData.imageDesc, savedAt:new Date().toISOString(), imgDataUrl:imageData.imgDataUrl||imageData.imgUrl||'', imgUrl:imageData.imgUrl||'' });
      saveFavorites(favs);
      toast('已收藏', 'success');
      return true;
    }
  }

  // ==================== ① 知识库首页 ====================

  function refreshHubCounts() {
    var total = Storage.count('pressureSoreLibrary');
    document.getElementById('hubTotalImages').textContent = '共 ' + total + ' 张压疮分期图';

    var favCount = loadFavorites().length;
    document.getElementById('hubFavCount').textContent = '共 ' + favCount + ' 张收藏';

    var agg = aggregateAllMistakes();
    var uniqueKeys = {};
    agg.forEach(function(m){ uniqueKeys[m.stageKey] = true; });
    document.getElementById('hubMistakeCount').textContent = '共 ' + Object.keys(uniqueKeys).length + ' 类混淆分期';
  }

  // ==================== ② 教学图库 ====================

  function renderGallerySidebar() {
    var allImages = Storage.findAll('pressureSoreLibrary');
    var counts = {};
    stageOrder.forEach(function(sk){ counts[sk]=0; });
    allImages.forEach(function(img){ counts[img.stageKey]=(counts[img.stageKey]||0)+1; });

    var html = '';
    /* "全部" */
    html += '<div class="library-stage-item' + (state.galleryFilterStage==='all'?' library-stage-item--active':'') + '" data-stage="all">';
    html += '<span class="library-stage-item__dot" style="background:#ccc;"></span>';
    html += '<span>全部</span>';
    html += '<span class="library-stage-item__count">' + allImages.length + '</span></div>';

    stageOrder.forEach(function(sk){
      var activeClass = state.galleryFilterStage===sk ? ' library-stage-item--active' : '';
      var color = stageColors[sk] || '#ccc';
      html += '<div class="library-stage-item' + activeClass + '" data-stage="' + sk + '">';
      html += '<span class="library-stage-item__dot" style="background:' + color + ';"></span>';
      html += '<span>' + (stageShortLabels[sk]||sk) + '</span>';
      html += '<span class="library-stage-item__count">' + (counts[sk]||0) + '</span></div>';
    });

    $galleryStageList.innerHTML = html;

    /* 绑定点击 */
    $galleryStageList.querySelectorAll('.library-stage-item').forEach(function(el){
      el.addEventListener('click', function(){
        state.galleryFilterStage = el.getAttribute('data-stage');
        state.galleryPage = 1;
        renderGalleryGrid();
        renderGallerySidebar();
      });
    });
  }

  function renderGalleryGrid() {
    var images = Storage.findAll('pressureSoreLibrary');

    /* 分期筛选 */
    if (state.galleryFilterStage !== 'all') {
      images = images.filter(function(img){ return img.stageKey === state.galleryFilterStage; });
    }
    /* 搜索 */
    if (state.gallerySearchText.trim()) {
      var kw = state.gallerySearchText.trim().toLowerCase();
      images = images.filter(function(img){
        return (img.imageDesc || '').toLowerCase().indexOf(kw) >= 0;
      });
    }

    var total = images.length;
    var totalPages = Math.ceil(total / PER_PAGE);
    if (state.galleryPage > totalPages) state.galleryPage = Math.max(1, totalPages);
    var start = (state.galleryPage - 1) * PER_PAGE;
    var pageImages = images.slice(start, start + PER_PAGE);

    $galleryResultCount.textContent = '共 ' + total + ' 张压疮分期图';

    if (pageImages.length === 0) {
      $galleryImageGrid.innerHTML = '<div class="library-empty-full"><div class="library-empty-full__icon">&#128270;</div><div class="library-empty-full__text">未找到匹配的压疮分期图</div></div>';
      $galleryPagination.innerHTML = '';
      return;
    }

    var html = '';
    pageImages.forEach(function(img){
      var activeClass = isFavorited(img.id) ? ' library-image-card__fav-btn--active' : '';
      var favIcon = isFavorited(img.id) ? '★' : '☆';
      html += '<div class="library-image-card" data-image-id="' + (img.id || '') + '">';
      /* 【新增】优先加载库内存储的压疮图片，图片路径为空/加载失败自动降级为文字展示 */
      var imgSrc = img.imgDataUrl || img.imgUrl || '';
      var imgHtml = imgSrc ? '<img src="' + imgSrc + '" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:12px;opacity:0.85;">' : '';

      html += '<div class="library-image-card__preview library-image-card__preview--' + (img.stageKey||'') + '">';
      html += imgHtml;
      html += '<span style="position:relative;z-index:1;color:#fff;opacity:0.8;">' + (stageShortLabels[img.stageKey]||'') + '</span>';
      html += '<button class="library-image-card__fav-btn' + activeClass + '" data-action="fav" data-img-id="' + (img.id||'') + '" data-stage="' + img.stageKey + '" data-desc="' + escapeAttr(img.imageDesc||'') + '">' + favIcon + '</button>';
      html += '</div>';
      html += '<div class="library-image-card__info">';
      html += '<div class="library-image-card__stage">' + (stageShortLabels[img.stageKey]||img.stageKey) + '</div>';
      html += '<div class="library-image-card__desc">' + (img.imageDesc||'压疮分期图') + '</div>';
      html += '</div></div>';
    });
    $galleryImageGrid.innerHTML = html;

    /* 绑定卡片点击 → 弹出详情 */
    $galleryImageGrid.querySelectorAll('.library-image-card').forEach(function(card){
      card.addEventListener('click', function(e){
        if (e.target.closest('[data-action="fav"]')) return; /* 收藏按钮单独处理 */
        var imgId = card.getAttribute('data-image-id');
        var img = Storage.findOne('pressureSoreLibrary', imgId);
        if (img) showStageDetail(img);
      });
    });

    /* 绑定收藏按钮 */
    $galleryImageGrid.querySelectorAll('[data-action="fav"]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var imgId = btn.getAttribute('data-img-id');
        var sk = btn.getAttribute('data-stage');
        var desc = btn.getAttribute('data-desc');
        var data = { id:imgId, stageKey:sk, imageDesc:unescapeAttr(desc) };
        toggleFav(data);
        renderGalleryGrid();
      });
    });

    /* 分页 */
    renderPagination($galleryPagination, state.galleryPage, totalPages, function(page){
      state.galleryPage = page;
      renderGalleryGrid();
    });
  }

  function openGallery() {
    state.galleryFilterStage = 'all';
    state.gallerySearchText = '';
    state.galleryPage = 1;
    if ($gallerySearchInput) $gallerySearchInput.value = '';
    renderGallerySidebar();
    renderGalleryGrid();
    showGallery();
  }

  // ==================== ③ 个人收藏 ====================

  function renderFavorites() {
    var favs = loadFavorites();
    /* 按保存时间倒序 */
    favs.sort(function(a,b){ return a.savedAt < b.savedAt ? 1 : -1; });

    /* 分期筛选 */
    if (state.favFilterStage !== 'all') {
      favs = favs.filter(function(f){ return f.stageKey === state.favFilterStage; });
    }

    var total = favs.length;
    var totalPages = Math.ceil(total / PER_PAGE);
    if (state.favPage > totalPages) state.favPage = Math.max(1, totalPages);
    var start = (state.favPage - 1) * PER_PAGE;
    var pageFavs = favs.slice(start, start + PER_PAGE);

    $favResultCount.textContent = '共 ' + total + ' 张';

    if (pageFavs.length === 0) {
      $favImageGrid.innerHTML = '<div class="library-empty-full"><div class="library-empty-full__icon">&#11088;</div><div class="library-empty-full__text">' + (state.favFilterStage==='all'?'暂无收藏，请在教学图库中收藏压疮分期图':'该分期暂无收藏') + '</div></div>';
      $favPagination.innerHTML = '';
      return;
    }

    var html = '';
    pageFavs.forEach(function(f){
      var selectedClass = state.favBatchMode && state.favSelectedIds[f.id] ? ' library-image-card--selected' : '';
      html += '<div class="library-image-card' + selectedClass + '" data-fav-id="' + (f.id||'') + '" data-stage="' + f.stageKey + '">';
      /* 【新增】优先加载库内存储的压疮图片，图片路径为空/加载失败自动降级为文字展示 */
      var favImgSrc = f.imgDataUrl || f.imgUrl || '';
      /* 兼容旧收藏数据：若无 imgDataUrl 则从图库回查 */
      if (!favImgSrc && f.id) {
        var favRecord = Storage.findOne('pressureSoreLibrary', f.id);
        if (favRecord) favImgSrc = favRecord.imgDataUrl || favRecord.imgUrl || '';
      }
      var favImgHtml = favImgSrc ? '<img src="' + favImgSrc + '" onerror="this.style.display=\'none\'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:12px;opacity:0.85;">' : '';

      html += '<div class="library-image-card__preview library-image-card__preview--' + (f.stageKey||'') + '">';
      html += favImgHtml;
      html += '<span style="position:relative;z-index:1;color:#fff;opacity:0.8;font-size:18px;">' + (stageShortLabels[f.stageKey]||'') + '</span>';
      html += '</div>';
      html += '<div class="library-image-card__info">';
      html += '<div class="library-image-card__stage">' + (stageShortLabels[f.stageKey]||f.stageKey) + '</div>';
      html += '<div class="library-image-card__desc">' + (f.imageDesc||'压疮分期图') + '</div>';
      html += '</div></div>';
    });
    $favImageGrid.innerHTML = html;

    /* 绑定点击 */
    $favImageGrid.querySelectorAll('.library-image-card').forEach(function(card){
      card.addEventListener('click', function(){
        if (state.favBatchMode) {
          /* 批量模式：切换选中 */
          var fid = card.getAttribute('data-fav-id');
          if (state.favSelectedIds[fid]) {
            delete state.favSelectedIds[fid];
          } else {
            state.favSelectedIds[fid] = true;
          }
          updateBatchBar();
          renderFavorites();
          return;
        }
        /* 普通模式：查看详情 */
        var fid = card.getAttribute('data-fav-id');
        var img = Storage.findOne('pressureSoreLibrary', fid);
        if (img) showStageDetail(img);
      });
    });

    renderPagination($favPagination, state.favPage, totalPages, function(page){
      state.favPage = page;
      renderFavorites();
    });
  }

  function openFavorites() {
    state.favFilterStage = 'all';
    state.favPage = 1;
    state.favBatchMode = false;
    state.favSelectedIds = {};
    if ($favStageFilter) $favStageFilter.value = 'all';
    $favBatchBar.classList.add('u-hidden');
    renderFavorites();
    showFavorites();
  }

  function updateBatchBar() {
    var count = Object.keys(state.favSelectedIds).length;
    $favBatchSelected.textContent = '已选 ' + count + ' 张';
    if (count > 0) {
      $favBatchBar.classList.remove('u-hidden');
    } else {
      $favBatchBar.classList.add('u-hidden');
    }
  }

  // ==================== ④ 错题题库 ====================

  /**
   * 聚合全部来源的错误分期
   * 来源1：trainRecord.wrongStageMatch
   * 来源2：examRecord（answeredWrong > 0 的记录）
   * 来源3：pu_game_mistakes
   * @returns {Array} [{ stageKey, source, desc, imageId, count }]
   */
  function aggregateAllMistakes() {
    var result = [];
    var seen = {};

    /* 练习记录 */
    var trainRecords = Storage.findAll('trainRecord');
    trainRecords.forEach(function(r){
      if (!r.wrongStageMatch) return;
      r.wrongStageMatch.forEach(function(w){
        var key = 'practice_' + w.selected;
        if (!seen[key]) { seen[key] = true; result.push({ stageKey:w.selected, source:'practice', count:0 }); }
      });
    });

    /* 考试记录 */
    var examRecords = Storage.findAll('examRecord');
    examRecords.forEach(function(r){
      if (r.answeredWrong <= 0) return;
      /* 考试记录没有 per-stage 详情，取对应 examRecord 的 setIndex 关联 */
      var key = 'exam_set' + r.setIndex;
      if (!seen[key]) { seen[key] = true; result.push({ stageKey:'unknown', source:'exam', count:r.answeredWrong, examDate:r.examDate, setIndex:r.setIndex }); }
    });

    /* pu_game_mistakes */
    var mistakes = loadMistakes();
    mistakes.forEach(function(m){
      var source = m.source || 'practice';
      result.push({ stageKey:m.stageKey, source:source, imageId:m.id, desc:'压疮分期图', savedAt:m.savedAt });
    });

    return result;
  }

  /** 从图库中按 stageKey 查找对应的图片描述 */
  function findImageDescByStage(sk) {
    var imgs = Storage.getImagesByStage(sk);
    return imgs.length > 0 ? imgs[0].imageDesc : '压疮分期图';
  }

  function renderMistakes() {
    var mistakes = aggregateAllMistakes();

    /* 来源筛选 */
    if (state.mistakeFilterSource !== 'all') {
      mistakes = mistakes.filter(function(m){ return m.source === state.mistakeFilterSource; });
    }

    /* 分期筛选 */
    if (state.mistakeFilterStage !== 'all') {
      mistakes = mistakes.filter(function(m){ return m.stageKey === state.mistakeFilterStage; });
    }

    /* 统计 */
    var allMistakes = aggregateAllMistakes();
    var practiceCount = allMistakes.filter(function(m){return m.source==='practice'}).length;
    var examCount     = allMistakes.filter(function(m){return m.source==='exam'}).length;
    var matchCount    = allMistakes.filter(function(m){return m.source==='match'}).length;

    document.getElementById('mistakeStatTotal').textContent = allMistakes.length;
    document.getElementById('mistakeStatPractice').textContent = practiceCount;
    document.getElementById('mistakeStatExam').textContent = examCount;
    document.getElementById('mistakeStatMatch').textContent = matchCount;

    $mistakeResultCount.textContent = '共 ' + mistakes.length + ' 条';

    /* 去重（按 stageKey+source） */
    var uniqueMap = {};
    mistakes.forEach(function(m){
      var uk = m.stageKey + '|' + m.source;
      if (!uniqueMap[uk]) {
        uniqueMap[uk] = { stageKey:m.stageKey, source:m.source, count:1, imageId:m.imageId, examDate:m.examDate, setIndex:m.setIndex, desc:m.desc };
      } else {
        uniqueMap[uk].count++;
      }
    });

    var uniqueList = Object.keys(uniqueMap).map(function(k){ return uniqueMap[k]; });

    if (uniqueList.length === 0) {
      $mistakesList.innerHTML = '<div class="empty-state" style="padding:40px;"><div class="empty-state__icon">&#128221;</div><div class="empty-state__desc" style="color:rgba(255,255,255,0.45);">暂无混淆分期记录，继续加油！</div></div>';
      return;
    }

    var html = '';
    uniqueList.forEach(function(m){
      var color = stageColors[m.stageKey] || '#999';
      var label = stageShortLabels[m.stageKey] || m.stageKey;
      var sourceLabels = { practice:'练习', exam:'考试', match:'比赛' };
      var sourceLabel = sourceLabels[m.source] || m.source;
      var sourceClass = 'library-mistake-item__source--' + m.source;

      html += '<div class="library-mistake-item">';
      html += '<div class="library-mistake-item__stage-dot" style="background:' + color + ';">' + label.charAt(0) + '</div>';
      html += '<div class="library-mistake-item__info">';
      html += '<div class="library-mistake-item__stage">' + label + '</div>';
      html += '<div class="library-mistake-item__desc">混淆次数: ' + m.count + ' 次 | ' + findImageDescByStage(m.stageKey).substring(0,20) + '...</div>';
      html += '</div>';
      html += '<div class="library-mistake-item__meta">';
      html += '<span class="library-mistake-item__source ' + sourceClass + '">' + sourceLabel + '</span>';
      html += '<div class="library-mistake-item__count">' + m.count + ' 次</div>';
      html += '</div></div>';
    });

    $mistakesList.innerHTML = html;
  }

  function openMistakes() {
    state.mistakeFilterSource = 'all';
    state.mistakeFilterStage = 'all';
    if ($mistakeSourceFilter) $mistakeSourceFilter.value = 'all';
    if ($mistakeStageFilter) $mistakeStageFilter.value = 'all';

    /* 初始化分期筛选下拉 */
    if ($mistakeStageFilter) {
      $mistakeStageFilter.innerHTML = '<option value="all">全部分期</option>';
      stageOrder.forEach(function(sk){
        $mistakeStageFilter.innerHTML += '<option value="' + sk + '">' + (stageShortLabels[sk]||sk) + '</option>';
      });
    }

    renderMistakes();
    showMistakes();
  }

  // ==================== ⑤ 分期详情弹窗 ====================

  function showStageDetail(imageData) {
    if (!imageData) return;
    state.currentDetailImage = imageData;

    var sk = imageData.stageKey;
    var detail = STAGE_DETAIL[sk];
    var stageInfo = AppConfig.STAGE;
    var stageLabel = stageShortLabels[sk] || sk;
    var stageName = '';

    Object.keys(stageInfo).forEach(function(k){
      if (stageInfo[k].key === sk) stageName = stageInfo[k].label;
    });

    $libraryDetailTitle.textContent = stageName + ' — ' + (detail ? detail.name : '');

    var html = '';

    /* 压疮创面描述 */
    if (imageData.imageDesc) {
      html += '<div class="library-detail__section">';
      html += '<div class="library-detail__section-title">压疮创面描述</div>';
      html += '<p>' + imageData.imageDesc + '</p>';
      html += '</div>';
    }

    if (detail) {
      /* 判定标准 */
      html += '<div class="library-detail__section">';
      html += '<div class="library-detail__section-title">判定标准</div>';
      html += '<p>' + detail.criteria + '</p>';
      html += '</div>';

      /* 鉴别要点 */
      html += '<div class="library-detail__section">';
      html += '<div class="library-detail__section-title">鉴别要点</div>';
      html += '<ul>';
      detail.identification.forEach(function(item){ html += '<li>' + item + '</li>'; });
      html += '</ul></div>';

      /* 护理措施 */
      html += '<div class="library-detail__section">';
      html += '<div class="library-detail__section-title">护理措施</div>';
      html += '<ul>';
      detail.care.forEach(function(item){ html += '<li>' + item + '</li>'; });
      html += '</ul></div>';
    }

    $libraryDetailBody.innerHTML = html;

    /* 收藏按钮文字 */
    var $btnFav = document.getElementById('btnLibraryFav');
    if ($btnFav) {
      $btnFav.textContent = isFavorited(imageData.id) ? '取消收藏此压疮分期图' : '收藏此压疮分期图';
    }

    $libraryDetailModal.classList.remove('u-hidden');
  }

  function closeDetailModal() {
    $libraryDetailModal.classList.add('u-hidden');
    state.currentDetailImage = null;
  }

  function onDetailFavClick() {
    if (!state.currentDetailImage) return;
    toggleFav(state.currentDetailImage);

    /* 更新按钮 */
    var $btnFav = document.getElementById('btnLibraryFav');
    if ($btnFav) {
      $btnFav.textContent = isFavorited(state.currentDetailImage.id) ? '取消收藏此压疮分期图' : '收藏此压疮分期图';
    }
  }

  // ==================== ⑥ 专项练习生成 ====================

  function showPracticeGenModal() {
    var mistakes = aggregateAllMistakes();

    /* 应用当前筛选 */
    if (state.mistakeFilterSource !== 'all') {
      mistakes = mistakes.filter(function(m){ return m.source === state.mistakeFilterSource; });
    }
    if (state.mistakeFilterStage !== 'all') {
      mistakes = mistakes.filter(function(m){ return m.stageKey === state.mistakeFilterStage; });
    }

    /* 提取唯一分期 */
    var stageSet = {};
    mistakes.forEach(function(m){
      if (m.stageKey && m.stageKey !== 'unknown') stageSet[m.stageKey] = true;
    });
    var uniqueStages = Object.keys(stageSet);

    if (uniqueStages.length === 0) {
      toast('当前筛选无混淆分期数据', 'warning');
      return;
    }

    var html = '<div class="library-practice-gen__icon">&#127922;</div>';
    html += '<p style="font-size:15px;color:#2C1A20;margin-bottom:12px;">基于当前混淆分期生成专项练习</p>';
    html += '<p style="font-size:13px;color:#7A6A72;">涉及分期：</p>';
    html += '<div style="margin:8px 0;">';
    uniqueStages.forEach(function(sk){
      html += '<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;background:#FFF8E1;color:#5A1B28;margin:2px 4px;border:1px solid #F5D78C;">' + (stageShortLabels[sk]||sk) + '</span>';
    });
    html += '</div>';
    html += '<p style="font-size:12px;color:#A8989E;">将生成包含以上混淆分期的专项练习，聚焦薄弱环节</p>';

    $libraryPracGenBody.innerHTML = html;
    $libraryPracticeGenModal.classList.remove('u-hidden');
  }

  function closePracticeGenModal() {
    $libraryPracticeGenModal.classList.add('u-hidden');
  }

  /**
   * 确认生成专项练习 → 跳转练习模块
   * 将当前筛选的混淆分期作为重点分布传入
   */
  function confirmGeneratePractice() {
    var mistakes = aggregateAllMistakes();
    if (state.mistakeFilterSource !== 'all') {
      mistakes = mistakes.filter(function(m){ return m.source === state.mistakeFilterSource; });
    }
    if (state.mistakeFilterStage !== 'all') {
      mistakes = mistakes.filter(function(m){ return m.stageKey === state.mistakeFilterStage; });
    }

    var stageSet = {};
    mistakes.forEach(function(m){ if(m.stageKey !== 'unknown') stageSet[m.stageKey] = true; });
    var uniqueStages = Object.keys(stageSet);

    if (uniqueStages.length === 0) { toast('无可用分期', 'warning'); return; }

    closePracticeGenModal();

    /* 切换到练习模块的体验版（作为基础），后续可在练习中手动选择难度 */
    if (global.Nav && global.Nav.navigateTo) {
      global.Nav.navigateTo('practice');
      toast('已跳转到练习模式，建议选择包含这些分期的难度进行针对性训练', 'success');
    } else {
      toast('专项练习功能需在完整系统中使用', 'info');
    }
  }

  // ==================== 分页组件 ====================

  function renderPagination($container, current, total, callback) {
    if (total <= 1) { $container.innerHTML = ''; return; }

    var html = '';
    html += '<button class="library-pagination__btn" ' + (current===1?'disabled':'') + ' data-page="' + (current-1) + '">上一页</button>';
    for (var p=1; p<=total; p++) {
      if (p===1 || p===total || (p>=current-2 && p<=current+2)) {
        var activeClass = p===current ? ' library-pagination__btn--active' : '';
        html += '<button class="library-pagination__btn' + activeClass + '" data-page="' + p + '">' + p + '</button>';
      } else if (p===current-3 || p===current+3) {
        html += '<span style="color:rgba(255,255,255,0.4);padding:5px 2px;">...</span>';
      }
    }
    html += '<button class="library-pagination__btn" ' + (current===total?'disabled':'') + ' data-page="' + (current+1) + '">下一页</button>';

    $container.innerHTML = html;
    $container.querySelectorAll('[data-page]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if (btn.disabled) return;
        callback(parseInt(btn.getAttribute('data-page'),10));
      });
    });
  }

  // ==================== 属性转义 ====================

  function escapeAttr(text) { return (text||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function unescapeAttr(text) { return (text||'').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); }

  // ==================== Toast ====================

  function toast(msg, type) {
    if (global.Nav && global.Nav.showToast) { global.Nav.showToast(msg, type); }
    else { console.log('[' + (type||'info') + '] ' + msg); }
  }

  // ==================== 初始化 ====================

  function init() {
    /* 确保存储键存在 */
    if (!localStorage.getItem('pu_game_favorites')) localStorage.setItem('pu_game_favorites','[]');
    if (!localStorage.getItem('pu_game_mistakes')) localStorage.setItem('pu_game_mistakes','[]');

    /* 首页计数 */
    refreshHubCounts();

    /* ===== 首页卡片点击 ===== */
    document.getElementById('cardTeaching').addEventListener('click', openGallery);
    document.getElementById('cardFavorites').addEventListener('click', openFavorites);
    document.getElementById('cardMistakes').addEventListener('click', openMistakes);

    /* ===== 图库 ===== */
    document.getElementById('btnGalleryBack').addEventListener('click', function(){ refreshHubCounts(); showHub(); });
    $gallerySearchInput.addEventListener('input', Utils.debounce(function(){
      state.gallerySearchText = $gallerySearchInput.value;
      state.galleryPage = 1;
      renderGalleryGrid();
    }, 300));

    /* ===== 收藏 ===== */
    document.getElementById('btnFavBack').addEventListener('click', function(){ refreshHubCounts(); showHub(); });
    $favStageFilter.addEventListener('change', function(){
      state.favFilterStage = $favStageFilter.value;
      state.favPage = 1;
      renderFavorites();
    });
    document.getElementById('btnBatchSelect').addEventListener('click', function(){
      state.favBatchMode = !state.favBatchMode;
      state.favSelectedIds = {};
      $favBatchBar.classList.add('u-hidden');
      document.getElementById('btnBatchSelect').textContent = state.favBatchMode ? '退出批量' : '批量管理';
      renderFavorites();
    });
    document.getElementById('btnBatchCancel').addEventListener('click', function(){
      state.favBatchMode = false;
      state.favSelectedIds = {};
      $favBatchBar.classList.add('u-hidden');
      document.getElementById('btnBatchSelect').textContent = '批量管理';
      renderFavorites();
    });
    document.getElementById('btnBatchUnfav').addEventListener('click', function(){
      var ids = Object.keys(state.favSelectedIds);
      if (ids.length === 0) return;
      if (!confirm('确认取消 ' + ids.length + ' 张收藏吗？')) return;
      var favs = loadFavorites();
      var idSet = {};
      ids.forEach(function(id){ idSet[id]=true; });
      var remaining = favs.filter(function(f){ return !idSet[f.id]; });
      saveFavorites(remaining);
      toast('已取消 ' + ids.length + ' 张收藏', 'info');
      state.favBatchMode = false;
      state.favSelectedIds = {};
      $favBatchBar.classList.add('u-hidden');
      document.getElementById('btnBatchSelect').textContent = '批量管理';
      state.favPage = 1;
      renderFavorites();
    });

    /* ===== 错题 ===== */
    document.getElementById('btnMistakesBack').addEventListener('click', function(){ refreshHubCounts(); showHub(); });
    $mistakeSourceFilter.addEventListener('change', function(){
      state.mistakeFilterSource = $mistakeSourceFilter.value;
      renderMistakes();
    });
    $mistakeStageFilter.addEventListener('change', function(){
      state.mistakeFilterStage = $mistakeStageFilter.value;
      renderMistakes();
    });
    document.getElementById('btnGenPractice').addEventListener('click', showPracticeGenModal);

    /* ===== 分期详情弹窗 ===== */
    document.getElementById('libraryDetailClose').addEventListener('click', closeDetailModal);
    document.getElementById('libraryDetailClose2').addEventListener('click', closeDetailModal);
    $libraryDetailModal.addEventListener('click', function(e){ if(e.target===$libraryDetailModal) closeDetailModal(); });
    document.getElementById('btnLibraryFav').addEventListener('click', onDetailFavClick);

    /* ===== 专项练习弹窗 ===== */
    document.getElementById('libraryPracGenClose').addEventListener('click', closePracticeGenModal);
    document.getElementById('libraryPracGenClose2').addEventListener('click', closePracticeGenModal);
    $libraryPracticeGenModal.addEventListener('click', function(e){ if(e.target===$libraryPracticeGenModal) closePracticeGenModal(); });
    document.getElementById('btnLibraryConfirmPractice').addEventListener('click', confirmGeneratePractice);

    showHub();
    console.log('[library] 知识库模块初始化完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  /* ===== 导出 ===== */
  global.Library = { init: init, refreshHubCounts: refreshHubCounts };

})(window);
