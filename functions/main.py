import os
import json
import datetime
from firebase_functions import options, scheduler_fn, https_fn
from firebase_admin import initialize_app, firestore
import requests
from bs4 import BeautifulSoup
import stripe

initialize_app()

# 通貨ペア変換マップ
PAIR_MAP = {
    'USD/JPY': 'USD_JPY', 'ドル/円': 'USD_JPY', '米ドル/円': 'USD_JPY', 'USDJPY': 'USD_JPY',
    'EUR/JPY': 'EUR_JPY', 'ユーロ/円': 'EUR_JPY', 'EURJPY': 'EUR_JPY',
    'AUD/JPY': 'AUD_JPY', '豪ドル/円': 'AUD_JPY', 'AUDJPY': 'AUD_JPY',
    'NZD/JPY': 'NZD_JPY', 'NZドル/円': 'NZD_JPY', 'NZDJPY': 'NZD_JPY',
    'GBP/JPY': 'GBP_JPY', 'ポンド/円': 'GBP_JPY', '英ポンド/円': 'GBP_JPY', 'GBPJPY': 'GBP_JPY',
    'CAD/JPY': 'CAD_JPY', 'カナダドル/円': 'CAD_JPY', 'CADJPY': 'CAD_JPY',
    'MXN/JPY': 'MXN_JPY', 'メキシコペソ/円': 'MXN_JPY', 'MXNJPY': 'MXN_JPY',
    'TRY/JPY': 'TRY_JPY', 'トルコリラ/円': 'TRY_JPY', 'TRYJPY': 'TRY_JPY',
    'ZAR/JPY': 'ZAR_JPY', '南アランド/円': 'ZAR_JPY', 'ZARJPY': 'ZAR_JPY',
}

def normalize_pair(text):
    clean = text.strip().replace(' ', '')
    if clean in PAIR_MAP.values():
        return clean
    if clean.replace('/', '_') in PAIR_MAP.values():
        return clean.replace('/', '_')
    return PAIR_MAP.get(clean, None)

# ブローカー一覧
BROKERS = [
    'sbi_fx', 'gmo_fx', 'dmm_fx', 'minnano_fx', 'gaitame', 'matsui_fx',
    'central_fx', 'lion_fx', 'kabu_com', 'gaitame_online', 'm2j', 'himawari',
    'monex_fx', 'rakuten_fx', 'light_fx', 'okasan_fx', 'oanda_fx'
]

