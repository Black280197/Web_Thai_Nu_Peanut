/**
 * app.js — Chinese Flashcard Learning Tool
 *
 * Modes:
 *   1. Flashcard      – front shows one of {hanzi, pinyin, meaning}; click to flip.
 *   2. Multiple Choice – shows one field, asks about another; 4 options.
 *   3. Matching        – match 4 left-side items to their 4 right-side counterparts.
 */

'use strict';

// ─── Embedded fallback data (mirrors data.json; used when fetch is blocked) ─
const FALLBACK_DATA = [
  { hanzi: "吃", pinyin: "chī", meaning: "ăn", memory_hint: "Miệng (口) + cái gì đó — hình ảnh mở miệng ăn", radical: "口", extra: "Động từ, HSK1" },
  { hanzi: "喝", pinyin: "hē", meaning: "uống", memory_hint: "Bên trái là miệng (口), bên phải gợi âm thanh khi uống", radical: "口", extra: "Động từ, HSK1" },
  { hanzi: "看", pinyin: "kàn", meaning: "nhìn, xem", memory_hint: "Tay (手) che trên mắt (目) để nhìn xa — như che mắt nhìn trời", radical: "目", extra: "Động từ, HSK1" },
  { hanzi: "说", pinyin: "shuō", meaning: "nói", memory_hint: "Bên trái là bộ lời nói (讠), bên phải là âm thanh phát ra", radical: "讠", extra: "Động từ, HSK1" },
  { hanzi: "走", pinyin: "zǒu", meaning: "đi bộ", memory_hint: "Hình người đang bước chân — dáng người đang đi", radical: "走", extra: "Động từ, HSK1" },
  { hanzi: "来", pinyin: "lái", meaning: "đến, lại", memory_hint: "Hình cây lúa mì — người từ xa đến như gặt lúa về", radical: "木", extra: "Động từ, HSK1" },
  { hanzi: "去", pinyin: "qù", meaning: "đi, rời đi", memory_hint: "Hình người quay lưng đi khuất — đi mất rồi", radical: "厶", extra: "Động từ, HSK1" },
  { hanzi: "好", pinyin: "hǎo", meaning: "tốt, tốt lành", memory_hint: "Phụ nữ (女) + con cái (子) = gia đình hạnh phúc, tốt đẹp", radical: "女", extra: "Tính từ, HSK1" },
  { hanzi: "大", pinyin: "dà", meaning: "lớn, to", memory_hint: "Hình người giang rộng hai tay — thứ gì đó to lớn", radical: "大", extra: "Tính từ, HSK1" },
  { hanzi: "小", pinyin: "xiǎo", meaning: "nhỏ, bé", memory_hint: "Ba chấm nhỏ li ti đứng cạnh nhau — bé xíu", radical: "小", extra: "Tính từ, HSK1" },
  { hanzi: "水", pinyin: "shuǐ", meaning: "nước", memory_hint: "Hình dòng nước chảy uốn lượn — sóng nước", radical: "水", extra: "Danh từ, HSK1" },
  { hanzi: "爱", pinyin: "ài", meaning: "yêu, tình yêu", memory_hint: "Bên trong có trái tim (心) — tình yêu phát ra từ con tim", radical: "心", extra: "Động từ / Danh từ, HSK2" },
  { hanzi: "学", pinyin: "xué", meaning: "học", memory_hint: "Phần trên là mái trường, phần dưới là đứa trẻ (子) đang học bài", radical: "子", extra: "Động từ, HSK1" },
  { hanzi: "书", pinyin: "shū", meaning: "sách", memory_hint: "Hình quyển sách đang mở ra với các trang giấy", radical: "乙", extra: "Danh từ, HSK1" },
  { hanzi: "人", pinyin: "rén", meaning: "người", memory_hint: "Hai nét như hai chân người đang đứng chống đỡ nhau", radical: "人", extra: "Danh từ, HSK1" },
  { hanzi: "朋友", pinyin: "péngyǒu", meaning: "bạn bè", memory_hint: "Hai chữ 月 (trăng) cùng nhau — bạn bè sánh vai như trăng đôi", radical: "月", extra: "Danh từ, HSK1" },
  { hanzi: "谢谢", pinyin: "xièxiè", meaning: "cảm ơn", memory_hint: "Bộ lời nói (讠) lặp lại — nói lời biết ơn nhiều lần", radical: "讠", extra: "Cụm từ lịch sự, HSK1" },
  { hanzi: "工作", pinyin: "gōngzuò", meaning: "công việc, làm việc", memory_hint: "工 là thợ thủ công + 作 là làm — người thợ đang làm việc", radical: "工", extra: "Danh từ / Động từ, HSK1" }
];

