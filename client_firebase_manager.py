import json
import requests

class FirebaseManager:
    def __init__(self, api_key, project_id, region="us-central1", use_emulator=False, emulator_host="localhost"):
        """
        Firebase連携クライアントマネージャー
        
        Args:
            api_key (str): FirebaseプロジェクトのAPIキー
            project_id (str): FirebaseプロジェクトID
            region (str): Cloud Functionsのデプロイ地域 (デフォルト: us-central1)
            use_emulator (bool): ローカルエミュレータを使用するかどうか
            emulator_host (str): エミュレータのホスト名
        """
        self.api_key = api_key
        self.project_id = project_id
        self.region = region
        self.use_emulator = use_emulator
        self.emulator_host = emulator_host
        self.id_token = None
        self.uid = None

    def login(self, email, password):
        """
        メールアドレスとパスワードでFirebase Authenticationにログインします。
        
        Args:
            email (str): ユーザーのメールアドレス
            password (str): ユーザーのパスワード
            
        Returns:
            dict: ログイン成功時の応答データ (idToken, localId 等)
        """
        if self.use_emulator:
            url = f"http://{self.emulator_host}:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={self.api_key}"
        else:
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={self.api_key}"

        payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.id_token = data.get("idToken")
                self.uid = data.get("localId")
                return {"success": True, "uid": self.uid, "id_token": self.id_token}
            else:
                error_msg = response.json().get("error", {}).get("message", "Unknown error")
                return {"success": False, "error": error_msg}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_financial_data(self):
        """
        Cloud Functions の get_financial_data (Callable) を呼び出して市場データを取得します。
        
        Returns:
            dict: 成功時は為替レートとスワップ情報、失敗時はエラーメッセージ
        """
        if not self.id_token:
            return {"success": False, "error": "ログインしていません。まずログインしてください。"}

        if self.use_emulator:
            # エミュレータ環境のURL (通常、Python v2 functions は指定がない場合は us-central1 で起動)
            url = f"http://{self.emulator_host}:5001/{self.project_id}/{self.region}/get_financial_data"
        else:
            url = f"https://{self.region}-{self.project_id}.cloudfunctions.net/get_financial_data"

        # HTTPS Callable Functionへのリクエストは {"data": ...} 形式でラップする
        payload = {"data": {}}
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.id_token}"
        }

        try:
            response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=15)
            if response.status_code == 200:
                res_data = response.json()
                # Callableの応答は {"result": ...} の中に格納される
                result = res_data.get("result")
                return {"success": True, "data": result}
            else:
                # HTTPS Callable からの HttpsError
                try:
                    error_msg = response.json().get("error", {}).get("message", "Request failed")
                except:
                    error_msg = f"HTTP Error {response.status_code}"
                return {"success": False, "error": error_msg}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def calculate_swap(self, positions, market_data):
        """
        保有ポジションと市場データを基に、保有数量に応じたスワップポイント（日次）を計算します。
        
        Args:
            positions (list): ポジション情報リスト
                例: [{"broker_id": "sbi_fx", "currency_pair": "USD_JPY", "direction": "buy", "amount": 50000}]
            market_data (dict): get_financial_data から取得した市場データ
                例: {"swaps": [{"broker_id": "sbi_fx", "currency_pair": "USD_JPY", "direction": "buy", "swap_per_single_unit": 0.0230, "days_attributed": 3}], "rates": {...}}
                
        Returns:
            dict: 計算結果 (各ポジションの詳細および総計)
        """
        swaps_list = market_data.get("swaps", [])
        
        # 検索用に辞書化
        swap_lookup = {}
        for item in swaps_list:
            key = f"{item['broker_id']}_{item['currency_pair']}_{item['direction']}"
            swap_lookup[key] = item

        calculated_positions = []
        total_daily_swap = 0.0

        for pos in positions:
            broker_id = pos.get("broker_id")
            pair = pos.get("currency_pair")
            direction = pos.get("direction")
            amount = pos.get("amount", 0)

            key = f"{broker_id}_{pair}_{direction}"
            swap_info = swap_lookup.get(key)

            if swap_info:
                swap_per_unit = swap_info.get("swap_per_single_unit", 0.0)
                days_attributed = swap_info.get("days_attributed", 1)
                # 獲得スワップ額 = 保有量 * 1単位あたりスワップ * 付与日数
                earned = amount * swap_per_unit * days_attributed
                total_daily_swap += earned
                
                calculated_positions.append({
                    "broker_id": broker_id,
                    "currency_pair": pair,
                    "direction": direction,
                    "amount": amount,
                    "swap_per_single_unit": swap_per_unit,
                    "days_attributed": days_attributed,
                    "earned": round(earned, 2)
                })
            else:
                calculated_positions.append({
                    "broker_id": broker_id,
                    "currency_pair": pair,
                    "direction": direction,
                    "amount": amount,
                    "swap_per_single_unit": 0.0,
                    "days_attributed": 0,
                    "earned": 0.0,
                    "warning": "Swap point data not found"
                })

        return {
            "total_daily_swap": round(total_daily_swap, 2),
            "positions": calculated_positions
        }


# 利用例 (簡易テスト用)
if __name__ == "__main__":
    # ローカルエミュレータを使用したテストシナリオ
    print("Testing FirebaseManager...")
    manager = FirebaseManager(
        api_key="AIzaSyDhfuLA6aWiBkfnd6WbVmGbBHR3DXGng4A", # デモ用APIキー
        project_id="apg-apps-sync",
        use_emulator=True
    )
    
    # ログインテスト
    login_res = manager.login("test@example.com", "password123")
    print("Login Result:", login_res)
    
    if login_res["success"]:
        # データ取得テスト
        data_res = manager.get_financial_data()
        print("Financial Data Result success:", data_res["success"])
        if data_res["success"]:
            # スワップ計算テスト
            test_positions = [
                {"broker_id": "sbi_fx", "currency_pair": "USD_JPY", "direction": "buy", "amount": 50000},
                {"broker_id": "gmo_fx", "currency_pair": "MXN_JPY", "direction": "buy", "amount": 100000}
            ]
            calc_res = manager.calculate_swap(test_positions, data_res["data"])
            print("Calculation Result:", json.dumps(calc_res, indent=2, ensure_ascii=False))
