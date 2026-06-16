/**
 * 反面海报SVG渲染服务
 * v8 — 图片统一+微圆角+窄边框、文字居中、商户贴底
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../../data/uploads');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 混合颜色与白色，ratio=0 保持原色，ratio=1 纯白
function lightenColor(hex, ratio) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.round(parseInt(m[1], 16) + (255 - parseInt(m[1], 16)) * ratio);
  const g = Math.round(parseInt(m[2], 16) + (255 - parseInt(m[2], 16)) * ratio);
  const b = Math.round(parseInt(m[3], 16) + (255 - parseInt(m[3], 16)) * ratio);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function darkenColor(hex, ratio) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.round(parseInt(m[1], 16) * (1 - ratio));
  const g = Math.round(parseInt(m[2], 16) * (1 - ratio));
  const b = Math.round(parseInt(m[3], 16) * (1 - ratio));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function tokenize(line) {
  const parts = line.split(/(\d+[\.\d]*)/g);
  return parts.filter(p => p.length > 0).map(p => ({ text: p, isPrice: /^\d+[\.\d]*$/.test(p) }));
}

function wrapLines(text, maxChars) {
  maxChars = Math.max(1, Math.floor(maxChars) || 1);
  if (!text || text.length <= maxChars) return [text || ''];
  const lines = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      lines.push(remaining);
      break;
    }
    // 在maxChars范围内找断点
    let breakAt = maxChars;
    const slice = remaining.slice(0, maxChars + 1);
    // 优先在标点后断开
    const punctIdx = Math.max(
      slice.lastIndexOf('，'), slice.lastIndexOf('。'), slice.lastIndexOf('、'),
      slice.lastIndexOf('；'), slice.lastIndexOf('：'), slice.lastIndexOf('！'),
      slice.lastIndexOf('？'), slice.lastIndexOf(','), slice.lastIndexOf('.'),
      slice.lastIndexOf(' '), slice.lastIndexOf('元'), slice.lastIndexOf('折'),
    );
    if (punctIdx >= Math.floor(maxChars * 0.4)) {
      breakAt = punctIdx + 1;
    } else {
      // 价格保护：数字+单位（折/元/万等）不分离
      const units = '折元万千百角分零整';
      const nextChar = remaining[breakAt];
      // 断点在数字上 → 看前面是否有价格单位，有则断在单位后，无则断在数字前
      if (nextChar && /\d/.test(nextChar)) {
        const prevChar = remaining[breakAt - 1];
        if (prevChar && units.includes(prevChar)) {
          breakAt = breakAt; // 断在数字前（单位在上一行末尾）
        } else {
          for (let i = breakAt - 1; i >= Math.floor(maxChars * 0.3); i--) {
            if (!/\d/.test(remaining[i])) { breakAt = i + 1; break; }
          }
        }
      }
      // 断点在价格单位上 → 保护断在数字前
      else if (nextChar && units.includes(nextChar)) {
        for (let i = breakAt - 1; i >= 0; i--) {
          if (!/\d/.test(remaining[i])) { breakAt = i + 1; break; }
          if (i === 0) breakAt = 0;
        }
        if (breakAt < Math.floor(maxChars * 0.3)) breakAt = maxChars;
      }
    }
    lines.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt);
  }
  return lines.length ? lines : [''];
}

function buildTextLine(tokens, x, y, fontSizeText, fontSizePrice) {
  const hasMixed = tokens.some(t => t.isPrice) && tokens.some(t => !t.isPrice);
  const font = `font-family="'Noto Serif SC','Source Han Serif SC','STSong','SimSun','FangSong',serif"`;
  if (!hasMixed) {
    const isPrice = tokens.every(t => t.isPrice);
    const fs = isPrice ? fontSizePrice : fontSizeText;
    const color = isPrice ? '#FFB800' : '#E8E8E8';
    const bold = isPrice ? ' font-weight="700"' : '';
    return `<text x="${x}" y="${y}" ${font} font-size="${fs}px" fill="${color}" text-anchor="middle"${bold}>${esc(tokens.map(t => t.text).join(''))}</text>`;
  }
  const tspans = tokens.map(t => {
    const fs = t.isPrice ? fontSizePrice : fontSizeText;
    return `<tspan ${font} font-size="${fs}px" fill="${t.isPrice ? '#FFB800' : '#E8E8E8'}"${t.isPrice ? ' font-weight="700"' : ''}>${esc(t.text)}</tspan>`;
  }).join('');
  return `<text x="${x}" y="${y}" ${font} text-anchor="middle">${tspans}</text>`;
}

function buildTextLineWhite(tokens, x, y, fontSizeText, fontSizePrice, primaryColor) {
  const hasMixed = tokens.some(t => t.isPrice) && tokens.some(t => !t.isPrice);
  const font = `font-family="'Noto Serif SC','Source Han Serif SC','STSong','SimSun','FangSong',serif"`;
  const accentColor = primaryColor || '#FFD700';
  const priceColor = lightenColor(accentColor, 0.3);

  if (!hasMixed) {
    const isPrice = tokens.every(t => t.isPrice);
    const fs = isPrice ? fontSizePrice : fontSizeText;
    const color = isPrice ? priceColor : '#FFFFFF';
    const text = tokens.map(t => t.text).join('');
    const segments = splitProductSegments(text, isPrice ? 'price' : 'normal');
    if (segments.length <= 1) {
      const bold = isPrice ? ' font-weight="700"' : '';
      return `<text x="${x}" y="${y}" ${font} font-size="${fs}px" fill="${color}" text-anchor="middle"${bold}>${esc(text)}</text>`;
    }
    return buildSegmentedLine(segments, x, y, fs, font, accentColor);
  }

  // 混合行：价格数字节日色加大加粗，dy偏移保持视觉垂直居中
  const baselineShift = Math.round((fontSizePrice - fontSizeText) * 0.4);
  const tspans = tokens.map(t => {
    const fs = t.isPrice ? fontSizePrice : fontSizeText;
    const fill = t.isPrice ? priceColor : '#FFFFFF';
    const dy = t.isPrice ? ` dy="${baselineShift}"` : '';
    return `<tspan ${font} font-size="${fs}px" fill="${fill}" font-weight="700"${dy}>${esc(t.text)}</tspan>`;
  }).join('');
  return `<text x="${x}" y="${y}" ${font} text-anchor="middle">${tspans}</text>`;
}

// 商品名关键词
const PRODUCT_PATTERNS = [
  /黄金/g, /铂金/g, /白银/g, /钻石/g, /翡翠/g, /玉石/g, /珍珠/g,
  /珠宝/g, /金饰/g, /银饰/g, /手链/g, /手镯/g, /项链/g, /戒指/g,
  /吊坠/g, /耳环/g, /耳钉/g, /胸针/g, /摆件/g, /金条/g, /金币/g,
  /全场/g, /足金/g, /古法金/g, /硬金/g, /K金/g,
  /绯红/g, /玫瑰金/g, /彩金/g,
];

/**
 * 将文本拆分成普通段和商品名段
 * type: 'normal' | 'price'
 */
