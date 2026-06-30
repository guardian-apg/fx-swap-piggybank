// ===== 1. 定数定義 =====

// 非対応証券会社リスト
const UNSUPPORTED_BROKERS = new Set(['saxo_bank']);

// 証券会社マスタ
const BROKER_NAMES = {
  sbi_fx:        'SBI FXトレード',
  gmo_fx:        'GMOクリック証券',
  dmm_fx:        'DMM FX',
  oanda_fx:      'OANDA Japan',
  gaitame:       '外為どっとコム',
  minnano_fx:    'みんなのFX',
  matsui_fx:     '松井証券FX',
  central_fx:    'セントラル短資FX',
  lion_fx:       'ヒロセ通商 LION FX',
  kabu_com:      'auカブコム証券',
  gaitame_online:'外為オンライン',
  m2j:           'マネースクエア',
  himawari:      'ひまわり証券',
  monex_fx:      'マネックスFX',
  rakuten_fx:    '楽天証券FX',
  light_fx:      'Light FX',
  okasan_fx:     '岡三オンライン',
  saxo_bank:     'サクソバンク証券',
};

// 証券会社略称（カードアイコン用）
const BROKER_SHORT = {
  sbi_fx:        'SBI',
  gmo_fx:        'GMO',
  dmm_fx:        'DMM',
  oanda_fx:      'OAN',
  gaitame:       '外為ど',
  minnano_fx:    'みんな',
  matsui_fx:     '松井',
  central_fx:    'CTL',
  lion_fx:       'LION',
  kabu_com:      'KAB',
  gaitame_online:'GTO',
  m2j:           'M2J',
  himawari:      'ひま',
  monex_fx:      'MNX',
  rakuten_fx:    '楽天',
  light_fx:      'LFX',
  okasan_fx:     '岡三',
  saxo_bank:     'SAX',
};

// 全アフィリエイト会社リスト（ロゴ画像・キャンペーン情報付き）
const ALL_AFFILIATES = [
  { name: 'SBI FXトレード',     broker_id: 'sbi_fx', logo: 'banner_sbi.png' },
  { name: 'GMOクリック証券',     broker_id: 'gmo_fx', logo: 'banner_gmo.png' },
  { name: 'DMM FX',            broker_id: 'dmm_fx', logo: 'banner_dmm.png' },
  { name: 'みんなのFX',         broker_id: 'minnano_fx', logo: 'https://min-fx.jp/wp-content/themes/minfx/images/common/logo.svg' },
  { name: '外為どっとコム',      broker_id: 'gaitame', logo: 'https://www.gaitame.com/assets/img/common/logo.png' },
  { name: '松井証券FX',         broker_id: 'matsui_fx', logo: 'https://www.matsui.co.jp/img/logo.gif' },
  { name: 'セントラル短資FX',    broker_id: 'central_fx', logo: 'https://www.central-tanshifx.com/common-v2/images/logo.png' },
  { name: 'LION FX',           broker_id: 'lion_fx', logo: 'https://hirose-fx.jp/img/logo.gif' },
  { name: 'auカブコム証券',      broker_id: 'kabu_com', logo: 'https://kabu.com/img/common/logo_kabu.svg' },
  { name: '外為オンライン',      broker_id: 'gaitame_online', logo: 'https://www.gaitameonline.com/images/common/header_logo.gif' },
  { name: 'マネースクエア',      broker_id: 'm2j', logo: 'https://www.m2j.co.jp/img/logo.svg' },
  { name: 'ひまわり証券',        broker_id: 'himawari', logo: 'https://sec.himawari-group.co.jp/images/common/logo.gif' },
  { name: 'マネックスFX',        broker_id: 'monex_fx', logo: 'https://sec.himawari-group.co.jp/images/common/logo.gif' },
  { name: '楽天証券FX',          broker_id: 'rakuten_fx', logo: 'https://www.rakuten-sec.co.jp/img/header/logo.svg' },
  { name: 'Light FX',           broker_id: 'light_fx', logo: 'https://lightfx.jp/wp-content/themes/lightfx/images/common/logo.svg' },
  { name: '岡三オンライン',       broker_id: 'okasan_fx', logo: 'https://www.okasan-online.co.jp/images/logo.png' },
];

// 通貨ペア表示名
const PAIR_NAMES = {
  USD_JPY: '米ドル/円',
  EUR_JPY: 'ユーロ/円',
  GBP_JPY: '英ポンド/円',
  AUD_JPY: '豪ドル/円',
  NZD_JPY: 'NZドル/円',
  CAD_JPY: 'カナダドル/円',
  CHF_JPY: 'スイスフラン/円',
  ZAR_JPY: '南アランド/円',
  TRY_JPY: 'トルコリラ/円',
  MXN_JPY: 'メキシコペソ/円',
  CZK_JPY: 'チェココルナ/円',
  HUF_JPY: 'ハンガリーフォリント/円',
  RUB_JPY: 'ロシアルーブル/円',
  CNH_JPY: '人民元/円',
  HKD_JPY: '香港ドル/円',
  SGD_JPY: 'シンガポールドル/円',
  PLN_JPY: 'ポーランドズロチ/円',
  NOK_JPY: 'ノルウェークローネ/円',
  SEK_JPY: 'スウェーデンクローナ/円',
};

