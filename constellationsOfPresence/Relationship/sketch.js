// Relationship — visualization of time series with progressive transparent shapes
// Data URL (use the CSV endpoint you provided)
const DATA_URL = 'https://ourworldindata.org/grapher/time-spent-with-relationships-by-age-us.csv?v=1&csvType=full&useColumnShortNames=true';

let container;
let years = []; // array of year numbers (strings or numbers)
let series = {}; // key -> array of values aligned with years
let seriesKeys = []; // ordered keys
let loaded = false;
// images map and layout order
let imgs = {};
const topRow = ['friends','alone','family'];
const bottomRow = ['coworkers','partner','child'];
let relFont;

function setup(){
  container = document.getElementById('p5-root');
  const cnv = createCanvas(container.clientWidth, container.clientHeight);
  cnv.parent('p5-root');
  // make the canvas element background transparent so underlying DOM (video) is visible
  try{
    cnv.style('background', 'transparent');
    if(cnv.canvas && cnv.canvas.style) cnv.canvas.style.background = 'transparent';
  }catch(e){ /* ignore if style not available */ }
  noStroke();
  colorMode(HSB, 360, 100, 100, 1);
  if(relFont) textFont(relFont);
  fetchData();
}

function windowResized(){
  resizeCanvas(container.clientWidth, container.clientHeight);
}

function preload(){
  imgs.friends = loadImage('assets/friends.png');
  imgs.alone   = loadImage('assets/alone.png');
  imgs.family  = loadImage('assets/family.png');
  imgs.coworkers = loadImage('assets/coworkers.png');
  imgs.partner = loadImage('assets/partner.png');
  imgs.child   = loadImage('assets/child.png');
  // endpoint icon for the axis
  imgs.stickman = loadImage('assets/stick-man-297255_1280.png');
  relFont = loadFont('assets/QWERTYpe-1.ttf');
}

async function fetchData(){
  setMessage('正在从远端获取 CSV 数据…');
  try{
    const res = await fetch(DATA_URL);
    if(!res.ok) throw new Error('网络错误: ' + res.status);
    const text = await res.text();
    // try parse as JSON first
    let parsed;
    try{ parsed = JSON.parse(text); } catch(e){ parsed = null; }

    if(parsed){
      // many OurWorldInData grapher metadata responses embed a CSV in parsed.csv or provide data.table
      if(parsed.csv){
        parseCSV(parsed.csv);
      } else if(parsed.data){
        // assume parsed.data is array of objects: {Year:..., "<age>":...}
        buildFromObjects(parsed.data);
      } else if(parsed.rows){
        buildFromObjects(parsed.rows);
      } else {
        // fallback: convert to string and search for CSV part
        setMessage('解析 JSON 成功，但未找到数据字段。尝试解析为文本 CSV…');
        parseCSV(text);
      }
    } else {
      // not JSON — try CSV parsing from text
      parseCSV(text);
    }

    if(Object.keys(series).length === 0){
      setMessage('无法解析数据。请尝试在本地运行静态服务器并确认 URL 可访问（CORS）。');
      return;
    }

    seriesKeys = Object.keys(series);
    setMessage('数据加载完成：' + years.length + ' 个年份，' + seriesKeys.length + ' 条序列。移动鼠标开始交互。');
    loaded = true;
  }catch(err){
    console.error(err);
    setMessage('加载失败：' + err.message + '。若出现 CORS，请使用本地服务器（参见页面提示）。');
  }
}

function setMessage(t){ /* hints/UI messages removed */ }