function splitProductSegments(text, type) {
  if (!text) return [{ text: '', type, isProduct: false }];
  // 找出所有商品名的位置
  const matches = [];
  for (const pat of PRODUCT_PATTERNS) {
    const re = new RegExp(pat.source, 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, name: m[0] });
    }
  }
  // 按位置排序，去重
  matches.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const m of matches) {
    if (merged.length > 0 && m.start <= merged[merged.length - 1].end) {
      const last = merged[merged.length - 1];
      last.end = Math.max(last.end, m.end);
    } else {
      merged.push({ ...m });
    }
  }
  if (merged.length === 0) return [{ text, type, isProduct: false }];
  // 拆分
  const segments = [];
  let pos = 0;
  for (const m of merged) {
    if (m.start > pos) segments.push({ text: text.slice(pos, m.start), type, isProduct: false });
    segments.push({ text: text.slice(m.start, m.end), type: 'product', isProduct: true });
    pos = m.end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), type, isProduct: false });
  return segments;
}

/**
 * 估算文字宽度（SVG无浏览器环境，按字符类型估算）
 */
function estimateWidth(text, fontSize) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code > 0x4e00 && code < 0x9fff) {
      w += fontSize * 0.95; // 中文字符
    } else if (/\d/.test(ch)) {
      w += fontSize * 0.58; // 数字
    } else {
      w += fontSize * 0.5; // 其他
    }
  }
  return w;
}

/**
 * 渲染带商品名高亮的分段行
 * 价格数字与两侧文字之间增加额外间距
 */
function buildSegmentedLine(segments, centerX, y, defaultFontSize, fontAttr, accentColor) {
  const _accent = accentColor || '#FFD700';
  const priceGap = 0.3;
  const tspans = segments.map((seg, i) => {
    const fs = seg.fontSize || defaultFontSize;
    const fill = seg.type === 'price' ? _accent : '#FFFFFF';
    const needGap = i > 0 && segments[i - 1].type !== seg.type;
    const dx = needGap ? ` dx="${Math.round(priceGap * fs)}"` : '';
    return `<tspan ${fontAttr} font-size="${fs}px" fill="${fill}"${dx}>${esc(seg.text)}</tspan>`;
  }).join('\n');
  return `<text x="${centerX}" y="${y}" ${fontAttr} text-anchor="middle">${tspans}</text>`;
}


/**
 * 渲染带突出关键词的行（橙色加粗高亮）
 */
