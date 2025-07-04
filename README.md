# 謎解きシステム

このプロジェクトは、11チームの進捗管理と車両番号表示、カメラ配信機能を持つ謎解き用システムです。

## 機能一覧

### 1. 入口ページ (`index.html`)
- 各機能へのナビゲーション
- 黒背景に黄緑色のボタン7個

### 2. STAFF制御 (`staff.html`)
- 11チームの進捗バー表示
- 個別チームの「Next」「Back」ボタン
- 全チーム一括操作

### 3. MASTER制御 (`master.html`)
- STAFF機能に加えて
- 車両番号の手動加減機能

### 4. モニター前 (`monitor-front.html`)
- チーム進捗に応じた画像の全画面表示
- 自動/手動チーム選択
- 前面用画像セット使用

### 5. モニター後 (`monitor-back.html`)
- モニター前と同様の機能
- 後面用画像セット使用

### 6. 車両番号表示 (`car-number.html`)
- 車両番号の大きな表示
- 1秒ごとの自動減少機能
- 手動設定機能

### 7. カメラ撮影 (`camera-capture.html`)
- WebRTCを使用した映像配信
- 複数カメラデバイス対応
- PeerJSによるP2P接続

### 8. カメラ映像 (`camera-view.html`)
- WebRTCによる映像受信
- 0-30秒の遅延設定機能
- 全画面表示対応

## セットアップ手順

### 1. 必要なファイル構成
```
tablet/
├── index.html
├── staff.html
├── master.html
├── monitor-front.html
├── monitor-back.html
├── car-number.html
├── camera-capture.html
├── camera-view.html
├── styles.css
├── js/
│   ├── firebase-config.js
│   └── app.js
└── images/
    ├── front/
    │   ├── progress_0.jpg
    │   ├── progress_1.jpg
    │   ├── ...
    │   └── progress_10.jpg
    └── back/
        ├── progress_0.jpg
        ├── progress_1.jpg
        ├── ...
        └── progress_10.jpg
```

### 2. 画像ファイルの準備
- `images/front/` フォルダに `progress_0.jpg` から `progress_10.jpg` まで11枚の画像を配置
- `images/back/` フォルダに同様に11枚の画像を配置
- 各画像は進捗レベルに応じて表示されます

### 3. Firebase設定
- `js/firebase-config.js` にFirebaseプロジェクトの設定が含まれています
- 必要に応じて設定を変更してください

### 4. Firestoreデータベース構造
```
- teams/
  - 1/
    - progress: 0
    - lastUpdated: timestamp
  - 2/
    - progress: 0
    - lastUpdated: timestamp
  - ...
  - 11/
    - progress: 0
    - lastUpdated: timestamp
- global/
  - carNumber/
    - value: 3600
    - lastUpdated: timestamp
```

## 使用方法

### 基本的な流れ
1. `index.html` を開いて各機能にアクセス
2. STAFF/MASTERページで進捗を管理
3. モニターページで参加者に進捗を表示
4. 車両番号ページで時間経過を演出
5. カメラ機能で映像配信

### 注意事項
- インターネット接続が必要です（Firebase、PeerJS使用）
- カメラ機能は HTTPS 環境で使用してください
- 複数デバイスでの同時使用を前提として設計されています

### トラブルシューティング
- Firebase接続エラー: ブラウザの開発者ツールでコンソールを確認
- カメラ接続エラー: カメラへのアクセス許可を確認
- 画像表示エラー: 画像ファイルのパスと名前を確認

## 技術仕様
- Firebase Firestore (リアルタイムデータベース)
- WebRTC + PeerJS (映像配信)
- HTML5 Canvas (遅延処理)
- Vanilla JavaScript (フレームワーク不使用)

## ライセンス
このプロジェクトはMITライセンスで公開されています。 