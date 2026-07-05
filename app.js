'use strict';

// ── 상태 ──────────────────────────────────────────────
let generateCount = 1;
const fixedNums   = new Set();
const excludeNums = new Set();
const poolNums    = new Set(); // 범위수
const MAX_FIXED   = 5;
let activeTab     = 'fixed';

// ── 수학 상수 ─────────────────────────────────────────
const PRIMES     = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43]);
const PERFECT_SQ = new Set([1,4,9,16,25,36]);
const COMPOSITES = new Set([4,6,8,9,10,12,14,15,16,18,20,21,22,24,25,26,27,28,
  30,32,33,34,35,36,38,39,40,42,44,45]);

// ── 토글 ID 목록 ──────────────────────────────────────
const TOGGLE_IDS = ['numRange','sumRange','acRange','evenCount','consecMax','sameTensMax',
  'stdRange','tailRange','primeCount','compositeCount','perfectSqCount','highLow'];

// ── 볼 색상 ───────────────────────────────────────────
function ballClass(n) {
  if (n<=10) return 'r1'; if (n<=20) return 'r2';
  if (n<=30) return 'r3'; if (n<=40) return 'r4'; return 'r5';
}

// ── 통계 함수 ─────────────────────────────────────────
function calcAC(nums) {
  const d=new Set();
  for (let i=0;i<nums.length;i++) for (let j=i+1;j<nums.length;j++) d.add(Math.abs(nums[i]-nums[j]));
  return d.size-5;
}
function calcStd(nums) {
  const m=nums.reduce((a,b)=>a+b,0)/nums.length;
  return Math.sqrt(nums.reduce((a,b)=>a+(b-m)**2,0)/nums.length);
}
function calcTailSum(nums)    { return nums.reduce((a,n)=>a+(n%10),0); }
function countSameTens(nums)  { const t={}; nums.forEach(n=>{const k=Math.floor(n/10);t[k]=(t[k]||0)+1;}); return Math.max(...Object.values(t)); }
function countConsecPairs(nums) { const s=[...nums].sort((a,b)=>a-b); let p=0,i=0; while(i<s.length-1){if(s[i+1]-s[i]===1){p++;i+=2;}else i++;} return p; }
function countPrimes(nums)    { return nums.filter(n=>PRIMES.has(n)).length; }
function countComposite(nums) { return nums.filter(n=>COMPOSITES.has(n)).length; }
function countPerfectSq(nums) { return nums.filter(n=>PERFECT_SQ.has(n)).length; }
function calcHighLow(nums)    { const h=nums.filter(n=>n>=23).length; return {high:h,low:6-h}; }
function getMultiples(nums) {
  return [3,4,5].map(d=>{const c=nums.filter(n=>n%d===0).length; return c>0?`${d}(${c})`:null;}).filter(Boolean).join(', ')||'없음';
}
function getSameTailGroups(nums) {
  const t={};
  nums.forEach(n=>{const k=n%10; t[k]=(t[k]||[]).concat(n);});
  return Object.entries(t).filter(([,v])=>v.length>1).map(([,v])=>`(${v.join(', ')}) ${v.length}수`).join(' ')||'없음';
}
function analyzeNums(nums) {
  const sorted=[...nums].sort((a,b)=>a-b);
  const sum=sorted.reduce((a,b)=>a+b,0), odd=sorted.filter(n=>n%2!==0).length;
  return { sorted, sum, odd, even:6-odd, ac:calcAC(sorted), std:calcStd(sorted),
    tail:calcTailSum(sorted), hl:calcHighLow(sorted), sameTail:getSameTailGroups(sorted),
    consec:countConsecPairs(sorted), primes:countPrimes(sorted),
    comp:countComposite(sorted), psq:countPerfectSq(sorted), mults:getMultiples(sorted) };
}

// ── 토글 헬퍼 ────────────────────────────────────────
function isOn(id) { const el=document.getElementById('tog_'+id); return el?el.checked:false; }

function applyToggleState(id, on) {
  const row=document.querySelector(`.filter-row[data-filter="${id}"]`);
  if (row) row.classList.toggle('filter-off', !on);
}

