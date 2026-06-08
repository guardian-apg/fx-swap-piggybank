// ===== Firebase 初期化 =====
// ※ 実際のFirebaseプロジェクトの設定値に差し替えてください
const firebaseConfig = window.firebaseConfig || {
  apiKey: "AIzaSyDGdgxmyV3tbNhJlvRmQtdEZIAavgbPwes",
  authDomain: "fx-swap-piggybank.firebaseapp.com",
  projectId: "fx-swap-piggybank",
  storageBucket: "fx-swap-piggybank.firebasestorage.app",
  messagingSenderId: "984929797846",
  appId: "1:984929797846:web:6c5e1e883a714dde8dab77",
  measurementId: "G-MQL10PC8MZ"
};

// ===== アフィリエイトリンク設定 =====
// ※ 各証券会社とのアフィリエイト提携後、取得したURLやキャンペーン内容をこちらに書き換えてください。
window.AFFILIATE_LINKS = {
  sbi_fx: {
    url: 'https://www.sbifxt.co.jp/', // 例: 'https://px.a8.net/svt/ejp?a8mat=...' など
    campaign: '新規口座開設で最大100万円キャッシュバックキャンペーン実施中！'
  },
  gmo_fx: {
    url: 'https://www.gmo-click.com/',
    campaign: '最大100万円キャッシュバック！スワップ金利業界最高水準'
  },
  dmm_fx: {
    url: 'https://fx.dmm.com/',
    campaign: '新規口座開設＆取引で最大30万円キャッシュバック実施中！'
  },
  minnano_fx: {
    url: 'https://min-fx.jp/',
    campaign: 'スワップNo.1挑戦キャンペーン！新規口座開設で最大100万円'
  },
  gaitame: {
    url: 'https://www.gaitame.com/',
    campaign: 'らくらくFX積立＆新規開設で最大100万円還元キャンペーン'
  },
  matsui_fx: {
    url: 'https://www.matsui.co.jp/',
    campaign: '1通貨から取引可能！新規口座開設で取引手数料キャッシュバック'
  },
  central_fx: {
    url: 'https://www.central-tanshifx.com/',
    campaign: 'メキシコペソ/円・高金利スワップ優遇キャンペーン開催中！'
  },
  lion_fx: {
    url: 'https://hirose-fx.jp/',
    campaign: '新規口座開設＆取引で最大100万円＋選べる高級グルメプレゼント！'
  },
  kabu_com: {
    url: 'https://kabu.com/',
    campaign: 'au回線やPontaポイントと連携でさらにお得に取引キャンペーン'
  },
  gaitame_online: {
    url: 'https://www.gaitameonline.com/',
    campaign: '新規口座開設＆一定取引で最大150,000円キャッシュバック！'
  },
  m2j: {
    url: 'https://www.m2j.co.jp/',
    campaign: 'トラリピ新規スタートキャンペーン！最大12万ポイント還元'
  },
  himawari: {
    url: 'https://sec.himawari-group.co.jp/',
    campaign: 'ループ・イフダン新規口座開設で最大10万円キャッシュバック'
  },
  monex_fx: {
    url: 'https://mxp1.monex.co.jp/pc/servlet/ITS/fx/FxTop',
    campaign: '新規口座開設＆取引で最大10万円キャッシュバックキャンペーン'
  },
  rakuten_fx: {
    url: 'https://www.rakuten-sec.co.jp/web/fx/',
    campaign: '楽天カードでFX積立可能！新規取引で最大30万ポイント付与'
  },
  light_fx: {
    url: 'https://lightfx.jp/',
    campaign: '新規口座開設最大100万円＆スワップ強化通貨キャンペーン'
  },
  okasan_fx: {
    url: 'https://www.okasan-online.co.jp/fx/',
    campaign: '新規口座開設＆お取引で最大50,000円キャッシュバック！'
  }
};

// Firebase SDKの初期化（compat版）
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== 認証ヘルパー =====

/**
 * メール・パスワードでログイン
 */
async function authLogin(email, password) {
  return await auth.signInWithEmailAndPassword(email, password);
}

/**
 * 新規ユーザー登録
 */
async function authRegister(email, password) {
  return await auth.createUserWithEmailAndPassword(email, password);
}

/**
 * ログアウト
 */
async function authLogout() {
  return await auth.signOut();
}

/**
 * パスワードリセットメール送信
 */
async function authResetPassword(email) {
  return await auth.sendPasswordResetEmail(email);
}

/**
 * 認証状態の変化を監視
 * @param {Function} callback - コールバック関数（user引数）
 */
function onAuthChange(callback) {
  return auth.onAuthStateChanged(callback);
}

// ===== Firestore ヘルパー =====

// --- User Positions（保有ポジション）---

/**
 * ユーザーの全ポジションを取得
 */