function buildHighlightLine(line, highlight, x, y, fontSizeText, fontSizePrice, primaryColor) {
  if (!highlight) return null;
  const font = `font-family="'Noto Serif SC','Source Han Serif SC','STSong','SimSun','FangSong',serif"`;
  const accentColor = primaryColor || '#FFD700';
  const priceColor = lightenColor(accentColor, 0.3);
  let tspans = '';
  let remaining = line;
  let found = false;

  while (remaining.length > 0) {
    const idx = remaining.indexOf(highlight);
    if (idx === -1) break;
    found = true;

    // 高亮前面的文字（正常渲染，含价格数字）
    const before = remaining.slice(0, idx);
    if (before) {
      const toks = tokenize(before);
      toks.forEach(t => {
        const fs = t.isPrice ? fontSizePrice : fontSizeText;
        tspans += `<tspan ${font} font-size="${fs}px" fill="${t.isPrice ? priceColor : '#FFFFFF'}"${t.isPrice ? ' font-weight="700"' : ''}>${esc(t.text)}</tspan>`;
      });
    }

    // 高亮关键词 — 使用 primaryColor
    tspans += `<tspan ${font} font-size="${fontSizePrice}px" fill="${priceColor}" font-weight="700">${esc(highlight)}</tspan>`;

    remaining = remaining.slice(idx + highlight.length);
  }

  if (!found) return null;

  // 高亮后面的剩余文字
  if (remaining) {
    const toks = tokenize(remaining);
    toks.forEach(t => {
      const fs = t.isPrice ? fontSizePrice : fontSizeText;
      tspans += `<tspan ${font} font-size="${fs}px" fill="${t.isPrice ? priceColor : '#FFFFFF'}"${t.isPrice ? ' font-weight="700"' : ''}>${esc(t.text)}</tspan>`;
    });
  }

  return `<text x="${x}" y="${y}" text-anchor="middle">${tspans}</text>`;
}