// シミュレーション期間ラベル
const PERIOD_LABELS = {
  30:   '1ヶ月',
  90:   '3ヶ月',
  180:  '6ヶ月',
  365:  '12ヶ月',
  1095: '3年',
  1825: '5年',
  3650: '10年',
};

// ===== 2. 状態管理 =====
let state = {
  uid:           null,
  email:         null,
  isDemoMode:    false,
  positions:     [],
  masterSwaps:   [],
  swapHistory:   [],
  todaySwap:     0,
  currentTab:    'home',
  bannerIndex:   0,
  simChart:      null,
  editingPosId:  null,
};

// ===== 3. DOM要素の取得 =====
const els = {
  loginOverlay:      document.getElementById('login-overlay'),
  appShell:          document.getElementById('app-shell'),
  loginForm:         document.getElementById('login-form'),
  loginEmail:        document.getElementById('login-email'),
  loginPassword:     document.getElementById('login-password'),
  loginBtn:          document.getElementById('login-btn'),
  loginError:        document.getElementById('login-error'),
  demoBtn:           document.getElementById('demo-login-btn'),
  registerForm:      document.getElementById('register-form'),
  regEmail:          document.getElementById('reg-email'),
  regPassword:       document.getElementById('reg-password'),
  registerBtn:       document.getElementById('register-btn'),
  resetForm:         document.getElementById('reset-form'),
  resetEmail:        document.getElementById('reset-email'),
  resetBtn:          document.getElementById('reset-btn'),
  showRegisterLink:  document.getElementById('show-register-link'),
  showResetLink:     document.getElementById('show-reset-link'),
  showLoginLink:     document.getElementById('show-login-link'),
  showLoginLink2:    document.getElementById('show-login-link2'),
  registerSwitch:    document.getElementById('register-switch'),
  resetSwitch:       document.getElementById('reset-switch'),
  // タブ
  tabBtns:           document.querySelectorAll('.tab-btn'),
  tabPanels:         document.querySelectorAll('.tab-panel'),
  // Home
  homeTodayValue:    document.getElementById('home-today-value'),
  homeMonthlyValue:  document.getElementById('home-monthly-value'),
  homeTotalValue:    document.getElementById('home-total-value'),
  homeAccountCount:  document.getElementById('home-account-count'),
  homeMonthlyEst:    document.getElementById('home-monthly-est'),
  homeDate:          document.getElementById('home-date'),
  homePositionList:  document.getElementById('home-position-list'),
  homeMenuBtn:       document.getElementById('home-menu-btn'),
  homeSettingsShortcut: document.getElementById('home-settings-shortcut'),
  // Detail
  accountCardsContainer: document.getElementById('account-cards-container'),
  passbookList:          document.getElementById('passbook-list'),
  // Simulation
  simPeriodSelect:   document.getElementById('sim-period-select'),
  simChart:          document.getElementById('sim-chart'),
  simTotalValue:     document.getElementById('sim-total-value'),
  simTotalUnit:      document.getElementById('sim-total-unit'),
  simPeriodNote:     document.getElementById('sim-period-note'),
  // Menu
  menuUserEmail:     document.getElementById('menu-user-email'),
  menuItemSettings:  document.getElementById('menu-item-settings'),
  menuItemTerms:     document.getElementById('menu-item-terms'),
  menuItemPrivacy:   document.getElementById('menu-item-privacy'),
  menuItemDisclaimer:document.getElementById('menu-item-disclaimer'),
  menuItemContact:   document.getElementById('menu-item-contact'),
  menuItemLogout:    document.getElementById('menu-item-logout'),
  // CRUD
  crudFormTitle:     document.getElementById('crud-form-title'),
  crudEditId:        document.getElementById('crud-edit-id'),
  crudBroker:        document.getElementById('crud-broker'),
  crudPair:          document.getElementById('crud-pair'),
  crudDirection:     document.getElementById('crud-direction'),
  crudAmount:        document.getElementById('crud-amount'),
  crudInitialSwap:   document.getElementById('crud-initial-swap'),
  crudSaveBtn:       document.getElementById('crud-save-btn'),
  crudCancelBtn:     document.getElementById('crud-cancel-btn'),
  crudPositionList:  document.getElementById('crud-position-list'),
  // アラート
  alertUnsupported:  document.getElementById('alert-unsupported'),
  alertManualCheck:  document.getElementById('alert-manual-check'),
  alertOkBtn:        document.getElementById('alert-unsupported-ok'),
  alertManualBtn:    document.getElementById('alert-unsupported-manual'),
  // バナー
  bannerSlider:      document.getElementById('banner-slider'),
  // スナックバー
  snackbar:          document.getElementById('snackbar'),
};