function bindToggles() {
  TOGGLE_IDS.forEach(id=>{
    const el=document.getElementById('tog_'+id);
    if (!el) return;
    el.addEventListener('change',()=>{ applyToggleState(id,el.checked); saveSettings(); });
  });
}

// ── chrome.storage ─────────────────────────────────────
const STORAGE_KEY='lotto_settings_v3';

function getFormValues() {
  const toggles={};
  TOGGLE_IDS.forEach(id=>{ toggles['tog_'+id]=isOn(id); });
  const g = id => { const el=document.getElementById(id); return el?el.value:''; };
  return {
    numMin:g('numMin'), numMax:g('numMax'),
    sumMin:g('sumMin'), sumMax:g('sumMax'),
    acMin:g('acMin'),   acMax:g('acMax'),
    evenMin:g('evenMin'), evenMax:g('evenMax'),
    consecMax:g('consecMax'), sameTensMax:g('sameTensMax'),
    stdMin:g('stdMin'), stdMax:g('stdMax'),
    tailMin:g('tailMin'), tailMax:g('tailMax'),
    primeCount:g('primeCount'), compositeCount:g('compositeCount'),
    perfectSqCount:g('perfectSqCount'), highLow:g('highLow'),
    generateCount, fixedNums:[...fixedNums], excludeNums:[...excludeNums], poolNums:[...poolNums],
    theme:document.documentElement.getAttribute('data-theme')||'dark',
    ...toggles
  };
}

function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormValues())); } catch(e) {}
}
function loadSettings(cb) {
  try { const raw = localStorage.getItem(STORAGE_KEY); cb(raw ? JSON.parse(raw) : null); } catch(e) { cb(null); }
}