// ─── Fields used for questions ─────────────────────────────────────────────
const QUESTION_FIELDS = ['hanzi', 'pinyin', 'meaning'];

const FIELD_META = {
  hanzi: { label: 'Hanzi 汉字', badge: '汉字' },
  pinyin: { label: 'Pinyin 拼音', badge: '拼音' },
  meaning: { label: 'Nghĩa', badge: '意思' },
  memory_hint: { label: 'Gợi nhớ', badge: '记忆' },
  radical: { label: 'Bộ thủ', badge: '部首' },
  extra: { label: 'Ghi chú', badge: '备注' }
};

// ─── App state ─────────────────────────────────────────────────────────────
let vocabulary = [];
let currentMode = 'flashcard';
let reviewedCount = 0;

// Flashcard state
let currentWord = null;
let previousWord = null;
let currentField = null;
let isRevealed = false;
let isAnimating = false;

// Multiple Choice state
let mcWord = null;
let mcQuestionField = null;
let mcAnswerField = null;
let mcOptions = [];
let mcCorrectIdx = null;
let mcAnswered = false;
let mcCorrect = 0;
let mcTotal = 0;

// Matching state
let matchingWords = [];
let matchingLeftField = 'hanzi';
let matchingRightField = 'meaning';
let matchingRightOrder = [];
let matchingSelected = null;
let matchingMatched = new Set();
let matchingScore = 0;

// ─── DOM helper ────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Shuffle helper (Fisher-Yates) ─────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Data loading ─────────────────────────────────────────────────────────
async function loadVocabulary() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Empty data');
    vocabulary = data;
    console.info(`[Flashcards] Loaded ${vocabulary.length} words from data.json`);
  } catch (err) {
    vocabulary = FALLBACK_DATA;
    console.info('[Flashcards] Using embedded fallback:', err.message);
  }

  $('total-words').textContent = `${vocabulary.length} từ`;
  restoreCardHTML();
  loadNewCard();
}

// ─── Mode switching ────────────────────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.mode === mode)
  );
  document.querySelectorAll('.mode-section').forEach(section =>
    section.classList.toggle('active', section.id === `mode-${mode}`)
  );

  const scoreWrap = $('mc-score-wrap');
  if (scoreWrap) scoreWrap.style.display = mode === 'multiple-choice' ? 'inline' : 'none';

  const footerHints = {
    'flashcard': 'Nhấp để lật · Nhấp lại để sang thẻ mới &nbsp;|&nbsp; Phím <kbd>Space</kbd> / <kbd>Enter</kbd> cũng hoạt động',
    'multiple-choice': 'Chọn đáp án đúng cho mỗi câu hỏi',
    'matching': 'Nhấp một ô bên trái, rồi nhấp ô tương ứng bên phải để nối',
  };
  $('footer-hint').innerHTML = footerHints[mode];

  if (mode === 'multiple-choice') { mcCorrect = 0; mcTotal = 0; startMCRound(); }
  else if (mode === 'matching') startMatchingRound();
}

// ─── UI helpers (flashcard) ────────────────────────────────────────────────
function showStateCard(icon, message, isError = false) {
  document.querySelector('.card-scene').innerHTML = `
    <div class="state-card ${isError ? 'error' : ''}">
      <span class="state-icon">${icon}</span>
      <span>${message}</span>
      ${isError ? `<span class="error-note">
        Mở <code>index.html</code> qua một server cục bộ<br>
        (ví dụ: <code>python -m http.server</code>) hoặc kiểm tra file data.json.
      </span>` : ''}
    </div>`;
}