// ===== 4. 初期化関数 =====
function init() {
  setupAuthListeners();
  setupTabListeners();
  setupMenuListeners();
  setupModalListeners();
  setupCRUDListeners();
  setupAlertListeners();
  setupSimulation();
  renderBannerTiles();
  updateHomeDate();
}

// ===== 5. 認証関連 =====
function setupAuthListeners() {
  // ログインフォーム
  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearLoginError();
    const email = els.loginEmail.value.trim();
    const password = els.loginPassword.value;
    if (!validatePassword(password)) {
      showLoginError('パスワードは英数字8文字以上で入力してください。');
      return;
    }
    els.loginBtn.textContent = 'ログイン中...';
    try {
      await authLogin(email, password);
    } catch (err) {
      showLoginError(getAuthErrorMessage(err.code));
      els.loginBtn.textContent = 'ログイン';
    }
  });

  // デモモードボタン
  els.demoBtn.addEventListener('click', () => {
    state.isDemoMode = true;
    window.FIREBASE_DEMO_MODE = true;
    state.uid   = 'demo_user';
    state.email = 'demo@example.com';
    onUserLoggedIn('demo_user', 'demo@example.com');
  });

  // 新規登録フォーム
  els.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearLoginError();
    const email    = els.regEmail.value.trim();
    const password = els.regPassword.value;
    if (!validatePassword(password)) {
      showLoginError('パスワードは英数字8文字以上で入力してください。');
      return;
    }
    els.registerBtn.textContent = '登録中...';
    try {
      await authRegister(email, password);
    } catch (err) {
      showLoginError(getAuthErrorMessage(err.code));
      els.registerBtn.textContent = '新規登録';
    }
  });

  // パスワードリセット
  els.resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = els.resetEmail.value.trim();
    try {
      await authResetPassword(email);
      showLoginError('パスワードリセットメールを送信しました。');
      els.loginError.style.background = 'rgba(16,185,129,0.1)';
      els.loginError.style.borderColor = 'rgba(16,185,129,0.3)';
      els.loginError.style.color = '#34d399';
    } catch (err) {
      showLoginError(getAuthErrorMessage(err.code));
    }
  });

  // フォーム切り替え
  els.showRegisterLink.addEventListener('click', () => switchForm('register'));
  els.showResetLink.addEventListener('click',    () => switchForm('reset'));
  els.showLoginLink.addEventListener('click',    () => switchForm('login'));
  els.showLoginLink2.addEventListener('click',   () => switchForm('login'));

  // Firebase認証状態監視
  if (!window.FIREBASE_DEMO_MODE) {
    onAuthChange((user) => {
      if (user) {
        window.FIREBASE_DEMO_MODE = false;
        onUserLoggedIn(user.uid, user.email);
      } else {
        onUserLoggedOut();
      }
    });
  }
}

function switchForm(form) {
  clearLoginError();
  els.loginForm.style.display     = form === 'login'    ? '' : 'none';
  els.registerForm.style.display  = form === 'register' ? '' : 'none';
  els.resetForm.style.display     = form === 'reset'    ? '' : 'none';
  els.registerSwitch.style.display = form === 'register' ? '' : 'none';
  els.resetSwitch.style.display    = form === 'reset'    ? '' : 'none';
}

async function onUserLoggedIn(uid, email) {
  state.uid   = uid;
  state.email = email;
  els.menuUserEmail.textContent = email;
  els.loginOverlay.classList.add('hidden');
  els.appShell.classList.remove('hidden');
  await loadAllData();
}

function onUserLoggedOut() {
  state.uid = null;
  els.appShell.classList.add('hidden');
  els.loginOverlay.classList.remove('hidden');
}

function validatePassword(pw) {
  return pw && pw.length >= 8;
}

function getAuthErrorMessage(code) {
  const map = {
    'auth/user-not-found':      'メールアドレスが見つかりません。',
    'auth/wrong-password':      'パスワードが正しくありません。',
    'auth/invalid-email':       'メールアドレスの形式が正しくありません。',
    'auth/email-already-in-use':'このメールアドレスはすでに使用されています。',
    'auth/weak-password':       'パスワードが弱すぎます。8文字以上にしてください。',
    'auth/too-many-requests':   'ログイン試行回数が多すぎます。しばらく時間をおいてください。',
    'auth/invalid-credential':  'メールアドレスまたはパスワードが正しくありません。',
  };
  return map[code] || 'エラーが発生しました。もう一度お試しください。';
}

function showLoginError(msg) {
  els.loginError.textContent = msg;
  els.loginError.classList.add('show');
}

function clearLoginError() {
  els.loginError.textContent = '';
  els.loginError.classList.remove('show');
  els.loginError.style.background = '';
  els.loginError.style.borderColor = '';
  els.loginError.style.color = '';
}