// ===== 布局计算 =====
function computeLayout(activities, W, H) {
  const n = activities.length;
  if (n === 0) return null;

  // 分离三类：纯文字、单图、多图
  const textOnly = [];
  const singleImg = [];
  const multiImg = [];
  for (const act of activities) {
    if (!act.imageUrls || act.imageUrls.length === 0) {
      textOnly.push(act);
    } else if (act.imageUrls.length >= 2) {
      multiImg.push(act);
    } else {
      singleImg.push(act);
    }
  }
  // 排序与行模式对齐：单图 → 多图 → 纯文字（带图的放上面，纯文字放最下面）
  const ordered = [...singleImg, ...multiImg, ...textOnly];
  // 带图活动 ≥5 时，所有单图强制转 LR 模式，图片缩小为 3/4
  const forceSingleLr = (singleImg.length + multiImg.length) >= 5;

  // 构建行模式：单图默认最多2列，多图独占一行[1]，纯文字[1]
  const rowPattern = [];
  if (forceSingleLr) {
    singleImg.forEach(() => rowPattern.push(1));
  } else {
    let rem = singleImg.length;
    while (rem > 0) {
      rowPattern.push(Math.min(2, rem));
      rem -= 2;
    }
  }
  multiImg.forEach(() => rowPattern.push(1));
  textOnly.forEach(() => rowPattern.push(1));

  const rows = rowPattern.length;
  const sidePad = Math.round(W * 0.0375);
  const colGap = Math.round(W * 0.0015);
  const rowGap = Math.round(H * 0.0075);
  const minModuleH = Math.round(H * 0.10);

  const midZoneTop = Math.round(H * 0.05);
  const midZoneBottom = Math.round(H * 0.85);
  const midZoneH = midZoneBottom - midZoneTop;

  const M = [];
  let gIdx = 0;
  const rowHs = [];

  // — 第一遍：计算每个模块尺寸 —
  for (let r = 0; r < rows; r++) {
    const cols = rowPattern[r];
    const totalGap = (cols - 1) * colGap;
    const mw = Math.floor((W - sidePad * 2 - totalGap) / cols);
    const isFull = cols === 1;

    const rowModules = [];
    for (let c = 0; c < cols; c++) {
      const act = ordered[gIdx];
      const hasImg = act.imageUrls && act.imageUrls.length > 0;
      const maxImgs = isFull ? 2 : 1;
      const imgCount = hasImg ? Math.min(act.imageUrls.length, maxImgs) : 0;
      const textLen = (act.discountDetail || act.content || '').length;
      const longText = textLen > 12;
      const isSingleImg = hasImg && imgCount === 1;
      const layout = hasImg
        ? ((forceSingleLr && isSingleImg) || (cols === 1 && isSingleImg) || (imgCount <= 2 && (cols === 1 || imgCount === 2) && (longText || imgCount === 2))) ? 'lr' : 'tb'
        : 'lr';

      const singleColW = W - Math.round(W * 0.05) * 2;
      const fontSizeText = hasImg
        ? Math.max(44, Math.round(singleColW * 0.06))
        : Math.max(52, Math.round(mw * 0.065));
      const fontSizePrice = hasImg
        ? Math.max(56, Math.round(singleColW * 0.075))
        : Math.max(66, Math.round(mw * 0.08));
      const lineH = Math.round(fontSizeText * 1.6);

      let imgCardSize = 0, imgAreaTotalW = 0;
      let maxChars = 3, wrapped = [''], textBlockH = 0;
      const maxModuleH = hasImg ? Math.round(H * 0.45) : Math.round(H * 0.22);
      let moduleH = minModuleH;

      if (layout === 'tb') {
        // 上下布局：图片在上居中，文字在下居中
        const imgRatio = cols === 2 ? 0.75 : 0.55;
        imgCardSize = Math.round(mw * imgRatio * 0.9 * 0.75);
        imgAreaTotalW = imgCardSize;
        const textAreaW = Math.round(mw * 0.9);
        maxChars = Math.max(3, Math.floor(textAreaW / fontSizeText));
        const text = act.discountDetail || act.content || '';
        wrapped = wrapLines(text, maxChars);
        console.log(`[TB] text="${text}", maxChars=${maxChars}, wrapped=${JSON.stringify(wrapped)}, cols=${cols}`);
        textBlockH = (wrapped.length - 1) * lineH + fontSizeText;
        const topPad = Math.round(H * 0.003);
        const frameBw = Math.max(3, Math.round(imgCardSize * 0.012));
        const ascent = Math.round(fontSizeText * 0.7);
        const gap = Math.round(H * 0.018);
        const bottomPad = Math.round(H * 0.01);
        moduleH = Math.min(Math.max(topPad + imgCardSize + frameBw + ascent + gap + textBlockH + bottomPad, minModuleH), maxModuleH);
      } else {
        // 左右布局：文字左，图片右（或纯文字居中）
        if (hasImg) {
          imgCardSize = Math.round(mw * 0.36 * 0.9 * 0.75);
          if (forceSingleLr && isSingleImg) imgCardSize = Math.round(imgCardSize * 0.75);
          imgAreaTotalW = imgCardSize * imgCount + (imgCount - 1) * Math.round(W * 0.01);
        }
        const cardW = Math.round(mw * (hasImg ? 0.96 : 0.98));
        const padLeft  = hasImg ? Math.round(W * 0.035) : Math.round(W * 0.005);
        const padRight = padLeft;
        const imgPad   = Math.round(W * 0.05);
        const textAreaW = cardW - padLeft - padRight - (hasImg ? imgAreaTotalW + imgPad : 0);
        maxChars = Math.max(3, Math.floor(textAreaW / fontSizeText * 0.85));
        if (hasImg && isSingleImg) maxChars = Math.min(maxChars, 6);
        const text = act.discountDetail || act.content || '';
        wrapped = wrapLines(text, maxChars);
        console.log(`[LR] text="${text}", maxChars=${maxChars}, wrapped=${JSON.stringify(wrapped)}, hasImg=${hasImg}, isSingleImg=${isSingleImg}, cols=${cols}, layout=${layout}`);
        textBlockH = wrapped.length * lineH;
        const imgH = hasImg ? imgCardSize + Math.round(H * 0.02) : 0;
        const minH = hasImg ? minModuleH : Math.round(H * 0.07);
        moduleH = Math.min(Math.max(textBlockH + Math.round(W * 0.020), imgH, minH), maxModuleH);
      }

      rowModules.push({
        gIdx, act, hasImg, layout,
        imgCardSize, imgAreaTotalW, imgCount,
        maxChars, wrapped,
        fontSizeText, fontSizePrice, lineH,
        textBlockH, moduleH,
        isFull, cols, moduleW: mw,
      });
      gIdx++;
    }

    const rowH = Math.max(...rowModules.map(m => m.moduleH));
    rowModules.forEach(m => { m.rowH = rowH; });
    rowHs.push(rowH);
    M.push(...rowModules);
  }

  // 溢出处理：内容超出视图时，缩小单列带图模块的图片
  let totalGridH = rowHs.reduce((s, h) => s + h, 0) + (rows - 1) * rowGap;
  if (totalGridH > midZoneH) {
    const overflowModules = M.filter(m => m.hasImg && m.layout === 'lr');
    if (overflowModules.length > 0) {
      const scale = midZoneH / totalGridH;
      for (const md of overflowModules) {
        md.imgCardSize = Math.max(80, Math.round(md.imgCardSize * scale));
        md.imgAreaTotalW = md.imgCardSize * md.imgCount + (md.imgCount - 1) * Math.round(W * 0.01);
        const cardMargin = Math.round(md.moduleW * 0.02);
        const cardW = md.moduleW - cardMargin * 2;
        const padLeft = Math.round(W * 0.035);
        const imgPad = Math.round(W * 0.05);
        const textAreaW = Math.max(100, cardW - padLeft * 2 - md.imgAreaTotalW - imgPad);
        md.maxChars = Math.max(3, Math.floor(textAreaW / md.fontSizeText * 0.85));
        md.wrapped = wrapLines(md.act.discountDetail || md.act.content || '', md.maxChars);
        md.textBlockH = md.wrapped.length * md.lineH;
        const imgH = md.imgCardSize + Math.round(H * 0.02);
        md.moduleH = Math.max(md.textBlockH + Math.round(W * 0.020), imgH, minModuleH);
      }
      // 重算行高
      let gi = 0;
      for (let r = 0; r < rows; r++) {
        const rowMods = M.slice(gi, gi + rowPattern[r]);
        rowHs[r] = Math.max(...rowMods.map(m => m.moduleH));
        gi += rowPattern[r];
      }
      totalGridH = rowHs.reduce((s, h) => s + h, 0) + (rows - 1) * rowGap;
    }
  }

  // 多模块时均匀分配剩余空间；单模块按内容自适应，不撑满
  totalGridH = rowHs.reduce((s, h) => s + h, 0) + (rows - 1) * rowGap;
  const gridTop = midZoneTop;
  if (totalGridH < midZoneH && rows > 1) {
    const extra = midZoneH - totalGridH;
    const extraPerRow = Math.floor(extra / rows);
    let remainder = extra - extraPerRow * rows;
    for (let r = 0; r < rows; r++) {
      const add = extraPerRow + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      rowHs[r] += add;
    }
  }

  // — 第二遍：定位（全部左右布局） —
  gIdx = 0;
  let y = gridTop;
  for (let r = 0; r < rows; r++) {
    const cols = rowPattern[r];
    const totalGap = (cols - 1) * colGap;
    const mw = Math.floor((W - sidePad * 2 - totalGap) / cols);
    const gridLeft = Math.floor((W - (cols * mw + (cols - 1) * colGap)) / 2);
    let x = gridLeft;

    for (let c = 0; c < cols; c++) {
      const md = M[gIdx];
      md.x = x;
      md.y = y;
      md.moduleW = mw;
      md.rowH = rowHs[r];

      const cardMargin = Math.round(mw * (!md.hasImg ? 0.0075 : cols === 1 ? 0.015 : 0.01125));
      md.cardX = x + cardMargin;
      md.cardW = mw - cardMargin * 2;

      if (md.layout === 'tb') {
        // 上下布局：图片顶部居中，文字在剩余空间水平+垂直居中
        md.imgX = md.cardX + Math.floor((md.cardW - md.imgCardSize) / 2);
        md.imgY = y + Math.round(md.rowH * 0.05);
        md.textCenterX = md.cardX + Math.floor(md.cardW / 2);
        const ascent = Math.round(md.fontSizeText * 0.7);
        const frameBw = Math.max(3, Math.round(md.imgCardSize * 0.012));
        const imgBottom = md.imgY + md.imgCardSize + frameBw;
        const remaining = (y + md.rowH) - imgBottom;
        const textBlockH = (md.wrapped.length - 1) * md.lineH + md.fontSizeText;
        const textTop = imgBottom + Math.floor(Math.max(0, remaining - textBlockH) / 2);
        md.textY = textTop + ascent;
      } else {
        // 左右布局：文字左，图片右（或纯文字居中）
        const pL = Math.round(W * 0.020);
        const iP = Math.round(W * 0.025);
        const tW = md.cardW - pL * 2 - (md.hasImg ? md.imgAreaTotalW + iP : 0);
        md.textCenterX = md.hasImg
          ? md.cardX + pL + Math.floor(tW / 2)
          : md.cardX + Math.floor(md.cardW / 2);

        if (md.hasImg) {
          md.imgX = md.cardX + md.cardW - Math.round(md.cardW * 0.05) - md.imgAreaTotalW;
          const availH = md.rowH - Math.round(md.rowH * 0.10);
          md.imgY = y + Math.round(md.rowH * 0.05) + Math.floor((availH - md.imgCardSize) / 2);
        }
      }
      x += mw + colGap;
      gIdx++;
    }
    y += rowHs[r] + rowGap;
  }

  return { W, H, rowPattern, colGap, rowGap, sidePad, gridTop, rowHs, totalGridH, M, n, midZoneTop, midZoneBottom };
}