async function getPositions(uid) {
  const snap = await db.collection('users').doc(uid).collection('positions').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * ポジションを追加
 */
async function addPosition(uid, position) {
  return await db.collection('users').doc(uid).collection('positions').add(position);
}

/**
 * ポジションを更新
 */
async function updatePosition(uid, positionId, data) {
  return await db.collection('users').doc(uid).collection('positions').doc(positionId).update(data);
}

/**
 * ポジションを削除
 */
async function deletePosition(uid, positionId) {
  return await db.collection('users').doc(uid).collection('positions').doc(positionId).delete();
}

// --- Swap History（スワップ付与履歴）---

/**
 * ユーザーのスワップ履歴を取得（最新100件）
 */
async function getSwapHistory(uid) {
  const snap = await db.collection('users').doc(uid).collection('swap_history')
    .orderBy('date', 'desc')
    .limit(100)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * スワップ履歴エントリを追加
 */
async function addSwapHistory(uid, entry) {
  return await db.collection('users').doc(uid).collection('swap_history').add(entry);
}

// --- Master Swaps（スワップポイントマスタ）---

/**
 * 指定日付のマスタスワップデータを取得
 */
async function getMasterSwaps(date) {
  const snap = await db.collection('master_swaps')
    .where('date', '==', date)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * 最新のマスタスワップデータを取得（broker_id + currency_pair + directionごと）
 */
async function getLatestMasterSwaps() {
  const snap = await db.collection('master_swaps')
    .orderBy('date', 'desc')
    .limit(200)
    .get();
  const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // broker_id + currency_pair + direction の組み合わせごとに最新1件を残す
  const latestMap = {};
  for (const item of all) {
    const key = `${item.broker_id}_${item.currency_pair}_${item.direction}`;
    if (!latestMap[key]) {
      latestMap[key] = item;
    }
  }
  return Object.values(latestMap);
}

// ===== デモ用モックデータ（Firebase未接続時のフォールバック）=====
const DEMO_MASTER_SWAPS = [
  { broker_id: 'sbi_fx', currency_pair: 'USD_JPY', direction: 'buy', date: '2026-06-07', days_attributed: 3, swap_per_single_unit: 0.0230 },
  { broker_id: 'sbi_fx', currency_pair: 'AUD_JPY', direction: 'buy', date: '2026-06-07', days_attributed: 3, swap_per_single_unit: 0.0190 },
  { broker_id: 'gmo_fx', currency_pair: 'USD_JPY', direction: 'buy', date: '2026-06-07', days_attributed: 1, swap_per_single_unit: 0.0185 },
  { broker_id: 'gmo_fx', currency_pair: 'MXN_JPY', direction: 'buy', date: '2026-06-07', days_attributed: 1, swap_per_single_unit: 0.0053 },
  { broker_id: 'dmm_fx', currency_pair: 'TRY_JPY', direction: 'buy', date: '2026-06-07', days_attributed: 1, swap_per_single_unit: 0.0082 },
];

const DEMO_POSITIONS = [
  { id: 'pos1', broker_id: 'sbi_fx', currency_pair: 'USD_JPY', direction: 'buy', amount: 55000 },
  { id: 'pos2', broker_id: 'sbi_fx', currency_pair: 'AUD_JPY', direction: 'buy', amount: 30000 },
  { id: 'pos3', broker_id: 'gmo_fx', currency_pair: 'MXN_JPY', direction: 'buy', amount: 100000 },
];

const DEMO_HISTORY = [
  // SBI FXトレード
  { id: 'h1',  date: '2026-06-07', broker_id: 'sbi_fx',         currency_pair: 'USD_JPY', days_attributed: 3, earned_amount: 3795 },
  { id: 'h2',  date: '2026-06-07', broker_id: 'sbi_fx',         currency_pair: 'AUD_JPY', days_attributed: 3, earned_amount: 1710 },
  { id: 'h3',  date: '2026-06-06', broker_id: 'sbi_fx',         currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1265 },
  { id: 'h4',  date: '2026-06-06', broker_id: 'sbi_fx',         currency_pair: 'AUD_JPY', days_attributed: 1, earned_amount: 570 },
  // GMOクリック証券
  { id: 'h5',  date: '2026-06-07', broker_id: 'gmo_fx',         currency_pair: 'MXN_JPY', days_attributed: 1, earned_amount: 530 },
  { id: 'h6',  date: '2026-06-05', broker_id: 'gmo_fx',         currency_pair: 'MXN_JPY', days_attributed: 1, earned_amount: 530 },
  { id: 'h7',  date: '2026-06-04', broker_id: 'gmo_fx',         currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1110 },
  // DMM FX
  { id: 'h8',  date: '2026-06-07', broker_id: 'dmm_fx',         currency_pair: 'TRY_JPY', days_attributed: 1, earned_amount: 820 },
  { id: 'h9',  date: '2026-06-06', broker_id: 'dmm_fx',         currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1150 },
  // みんなのFX
  { id: 'h10', date: '2026-06-07', broker_id: 'minnano_fx',     currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1230 },
  { id: 'h11', date: '2026-06-06', broker_id: 'minnano_fx',     currency_pair: 'MXN_JPY', days_attributed: 1, earned_amount: 480 },
  // 外為どっとコム
  { id: 'h12', date: '2026-06-07', broker_id: 'gaitame',        currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1200 },
  { id: 'h13', date: '2026-06-05', broker_id: 'gaitame',        currency_pair: 'TRY_JPY', days_attributed: 1, earned_amount: 750 },
  // 松井証券FX
  { id: 'h14', date: '2026-06-07', broker_id: 'matsui_fx',      currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1180 },
  // セントラル短資FX
  { id: 'h15', date: '2026-06-07', broker_id: 'central_fx',     currency_pair: 'MXN_JPY', days_attributed: 1, earned_amount: 550 },
  { id: 'h16', date: '2026-06-06', broker_id: 'central_fx',     currency_pair: 'MXN_JPY', days_attributed: 1, earned_amount: 550 },
  // ヒロセ通商 LION FX
  { id: 'h17', date: '2026-06-07', broker_id: 'lion_fx',        currency_pair: 'ZAR_JPY', days_attributed: 1, earned_amount: 380 },
  { id: 'h18', date: '2026-06-06', broker_id: 'lion_fx',        currency_pair: 'TRY_JPY', days_attributed: 1, earned_amount: 850 },
  // auカブコム証券
  { id: 'h19', date: '2026-06-07', broker_id: 'kabu_com',       currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1100 },
  // 外為オンライン
  { id: 'h20', date: '2026-06-07', broker_id: 'gaitame_online', currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1050 },
  // OANDA Japan
  { id: 'h21', date: '2026-06-07', broker_id: 'oanda_fx',       currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1190 },
  // マネースクエア
  { id: 'h22', date: '2026-06-06', broker_id: 'm2j',            currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 980 },
  // ひまわり証券
  { id: 'h23', date: '2026-06-07', broker_id: 'himawari',       currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1020 },
  // マネックスFX
  { id: 'h24', date: '2026-06-06', broker_id: 'monex_fx',       currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1130 },
  // 楽天証券FX
  { id: 'h25', date: '2026-06-07', broker_id: 'rakuten_fx',     currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1210 },
  { id: 'h26', date: '2026-06-05', broker_id: 'rakuten_fx',     currency_pair: 'MXN_JPY', days_attributed: 1, earned_amount: 520 },
  // Light FX
  { id: 'h27', date: '2026-06-07', broker_id: 'light_fx',       currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1240 },
  { id: 'h28', date: '2026-06-06', broker_id: 'light_fx',       currency_pair: 'TRY_JPY', days_attributed: 1, earned_amount: 810 },
  // 岡三オンライン
  { id: 'h29', date: '2026-06-07', broker_id: 'okasan_fx',      currency_pair: 'USD_JPY', days_attributed: 1, earned_amount: 1080 },
];

// Firebase接続状態フラグ
window.FIREBASE_DEMO_MODE = false; // Firebaseが未設定の場合はtrue

/**
 * デモモードかFirebaseから取得する汎用ラッパー
 */
async function fetchPositions(uid) {
  if (window.FIREBASE_DEMO_MODE) return JSON.parse(JSON.stringify(DEMO_POSITIONS));
  return await getPositions(uid);
}

async function fetchSwapHistory(uid) {
  if (window.FIREBASE_DEMO_MODE) return JSON.parse(JSON.stringify(DEMO_HISTORY));
  return await getSwapHistory(uid);
}

async function fetchLatestMasterSwaps() {
  if (window.FIREBASE_DEMO_MODE) return JSON.parse(JSON.stringify(DEMO_MASTER_SWAPS));
  return await getLatestMasterSwaps();
}

async function savePosition(uid, position) {
  if (window.FIREBASE_DEMO_MODE) {
    const id = 'pos_' + Date.now();
    DEMO_POSITIONS.push({ id, ...position });
    return id;
  }
  const ref = await addPosition(uid, position);
  return ref.id;
}

async function editPosition(uid, positionId, data) {
  if (window.FIREBASE_DEMO_MODE) {
    const idx = DEMO_POSITIONS.findIndex(p => p.id === positionId);
    if (idx !== -1) Object.assign(DEMO_POSITIONS[idx], data);
    return;
  }
  return await updatePosition(uid, positionId, data);
}

async function removePosition(uid, positionId) {
  if (window.FIREBASE_DEMO_MODE) {
    const idx = DEMO_POSITIONS.findIndex(p => p.id === positionId);
    if (idx !== -1) DEMO_POSITIONS.splice(idx, 1);
    return;
  }
  return await deletePosition(uid, positionId);
}