// ===== 6. データ読み込み =====
async function loadAllData() {
  try {
    const results = await Promise.allSettled([
      fetchPositions(state.uid),
      fetchLatestMasterSwaps(),
      fetchSwapHistory(state.uid),
    ]);

    state.positions = results[0].status === 'fulfilled' ? results[0].value : [];
    
    if (results[1].status === 'fulfilled') {
      state.masterSwaps = results[1].value;
      state.isSubscribed = true;
    } else {
      state.masterSwaps = [];
      state.isSubscribed = false;
      const err = results[1].reason;
      if (err && (err.code === 'permission-denied' || err.message.includes('PERMISSION_DENIED'))) {
        showSnackbar('有効なサブスクリプションがありません。市場データを利用するには購読が必要です。');
      } else {
        showSnackbar('市場データの取得に失敗しました');
      }
    }

    state.swapHistory = results[2].status === 'fulfilled' ? results[2].value : [];
    updateAllUI();
  } catch (err) {
    console.error('データ読み込みエラー:', err);
    showSnackbar('データの読み込みに失敗しました');
  }
}

function updateAllUI() {
  updateHomeTab();
  updateDetailTab();
  if (state.currentTab === 'sim') {
    updateSimulation();
  }
}

// ===== 7. Tab切り替え =====
function setupTabListeners() {
  els.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // ヘッダーのハンバーガーボタン → Menuタブへ
  els.homeMenuBtn.addEventListener('click', () => switchTab('menu'));

  // ヘッダーの「口座・保有通貨の設定」ショートカットボタン
  els.homeSettingsShortcut.addEventListener('click', () => openModal('modal-settings'));
}

function switchTab(tab) {
  state.currentTab = tab;
  els.tabBtns.forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });
  els.tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tab}`);
  });
  if (tab === 'sim') updateSimulation();
  
  // タブ切り替え時にバナーローテーションを発火
  rotateBanners();
}

// ===== 8. Tab 1: Home =====
function updateHomeDate() {
  const now = new Date();
  els.homeDate.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
}

function updateHomeTab() {
  const today = getTodayString();
  let todayTotal = 0;

  // 本日のスワップ合計計算
  for (const pos of state.positions) {
    const master = findMasterSwap(pos.broker_id, pos.currency_pair, pos.direction);
    if (master) {
      const earned = pos.amount * master.swap_per_single_unit * master.days_attributed;
      todayTotal += earned;
    }
  }
  state.todaySwap = todayTotal;

  // 累計スワップ（履歴から集計 ＋ これまで獲得したスワップの初期登録値）
  const initialSwapsSum = state.positions.reduce((s, p) => s + (parseInt(p.initial_swap, 10) || 0), 0);
  const totalSwap = state.swapHistory.reduce((s, h) => s + (h.earned_amount || 0), 0) + initialSwapsSum;

  // 今月合計
  const thisMonth = today.slice(0, 7); // "YYYY-MM"
  const monthlySwap = state.swapHistory
    .filter(h => h.date && h.date.startsWith(thisMonth))
    .reduce((s, h) => s + (h.earned_amount || 0), 0);

  // 月次換算（直近日次 × 30）
  const monthlyEst = todayTotal * 30;

  // 表示更新
  animateNumber(els.homeTodayValue, todayTotal);
  els.homeMonthlyValue.textContent = formatComma(Math.round(monthlySwap));
  els.homeTotalValue.textContent   = formatComma(Math.round(totalSwap));
  els.homeAccountCount.textContent = state.positions.length;
  els.homeMonthlyEst.textContent   = formatComma(Math.round(monthlyEst));

  // ポジションチップ
  renderHomePositionChips();
}

function renderHomePositionChips() {
  if (state.positions.length === 0) {
    els.homePositionList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>
        <div class="empty-state-title">ポジションが未登録です</div>
        <div class="empty-state-desc">Menuタブ → 口座・保有通貨の設定から<br>FX口座を登録してください</div>
      </div>`;
    return;
  }

  els.homePositionList.innerHTML = state.positions.map((pos, i) => {
    const master = findMasterSwap(pos.broker_id, pos.currency_pair, pos.direction);
    const earned = master
      ? pos.amount * master.swap_per_single_unit * master.days_attributed
      : 0;
    const delay = i * 80;
    return `
      <div class="position-chip" style="animation-delay:${delay}ms;">
        <div class="position-chip-left">
          <div class="position-chip-name">
            ${BROKER_NAMES[pos.broker_id] || pos.broker_id}
            <span class="direction-badge ${pos.direction}">${pos.direction === 'buy' ? '買' : '売'}</span>
          </div>
          <div class="position-chip-sub">${PAIR_NAMES[pos.currency_pair] || pos.currency_pair} ／ <span class="italic-num">${formatComma(pos.amount)}</span>通貨</div>
        </div>
        <div class="position-chip-amount">+${formatComma(Math.round(earned))}円</div>
      </div>`;
  }).join('');
}