# デフォルト（モック）スワップデータ
DEFAULT_SWAPS = [
    {"broker_id": "sbi_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 3, "swap_per_single_unit": 0.0230},
    {"broker_id": "sbi_fx", "currency_pair": "AUD_JPY", "direction": "buy", "days_attributed": 3, "swap_per_single_unit": 0.0190},
    {"broker_id": "gmo_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0185},
    {"broker_id": "gmo_fx", "currency_pair": "MXN_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0053},
    {"broker_id": "dmm_fx", "currency_pair": "TRY_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0082},
    {"broker_id": "minnano_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0210},
    {"broker_id": "minnano_fx", "currency_pair": "MXN_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0050},
    {"broker_id": "gaitame", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0200},
    {"broker_id": "matsui_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0195},
    {"broker_id": "central_fx", "currency_pair": "MXN_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0052},
    {"broker_id": "lion_fx", "currency_pair": "ZAR_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0035},
    {"broker_id": "kabu_com", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0190},
    {"broker_id": "gaitame_online", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0180},
    {"broker_id": "oanda_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0192},
    {"broker_id": "m2j", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0175},
    {"broker_id": "himawari", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0182},
    {"broker_id": "monex_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0198},
    {"broker_id": "rakuten_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0205},
    {"broker_id": "light_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0225},
    {"broker_id": "okasan_fx", "currency_pair": "USD_JPY", "direction": "buy", "days_attributed": 1, "swap_per_single_unit": 0.0190},
]

# タスク2: 1日1回の定期スクレイピングとデータ保存 (午前7時45分日本時間)
@scheduler_fn.on_schedule(schedule="45 7 * * *", timezone="Asia/Tokyo")
def fetch_daily_market_data(event):
    db = firestore.client()
    
    # 1. 為替レートの取得 (無料API)
    fetched_rates = {"USD_JPY": 150.25, "EUR_JPY": 162.10, "GBP_JPY": 190.40, "AUD_JPY": 100.15, "MXN_JPY": 8.95, "TRY_JPY": 4.65, "ZAR_JPY": 8.15}
    try:
        res = requests.get("https://open.er-api.com/v6/latest/USD", timeout=10)
        if res.status_code == 200:
            data = res.json()
            rates = data.get("rates", {})
            jpy_rate = rates.get("JPY")
            if jpy_rate:
                # 各種対円レートを計算
                for curr in ["EUR", "GBP", "AUD", "MXN", "TRY", "ZAR"]:
                    curr_rate = rates.get(curr)
                    if curr_rate:
                        pair_name = f"{curr}_JPY"
                        fetched_rates[pair_name] = round(jpy_rate / curr_rate, 4)
                fetched_rates["USD_JPY"] = round(jpy_rate, 4)
    except Exception as e:
        print(f"Failed to fetch exchange rates: {e}")

    # 2. 主要証券会社のスワップスクレイピング (プレースホルダー & フォールバック)
    # 実環境でのサイト構造の変化に対応できるよう、エラーハンドリングを適用
    swaps_to_save = list(DEFAULT_SWAPS) # 初期値としてモックを保持

    # (例) SBI FX のスクレイピング試行
    try:
        sbi_res = requests.get("https://www.sbifxt.co.jp/swappoint/", headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if sbi_res.status_code == 200:
            soup = BeautifulSoup(sbi_res.text, "html.parser")
            sbi_swaps = []
            for tr in soup.select("table.swap-table tbody tr"):
                cells = tr.select("td")
                if len(cells) < 3:
                    continue
                pair_text = cells[0].text.strip()
                buy_text = cells[1].text.strip().replace(",", "")
                sell_text = cells[2].text.strip().replace(",", "")
                pair = normalize_pair(pair_text)
                if not pair:
                    continue
                try:
                    buy = float(''.join(c for c in buy_text if c.isdigit() or c in ['.', '-']))
                    sell = float(''.join(c for c in sell_text if c.isdigit() or c in ['.', '-']))
                    # SBIは1万通貨単位
                    sbi_swaps.append({"broker_id": "sbi_fx", "currency_pair": pair, "direction": "buy", "days_attributed": 1, "swap_per_single_unit": buy / 10000.0})
                    sbi_swaps.append({"broker_id": "sbi_fx", "currency_pair": pair, "direction": "sell", "days_attributed": 1, "swap_per_single_unit": sell / 10000.0})
                except ValueError:
                    continue
            if sbi_swaps:
                # 既存の SBI モックデータをスクレイピング結果で上書き
                swaps_to_save = [s for s in swaps_to_save if s["broker_id"] != "sbi_fx"] + sbi_swaps
    except Exception as e:
        print(f"SBI FX scraping failed, using fallback: {e}")

    # Firestoreに保存 (market_data/latest)
    db.collection("market_data").document("latest").set({
        "rates": fetched_rates,
        "swaps": swaps_to_save,
        "updated_at": firestore.SERVER_TIMESTAMP
    })
    print("Market data successfully updated.")

# タスク3: Stripe Webhook関数 (Stripe 決済成功・解約ステータスの監視)
@https_fn.on_request()
def stripe_webhook(req: https_fn.HttpRequest):
    payload = req.data
    sig_header = req.headers.get("Stripe-Signature")
    endpoint_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    event = None
    if endpoint_secret and sig_header:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except Exception as e:
            return https_fn.Response(f"Webhook signature verification failed: {str(e)}", status=400)
    else:
        # 開発環境・エミュレータ用 (署名検証スキップ)
        try:
            event = json.loads(payload.decode("utf-8"))
        except Exception as e:
            return https_fn.Response("Invalid payload", status=400)

    event_type = event.get("type") if isinstance(event, dict) else event.type
    event_data = event.get("data") if isinstance(event, dict) else event.data
    obj = event_data.get("object") if isinstance(event_data, dict) else event_data.object

    # メタデータから uid を取得
    metadata = obj.get("metadata") if isinstance(obj, dict) else getattr(obj, "metadata", {})
    uid = metadata.get("uid") if metadata else None

    db = firestore.client()

    # uid がない場合は customer ID から検索
    if not uid:
        customer_id = obj.get("customer") if isinstance(obj, dict) else getattr(obj, "customer", None)
        if customer_id:
            users_ref = db.collection("users").where("stripe_customer_id", "==", customer_id).limit(1).get()
            if users_ref:
                uid = users_ref[0].id

    if not uid:
        print("Stripe Webhook Warning: No Firebase UID found in event metadata or customer field.")
        return https_fn.Response("User mapping not found", status=200)

    # 購読ステータスの更新
    is_active_subscriber = False
    if event_type in ["customer.subscription.created", "invoice.payment_succeeded"]:
        is_active_subscriber = True
    elif event_type in ["customer.subscription.deleted", "invoice.payment_failed"]:
        is_active_subscriber = False
    elif event_type == "customer.subscription.updated":
        status = obj.get("status") if isinstance(obj, dict) else getattr(obj, "status", None)
        if status in ["active", "trialing"]:
            is_active_subscriber = True

    # Firestore の該当ユーザーのドキュメントを更新
    db.collection("users").document(uid).set({
        "is_active_subscriber": is_active_subscriber
    }, merge=True)

    print(f"Stripe Webhook processed: uid={uid}, is_active_subscriber={is_active_subscriber}")
    return https_fn.Response("OK", status=200)

# タスク4: クライアント向けデータ配信API (認証 & サブスク契約状態のセキュアチェック)
@https_fn.on_call()
def get_financial_data(req: https_fn.CallableRequest):
    # 1. ログイン認証チェック
    if not req.auth:
        raise https_fn.HttpsError(https_fn.FunctionsErrorCode.UNAUTHENTICATED, "認証が必要です。")
   
    uid = req.auth.uid
    db = firestore.client()
   
    # 2. サブスクリプション契約チェック
    user_ref = db.collection("users").document(uid).get()
    user_data = user_ref.to_dict() or {}
   
    if not user_data.get("is_active_subscriber", False):
        raise https_fn.HttpsError(https_fn.FunctionsErrorCode.PERMISSION_DENIED, "有効なサブスクリプションがありません。")
       
    # 3. 安全なデータをDBから返却
    market_data = db.collection("market_data").document("latest").get().to_dict()
    if not market_data:
        # データがまだ生成されていない場合は初期データを返す
        return {
            "rates": {"USD_JPY": 150.25, "EUR_JPY": 162.10},
            "swaps": DEFAULT_SWAPS
        }
    return market_data
