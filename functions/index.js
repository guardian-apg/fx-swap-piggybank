'use strict';

// ===== Firebase 初期化 =====
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest }  = require('firebase-functions/v2/https');
const { logger }     = require('firebase-functions');
const admin          = require('firebase-admin');
const axios          = require('axios');
const cheerio        = require('cheerio');

admin.initializeApp();
const db = admin.firestore();

// ===== ブローカー設定 =====
// 各証券会社のスクレイピング設定
// ※ セレクタは証券会社サイトの変更により更新が必要な場合があります

const BROKERS = {

  // ------------------------------------------------
  // SBI FXトレード
  // スワップポイント表: https://www.sbifxt.co.jp/swappoint/
  // ------------------------------------------------
  sbi_fx: {
    name: 'SBI FXトレード',
    url: 'https://www.sbifxt.co.jp/swappoint/',
    /**
     * スクレイピング処理
     * @param {string} html - 取得したHTML
     * @returns {Array<{currency_pair, direction, days_attributed, swap_per_lot}>}
     *   swap_per_lot: 1万通貨あたりのスワップポイント（円）
     */
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];

      // SBI FXトレードのスワップポイント表を解析
      // ※ 実際のHTMLセレクタはサイト構造に合わせて調整してください
      $('table.swap-table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;

        const pairText = $(cells[0]).text().trim();
        const buyText  = $(cells[1]).text().trim().replace(/[^\d\-\.]/g, '');
        const sellText = $(cells[2]).text().trim().replace(/[^\d\-\.]/g, '');

        const pair = normalizePair(pairText);
        if (!pair) return;

        const buy  = parseFloat(buyText);
        const sell = parseFloat(sellText);

        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });

      // 月曜日など週末スワップが含まれる場合は days_attributed = 3
      // 通常は 1。SBI FXは週末（金→月曜日）に3日分付与
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=日, 1=月, ..., 6=土
      const daysAttributed = dayOfWeek === 1 ? 3 : 1; // 月曜日 = 3日分

      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    // 1万通貨あたりの単価（円）→ 1通貨あたりに変換する係数
    lot_size: 10000,
  },

  // ------------------------------------------------
  // GMOクリック証券
  // スワップポイント表: https://www.gmo-click.com/service/swapPoint/
  // ------------------------------------------------
  gmo_fx: {
    name: 'GMOクリック証券',
    url: 'https://www.gmo-click.com/service/swapPoint/',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];

      // GMOクリック証券のスワップポイント表
      $('table.swap-rate-table tbody tr, .tbl-swap tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;

        const pairText = $(cells[0]).text().trim();
        const buyText  = $(cells[1]).text().trim().replace(/[^\d\-\.]/g, '');
        const sellText = $(cells[2]).text().trim().replace(/[^\d\-\.]/g, '');

        const pair = normalizePair(pairText);
        if (!pair) return;

        const buy  = parseFloat(buyText);
        const sell = parseFloat(sellText);

        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });

      // GMOは毎日付与（週末も1日分ずつ）
      return results.map(r => ({ ...r, days_attributed: 1 }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // DMM FX
  // スワップポイント表: https://fx.dmm.com/service/swap/
  // ------------------------------------------------
  dmm_fx: {
    name: 'DMM FX',
    url: 'https://fx.dmm.com/service/swap/',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];

      // DMM FXのスワップポイント表
      $('.swap-table tbody tr, table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;

        const pairText = $(cells[0]).text().trim();
        const buyText  = $(cells[1]).text().trim().replace(/[^\d\-\.]/g, '');
        const sellText = $(cells[2]).text().trim().replace(/[^\d\-\.]/g, '');

        const pair = normalizePair(pairText);
        if (!pair) return;

        const buy  = parseFloat(buyText);
        const sell = parseFloat(sellText);

        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });

      return results.map(r => ({ ...r, days_attributed: 1 }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // OANDA Japan
  // スワップポイント表: https://www.oanda.jp/lab-education/tools_and_apps/oanda_fxtrade_swappoint/
  // ------------------------------------------------
  oanda_fx: {
    name: 'OANDA Japan',
    url: 'https://www.oanda.jp/lab-education/tools_and_apps/oanda_fxtrade_swappoint/',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];

      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;

        const pairText = $(cells[0]).text().trim();
        const buyText  = $(cells[1]).text().trim().replace(/[^\d\-\.]/g, '');
        const sellText = $(cells[2]).text().trim().replace(/[^\d\-\.]/g, '');

        const pair = normalizePair(pairText);
        if (!pair) return;

        const buy  = parseFloat(buyText);
        const sell = parseFloat(sellText);

        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });

      // OANDAは週末含めて月曜に3日分
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysAttributed = dayOfWeek === 1 ? 3 : 1;
      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // 外為どっとコム
  // ------------------------------------------------
  gaitame: {
    name: '外為どっとコム',
    url: 'https://www.gaitame.com/markets/swap.html',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      const daysAttributed = new Date().getDay() === 1 ? 3 : 1;
      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // みんなのFX（トレイダーズ証券）
  // ------------------------------------------------
  minnano_fx: {
    name: 'みんなのFX',
    url: 'https://min-fx.jp/market/swap/',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      return results.map(r => ({ ...r, days_attributed: 1 }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // 松井証券FX
  // ------------------------------------------------
  matsui_fx: {
    name: '松井証券FX',
    url: 'https://www.matsui.co.jp/service/fx/swap.html',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      const daysAttributed = new Date().getDay() === 1 ? 3 : 1;
      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // セントラル短資FX
  // ------------------------------------------------
  central_fx: {
    name: 'セントラル短資FX',
    url: 'https://www.central-tanshifx.com/market/swap.html',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      const daysAttributed = new Date().getDay() === 1 ? 3 : 1;
      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // ヒロセ通商（LION FX）
  // ------------------------------------------------
  lion_fx: {
    name: 'ヒロセ通商 LION FX',
    url: 'https://hirose-fx.jp/swap/',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      return results.map(r => ({ ...r, days_attributed: 1 }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // auカブコム証券FX
  // ------------------------------------------------
  kabu_com: {
    name: 'auカブコム証券',
    url: 'https://kabu.com/service/fx/swap.html',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      const daysAttributed = new Date().getDay() === 1 ? 3 : 1;
      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // 外為オンライン
  // ------------------------------------------------
  gaitame_online: {
    name: '外為オンライン',
    url: 'https://www.gaitameonline.com/rateSwap.do',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      return results.map(r => ({ ...r, days_attributed: 1 }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // マネースクエア（M2J）
  // ------------------------------------------------
  m2j: {
    name: 'マネースクエア',
    url: 'https://www.m2j.co.jp/fx/trade/swap.php',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      return results.map(r => ({ ...r, days_attributed: 1 }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // ひまわり証券
  // ------------------------------------------------
  himawari: {
    name: 'ひまわり証券',
    url: 'https://sec.himawari-group.co.jp/report/swap/',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      return results.map(r => ({ ...r, days_attributed: 1 }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // マネックスFX
  // ------------------------------------------------
  monex_fx: {
    name: 'マネックスFX',
    url: 'https://mxp1.monex.co.jp/pc/servlet/ITS/fx/FxTop',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      const daysAttributed = new Date().getDay() === 1 ? 3 : 1;
      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // 楽天証券FX
  // ------------------------------------------------
  rakuten_fx: {
    name: '楽天証券FX',
    url: 'https://www.rakuten-sec.co.jp/web/fx/swap.html',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      const daysAttributed = new Date().getDay() === 1 ? 3 : 1;
      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // Light FX（トレイダーズ証券）
  // ------------------------------------------------
  light_fx: {
    name: 'Light FX',
    url: 'https://lightfx.jp/service/swap',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      return results.map(r => ({ ...r, days_attributed: 1 }));
    },
    lot_size: 10000,
  },

  // ------------------------------------------------
  // 岡三オンライン
  // ------------------------------------------------
  okasan_fx: {
    name: '岡三オンライン',
    url: 'https://www.okasan-online.co.jp/fx/swap_calender/',
    parse: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 3) return;
        const pair = normalizePair($(cells[0]).text().trim());
        if (!pair) return;
        const buy  = parseFloat($(cells[1]).text().trim().replace(/[^\d\-\.]/g, ''));
        const sell = parseFloat($(cells[2]).text().trim().replace(/[^\d\-\.]/g, ''));
        if (!isNaN(buy))  results.push({ currency_pair: pair, direction: 'buy',  swap_per_lot: buy  });
        if (!isNaN(sell)) results.push({ currency_pair: pair, direction: 'sell', swap_per_lot: sell });
      });
      const daysAttributed = new Date().getDay() === 1 ? 3 : 1;
      return results.map(r => ({ ...r, days_attributed: daysAttributed }));
    },
    lot_size: 10000,
  },
};


// ===== 通貨ペア正規化 =====
const PAIR_MAP = {
  'USD/JPY': 'USD_JPY', 'ドル/円': 'USD_JPY', '米ドル/円': 'USD_JPY', 'USDJPY': 'USD_JPY',
  'EUR/JPY': 'EUR_JPY', 'ユーロ/円': 'EUR_JPY', 'EURJPY': 'EUR_JPY',
  'AUD/JPY': 'AUD_JPY', '豪ドル/円': 'AUD_JPY', 'AUDJPY': 'AUD_JPY',
  'NZD/JPY': 'NZD_JPY', 'NZドル/円': 'NZD_JPY', 'NZDJPY': 'NZD_JPY',
  'GBP/JPY': 'GBP_JPY', 'ポンド/円': 'GBP_JPY', '英ポンド/円': 'GBP_JPY', 'GBPJPY': 'GBP_JPY',
  'CAD/JPY': 'CAD_JPY', 'カナダドル/円': 'CAD_JPY', 'CADJPY': 'CAD_JPY',
  'MXN/JPY': 'MXN_JPY', 'メキシコペソ/円': 'MXN_JPY', 'MXNJPY': 'MXN_JPY',
  'TRY/JPY': 'TRY_JPY', 'トルコリラ/円': 'TRY_JPY', 'TRYJPY': 'TRY_JPY',
  'ZAR/JPY': 'ZAR_JPY', '南アランド/円': 'ZAR_JPY', 'ZARJPY': 'ZAR_JPY',
};

function normalizePair(text) {
  const clean = text.trim().replace(/\s+/g, '');
  return PAIR_MAP[clean] || PAIR_MAP[text.trim()] || null;
}

// ===== スクレイピング実行 =====
async function scrapeBroker(brokerId, brokerConfig) {
  try {
    logger.info(`[${brokerId}] スクレイピング開始: ${brokerConfig.url}`);

    const response = await axios.get(brokerConfig.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja-JP,ja;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const items = brokerConfig.parse(response.data);
    logger.info(`[${brokerId}] ${items.length}件取得`);
    return items.map(item => ({
      ...item,
      // lot_size（例: 10000）で割って1通貨あたりの単価に変換
      // 例: 230円/1万通貨 → 0.0230円/1通貨
      swap_per_single_unit: item.swap_per_lot / brokerConfig.lot_size,
      broker_id: brokerId,
    }));
  } catch (err) {
    logger.error(`[${brokerId}] スクレイピングエラー:`, err.message);
    return [];
  }
}

// ===== Firestoreへ保存 =====
async function saveSwapData(records) {
  if (records.length === 0) return 0;

  const today = getTodayString();
  const batch = db.batch();
  let count   = 0;

  for (const record of records) {
    // ドキュメントID: date_brokerId_currencyPair_direction
    const docId = `${today}_${record.broker_id}_${record.currency_pair}_${record.direction}`;
    const docRef = db.collection('master_swaps').doc(docId);
    batch.set(docRef, {
      date:                today,
      broker_id:           record.broker_id,
      currency_pair:       record.currency_pair,
      direction:           record.direction,
      days_attributed:     record.days_attributed,
      swap_per_single_unit: record.swap_per_single_unit,
      updated_at:          admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    count++;
  }

  await batch.commit();
  logger.info(`${count}件をFirestoreに保存しました`);
  return count;
}

// ===== ユーティリティ =====
function getTodayString() {
  const d = new Date();
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  return jst.toISOString().slice(0, 10);
}

// ===== Cloud Functions =====

/**
 * 定期スクレイピング: 毎日18:00 JST（日本時間）に実行
 * スワップポイントは一般的に18:00（JST）前後に更新される
 * cron式はUTCで記述: 09:00 UTC = 18:00 JST
 */
exports.scheduledSwapScraper = onSchedule(
  {
    schedule:  '0 9 * * *',  // 毎日 09:00 UTC = 18:00 JST
    timeZone:  'Asia/Tokyo',
    memory:    '512MiB',
    timeoutSeconds: 120,
    region:    'asia-northeast1',
  },
  async (event) => {
    logger.info('定期スクレイピング開始:', getTodayString());

    let totalSaved = 0;

    for (const [brokerId, config] of Object.entries(BROKERS)) {
      const records = await scrapeBroker(brokerId, config);
      const saved   = await saveSwapData(records);
      totalSaved   += saved;

      // レート制限対策: 各ブローカー間に1秒待機
      await new Promise(r => setTimeout(r, 1000));
    }

    logger.info(`スクレイピング完了: 合計 ${totalSaved} 件保存`);
  }
);

/**
 * 手動トリガー: 開発・デバッグ用HTTPエンドポイント
 * URL: https://<region>-<projectId>.cloudfunctions.net/manualSwapScraper?key=<SECRET_KEY>
 */
exports.manualSwapScraper = onRequest(
  {
    memory: '512MiB',
    timeoutSeconds: 120,
    region: 'asia-northeast1',
  },
  async (req, res) => {
    // 簡易認証（本番運用前にFirebase App Checkやより強固な認証に差し替えること）
    const secret = process.env.MANUAL_SCRAPE_KEY || 'change-me-before-production';
    if (req.query.key !== secret) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    logger.info('手動スクレイピング開始:', getTodayString());

    const brokerParam = req.query.broker;
    const targets     = brokerParam
      ? { [brokerParam]: BROKERS[brokerParam] }
      : BROKERS;

    if (brokerParam && !BROKERS[brokerParam]) {
      res.status(400).json({ error: `不明なbroker_id: ${brokerParam}` });
      return;
    }

    const results = {};
    let totalSaved = 0;

    for (const [brokerId, config] of Object.entries(targets)) {
      const records  = await scrapeBroker(brokerId, config);
      const saved    = await saveSwapData(records);
      results[brokerId] = { scraped: records.length, saved };
      totalSaved += saved;
    }

    res.json({
      date:        getTodayString(),
      total_saved: totalSaved,
      brokers:     results,
    });
  }
);