function restoreCardHTML() {
  document.querySelector('.card-scene').innerHTML = `
    <div class="card" id="flashcard" role="button"
         tabindex="0" aria-label="Flashcard — click to reveal">
      <div class="card-inner">
        <div class="card-face card-front" id="card-front"></div>
        <div class="card-face card-back"  id="card-back"></div>
      </div>
    </div>`;
  const card = $('flashcard');
  card.addEventListener('click', handleCardClick);
  card.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleCardClick(); }
  });
}

// ─── Flashcard logic ───────────────────────────────────────────────────────
function getRandomWord() {
  if (vocabulary.length <= 1) return vocabulary[0];
  let word;
  do { word = vocabulary[Math.floor(Math.random() * vocabulary.length)]; }
  while (word === previousWord);
  return word;
}

function loadNewCard() {
  previousWord = currentWord;
  currentWord = getRandomWord();
  currentField = QUESTION_FIELDS[Math.floor(Math.random() * QUESTION_FIELDS.length)];
  isRevealed = false;
  renderFront();
  renderBack();
  const card = $('flashcard');
  if (card) card.classList.remove('flipped');
  $('action-hint').textContent = '✨ Nhấp thẻ để lật xem';
}

function renderFront() {
  const front = $('card-front');
  const meta = FIELD_META[currentField];

  let valueHTML;
  if (currentField === 'hanzi') {
    valueHTML = `<div class="hanzi-display">${currentWord.hanzi}</div>`;
  } else if (currentField === 'pinyin') {
    valueHTML = `<div class="field-display is-pinyin">${currentWord.pinyin}</div>`;
  } else {
    valueHTML = `<div class="field-display is-meaning">${currentWord.meaning}</div>`;
  }

  const prompts = {
    hanzi: 'Nghĩa và cách đọc của chữ này là gì?',
    pinyin: 'Chữ Hán nào có cách đọc này?',
    meaning: 'Chữ Hán nào mang nghĩa này?',
  };

  front.innerHTML = `
    <div class="hint-badge">${meta.badge} — ${meta.label}</div>
    ${valueHTML}
    <div class="hint-sub">${prompts[currentField]}</div>`;
}

function renderBack() {
  const back = $('card-back');
  const rows = [
    { key: 'hanzi', label: FIELD_META.hanzi.label, val: currentWord.hanzi, cls: 'hanzi-val' },
    { key: 'pinyin', label: FIELD_META.pinyin.label, val: currentWord.pinyin, cls: 'pinyin-val' },
    { key: 'meaning', label: FIELD_META.meaning.label, val: currentWord.meaning, cls: '' },
    { key: 'memory_hint', label: FIELD_META.memory_hint.label, val: currentWord.memory_hint, cls: '' },
    { key: 'radical', label: FIELD_META.radical.label, val: currentWord.radical, cls: '' },
    { key: 'extra', label: FIELD_META.extra.label, val: currentWord.extra, cls: '' },
  ];
  const rowsHTML = rows.map(r => `
    <div class="field-row ${r.key === currentField ? 'is-highlighted' : ''}">
      <span class="field-key">${r.label}</span>
      <span class="field-val ${r.cls}">${r.val}</span>
    </div>`).join('');
  back.innerHTML = `
    <div class="back-hanzi">${currentWord.hanzi}</div>
    <div class="fields-list">${rowsHTML}</div>`;
}

function handleCardClick() {
  if (isAnimating) return;
  const card = $('flashcard');

  if (!isRevealed) {
    isRevealed = true;
    isAnimating = true;
    reviewedCount++;
    card.classList.add('flipped');
    $('reviewed-count').textContent = `${reviewedCount} đã học`;
    $('action-hint').textContent = '➡️ Nhấp tiếp để sang từ mới';
    setTimeout(() => { isAnimating = false; }, 680);
  } else {
    isAnimating = true;
    card.classList.remove('flipped');
    setTimeout(() => {
      previousWord = currentWord;
      currentWord = getRandomWord();
      currentField = QUESTION_FIELDS[Math.floor(Math.random() * QUESTION_FIELDS.length)];
      renderFront();
      renderBack();
    }, 325);
    setTimeout(() => {
      isRevealed = false;
      isAnimating = false;
      $('action-hint').textContent = '✨ Nhấp thẻ để lật xem';
    }, 680);
  }
}