function applyStoredSettings(s) {
  if (!s) return;
  ['numMin','numMax','sumMin','sumMax','acMin','acMax','evenMin','evenMax',
   'consecMax','sameTensMax','stdMin','stdMax','tailMin','tailMax',
   'primeCount','compositeCount','perfectSqCount','highLow'].forEach(id=>{
    const el=document.getElementById(id); if(el&&s[id]!==undefined) el.value=s[id];
  });
  TOGGLE_IDS.forEach(id=>{
    const el=document.getElementById('tog_'+id);
    if (el&&s['tog_'+id]!==undefined){ el.checked=s['tog_'+id]; applyToggleState(id,el.checked); }
  });
  if (s.generateCount) {
    generateCount=s.generateCount;
    document.querySelectorAll('.count-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.count)===generateCount));
  }
  if (s.fixedNums)   s.fixedNums.forEach(n=>fixedNums.add(n));
  if (s.excludeNums) s.excludeNums.forEach(n=>excludeNums.add(n));
  if (s.poolNums)    s.poolNums.forEach(n=>poolNums.add(n));
  if (s.theme) {
    document.documentElement.setAttribute('data-theme',s.theme);
    document.getElementById('themeToggle').textContent=s.theme==='dark'?'🌙':'☀️';
  }
}

function bindAutoSave() {
  ['numMin','numMax','sumMin','sumMax','acMin','acMax','evenMin','evenMax',
   'consecMax','sameTensMax','stdMin','stdMax','tailMin','tailMax',
   'primeCount','compositeCount','perfectSqCount','highLow'].forEach(id=>{
    const el=document.getElementById(id);
    if (el) el.addEventListener('change',saveSettings);
  });
}

// ── 유효성 검사 ───────────────────────────────────────
function isValid(nums) {
  const s=[...nums].sort((a,b)=>a-b);
  if (isOn('numRange'))     { const nMin=+document.getElementById('numMin').value,nMax=+document.getElementById('numMax').value; if(s[0]<nMin||s[5]>nMax) return false; }
  if (isOn('sumRange'))     { const sMin=+document.getElementById('sumMin').value,sMax=+document.getElementById('sumMax').value; const sum=s.reduce((a,b)=>a+b,0); if(sum<sMin||sum>sMax) return false; }
  if (isOn('acRange'))      { const aMin=+document.getElementById('acMin').value,aMax=+document.getElementById('acMax').value; const ac=calcAC(s); if(ac<aMin||ac>aMax) return false; }
  if (isOn('evenCount'))    { const eMin=+document.getElementById('evenMin').value,eMax=+document.getElementById('evenMax').value; const ev=s.filter(n=>n%2===0).length; if(ev<eMin||ev>eMax) return false; }
  if (isOn('consecMax'))    { if(countConsecPairs(s)>+document.getElementById('consecMax').value) return false; }
  if (isOn('sameTensMax'))  { if(countSameTens(s)>+document.getElementById('sameTensMax').value) return false; }
  if (isOn('stdRange'))     { const sdMin=+document.getElementById('stdMin').value,sdMax=+document.getElementById('stdMax').value; const std=calcStd(s); if(std<sdMin||std>sdMax) return false; }
  if (isOn('tailRange'))    { const tlMin=+document.getElementById('tailMin').value,tlMax=+document.getElementById('tailMax').value; if(calcTailSum(s)<tlMin||calcTailSum(s)>tlMax) return false; }
  if (isOn('primeCount'))   { if(countPrimes(s)!==+document.getElementById('primeCount').value) return false; }
  if (isOn('compositeCount')){ if(countComposite(s)!==+document.getElementById('compositeCount').value) return false; }
  if (isOn('perfectSqCount')){ if(countPerfectSq(s)!==+document.getElementById('perfectSqCount').value) return false; }
  if (isOn('highLow'))      { const [h,l]=document.getElementById('highLow').value.split(':').map(Number); const {high,low}=calcHighLow(s); if(high!==h||low!==l) return false; }
  return true;
}

// ── 번호 생성 ─────────────────────────────────────────
function generateOne(maxTries=100000) {
  const nMin=isOn('numRange')?+document.getElementById('numMin').value:1;
  const nMax=isOn('numRange')?+document.getElementById('numMax').value:45;
  const fixed=[...fixedNums];
  if (fixed.some(n=>n<nMin||n>nMax)) return null;
  const remaining=6-fixed.length;

  // 범위수 6개 이상 선택 시 해당 풀에서만 추출
  const usePool = poolNums.size >= 6;
  const pool=[];
  for (let i=nMin;i<=nMax;i++) {
    if (fixedNums.has(i)||excludeNums.has(i)) continue;
    if (usePool && !poolNums.has(i)) continue;
    pool.push(i);
  }
  if (pool.length<remaining) return null;

  // 범위수 탭 활성 && 필터 적용 토글 확인
  const useFilter = !usePool || (document.getElementById('poolUseFilter')?.checked ?? true);

  for (let t=0;t<maxTries;t++) {
    const arr=[...pool];
    for (let i=0;i<remaining;i++){const j=i+Math.floor(Math.random()*(arr.length-i));[arr[i],arr[j]]=[arr[j],arr[i]];}
    const pick=[...fixed,...arr.slice(0,remaining)].sort((a,b)=>a-b);
    if (!useFilter || isValid(pick)) return pick;
  }
  return null;
}

function generateMultiple(n) {
  const results=[],seen=new Set(); let attempts=0;
  while(results.length<n&&attempts<n*400){attempts++; const nums=generateOne(); if(!nums) continue; const key=nums.join(','); if(!seen.has(key)){seen.add(key);results.push(nums);}}
  return results;
}

// ── 스탯 테이블 HTML ─────────────────────────────────
function buildStatTable(a, cls) {
  return `<table class="${cls}">
    <tr><td>표준편차</td><td>${a.std.toFixed(4)}</td><td>AC</td><td>${a.ac}</td></tr>
    <tr><td>홀짝</td><td>홀(${a.odd}), 짝(${a.even})</td><td>합</td><td>${a.sum}</td></tr>
    <tr><td>고저</td><td>고(${a.hl.high}), 저(${a.hl.low})</td><td>끝수합</td><td>${a.tail}</td></tr>
    <tr><td>동일 끝수</td><td>${a.sameTail}</td><td>연속수</td><td>${a.consec}쌍</td></tr>
    <tr><td>소수</td><td>${a.primes}개</td><td>합성수</td><td>${a.comp}개</td></tr>
    <tr><td>완전제곱수</td><td>${a.psq}개</td><td>배수</td><td>${a.mults}</td></tr>
  </table>`;
}

// ── 결과 렌더링 ───────────────────────────────────────
function renderResults(results) {
  const list=document.getElementById('resultList');
  const noRes=document.getElementById('noResult');
  const emptyEl=document.getElementById('emptyResult');
  list.innerHTML=''; emptyEl.classList.add('hidden');
  if(results.length===0){noRes.classList.remove('hidden');return;}
  noRes.classList.add('hidden');
  results.forEach((nums,idx)=>{
    const a=analyzeNums(nums);
    const entry=document.createElement('div'); entry.className='result-entry';
    const row=document.createElement('div'); row.className='num-row';
    const idxSpan=document.createElement('span'); idxSpan.className='row-idx'; idxSpan.textContent=idx+1;
    const ballsDiv=document.createElement('div'); ballsDiv.className='balls';
    nums.forEach(n=>{const b=document.createElement('div'); b.className=fixedNums.has(n)?'ball fixed-ball':`ball ${ballClass(n)}`; b.textContent=n; ballsDiv.appendChild(b);});
    const copyBtn=document.createElement('button'); copyBtn.className='copy-btn'; copyBtn.textContent='📋';
    copyBtn.onclick=()=>{navigator.clipboard.writeText(nums.join(', ')); copyBtn.textContent='✅'; setTimeout(()=>{copyBtn.textContent='📋';},1200);};
    row.append(idxSpan,ballsDiv,copyBtn);
    entry.appendChild(row);
    entry.insertAdjacentHTML('beforeend',buildStatTable(a,'result-stat-table'));
    list.appendChild(entry);
  });
}

// ── 전체 복사 ─────────────────────────────────────────
function copyAll() {
  const lines=[...document.querySelectorAll('.balls')].map((r,i)=>`[${i+1}] ${[...r.querySelectorAll('.ball')].map(b=>b.textContent).join(', ')}`);
  if(!lines.length) return;
  navigator.clipboard.writeText(lines.join('\n'));
  const btn=document.getElementById('copyAllBtn'); btn.textContent='복사됨 ✅';
  setTimeout(()=>{btn.textContent='전체 복사';},1500);
}

// ── 조합 분석기 (다중) ───────────────────────────────
let analyzeRowCount = 0;

function addAnalyzeRow() {
  const idx = ++analyzeRowCount;
  const container = document.getElementById('analyzeRows');
  const rowEl = document.createElement('div');
  rowEl.className = 'analyze-input-row';
  rowEl.dataset.idx = idx;
  rowEl.innerHTML = `
    <input type="text" class="analyze-input" data-idx="${idx}" placeholder="예: 1, 7, 13, 24, 35, 42" maxlength="30"/>
    <button class="analyze-btn" data-idx="${idx}">분석</button>
    <button class="analyze-del-btn" data-idx="${idx}" title="삭제">✕</button>
  `;
  container.appendChild(rowEl);

  rowEl.querySelector('.analyze-btn').addEventListener('click', ()=>runAnalyze(idx));
  rowEl.querySelector('.analyze-input').addEventListener('keydown', e=>{ if(e.key==='Enter') runAnalyze(idx); });
  rowEl.querySelector('.analyze-del-btn').addEventListener('click', ()=>{
    rowEl.remove();
    document.querySelector(`.analyze-result-block[data-idx="${idx}"]`)?.remove();
  });
}

function runAnalyze(idx) {
  const inputEl = document.querySelector(`.analyze-input[data-idx="${idx}"]`);
  if (!inputEl) return;
  const raw = inputEl.value;

  // 기존 결과 블록 제거
  document.querySelector(`.analyze-result-block[data-idx="${idx}"]`)?.remove();

  const nums = raw.split(/[\s,\/]+/).map(s=>parseInt(s)).filter(n=>!isNaN(n));
  const resultsContainer = document.getElementById('analyzeResults');
  const block = document.createElement('div');
  block.className = 'analyze-result-block';
  block.dataset.idx = idx;

  if (nums.length!==6) { block.innerHTML=`<div class="analyze-error">⚠️ 숫자 6개가 필요해요. (현재 ${nums.length}개)</div>`; resultsContainer.appendChild(block); return; }
  if (nums.some(n=>n<1||n>45)) { block.innerHTML=`<div class="analyze-error">⚠️ 모든 숫자는 1~45 사이여야 해요.</div>`; resultsContainer.appendChild(block); return; }
  if (new Set(nums).size!==6) { block.innerHTML=`<div class="analyze-error">⚠️ 중복된 숫자가 있어요.</div>`; resultsContainer.appendChild(block); return; }

  const a = analyzeNums(nums);

  // 볼 HTML
  const ballsHtml = a.sorted.map(n=>`<div class="ball ${ballClass(n)}">${n}</div>`).join('');

  block.innerHTML = `
    <div class="analyze-result">
      <div class="analyze-balls">${ballsHtml}</div>
      <table class="stat-table">
        <tr><td>표준편차</td><td>${a.std.toFixed(4)}</td><td>AC</td><td>${a.ac}</td></tr>
        <tr><td>홀짝</td><td>홀(${a.odd}), 짝(${a.even})</td><td>합</td><td>${a.sum}</td></tr>
        <tr><td>고저</td><td>고(${a.hl.high}), 저(${a.hl.low})</td><td>끝수합</td><td>${a.tail}</td></tr>
        <tr><td>동일 끝수</td><td>${a.sameTail}</td><td>연속수</td><td>${a.consec}쌍</td></tr>
        <tr><td>소수</td><td>${a.primes}개</td><td>합성수</td><td>${a.comp}개</td></tr>
        <tr><td>완전제곱수</td><td>${a.psq}개</td><td>배수</td><td>${a.mults}</td></tr>
      </table>
    </div>
  `;
  resultsContainer.appendChild(block);
}

// ── 고정수/제외수/범위수 UI ──────────────────────────
function updateGridUI() {
  document.querySelectorAll('.ng-btn').forEach(btn=>{
    const n=parseInt(btn.dataset.n);
    const isFixed=fixedNums.has(n), isExclude=excludeNums.has(n), isPool=poolNums.has(n);
    btn.classList.remove('ng-selected-fixed','ng-selected-exclude','ng-selected-pool','ng-disabled');
    if(isFixed)   btn.classList.add('ng-selected-fixed');
    if(isExclude) btn.classList.add('ng-selected-exclude');
    if(isPool)    btn.classList.add('ng-selected-pool');
    if(activeTab==='fixed'){
      if(isExclude||isPool) btn.classList.add('ng-disabled');
      else if(fixedNums.size>=MAX_FIXED&&!isFixed) btn.classList.add('ng-disabled');
    }
    if(activeTab==='exclude'){ if(isFixed||isPool)    btn.classList.add('ng-disabled'); }
    if(activeTab==='pool'){    if(isFixed||isExclude)  btn.classList.add('ng-disabled'); }
  });
}

function updateFixedSelectedUI() {
  const sel=document.getElementById('fixedSelected'); sel.innerHTML='';
  if(!fixedNums.size){sel.innerHTML='<span class="fixed-empty">선택된 고정수 없음</span>';}
  else{[...fixedNums].sort((a,b)=>a-b).forEach(n=>{const t=document.createElement('div');t.className=`fixed-tag ng-${ballClass(n)}`;t.textContent=n;t.onclick=()=>{fixedNums.delete(n);updateAll();saveSettings();};sel.appendChild(t);});}
  document.getElementById('fixedBadge').textContent=fixedNums.size?`${fixedNums.size}/${MAX_FIXED}개`:'최대 5개';
}

function updateExcludeSelectedUI() {
  const sel=document.getElementById('excludeSelected'); sel.innerHTML='';
  if(!excludeNums.size){sel.innerHTML='<span class="fixed-empty">선택된 제외수 없음</span>';}
  else{[...excludeNums].sort((a,b)=>a-b).forEach(n=>{const t=document.createElement('div');t.className=`fixed-tag ng-${ballClass(n)}`;t.style.filter='brightness(0.55) saturate(0.5)';t.style.outline='2px solid #e07070';t.textContent=n;t.onclick=()=>{excludeNums.delete(n);updateAll();saveSettings();};sel.appendChild(t);});}
  document.getElementById('excludeBadge').textContent=`${excludeNums.size}개`;
}

function updatePoolSelectedUI() {
  const sel=document.getElementById('poolSelected'); sel.innerHTML='';
  if(!poolNums.size){sel.innerHTML='<span class="fixed-empty">선택된 범위수 없음</span>';}
  else{[...poolNums].sort((a,b)=>a-b).forEach(n=>{const t=document.createElement('div');t.className=`pool-tag ng-${ballClass(n)}`;t.textContent=n;t.title=`${n} 클릭 시 해제`;t.onclick=()=>{poolNums.delete(n);updateAll();saveSettings();};sel.appendChild(t);});}
  const badge=document.getElementById('poolBadge');
  badge.textContent=poolNums.size>0?`${poolNums.size}개 선택`:'0개';
  // 6개 미만이면 경고
  if(poolNums.size>0&&poolNums.size<6) badge.style.color='#e07070';
  else badge.style.color='';
}

function updateAll(){ updateFixedSelectedUI(); updateExcludeSelectedUI(); updatePoolSelectedUI(); updateGridUI(); }

function toggleBall(n) {
  if(activeTab==='fixed'){
    if(excludeNums.has(n)||poolNums.has(n)) return;
    if(fixedNums.has(n)) fixedNums.delete(n);
    else{ if(fixedNums.size>=MAX_FIXED) return; fixedNums.add(n); }
  } else if(activeTab==='exclude'){
    if(fixedNums.has(n)||poolNums.has(n)) return;
    if(excludeNums.has(n)) excludeNums.delete(n); else excludeNums.add(n);
  } else {
    if(fixedNums.has(n)||excludeNums.has(n)) return;
    if(poolNums.has(n)) poolNums.delete(n); else poolNums.add(n);
  }
  updateAll(); saveSettings();
}

function switchTab(tab) {
  activeTab=tab;
  document.getElementById('tabFixed').classList.toggle('active',tab==='fixed');
  document.getElementById('tabExclude').classList.toggle('active',tab==='exclude');
  document.getElementById('tabPool').classList.toggle('active',tab==='pool');
  document.getElementById('fixedPanel').classList.toggle('hidden',tab!=='fixed');
  document.getElementById('excludePanel').classList.toggle('hidden',tab!=='exclude');
  document.getElementById('poolPanel').classList.toggle('hidden',tab!=='pool');
  updateGridUI();
}

function buildNumGrid() {
  const grid=document.getElementById('numGrid');
  for(let i=1;i<=45;i++){
    const btn=document.createElement('button');
    btn.className=`ng-btn ng-${ballClass(i)}`; btn.dataset.n=i; btn.textContent=i;
    btn.addEventListener('click',()=>{if(!btn.classList.contains('ng-disabled'))toggleBall(i);});
    grid.appendChild(btn);
  }
}

// ── 프리셋 ────────────────────────────────────────────
const PRESETS={
  balanced: {numMin:1,numMax:45,sumMin:100,sumMax:170,acMin:7,acMax:10,evenMin:2,evenMax:4,consecMax:'1',sameTensMax:'2',stdMin:0,stdMax:20,tailMin:0,tailMax:54,primeCount:'2',compositeCount:'3',perfectSqCount:'0',highLow:'3:3',tog_numRange:true,tog_sumRange:true,tog_acRange:true,tog_evenCount:true,tog_consecMax:false,tog_sameTensMax:false,tog_stdRange:false,tog_tailRange:false,tog_primeCount:false,tog_compositeCount:false,tog_perfectSqCount:false,tog_highLow:false},
  high:     {numMin:1,numMax:45,sumMin:150,sumMax:230,acMin:5,acMax:10,evenMin:0,evenMax:6,consecMax:'1',sameTensMax:'2',stdMin:0,stdMax:20,tailMin:0,tailMax:54,primeCount:'2',compositeCount:'3',perfectSqCount:'0',highLow:'3:3',tog_numRange:true,tog_sumRange:true,tog_acRange:true,tog_evenCount:false,tog_consecMax:false,tog_sameTensMax:false,tog_stdRange:false,tog_tailRange:false,tog_primeCount:false,tog_compositeCount:false,tog_perfectSqCount:false,tog_highLow:false},
  noconsec: {numMin:1,numMax:45,sumMin:80,sumMax:200,acMin:6,acMax:10,evenMin:0,evenMax:6,consecMax:'0',sameTensMax:'2',stdMin:0,stdMax:20,tailMin:0,tailMax:54,primeCount:'2',compositeCount:'3',perfectSqCount:'0',highLow:'3:3',tog_numRange:true,tog_sumRange:true,tog_acRange:true,tog_evenCount:false,tog_consecMax:true,tog_sameTensMax:false,tog_stdRange:false,tog_tailRange:false,tog_primeCount:false,tog_compositeCount:false,tog_perfectSqCount:false,tog_highLow:false},
  recommend:{numMin:1,numMax:45,sumMin:100,sumMax:170,acMin:7,acMax:10,evenMin:2,evenMax:4,consecMax:'1',sameTensMax:'2',stdMin:6,stdMax:16,tailMin:0,tailMax:54,primeCount:'2',compositeCount:'3',perfectSqCount:'0',highLow:'3:3',tog_numRange:true,tog_sumRange:true,tog_acRange:true,tog_evenCount:true,tog_consecMax:true,tog_sameTensMax:true,tog_stdRange:true,tog_tailRange:false,tog_primeCount:false,tog_compositeCount:false,tog_perfectSqCount:false,tog_highLow:false}
};

function applyPreset(name) {
  const p=PRESETS[name]; if(!p) return;
  Object.entries(p).forEach(([id,val])=>{
    if(id.startsWith('tog_')){
      const el=document.getElementById(id); if(el){el.checked=val;applyToggleState(id.replace('tog_',''),val);}
    } else {
      const el=document.getElementById(id); if(el) el.value=val;
    }
  });
  document.querySelectorAll('.preset-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`[data-preset="${name}"]`)?.classList.add('active');
  saveSettings();
}

// ── DOMContentLoaded ──────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  buildNumGrid();

  // 기본 토글 ON 상태 초기화
  ['numRange','sumRange','acRange'].forEach(id=>{
    const el=document.getElementById('tog_'+id);
    if(el){ el.checked=true; applyToggleState(id,true); }
  });

  loadSettings(s=>{ applyStoredSettings(s); updateAll(); });
  bindAutoSave();
  bindToggles();

  document.querySelectorAll('.preset-btn').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));

  document.querySelectorAll('.count-btn').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.count-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); generateCount=parseInt(btn.dataset.count); saveSettings();
  }));

  document.getElementById('themeToggle').addEventListener('click',()=>{
    const html=document.documentElement;
    const isDark=html.getAttribute('data-theme')==='dark';
    html.setAttribute('data-theme',isDark?'light':'dark');
    document.getElementById('themeToggle').textContent=isDark?'☀️':'🌙';
    saveSettings();
  });

  document.getElementById('tabFixed').addEventListener('click',   ()=>switchTab('fixed'));
  document.getElementById('tabExclude').addEventListener('click', ()=>switchTab('exclude'));
  document.getElementById('tabPool').addEventListener('click',    ()=>switchTab('pool'));
  document.getElementById('clearFixedBtn').addEventListener('click',()=>{
    if(activeTab==='fixed') fixedNums.clear();
    else if(activeTab==='exclude') excludeNums.clear();
    else poolNums.clear();
    updateAll(); saveSettings();
  });

  document.getElementById('addAnalyzeBtn').addEventListener('click', addAnalyzeRow);
  addAnalyzeRow(); // 첫 줄 자동 생성
  document.getElementById('copyAllBtn').addEventListener('click', copyAll);

  document.getElementById('generateBtn').addEventListener('click',()=>{
    const btn=document.getElementById('generateBtn'), txt=document.getElementById('btnText');
    btn.classList.add('loading'); txt.textContent='생성 중...';
    setTimeout(()=>{ try{renderResults(generateMultiple(generateCount));}finally{btn.classList.remove('loading');txt.textContent='번호 생성';} },10);
  });
});