// helper to produce the hover label shown above images
function getHoverLabel(key){
  if(!key) return '';
  // base label (lowercase)
  let label;
  if(key.toLowerCase() === 'alone') label = 'stay alone';
  else {
    // display 'children' instead of 'child'
    const base = key.toLowerCase() === 'child' ? 'children' : key.toLowerCase();
    label = 'with ' + base;
  }
  // convert to Title Case (capitalize first letter of each word)
  return label.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseCSV(text){
  // Basic CSV parsing into objects: split lines, handle simple quoted fields
  const lines = text.trim().split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
  if(lines.length < 2) return;
  const header = splitCSVLine(lines[0]);
  const cols = header.map(h=>h.trim());
  const objs = [];
  for(let i=1;i<lines.length;i++){
    const row = splitCSVLine(lines[i]);
    const obj = {};
    for(let c=0;c<cols.length;c++){
      const key = cols[c] || ('col'+c);
      const raw = row[c] === undefined ? '' : row[c];
      // try to convert numeric fields to Number, keep empty as NaN
      const num = raw === '' ? NaN : Number(raw);
      obj[key] = isFinite(num) ? num : raw;
    }
    objs.push(obj);
  }
  // delegate to buildFromObjects to sort and extract series
  buildFromObjects(objs);
}

function buildFromObjects(objs){
  if(!Array.isArray(objs) || objs.length === 0) return;
  // determine keys and the year key
  const first = objs[0];
  const cols = Object.keys(first);
  const yearKey = cols.find(c=>/year/i.test(c)) || cols.find(c=>/date|time/i.test(c)) || cols[0];

  // normalize: ensure year values are numeric where possible, and sort objects by year ascending
  const mapped = objs.map(o => {
    const copy = Object.assign({}, o);
    const rawYear = o[yearKey];
    const yNum = Number(rawYear);
    copy.__yearNum = isFinite(yNum) ? yNum : NaN;
    return copy;
  }).filter(o=>!isNaN(o.__yearNum)); // keep only rows with numeric year

  mapped.sort((a,b)=> a.__yearNum - b.__yearNum);

  years = mapped.map(o => o.__yearNum);
  series = {};
  for(let k of cols){ if(k === yearKey) continue; series[k] = []; }
  for(let o of mapped){
    for(let k of Object.keys(series)){
      const v = o[k];
      series[k].push(isFinite(Number(v)) ? Number(v) : NaN);
    }
  }
}

function splitCSVLine(line){
  const out = [];
  let cur = '';
  let inQ = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(ch === '"') { inQ = !inQ; continue; }
    if(ch === ',' && !inQ){ out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(s=>s.trim());
}

// helper: find series key containing a substring (case-insensitive)
function findSeriesKeyContaining(sub){
  sub = String(sub).toLowerCase();
  for(const k of Object.keys(series || {})){
    if(String(k).toLowerCase().includes(sub)) return k;
  }
  return null;
}

function draw(){
  // clear to transparent so the underlying background video remains visible
  clear();

  const axisY = height / 2;
  const xRight = constrain(mouseX, 0, width);
  // draw axis
  push();
  // draw axis in white and use a stick-man image at the endpoint if available
  colorMode(RGB, 255);
  stroke(255);
  strokeWeight(3);
  line(0, axisY, xRight, axisY);
  noStroke();
  // draw endpoint: prefer stickman image (centered), fallback to white circle
  imageMode(CENTER);
  if(imgs.stickman && imgs.stickman.width){
    const s = 24; // size of endpoint icon
    image(imgs.stickman, xRight, axisY, s, s);
  } else {
    fill(255);
    circle(xRight, axisY, 10);
  }
  // restore HSB color mode used elsewhere
  colorMode(HSB, 360, 100, 100, 1);
  pop();

  // 预计算 mouseX 到 years 的 fractional index
  const total = years.length;
  let fIndex = 0;
  if(total > 0){
    fIndex = map(xRight, 0, width, 0, max(0, total - 1));
  }
  const i0 = floor(fIndex);
  const i1 = min(i0 + 1, max(0, total - 1));
  const frac = constrain(fIndex - i0, 0, 1);

  // 计算 'alone' 序列在当前鼠标位置的插值值和对应的 alpha (0-255)
  const aloneKey = findSeriesKeyContaining('alone');
  let aloneValue = NaN;
  let aloneT = 255; // 默认不透明
  if(aloneKey && total > 0 && Array.isArray(series[aloneKey])){
    const a = series[aloneKey][i0];
    const b = series[aloneKey][i1];
    aloneValue = interpolateValue(isFinite(a)?a:NaN, isFinite(b)?b:NaN, frac);

    // 计算该序列的 min/max（忽略 NaN）
    let minV = Infinity, maxV = -Infinity;
    for(const v of series[aloneKey]){
      if(!isFinite(v)) continue;
      if(v < minV) minV = v;
      if(v > maxV) maxV = v;
    }
    if(minV === Infinity || maxV === -Infinity || minV === maxV){
      aloneT = 255;
    } else {
      aloneT = constrain(map(aloneValue, minV, maxV, 0, 255), 0, 255);
    }
  }

  // 计算 'friend(s)' 序列在当前鼠标位置的插值值和对应的 alpha (0-255)
  const friendKey = findSeriesKeyContaining('friend');
  let friendValue = NaN;
  let friendT = 255;
  if(friendKey && total > 0 && Array.isArray(series[friendKey])){
    const fa = series[friendKey][i0];
    const fb = series[friendKey][i1];
    friendValue = interpolateValue(isFinite(fa)?fa:NaN, isFinite(fb)?fb:NaN, frac);

    // 计算 friend 序列的 min/max（忽略 NaN）
    let fMin = Infinity, fMax = -Infinity;
    for(const v of series[friendKey]){
      if(!isFinite(v)) continue;
      if(v < fMin) fMin = v;
      if(v > fMax) fMax = v;
    }
    if(fMin === Infinity || fMax === -Infinity || fMin === fMax){
      friendT = 255;
    } else {
      friendT = constrain(map(friendValue, fMin, fMax, 0, 255), 0, 255);
    }
  }

  // 新增：计算 'child/children' 序列在当前鼠标位置的插值值和对应的 alpha (0-255)
  const childKey = findSeriesKeyContaining('child') || findSeriesKeyContaining('children');
  let childValue = NaN;
  let childT = 255;
  if(childKey && total > 0 && Array.isArray(series[childKey])){
    const ca = series[childKey][i0];
    const cb = series[childKey][i1];
    childValue = interpolateValue(isFinite(ca)?ca:NaN, isFinite(cb)?cb:NaN, frac);

    // 计算 child 序列的 min/max（忽略 NaN）
    let cMin = Infinity, cMax = -Infinity;
    for(const v of series[childKey]){
      if(!isFinite(v)) continue;
      if(v < cMin) cMin = v;
      if(v > cMax) cMax = v;
    }
    if(cMin === Infinity || cMax === -Infinity || cMin === cMax){
      childT = 255;
    } else {
      childT = constrain(map(childValue, cMin, cMax, 0, 255), 0, 255);
    }
  }

  // 新增：计算 'family' 序列在当前鼠标位置的插值值和对应的 alpha (0-255)
  const familyKey = findSeriesKeyContaining('family');
  let familyValue = NaN;
  let familyT = 255;
  if(familyKey && total > 0 && Array.isArray(series[familyKey])){
    const fa0 = series[familyKey][i0];
    const fa1 = series[familyKey][i1];
    familyValue = interpolateValue(isFinite(fa0)?fa0:NaN, isFinite(fa1)?fa1:NaN, frac);

    // 计算 family 序列的 min/max（忽略 NaN）
    let famMin = Infinity, famMax = -Infinity;
    for(const v of series[familyKey]){
      if(!isFinite(v)) continue;
      if(v < famMin) famMin = v;
      if(v > famMax) famMax = v;
    }
    if(famMin === Infinity || famMax === -Infinity || famMin === famMax){
      familyT = 255;
    } else {
      familyT = constrain(map(familyValue, famMin, famMax, 0, 255), 0, 255);
    }
  }

  // 新增：计算 'partner' 序列在当前鼠标位置的插值值和对应的 alpha (0-255)
  const partnerKey = findSeriesKeyContaining('partner');
  let partnerValue = NaN;
  let partnerT = 255;
  if(partnerKey && total > 0 && Array.isArray(series[partnerKey])){
    const pa = series[partnerKey][i0];
    const pb = series[partnerKey][i1];
    partnerValue = interpolateValue(isFinite(pa)?pa:NaN, isFinite(pb)?pb:NaN, frac);

    // 计算 partner 序列的 min/max（忽略 NaN）
    let pMin = Infinity, pMax = -Infinity;
    for(const v of series[partnerKey]){
      if(!isFinite(v)) continue;
      if(v < pMin) pMin = v;
      if(v > pMax) pMax = v;
    }
    if(pMin === Infinity || pMax === -Infinity || pMin === pMax){
      partnerT = 255;
    } else {
      partnerT = constrain(map(partnerValue, pMin, pMax, 0, 255), 0, 255);
    }
  }

  // 新增：计算 'co-worker' / 'coworker(s)' 序列在当前鼠标位置的插值值和对应的 alpha (0-255)
  // 使用更鲁棒的键名检测：打印 keys（仅一次），正则匹配常见写法，归一化再匹配，最后尝试同时包含 "co" 和 "work" 的情况。
  const coworkerKey = (function(){
    if(!seriesKeys || seriesKeys.length === 0) return null;
    // debug logging removed
    const re = /co[\s-_]?work|cowork|co[\s-_]?worker|coworker|co-worker|co workers|co-workers|coworkers|co_worker/i;
    for(const k of seriesKeys){
      if(re.test(k)) return k;
      const nk = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
      if(nk.indexOf('cowork') !== -1 || nk.indexOf('coworker') !== -1) return k;
    }
    // 宽泛后备匹配：同时包含 'co' 与 'work' / 'worker'
    for(const k of seriesKeys){
      const lk = String(k).toLowerCase();
      if((lk.includes('co') && (lk.includes('work') || lk.includes('worker')))) return k;
    }
    return null;
  })();

  let coworkerValue = NaN;
  let coworkerT = 255;
  if(coworkerKey && total > 0 && Array.isArray(series[coworkerKey])){
    const ca = series[coworkerKey][i0];
    const cb = series[coworkerKey][i1];
    coworkerValue = interpolateValue(isFinite(ca)?ca:NaN, isFinite(cb)?cb:NaN, frac);

    // 计算 coworker 序列的 min/max（忽略 NaN）
    let cwMin = Infinity, cwMax = -Infinity;
    for(const v of series[coworkerKey]){
      if(!isFinite(v)) continue;
      if(v < cwMin) cwMin = v;
      if(v > cwMax) cwMax = v;
    }
    if(cwMin === Infinity || cwMax === -Infinity || cwMin === cwMax){
      coworkerT = 255;
    } else {
      coworkerT = constrain(map(coworkerValue, cwMin, cwMax, 0, 255), 0, 255);
    }
  }

  // draw images evenly spaced above and below the axis
  imageMode(CENTER);
  const cols = 3;
  const maxImgW = min(280, width / 3);
  const maxImgH = min(280, height / 3);
  const rowOffset = min(160, height * 0.36);
  const halfMaxW = maxImgW / 2;
  let paddingX = width * 0.08;
  paddingX = max(paddingX, halfMaxW + 8);
  const availableW = max(0, width - paddingX * 2);
  const stepX = cols > 1 ? availableW / (cols - 1) : 0;

  // top row
  for (let i = 0; i < topRow.length; i++) {
    const key = topRow[i];
    const ixBase = paddingX + i * stepX;
    const iy = axisY - rowOffset;
    const img = imgs[key];
    if (img && img.width) {
      const scale = min(maxImgW / img.width, maxImgH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      // horizontal shift for edge images
      let shiftX = 0;
      if (i === 0) shiftX = +w / 2;
      else if (i === topRow.length - 1) shiftX = -w / 2;

      const keyLower = key.toLowerCase();
      if (friendKey && keyLower.includes('friend')) {
        colorMode(RGB, 255);
        tint(255, 255, 255, friendT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (aloneKey && keyLower.includes('alone')) {
        colorMode(RGB, 255);
        tint(255, 255, 255, aloneT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (childKey && (keyLower.includes('child') || keyLower.includes('children'))) {
        colorMode(RGB, 255);
        tint(255, 255, 255, childT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (familyKey && keyLower.includes('family')) {
        colorMode(RGB, 255);
        tint(255, 255, 255, familyT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (partnerKey && keyLower.includes('partner')) {
        colorMode(RGB, 255);
        tint(255, 255, 255, partnerT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (coworkerKey && (keyLower.includes('cowork') || keyLower.includes('co-worker') || keyLower.includes('co worker'))) {
        colorMode(RGB, 255);
        tint(255, 255, 255, coworkerT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else {
        image(img, ixBase + shiftX, iy, w, h);
      }

      // hover label: centered over image with translucent white background
      if (mouseX >= ixBase + shiftX - w / 2 && mouseX <= ixBase + shiftX + w / 2 && mouseY >= iy - h / 2 && mouseY <= iy + h / 2) {
        push();
        const ts = 14;
        textSize(ts);
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        // translucent white background (~30% alpha)
        colorMode(RGB, 255);
        noStroke();
        fill(255, 255, 255, Math.round(255 * 0.3));
  rect(ixBase + shiftX, iy, w, ts * 3.2);
        // label
        fill(0);
        text(getHoverLabel(key), ixBase + shiftX, iy);
        // restore color mode
        colorMode(HSB, 360, 100, 100, 1);
        pop();
      }
    } else {
      fill(220);
      noStroke();
      circle(ixBase, iy, 80);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(key, ixBase, iy);

      // hover for fallback circle: center label with translucent background
      const r = 80 / 2;
      if (mouseX >= ixBase - r && mouseX <= ixBase + r && mouseY >= iy - r && mouseY <= iy + r) {
        push();
        const ts = 14;
        textSize(ts);
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        colorMode(RGB, 255);
        noStroke();
        fill(255, 255, 255, Math.round(255 * 0.3));
  rect(ixBase, iy, 80, ts * 3.2);
        fill(0);
        text(getHoverLabel(key), ixBase, iy);
        colorMode(HSB, 360, 100, 100, 1);
        pop();
      }
    }
  }

  // bottom row
  for (let i = 0; i < bottomRow.length; i++) {
    const key = bottomRow[i];
    const ixBase = paddingX + i * stepX;
    const iy = axisY + rowOffset;
    const img = imgs[key];
    if (img && img.width) {
      const scale = min(maxImgW / img.width, maxImgH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      let shiftX = 0;
      if (i === 0) shiftX = +w / 2;
      else if (i === bottomRow.length - 1) shiftX = -w / 2;

      const keyLower = key.toLowerCase();
      if (friendKey && keyLower.includes('friend')) {
        colorMode(RGB, 255);
        tint(255, 255, 255, friendT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (aloneKey && keyLower.includes('alone')) {
        colorMode(RGB, 255);
        tint(255, 255, 255, aloneT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (childKey && (keyLower.includes('child') || keyLower.includes('children'))) {
        colorMode(RGB, 255);
        tint(255, 255, 255, childT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (familyKey && keyLower.includes('family')) {
        colorMode(RGB, 255);
        tint(255, 255, 255, familyT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (partnerKey && keyLower.includes('partner')) {
        colorMode(RGB, 255);
        tint(255, 255, 255, partnerT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else if (coworkerKey && (keyLower.includes('cowork') || keyLower.includes('co-worker') || keyLower.includes('co worker'))) {
        colorMode(RGB, 255);
        tint(255, 255, 255, coworkerT);
        image(img, ixBase + shiftX, iy, w, h);
        noTint();
        colorMode(HSB, 360, 100, 100, 1);
      } else {
        image(img, ixBase + shiftX, iy, w, h);
      }

      // hover label: centered over image with translucent white background
      if (mouseX >= ixBase + shiftX - w / 2 && mouseX <= ixBase + shiftX + w / 2 && mouseY >= iy - h / 2 && mouseY <= iy + h / 2) {
        push();
        const ts = 14;
        textSize(ts);
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        colorMode(RGB, 255);
        noStroke();
        fill(255, 255, 255, Math.round(255 * 0.3));
  rect(ixBase + shiftX, iy, w, ts * 3.2);
        fill(0);
        text(getHoverLabel(key), ixBase + shiftX, iy);
        colorMode(HSB, 360, 100, 100, 1);
        pop();
      }
    } else {
      fill(220);
      noStroke();
      circle(ixBase, iy, 80);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(key, ixBase, iy);

      // hover for fallback circle: centered label with translucent background
      const r = 80 / 2;
      if (mouseX >= ixBase - r && mouseX <= ixBase + r && mouseY >= iy - r && mouseY <= iy + r) {
        push();
        const ts = 14;
        textSize(ts);
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        colorMode(RGB, 255);
        noStroke();
        fill(255, 255, 255, Math.round(255 * 0.3));
  rect(ixBase, iy, 80, ts * 3.2);
        fill(0);
        text(getHoverLabel(key), ixBase, iy);
        colorMode(HSB, 360, 100, 100, 1);
        pop();
      }
    }
  }

  // 年份标签显示
  let yearLabel = '';
  if(total > 0){
    const y0 = Number(years[i0]);
    const y1 = Number(years[i1]);
    if(isFinite(y0) && isFinite(y1)){
      const interpYear = Math.round(lerp(y0, y1, frac));
      yearLabel = String(interpYear);
    } else {
      yearLabel = String(years[i0]);
    }
  }

  if(yearLabel){
    push();
    textAlign(CENTER, BOTTOM);
    textSize(14);
    fill(0);
    noStroke();
    text(yearLabel, xRight, axisY - 12);
    pop();
  }
}

function interpolateValue(a,b,t){
  if(isNaN(a) && isNaN(b)) return 0;
  if(isNaN(a)) return b;
  if(isNaN(b)) return a;
  return lerp(a,b,t);
}

function keyPressed(){ if(key === 'r' || key === 'R') { /* nothing heavy to reset for now */ } }

function mousePressed(){ /* small visual burst: temporarily tweak global alpha by noise — handled implicitly by mouseY */ }