// ─── Multiple Choice ───────────────────────────────────────────────────────
function startMCRound() {
  mcAnswered = false;
  mcWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
  mcQuestionField = QUESTION_FIELDS[Math.floor(Math.random() * QUESTION_FIELDS.length)];
  const others = QUESTION_FIELDS.filter(f => f !== mcQuestionField);
  mcAnswerField = others[Math.floor(Math.random() * others.length)];

  const correct = mcWord[mcAnswerField];
  const pool = shuffle(
    vocabulary
      .filter(w => w !== mcWord)
      .map(w => w[mcAnswerField])
      .filter((v, i, arr) => v !== correct && arr.indexOf(v) === i)
  ).slice(0, 3);

  mcOptions = shuffle([...pool, correct]);
  mcCorrectIdx = mcOptions.indexOf(correct);
  mcTotal++;

  renderMCQuestion();
  $('mc-score').textContent = `${mcCorrect}/${mcTotal} đúng`;
}

function renderMCQuestion() {
  const meta = FIELD_META[mcQuestionField];
  $('mc-question-badge').textContent = `${meta.badge} — ${meta.label}`;

  const qDiv = $('mc-question-value');
  const value = mcWord[mcQuestionField];
  if (mcQuestionField === 'hanzi') {
    qDiv.innerHTML = `<div class="mc-hanzi">${value}</div>`;
  } else if (mcQuestionField === 'pinyin') {
    qDiv.innerHTML = `<div class="mc-pinyin">${value}</div>`;
  } else {
    qDiv.innerHTML = `<div class="mc-meaning">${value}</div>`;
  }

  const answerMeta = FIELD_META[mcAnswerField];
  const prompts = {
    hanzi: `Chữ Hán (${answerMeta.label}) là gì?`,
    pinyin: `Cách đọc (${answerMeta.label}) là gì?`,
    meaning: 'Nghĩa tiếng Việt là gì?',
  };
  $('mc-question-prompt').textContent = prompts[mcAnswerField];

  const container = $('mc-options');
  container.innerHTML = '';
  container.className = 'mc-options' + (mcAnswerField === 'hanzi' ? ' answer-hanzi' : '');

  mcOptions.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'mc-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleMCAnswer(idx));
    container.appendChild(btn);
  });
  $('mc-hint').textContent = 'Chọn đáp án đúng';
}

function handleMCAnswer(selectedIdx) {
  if (mcAnswered) return;
  mcAnswered = true;

  const options = document.querySelectorAll('.mc-option');
  options.forEach(btn => { btn.disabled = true; });

  const isCorrect = selectedIdx === mcCorrectIdx;
  options[selectedIdx].classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) options[mcCorrectIdx].classList.add('correct');

  if (isCorrect) {
    mcCorrect++;
    reviewedCount++;
    $('reviewed-count').textContent = `${reviewedCount} đã học`;
    $('mc-hint').textContent = '✅ Đúng rồi!';
  } else {
    $('mc-hint').textContent = `❌ Sai! Đáp án đúng: ${mcOptions[mcCorrectIdx]}`;
  }
  $('mc-score').textContent = `${mcCorrect}/${mcTotal} đúng`;
  setTimeout(startMCRound, 1700);
}

// ─── Matching ──────────────────────────────────────────────────────────────
function startMatchingRound() {
  matchingWords = shuffle(vocabulary).slice(0, Math.min(4, vocabulary.length));

  const pairs = [['hanzi', 'meaning'], ['hanzi', 'pinyin'], ['pinyin', 'meaning']];
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  matchingLeftField = pair[0];
  matchingRightField = pair[1];

  matchingRightOrder = shuffle([...Array(matchingWords.length).keys()]);
  matchingSelected = null;
  matchingMatched = new Set();
  matchingScore = 0;

  $('matching-result').textContent = '';
  $('matching-next').classList.add('hidden');

  const lm = FIELD_META[matchingLeftField];
  const rm = FIELD_META[matchingRightField];
  $('matching-subtitle').textContent =
    `Nối ${lm.label} (trái) với ${rm.label} (phải) tương ứng`;

  renderMatching();
}