// ===== SVG =====
function buildBackSvg(layout, brand, merchantInfo, options = {}) {
  if (!layout) return '';
  const { W, H, M, sidePad, rowGap, rowHs, rowPattern } = layout;
  const { primaryColor, secondaryColor, bgColor } = options;
  const accentColor = primaryColor || '#FFD700';

  const fontFamily = `font-family="'Noto Serif SC','Source Han Serif SC','STSong','SimSun','FangSong',serif"`;

  console.log('[buildBackSvg] options.bgColor:', bgColor);
  console.log('[buildBackSvg] activities:', M.map(m => ({ actBgColor: m.act.bgColor, highlight: m.act.highlight, content: (m.act.discountDetail || m.act.content || '').slice(0, 30) })));

  const parts = [];
  parts.push(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`);

  // 计算所有活动模块的整体包围盒
  const padExtra = Math.round(W * 0.01125);
  const outerRadius = Math.round(W * 0.01125);

  if (M.length > 0) {
    let minX = Infinity, maxX = 0, minY = Infinity, maxY = 0;
    M.forEach(md => {
      minX = Math.min(minX, md.cardX);
      maxX = Math.max(maxX, md.cardX + md.cardW);
      minY = Math.min(minY, md.y);
      maxY = Math.max(maxY, md.y + md.rowH);
    });

    // 白色半透明大容器
    const maxAllowedY = Math.round(H * 0.97);
    const outerX = minX - padExtra;
    const outerY = minY - padExtra;
    const outerW = (maxX - minX) + padExtra * 2;
    const outerH = Math.min((maxY - minY) + padExtra * 2, maxAllowedY - outerY);
    if (outerH > 0) {
      parts.push(`<rect x="${outerX}" y="${outerY}" width="${outerW}" height="${outerH}" rx="${outerRadius}" fill="white" opacity="0.75"/>`);
    }
  }

  // 活动模块
  M.forEach((md) => {
    const { y: my, rowH: mh } = md;
    const bottomLimit = Math.round(H * 0.97);
    if (my >= bottomLimit) return;
    const clipH = Math.min(mh, bottomLimit - my);
    if (clipH <= 0) return;
    const radius = Math.round(W * 0.01);
    const strokeW = Math.round(W * 0.0015);

    // 模块背景：优先使用节日bgColor，混合白色变浅
    const rawBg = bgColor || md.act.bgColor || '#2a2a5a';
    const moduleBg = lightenColor(rawBg, 0.08);

    parts.push(`<rect x="${md.cardX}" y="${my}" width="${md.cardW}" height="${clipH}" rx="${radius}" fill="${moduleBg}" stroke="${accentColor}" stroke-opacity="0.50" stroke-width="${strokeW}"/>`);

    // 文字定位
    let ty;
    if (md.layout === 'tb') {
      ty = md.textY;
    } else {
      const visualHeight = (md.wrapped.length - 1) * md.lineH + md.fontSizeText;
      const visualTop = my + Math.floor(Math.max(0, mh - visualHeight) / 2);
      ty = visualTop + Math.round(md.fontSizeText * 0.85);
    }
    md.wrapped.forEach(wl => {
      if (ty + Math.round(md.fontSizeText * 0.3) > my + clipH - Math.round(H * 0.01)) return;
      if (md.act.highlight && wl.includes(md.act.highlight)) {
        // 高亮行：关键词白底+背景色文字，其余保持白色
        const hlKeyword = md.act.highlight;
        const hlFontSize = md.fontSizePrice;
        const hlColor = bgColor || '#1a1a3a';
        const fontAttr = `font-family="'Noto Serif SC','Source Han Serif SC','STSong','SimSun','FangSong',serif"`;
        // 计算各行段宽度
        const idx = wl.indexOf(hlKeyword);
        const beforeText = wl.slice(0, idx);
        const afterText = wl.slice(idx + hlKeyword.length);
        const beforeW = estimateWidth(beforeText, md.fontSizeText);
        const hlW = estimateWidth(hlKeyword, hlFontSize);
        const afterW = estimateWidth(afterText, md.fontSizeText);
        const padX = Math.round(hlFontSize * 0.3);
        const gap = padX * 3; // 底色框与两侧文字的间距（更大）
        const totalW = beforeW + (beforeText ? gap : 0) + hlW + (afterText ? gap : 0) + afterW;
        // 垂直居中：以普通文字视觉中心为基准，大号高亮文字的基线也要对齐到同一中心
        const normalVisualCenter = ty - md.fontSizeText * 0.45;
        const hlBaseline = Math.round(normalVisualCenter + hlFontSize * 0.45);
        // 高亮关键词居中定位
        const hlCenterX = md.textCenterX - Math.round(totalW / 2) + (beforeText ? beforeW + gap : 0) + Math.round(hlW / 2);
        const padY = Math.round(hlFontSize * 0.12);
        const hlBgX = hlCenterX - Math.round(hlW / 2) - padX;
        const hlBgY = Math.round(normalVisualCenter - hlFontSize * 0.55);
        const hlBgW = hlW + padX * 2;
        const hlBgH = Math.round(hlFontSize * 1.1);
        const hlR = Math.round(hlFontSize * 0.15);
        // 白底
        parts.push(`<rect x="${hlBgX}" y="${hlBgY}" width="${hlBgW}" height="${hlBgH}" rx="${hlR}" fill="white"/>`);
        // 三段文字：前段白色 + 关键词背景色 + 后段白色
        const beforeX = md.textCenterX - Math.round(totalW / 2) + Math.round(beforeW / 2);
        const afterX = hlCenterX + Math.round(hlW / 2) + gap + Math.round(afterW / 2);
        if (beforeText) {
          const toks = tokenize(beforeText);
          parts.push(buildTextLineWhite(toks, beforeX, ty, md.fontSizeText, md.fontSizePrice, accentColor) + '\n');
        }
        // 关键词（背景色）
        parts.push(`<text x="${hlCenterX}" y="${hlBaseline}" ${fontAttr} font-size="${hlFontSize}px" fill="${hlColor}" text-anchor="middle" font-weight="700">${esc(hlKeyword)}</text>\n`);
        if (afterText) {
          const toks = tokenize(afterText);
          parts.push(buildTextLineWhite(toks, afterX, ty, md.fontSizeText, md.fontSizePrice, accentColor) + '\n');
        }
      } else {
        const toks = tokenize(wl);
        parts.push(buildTextLineWhite(toks, md.textCenterX, ty, md.fontSizeText, md.fontSizePrice, accentColor) + '\n');
      }
      ty += md.lineH;
    });
  });

  // ===== 底部商家信息（一行排列，节日色，渐变背景） =====
  if (merchantInfo && (merchantInfo.name || merchantInfo.address || merchantInfo.phone || merchantInfo.wechat)) {
    const bottomY = Math.round(H * 0.955);
    const fontS = Math.round(H * 0.021);

    // 所有信息拼成一行
    const parts_list = [];
    if (merchantInfo.name) parts_list.push(merchantInfo.name);
    if (merchantInfo.address) parts_list.push(merchantInfo.address);
    if (merchantInfo.phone) parts_list.push('电话：' + merchantInfo.phone);
    if (merchantInfo.wechat) parts_list.push('微信：' + merchantInfo.wechat);
    const line = parts_list.join('  |  ');

    const textY = bottomY + Math.round(fontS * 0.75);
    const textColor = darkenColor(accentColor || '#FFD700', 0.25);

    // 渐变背景框
    const textW = estimateWidth(line, fontS);
    const boxPadX = Math.round(W * 0.04);
    const boxPadY = Math.round(fontS * 0.4);
    const boxW = textW + boxPadX * 2;
    const boxH = fontS + boxPadY * 2;
    const boxX = Math.round(W / 2 - boxW / 2);
    const boxY = textY - fontS - boxPadY + Math.round(fontS * 0.1);
    const boxR = Math.round(W * 0.012);

    // 渐变：中心不透明 -> 两端透明
    const gradId = 'merchantGrad';
    parts.push(`<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">`);
    parts.push(`<stop offset="0%" stop-color="white" stop-opacity="0"/>`);
    parts.push(`<stop offset="15%" stop-color="white" stop-opacity="0.75"/>`);
    parts.push(`<stop offset="50%" stop-color="white" stop-opacity="0.85"/>`);
    parts.push(`<stop offset="85%" stop-color="white" stop-opacity="0.75"/>`);
    parts.push(`<stop offset="100%" stop-color="white" stop-opacity="0"/>`);
    parts.push(`</linearGradient></defs>`);
    parts.push(`<rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${boxR}" fill="url(#${gradId})"/>`);

    parts.push(`<text x="${W / 2}" y="${textY}" ${fontFamily} font-size="${fontS}px" font-weight="700" fill="${textColor}" text-anchor="middle">${esc(line)}</text>`);
  }

  parts.push('</svg>');
  return parts.join('\n');
}