// ===== 9. Tab 2: Detail =====
function updateDetailTab() {
  renderAccountCards();
  renderPassbook();
}

function renderAccountCards() {
  if (state.positions.length === 0) {
    els.accountCardsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </div>
        <div class="empty-state-title">口座が未登録です</div>
        <div class="empty-state-desc">Menuタブから口座を登録してください</div>
      </div>`;
    return;
  }

  els.accountCardsContainer.innerHTML = state.positions.map((pos, i) => {
    const master = findMasterSwap(pos.broker_id, pos.currency_pair, pos.direction);
    const dailySwap = master
      ? pos.amount * master.swap_per_single_unit * master.days_attributed
      : 0;

    // 累計スワップ（この口座分 ＋ これまで獲得したスワップ）
    const cumulSwap = state.swapHistory
      .filter(h => h.broker_id === pos.broker_id && h.currency_pair === pos.currency_pair)
      .reduce((s, h) => s + (h.earned_amount || 0), 0) + (parseInt(pos.initial_swap, 10) || 0);

    // ダミー評価損益・維持率・レバレッジ（実データは証券会社API連携が必要）
    const evalPnl    = 0;   // ダミー
    const netAssets  = 0;   // ダミー
    const mainRatio  = 999; // ダミー（高水準）
    const leverage   = 3.2; // ダミー

    const ratioClass = mainRatio >= 500 ? 'safe' : mainRatio >= 200 ? 'warning' : 'danger';
    const evalClass  = evalPnl >= 0 ? 'green' : 'red';
    const short      = BROKER_SHORT[pos.broker_id] || '??';

    return `
      <div class="account-card" style="animation-delay:${i*100}ms;">
        <div class="account-card-header">
          <div class="broker-icon">${short}</div>
          <div>
            <div class="account-card-title">${BROKER_NAMES[pos.broker_id] || pos.broker_id}</div>
            <div class="account-card-subtitle">${PAIR_NAMES[pos.currency_pair] || pos.currency_pair} ／ <span class="direction-badge ${pos.direction}">${pos.direction === 'buy' ? '買い' : '売り'}</span></div>
          </div>
        </div>
        <div class="account-metrics">
          <div class="metric-item">
            <div class="metric-label">累計スワップ</div>
            <div class="metric-value orange">+${formatComma(Math.round(cumulSwap))}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">本日獲得</div>
            <div class="metric-value orange">+${formatComma(Math.round(dailySwap))}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">評価損益</div>
            <div class="metric-value ${evalClass}">${evalPnl >= 0 ? '+' : ''}${formatComma(evalPnl)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">純資産</div>
            <div class="metric-value">${formatComma(netAssets)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">保有数量</div>
            <div class="metric-value">${formatComma(pos.amount)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">レバレッジ</div>
            <div class="metric-value">${leverage.toFixed(1)}倍</div>
          </div>
        </div>
        <!-- 証拠金維持率（最強調） -->
        <div class="maintenance-ratio-row">
          <span class="maintenance-label">証拠金維持率</span>
          <span class="maintenance-value ${ratioClass}">${mainRatio.toFixed(1)}<small class="leverage-badge">%</small></span>
        </div>
      </div>`;
  }).join('');
}

function renderPassbook() {
  if (state.swapHistory.length === 0) {
    els.passbookList.innerHTML = `<div class="empty-state" style="padding:24px;"><div class="empty-state-desc">スワップ付与履歴がありません</div></div>`;
    return;
  }

  els.passbookList.innerHTML = state.swapHistory.map((h, i) => {
    const dateStr   = h.date ? h.date.replace(/-/g, '/') : '-';
    const pairLabel = `${BROKER_SHORT[h.broker_id] || h.broker_id} / ${h.currency_pair || '-'}`;
    const delay     = Math.min(i * 40, 400);
    return `
      <div class="passbook-row" style="animation-delay:${delay}ms;">
        <span class="passbook-date">${dateStr}</span>
        <span class="passbook-pair">${pairLabel}</span>
        <span class="passbook-days">${h.days_attributed || 1}日分</span>
        <span class="passbook-amount">+${formatComma(Math.round(h.earned_amount || 0))}円</span>
      </div>`;
  }).join('');
}

// ===== 10. Tab 3: Simulation =====
function setupSimulation() {
  els.simPeriodSelect.addEventListener('change', updateSimulation);
}

function updateSimulation() {
  const totalDays = parseInt(els.simPeriodSelect.value, 10);
  const periodLabel = PERIOD_LABELS[totalDays] || `${totalDays}日`;

  // 月次データ生成（月ごとの累積スワップ）
  const monthlyData = buildMonthlySimData(totalDays);
  const totalSwap   = monthlyData.reduce((s, v) => s + v.value, 0);

  // Y軸スケーリング
  const useMan = totalSwap >= 100000;

  // グラフ更新
  drawSimChart(monthlyData, useMan);

  // 合計表示
  if (useMan) {
    const man = totalSwap / 10000;
    els.simTotalValue.textContent = man >= 100
      ? formatComma(Math.round(man))
      : man.toFixed(1);
    els.simTotalUnit.textContent = '万円';
  } else {
    els.simTotalValue.textContent = formatComma(Math.round(totalSwap));
    els.simTotalUnit.textContent  = '円';
  }

  els.simPeriodNote.textContent = `${periodLabel}間の単利計算（日次スワップ × ${totalDays}日）`;
}

function buildMonthlySimData(totalDays) {
  // 全ポジションの1日あたりスワップを計算
  let dailyTotal = 0;
  for (const pos of state.positions) {
    const master = findMasterSwap(pos.broker_id, pos.currency_pair, pos.direction);
    if (master) {
      const dailyPerUnit = master.swap_per_single_unit;
      dailyTotal += pos.amount * dailyPerUnit;
    }
  }

  // 期間日数に対応する月数を決める
  let numMonths = 12;
  if (totalDays <= 30) numMonths = 1;
  else if (totalDays <= 90) numMonths = 3;
  else if (totalDays <= 180) numMonths = 6;
  else if (totalDays <= 365) numMonths = 12;
  else if (totalDays <= 1095) numMonths = 36;
  else if (totalDays <= 1825) numMonths = 60;
  else if (totalDays <= 3650) numMonths = 120;

  const daysPerMonth = totalDays / numMonths;

  // ラベル間引き間隔を決める
  // 5年(60ヶ月)→3ヶ月ごと、10年(120ヶ月)→6ヶ月ごと
  let labelInterval = 1;
  if (numMonths >= 120) labelInterval = 6;
  else if (numMonths >= 60) labelInterval = 3;

  return Array.from({ length: numMonths }, (_, i) => {
    const monthNum = i + 1;
    let label;
    if (labelInterval > 1) {
      label = (monthNum % labelInterval === 0) ? `${monthNum}ヶ月` : '';
    } else {
      label = `${monthNum}ヶ月`;
    }
    return { label, value: dailyTotal * daysPerMonth };
  });
}

function drawSimChart(monthlyData, useMan) {
  const labels = monthlyData.map(d => d.label);
  const values = monthlyData.map(d => useMan ? d.value / 10000 : d.value);

  if (state.simChart) {
    state.simChart.destroy();
  }

  state.simChart = new Chart(els.simChart, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: useMan ? 'スワップ（万円）' : 'スワップ（円）',
        data: values,
        backgroundColor: 'rgba(57, 255, 20, 0.7)',
        borderColor:     '#39FF14',
        borderWidth:     1.5,
        borderRadius:    4,
        borderSkipped:   false,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.y;
              return useMan
                ? ` ${val.toFixed(2)} 万円`
                : ` ${formatComma(Math.round(val))} 円`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#E0E0E0', lineWidth: 1 },
          ticks: {
            color: '#555',
            font: { size: 10 },
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          grid: { color: '#E0E0E0', lineWidth: 1 },
          beginAtZero: true,
          ticks: {
            color: '#555',
            font:  { size: 10 },
            callback: val => useMan
              ? `${val.toFixed(1)}万`
              : `${formatComma(Math.round(val))}円`,
          },
        },
      },
    },
  });
}

// ===== 11. Tab 4: Menu =====
function setupMenuListeners() {
  els.menuItemSettings.addEventListener('click',   () => openModal('modal-settings'));
  els.menuItemTerms.addEventListener('click',      () => openModal('modal-terms'));
  els.menuItemPrivacy.addEventListener('click',    () => openModal('modal-privacy'));
  els.menuItemDisclaimer.addEventListener('click', () => openModal('modal-disclaimer'));
  els.menuItemContact.addEventListener('click',    () => openModal('modal-contact'));
  els.menuItemLogout.addEventListener('click',     handleLogout);
}

async function handleLogout() {
  if (!confirm('ログアウトしますか？')) return;
  try {
    if (!state.isDemoMode) {
      await authLogout();
    }
    state.uid = null;
    state.isDemoMode = false;
    window.FIREBASE_DEMO_MODE = false;
    onUserLoggedOut();
  } catch (err) {
    showSnackbar('ログアウトに失敗しました');
  }
}

// ===== 12. モーダル制御 =====
function setupModalListeners() {
  // data-close属性で閉じる
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.close;
      closeModal(id);
    });
  });

  // オーバーレイクリックで閉じる
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  if (id === 'modal-settings') renderCRUDList();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// 数量・金額入力時にリアルタイムでカンマを付与する（カーソル位置維持対応）
function formatCurrencyInput(e) {
  const input = e.target;
  const originalValue = input.value;
  const cursorPosition = input.selectionStart;
  
  // 数字以外の文字を排除
  const value = originalValue.replace(/[^\d]/g, '');
  if (value) {
    const formatted = parseInt(value, 10).toLocaleString('ja-JP');
    input.value = formatted;
    
    // カンマ追加による文字数変化を考慮してカーソル位置を調整
    const commasBefore = (originalValue.substring(0, cursorPosition).match(/,/g) || []).length;
    const rawNumbersBefore = originalValue.substring(0, cursorPosition).replace(/[^\d]/g, '').length;
    
    // 新しい文字列内でのカーソル位置を算出
    let newCursorPosition = 0;
    let numbersSeen = 0;
    while (newCursorPosition < formatted.length && numbersSeen < rawNumbersBefore) {
      if (formatted[newCursorPosition] !== ',') {
        numbersSeen++;
      }
      newCursorPosition++;
    }
    // 隣り合うカンマの直後にカーソルが来る場合の微調整
    while (newCursorPosition < formatted.length && formatted[newCursorPosition] === ',') {
      newCursorPosition++;
    }
    
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  } else {
    input.value = '';
  }
}

// ===== 13. CRUD（口座設定） =====
function setupCRUDListeners() {
  els.crudBroker.addEventListener('change', () => {
    const broker = els.crudBroker.value;
    if (UNSUPPORTED_BROKERS.has(broker)) {
      openAlertUnsupported();
      els.crudBroker.value = '';
    }
  });

  els.crudAmount.addEventListener('input', formatCurrencyInput);
  els.crudInitialSwap.addEventListener('input', formatCurrencyInput);

  els.crudSaveBtn.addEventListener('click', handleCRUDSave);
  els.crudCancelBtn.addEventListener('click', resetCRUDForm);
}

async function handleCRUDSave() {
  const broker    = els.crudBroker.value;
  const pair      = els.crudPair.value;
  const direction = els.crudDirection.value;
  // カンマを除去して数値に変換
  const rawAmountStr = els.crudAmount.value.replace(/,/g, '');
  const amount    = parseInt(rawAmountStr, 10);
  const rawInitialSwapStr = els.crudInitialSwap.value.replace(/,/g, '');
  const initialSwap = parseInt(rawInitialSwapStr, 10) || 0;

  if (!broker || !pair || !direction || !amount || amount <= 0) {
    showSnackbar('すべての項目を入力してください');
    return;
  }

  const posData = { broker_id: broker, currency_pair: pair, direction, amount, initial_swap: initialSwap };

  try {
    const editId = els.crudEditId.value;
    if (editId) {
      await editPosition(state.uid, editId, posData);
      showSnackbar('ポジションを更新しました');
    } else {
      await savePosition(state.uid, posData);
      showSnackbar('ポジションを登録しました');
    }
    await loadAllData();
    renderCRUDList();
    resetCRUDForm();
  } catch (err) {
    showSnackbar('保存に失敗しました: ' + err.message);
  }
}

function renderCRUDList() {
  if (state.positions.length === 0) {
    els.crudPositionList.innerHTML = `<li style="padding:16px;color:var(--text-dim);text-align:center;font-size:13px;">登録されたポジションはありません</li>`;
    return;
  }

  els.crudPositionList.innerHTML = state.positions.map((pos) => `
    <li class="position-list-item">
      <div class="position-info">
        <div class="position-info-name">
          ${BROKER_NAMES[pos.broker_id] || pos.broker_id}
          <span class="direction-badge ${pos.direction}" style="margin-left:4px;">${pos.direction === 'buy' ? '買' : '売'}</span>
        </div>
        <div class="position-info-detail">
          ${PAIR_NAMES[pos.currency_pair] || pos.currency_pair} ／ <span class="italic-num">${formatComma(pos.amount)}</span>通貨<br>
          <span style="font-size:11px;color:var(--text-dim);">貯金スワップ: <span class="italic-num">${formatComma(pos.initial_swap || 0)}</span>円</span>
        </div>
      </div>
      <div class="position-actions">
        <button class="btn-edit" onclick="startEditPosition('${pos.id}')">編集</button>
        <button class="btn-delete" onclick="confirmDeletePosition('${pos.id}')">削除</button>
      </div>
    </li>`).join('');
}

function startEditPosition(posId) {
  const pos = state.positions.find(p => p.id === posId);
  if (!pos) return;
  els.crudEditId.value      = posId;
  els.crudBroker.value      = pos.broker_id;
  els.crudPair.value        = pos.currency_pair;
  els.crudDirection.value   = pos.direction;
  els.crudAmount.value      = pos.amount ? parseInt(pos.amount, 10).toLocaleString('ja-JP') : '';
  els.crudInitialSwap.value  = pos.initial_swap ? parseInt(pos.initial_swap, 10).toLocaleString('ja-JP') : '';
  els.crudFormTitle.textContent = 'ポジションを編集';
  els.crudSaveBtn.textContent   = '更新する';
  els.crudCancelBtn.style.display = '';
  els.crudSaveBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function confirmDeletePosition(posId) {
  if (!confirm('このポジションを削除しますか？')) return;
  try {
    await removePosition(state.uid, posId);
    showSnackbar('ポジションを削除しました');
    await loadAllData();
    renderCRUDList();
  } catch (err) {
    showSnackbar('削除に失敗しました');
  }
}

function resetCRUDForm() {
  els.crudEditId.value          = '';
  els.crudBroker.value          = '';
  els.crudPair.value            = 'USD_JPY';
  els.crudDirection.value       = 'buy';
  els.crudAmount.value          = '';
  els.crudInitialSwap.value     = '';
  els.crudFormTitle.textContent = 'ポジションを追加';
  els.crudSaveBtn.textContent   = '登録する';
  els.crudCancelBtn.style.display = 'none';
}

// グローバル公開（HTMLのonclick属性から呼び出すため）
window.startEditPosition   = startEditPosition;
window.confirmDeletePosition = confirmDeletePosition;

// ===== 14. 警告ダイアログ =====
function setupAlertListeners() {
  els.alertOkBtn.addEventListener('click', () => {
    els.alertUnsupported.classList.remove('open');
    els.alertManualCheck.checked = false;
  });

  els.alertManualBtn.addEventListener('click', () => {
    els.alertUnsupported.classList.remove('open');
    showSnackbar('手動入力モードは現在準備中です');
  });
}

function openAlertUnsupported() {
  els.alertManualCheck.checked = false;
  els.alertUnsupported.classList.add('open');
}

// 全アフィリエイト会社のSVGフォールバックロゴを事前に一括生成してキャッシュする
const _svgLogoCache = {};
(function preGenerateSvgLogos() {
  ALL_AFFILIATES.forEach(a => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50" width="160" height="50">' +
      '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#FF9900"/><stop offset="100%" stop-color="#cc7a00"/>' +
      '</linearGradient></defs>' +
      '<rect width="100%" height="100%" rx="6" fill="url(#g)"/>' +
      '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" ' +
      'font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="12" fill="#000">' +
      a.name + '</text></svg>';
    _svgLogoCache[a.name] = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  });
})();

function renderBannerTiles() {
  const container = document.getElementById('banner-tiles');
  if (!container) return;
  
  const displayBanners = [];
  for (let i = 0; i < 4; i++) {
    const idx = (state.bannerIndex + i) % ALL_AFFILIATES.length;
    displayBanners.push(ALL_AFFILIATES[idx]);
  }

  container.innerHTML = displayBanners.map(a => {
    const fallback = _svgLogoCache[a.name];
    
    // firebase.js の AFFILIATE_LINKS から動的に取得
    const linkInfo = (window.AFFILIATE_LINKS && window.AFFILIATE_LINKS[a.broker_id]) || { url: '#', campaign: '' };
    const campaignHtml = '<div class="banner-tile-campaign">' + (linkInfo.campaign || '') + '</div>';
    
    return '<a class="banner-tile" href="' + linkInfo.url + '" target="_blank" rel="noopener noreferrer">' +
      '<div style="display:flex;flex-direction:column;align-items:center;width:100%;gap:4px">' +
        '<div class="banner-logo-wrapper">' +
          '<img src="' + a.logo + '" alt="' + a.name + '" data-fallback="' + fallback + '">' +
        '</div>' +
        '<div class="banner-tile-name">' + a.name + '</div>' +
      '</div>' +
      campaignHtml +
      '<span class="banner-tile-cta">口座開設</span>' +
    '</a>';
  }).join('');

  // イベント委譲：画像ロードエラーを安全にハンドリングする
  container.querySelectorAll('img[data-fallback]').forEach(img => {
    img.onerror = function() {
      this.onerror = null;
      this.src = this.getAttribute('data-fallback');
    };
  });
}

function rotateBanners() {
  // 4社ごとにローテーションさせる
  state.bannerIndex = (state.bannerIndex + 4) % ALL_AFFILIATES.length;
  renderBannerTiles();
}

// ===== 16. ユーティリティ関数 =====

/**
 * 数値をカンマ区切り文字列に変換
 */
function formatComma(n) {
  if (isNaN(n)) return '0';
  return Math.round(n).toLocaleString('ja-JP');
}

/**
 * 今日の日付文字列（YYYY-MM-DD）
 */
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/**
 * マスタスワップデータを検索
 */
function findMasterSwap(brokerId, currencyPair, direction) {
  return state.masterSwaps.find(m =>
    m.broker_id === brokerId &&
    m.currency_pair === currencyPair &&
    m.direction === direction
  ) || null;
}

/**
 * 数値をアニメーションで表示
 */
function animateNumber(el, targetValue, duration = 800) {
  const start     = performance.now();
  const startVal  = parseFloat(el.textContent.replace(/,/g, '')) || 0;

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const current  = startVal + (targetValue - startVal) * eased;
    el.textContent = formatComma(Math.round(current));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/**
 * スナックバー表示
 */
let snackbarTimer = null;
function showSnackbar(msg, duration = 3000) {
  const el = els.snackbar;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(snackbarTimer);
  snackbarTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ===== 17. 起動 =====
init();