function renderMatching() {
  const leftCol = $('matching-left');
  const rightCol = $('matching-right');
  leftCol.innerHTML = rightCol.innerHTML = '';

  const NUM_LABELS = ['1', '2', '3', '4'];
  const LET_LABELS = ['A', 'B', 'C', 'D'];

  matchingWords.forEach((word, idx) => {
    const item = document.createElement('div');
    item.className = 'matching-item left-item';
    item.dataset.idx = idx;
    const isHanzi = matchingLeftField === 'hanzi';
    item.innerHTML = `
      <span class="match-label">${NUM_LABELS[idx]}</span>
      <span class="match-text${isHanzi ? ' is-hanzi' : ''}">${word[matchingLeftField]}</span>`;
    item.addEventListener('click', () => handleMatchClick('left', idx));
    leftCol.appendChild(item);
  });

  matchingRightOrder.forEach((wordIdx, displayIdx) => {
    const word = matchingWords[wordIdx];
    const item = document.createElement('div');
    item.className = 'matching-item right-item';
    item.dataset.idx = displayIdx;
    item.dataset.wordIdx = wordIdx;
    const isHanzi = matchingRightField === 'hanzi';
    item.innerHTML = `
      <span class="match-label">${LET_LABELS[displayIdx]}</span>
      <span class="match-text${isHanzi ? ' is-hanzi' : ''}">${word[matchingRightField]}</span>`;
    item.addEventListener('click', () => handleMatchClick('right', displayIdx));
    rightCol.appendChild(item);
  });
}

function handleMatchClick(side, idx) {
  if (side === 'left') {
    const item = document.querySelector(`.left-item[data-idx="${idx}"]`);
    if (!item || item.classList.contains('matched-correct')) return;
    if (matchingSelected) {
      const prev = document.querySelector(`.left-item[data-idx="${matchingSelected.idx}"]`);
      if (prev) prev.classList.remove('selected');
      if (matchingSelected.idx === idx) { matchingSelected = null; return; }
    }
    matchingSelected = { side: 'left', idx };
    item.classList.add('selected');
  } else {
    if (!matchingSelected || matchingSelected.side !== 'left') return;
    const item = document.querySelector(`.right-item[data-idx="${idx}"]`);
    if (!item || item.classList.contains('matched-correct')) return;

    const leftIdx = matchingSelected.idx;
    const rightWordIdx = parseInt(item.dataset.wordIdx, 10);
    const leftItem = document.querySelector(`.left-item[data-idx="${leftIdx}"]`);
    if (leftItem) leftItem.classList.remove('selected');
    matchingSelected = null;

    if (leftIdx === rightWordIdx) {
      if (leftItem) leftItem.classList.add('matched-correct');
      item.classList.add('matched-correct');
      matchingMatched.add(leftIdx);
      matchingScore++;
      reviewedCount++;
      $('reviewed-count').textContent = `${reviewedCount} đã học`;
      if (matchingScore === matchingWords.length) {
        $('matching-result').textContent = '🎉 Hoàn thành! Tất cả đúng!';
        $('matching-next').classList.remove('hidden');
      }
    } else {
      if (leftItem) leftItem.classList.add('matched-wrong');
      item.classList.add('matched-wrong');
      setTimeout(() => {
        if (leftItem) leftItem.classList.remove('matched-wrong');
        item.classList.remove('matched-wrong');
      }, 800);
    }
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mode-tab').forEach(btn =>
    btn.addEventListener('click', () => switchMode(btn.dataset.mode))
  );

  const nextBtn = $('matching-next');
  if (nextBtn) nextBtn.addEventListener('click', startMatchingRound);

  const initialCard = $('flashcard');
  if (initialCard) {
    initialCard.addEventListener('click', handleCardClick);
    initialCard.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleCardClick(); }
    });
  }

  loadVocabulary();
});