// ===== 华丽金框（渐变金边 + 阴影 + 角饰） =====
async function createFramedImage(imagePath, cardSize) {
  const bw = Math.max(3, Math.round(cardSize * 0.012));
  const inner = cardSize - bw * 2;
  const r = Math.round(cardSize * 0.04);
  const total = cardSize + bw * 2;

  const product = await sharp(imagePath).resize(inner, inner, { fit: 'cover' }).png().toBuffer();
  const b64 = product.toString('base64');

  const shadowOx = Math.round(total * 0.015);
  const shadowOy = Math.round(total * 0.02);
  const innerDeco = Math.max(2, Math.round(cardSize * 0.015));
  const decoStroke = Math.max(1, Math.round(cardSize * 0.006));
  const cornerOff = Math.max(2, Math.round(cardSize * 0.025));
  const cornerR = Math.max(2, Math.round(cardSize * 0.02));
  const cornerInnerR = Math.round(r * 0.7);
  const cornerInnerDecoR = Math.max(1, cornerInnerR - 1);

  const svg = `<svg width="${total}" height="${total}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="c"><rect x="${bw}" y="${bw}" width="${cardSize}" height="${cardSize}" rx="${cornerInnerR}"/></clipPath>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF3CD"/>
      <stop offset="30%" stop-color="#FFD700"/>
      <stop offset="70%" stop-color="#DAA520"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </linearGradient>
  </defs>
  <rect x="${shadowOx}" y="${shadowOy}" width="${total - shadowOx * 2}" height="${total - shadowOy}" rx="${r}" fill="rgba(0,0,0,0.25)"/>
  <rect x="0" y="0" width="${total}" height="${total}" rx="${r}" fill="url(#g)"/>
  <rect x="${bw}" y="${bw}" width="${cardSize}" height="${cardSize}" rx="${cornerInnerR}" fill="white"/>
  <rect x="${bw + innerDeco}" y="${bw + innerDeco}" width="${cardSize - innerDeco * 2}" height="${cardSize - innerDeco * 2}" rx="${cornerInnerDecoR}" fill="none" stroke="#DAA520" stroke-width="${decoStroke}" opacity="0.5"/>
  <circle cx="${bw + cornerOff}" cy="${bw + cornerOff}" r="${cornerR}" fill="#B8860B" opacity="0.8"/>
  <circle cx="${bw + cardSize - cornerOff}" cy="${bw + cornerOff}" r="${cornerR}" fill="#B8860B" opacity="0.8"/>
  <circle cx="${bw + cornerOff}" cy="${bw + cardSize - cornerOff}" r="${cornerR}" fill="#B8860B" opacity="0.8"/>
  <circle cx="${bw + cardSize - cornerOff}" cy="${bw + cardSize - cornerOff}" r="${cornerR}" fill="#B8860B" opacity="0.8"/>
  <image x="${bw}" y="${bw}" width="${cardSize}" height="${cardSize}" href="data:image/png;base64,${b64}" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>
</svg>`;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

// ===== 合成商品图 =====
async function composeProductImages(imageBuffer, layout) {
  if (!layout || !layout.M.some(m => m.hasImg)) return imageBuffer;
  const overlays = [];
  for (const md of layout.M) {
    if (!md.hasImg || !md.imgCount) continue;
    for (let j = 0; j < md.imgCount; j++) {
      const url = md.act.imageUrls[j];
      if (!url) continue;
      const localPath = path.join(UPLOAD_DIR, path.basename(url));
      if (!fs.existsSync(localPath)) continue;
      try {
        const offsetX = j * (md.imgCardSize + Math.round(layout.W * 0.01));
        const bw = Math.max(3, Math.round(md.imgCardSize * 0.012));
        const framed = await createFramedImage(localPath, md.imgCardSize);
        overlays.push({ input: framed, top: md.imgY - bw, left: md.imgX + offsetX - bw });
      } catch (e) { console.error(`[合成图片失败] ${localPath}:`, e.message); }
    }
  }
  if (!overlays.length) return imageBuffer;
  return await sharp(imageBuffer).composite(overlays).png().toBuffer();
}

// ===== 入口 =====
async function renderBackPoster(backgroundBuffer, activities, merchantInfo, brand, options = {}) {
  const W = options.width || 2100;
  const H = options.height || 2970;
  const layout = computeLayout(activities, W, H);
  if (!layout) return backgroundBuffer;
  const svg = buildBackSvg(layout, brand, merchantInfo, options);
  const withText = await sharp(backgroundBuffer).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
  return await composeProductImages(withText, layout);
}

// ===== 车贴渲染 =====
async function renderCarSticker(backgroundBuffer, data, options = {}) {
  const W = options.width || 2000;
  const H = options.height || 800;
  const { brand, text, phone, merchantName } = data;

  const parts = [];
  parts.push(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`);

  const fontFamily = "'Noto Serif SC','Source Han Serif SC','STSong','SimSun','FangSong',serif";
  const centerX = Math.round(W / 2);

  // 商家名称 — 最大最醒目
  const nameSize = Math.round(H * 0.28);
  if (brand) {
    parts.push(`<text x="${centerX}" y="${Math.round(H * 0.38)}" font-family="${fontFamily}" font-size="${nameSize}px" fill="#FFFFFF" text-anchor="middle" font-weight="700">${esc(brand)}</text>`);
  }

  // 车贴主文案
  const textSize = Math.round(H * 0.16);
  if (text) {
    parts.push(`<text x="${centerX}" y="${Math.round(H * 0.62)}" font-family="${fontFamily}" font-size="${textSize}px" fill="#FFD700" text-anchor="middle" font-weight="700">${esc(text)}</text>`);
  }

  // 电话和商家名
  const infoSize = Math.round(H * 0.10);
  let infoLine = '';
  if (phone) infoLine += '电话：' + esc(phone);
  if (merchantName) {
    if (infoLine) infoLine += '  |  ';
    infoLine += esc(merchantName);
  }
  if (infoLine) {
    parts.push(`<text x="${centerX}" y="${Math.round(H * 0.82)}" font-family="${fontFamily}" font-size="${infoSize}px" fill="#EEEEEE" text-anchor="middle">${infoLine}</text>`);
  }

  parts.push('</svg>');
  const svg = parts.join('\n');

  return await sharp(backgroundBuffer).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
}

module.exports = { renderBackPoster, renderCarSticker, computeLayout };
