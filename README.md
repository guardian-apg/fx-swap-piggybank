# FXスワップ貯金箱 — セットアップガイド

## 1. 前提条件

以下のツールをインストールしてください。

- Node.js v20以上
- Firebase CLI: `npm install -g firebase-tools`
- Googleアカウント（Firebaseプロジェクト作成用）

---

## 2. Firebaseプロジェクトの新規作成

### 2-1. Firebaseコンソールでプロジェクト作成

1. https://console.firebase.google.com/ にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `fx-swap-piggybank`）
4. Google アナリティクスは任意（無効でも可）
5. 作成完了後、プロジェクトIDをメモしておく

### 2-2. Firebase Authentication の有効化

1. コンソール左メニュー → 「Authentication」
2. 「始める」をクリック
3. 「Sign-in method」タブ → 「メール/パスワード」を有効化

### 2-3. Firestore Database の作成

1. コンソール左メニュー → 「Firestore Database」
2. 「データベースの作成」
3. リージョン: `asia-northeast1`（東京）を選択
4. セキュリティルール: 「本番モードで開始」を選択

### 2-4. Cloud Functions の有効化

1. コンソール左メニュー → 「Functions」
2. 「始める」をクリック
3. 支払いプランを「Blaze（従量課金）」にアップグレード
   - Cloud Functionsの使用にはBlazeプランが必要です
   - スクレイピングのトラフィックは小規模なので費用はほぼ無料です

---

## 3. firebase.js に設定を入力

Firebaseコンソール → プロジェクト設定 → 「マイアプリ」 → 「ウェブアプリを追加」から設定値を取得し、`firebase.js` の先頭部分を更新してください。

```javascript
// firebase.js の 6〜13行目を実際の値に書き換える
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",           // ← 実際の値に変更
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

また、設定を入力したら `firebase.js` の末尾近くにある以下の行を変更してください。

```javascript
// 変更前
window.FIREBASE_DEMO_MODE = true;

// 変更後（本番モード）
window.FIREBASE_DEMO_MODE = false;
```

---

## 4. .firebaserc の設定

`.firebaserc` ファイルを作成して、プロジェクトIDを設定します。

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

---

## 5. Firebase CLIでログイン・プロジェクト設定

```bash
# Firebaseにログイン
firebase login

# プロジェクトを設定
firebase use your-project-id

# Firestoreルールとインデックスをデプロイ
firebase deploy --only firestore
```

---

## 6. Cloud Functions のデプロイ

```bash
# functionsディレクトリに移動
cd functions

# 依存関係のインストール
npm install

# 上位ディレクトリに戻る
cd ..

# Cloud Functionsをデプロイ
firebase deploy --only functions
```

デプロイが完了すると、以下のスケジュール関数が有効になります。

- `scheduledSwapScraper`: 毎日 18:00 JST に自動実行

---

## 7. 手動スクレイピングの実行（テスト用）

デプロイ後、以下のURLをブラウザで開くと即時スクレイピングを実行できます。

```
https://asia-northeast1-YOUR_PROJECT_ID.cloudfunctions.net/manualSwapScraper?key=change-me-before-production
```

本番運用前に `functions/index.js` の `MANUAL_SCRAPE_KEY` を環境変数で設定してください。

```bash
firebase functions:config:set scraper.key="YOUR_SECRET_KEY"
```

---

## 8. Firebase Hosting へのデプロイ（任意）

フロントエンドをFirebase Hostingに公開できます。

```bash
firebase deploy --only hosting
```

デプロイ後のURL: `https://your-project-id.web.app`

---

## 9. ローカル開発（エミュレータ）

Firebase Emulator Suiteを使ってローカルでテストできます。

```bash
# エミュレータ起動
firebase emulators:start

# ブラウザで開く
# http://localhost:5000  (Hosting)
# http://localhost:4000  (Emulator UI)
```

---

## 10. スクレイピングのカスタマイズ

`functions/index.js` の各ブローカーの `parse()` 関数内のCSSセレクタは、
証券会社のウェブサイト構造が変わると更新が必要になります。

手順:
1. 対象URLをブラウザで開く
2. 開発者ツール（F12）でスワップポイント表のHTMLを確認
3. `parse()` 関数内のセレクタを適切なものに変更
4. `firebase deploy --only functions` で再デプロイ

---

## ファイル構成

```
fx-swap-piggybank/
├── index.html              # メインアプリ（4タブSPA）
├── style.css               # スタイルシート
├── app.js                  # アプリケーションロジック
├── firebase.js             # Firebase初期化・データアクセス
├── firebase.json           # Firebaseホスティング・Functions設定
├── .firebaserc             # プロジェクトID設定（要作成）
├── firestore.rules         # Firestoreセキュリティルール
├── firestore.indexes.json  # Firestore複合インデックス
├── banner_sbi.png          # SBI FXアフィリエイトバナー（サンプル）
├── banner_gmo.png          # GMOアフィリエイトバナー（サンプル）
├── banner_dmm.png          # DMMアフィリエイトバナー（サンプル）
├── functions/
│   ├── index.js            # Cloud Functions（スクレイピング）
│   └── package.json
└── README.md               # このファイル
```
