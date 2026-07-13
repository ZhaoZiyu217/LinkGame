/**
 * charts.js — 原生 Canvas 图表渲染工具
 * 柱状图（Bar）、饼图（Pie），无第三方依赖
 * 版本：v1.0.0
 */

;(function (global) {
  'use strict';

  // ==================== 调色板 ====================

  var COLORS = [
    '#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#607D8B', '#9C27B0',
    '#E91E63', '#00BCD4', '#795548', '#3F51B5', '#FF5722', '#8BC34A',
  ];

  var PIE_BG = '#1A0A12';

  // ==================== 柱状图 ====================

  /**
   * 渲染柱状图
   * @param {string|Element} container - 目标容器或选择器
   * @param {Object}         opts
   *   - data:     [{ label, value, color? }]
   *   - title:    string
   *   - width:    number (默认 600)
   *   - height:   number (默认 320)
   *   - showValue: boolean (默认 true)
   */
  function renderBarChart(container, opts) {
    opts = opts || {};
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    var data  = opts.data || [];
    var title = opts.title || '';
    var W     = opts.width || 600;
    var H     = opts.height || 320;
    var pad   = { top: 40, right: 24, bottom: 60, left: 50 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    /* 创建 Canvas */
    var canvas = document.createElement('canvas');
    canvas.width  = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    /* 【文字颜色 #222222】柱状图白底适配 — 背景 */
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    ctx.fillRect(0, 0, W, H);

    /* 【文字颜色 #222222】标题 */
    if (title) {
      ctx.fillStyle = '#222222';
      ctx.font = '14px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 24);
    }

    if (data.length === 0) {
      ctx.fillStyle = '#999999';
      ctx.font = '13px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', W / 2, H / 2);
      el.innerHTML = '';
      el.appendChild(canvas);
      return;
    }

    /* 计算最大值 */
    var maxVal = 0;
    data.forEach(function (d) { if (d.value > maxVal) maxVal = d.value; });
    if (maxVal <= 0) maxVal = 1;

    var barCount = data.length;
    var barGap   = Math.min(20, plotW / (barCount * 2));
    var barW     = (plotW - barGap * (barCount + 1)) / barCount;
    if (barW < 8) barW = 8;

    /* 【文字颜色 #222222】网格线 */
    var ySteps = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (var i = 1; i <= ySteps; i++) {
      var y = pad.top + plotH - (plotH / ySteps) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();

      /* 【文字颜色 #222222】Y 轴标签 */
      var val = Math.round((maxVal / ySteps) * i);
      ctx.fillStyle = '#222222';
      ctx.font = '11px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, pad.left - 8, y + 4);
    }

    /* 绘制柱子 */
    data.forEach(function (d, idx) {
      var x = pad.left + barGap + idx * (barW + barGap);
      var barH = (d.value / maxVal) * plotH;
      var y = pad.top + plotH - barH;
      var color = d.color || COLORS[idx % COLORS.length];

      /* 柱体 */
      var grad = ctx.createLinearGradient(x, y, x, pad.top + plotH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, lightenColor(color, 0.3));
      ctx.fillStyle = grad;
      ctx.beginPath();
      roundRect(ctx, x, y, barW, barH, 4);
      ctx.fill();

      /* 【文字颜色 #222222】数值标签 */
      if (opts.showValue !== false) {
        ctx.fillStyle = '#222222';
        ctx.font = 'bold 11px "Microsoft YaHei","PingFang SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.value, x + barW / 2, y - 6);
      }

      /* 【文字颜色 #222222】X 轴标签 */
      ctx.fillStyle = '#222222';
      ctx.font = '11px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      var label = d.label || '';
      if (label.length > 5) label = label.substring(0, 4) + '..';
      ctx.fillText(label, x + barW / 2, pad.top + plotH + 18);
    });

    /* 【文字颜色 #222222】X 轴线 */
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    el.innerHTML = '';
    el.appendChild(canvas);
  }

  // ==================== 饼图 ====================

  /**
   * 渲染饼图
   * @param {string|Element} container
   * @param {Object}         opts
   *   - data:     [{ label, value, color? }]
   *   - title:    string
   *   - size:     number (半径，默认 140)
   *   - width:    number (默认 500)
   *   - height:   number (默认 340)
   *   - showLegend: boolean (默认 true)
   */
  function renderPieChart(container, opts) {
    opts = opts || {};
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    var data  = opts.data || [];
    var title = opts.title || '';
    var size  = opts.size || 140;
    var W     = opts.width || 500;
    var H     = opts.height || 340;
    var cx    = W / 2;
    var cy    = H / 2 + 10;

    var canvas = document.createElement('canvas');
    canvas.width  = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    /* 【文字颜色 #000000】饼图白底适配 — 背景 */
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    ctx.fillRect(0, 0, W, H);

    if (title) {
      /* 【文字颜色 #000000】标题 */
      ctx.fillStyle = '#000000';
      ctx.font = '14px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 24);
    }

    if (data.length === 0) {
      ctx.fillStyle = '#999999';
      ctx.font = '13px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', cx, cy);
      el.innerHTML = '';
      el.appendChild(canvas);
      return;
    }

    /* 计算总值 */
    var total = 0;
    data.forEach(function (d) { total += d.value; });
    if (total <= 0) total = 1;

    /* 绘制扇区 */
    var startAngle = -Math.PI / 2;
    data.forEach(function (d, idx) {
      var sliceAngle = (d.value / total) * Math.PI * 2;
      var color = d.color || COLORS[idx % COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, size, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      /* 边框 */
      ctx.strokeStyle = PIE_BG;
      ctx.lineWidth = 2;
      ctx.stroke();

      /* 【文字颜色 #000000】百分比标签（扇区内） */
      var pct = Math.round((d.value / total) * 100);
      if (pct >= 5) {
        var midAngle = startAngle + sliceAngle / 2;
        var tx = cx + Math.cos(midAngle) * size * 0.65;
        var ty = cy + Math.sin(midAngle) * size * 0.65;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px "Microsoft YaHei","PingFang SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pct + '%', tx, ty);
      }

      startAngle += sliceAngle;
    });

    /* 【文字颜色 #000000】图例 */
    if (opts.showLegend !== false) {
      var legendY = cy + size + 24;
      var legendX = 20;
      data.forEach(function (d, idx) {
        var color = d.color || COLORS[idx % COLORS.length];
        var x = legendX + (idx % 3) * 160;
        var y = legendY + Math.floor(idx / 3) * 22;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, 10, 10);

        ctx.fillStyle = '#000000';
        ctx.font = '11px "Microsoft YaHei","PingFang SC",sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        var legendLabel = (d.label || '') + ' (' + d.value + ')';
        if (legendLabel.length > 14) legendLabel = legendLabel.substring(0, 13) + '..';
        ctx.fillText(legendLabel, x + 14, y);
      });
    }

    el.innerHTML = '';
    el.appendChild(canvas);
  }

  // ==================== 水平条形图（排行用） ====================

  /**
   * 水平排行条形图
   * @param {string|Element} container
   * @param {Object} opts - { data: [{label,value,color?}], title, width, height }
   */
  function renderHBarChart(container, opts) {
    opts = opts || {};
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    var data  = opts.data || [];
    var title = opts.title || '';
    var W     = opts.width || 500;
    var H     = opts.height || 280;
    var pad   = { top: 36, right: 16, bottom: 8, left: 90 };
    var plotW = W - pad.left - pad.right;
    var barH  = 28;
    var gap   = 8;

    var canvas = document.createElement('canvas');
    canvas.width  = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 0, W, H);

    if (title) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '14px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 22);
    }

    if (data.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '13px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无排行数据', W / 2, H / 2);
      el.innerHTML = '';
      el.appendChild(canvas);
      return;
    }

    var maxVal = 0;
    data.forEach(function (d) { if (d.value > maxVal) maxVal = d.value; });
    if (maxVal <= 0) maxVal = 1;

    data.forEach(function (d, idx) {
      var y = pad.top + idx * (barH + gap);
      var color = d.color || COLORS[idx % COLORS.length];

      /* 标签 */
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label || '', pad.left - 8, y + barH / 2);

      /* 背景条 */
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      roundRect(ctx, pad.left, y, plotW, barH, 3);
      ctx.fill();

      /* 数值条 */
      var fillW = (d.value / maxVal) * plotW;
      var grad = ctx.createLinearGradient(pad.left, 0, pad.left + fillW, 0);
      grad.addColorStop(0, color);
      grad.addColorStop(1, lightenColor(color, 0.4));
      ctx.fillStyle = grad;
      ctx.beginPath();
      roundRect(ctx, pad.left, y, fillW, barH, 3);
      ctx.fill();

      /* 数值 */
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.value, pad.left + fillW + 6, y + barH / 2);
    });

    el.innerHTML = '';
    el.appendChild(canvas);
  }

  // ==================== 辅助函数 ====================

  /** 绘制圆角矩形 */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /** 颜色变亮 */
  function lightenColor(hex, factor) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.floor(r + (255 - r) * factor));
    g = Math.min(255, Math.floor(g + (255 - g) * factor));
    b = Math.min(255, Math.floor(b + (255 - b) * factor));
    return '#' + [r, g, b].map(function (c) {
      return ('0' + c.toString(16)).slice(-2);
    }).join('');
  }

  // ==================== 导出 ====================

  global.Charts = {
    bar:    renderBarChart,
    pie:    renderPieChart,
    hbar:   renderHBarChart,
    COLORS: COLORS,
  };

})(window);
