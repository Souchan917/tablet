# 🚂 謎解き公演制御システム

謎解き公演での端末管理、映像配信、チーム進行を統合的に制御するWebアプリケーションです。

## 🌟 主な機能

### 📱 端末管理
- **マスター画面**: 全端末の統合制御
- **スタッフ画面**: チーム進行管理
- **モニター画面**: 前後画面の表示制御
- **車両番号画面**: 豪華列車風車両番号表示
- **カメラ画面**: リアルタイム映像配信

### 🔗 通信機能
- **Firebase Database**: リアルタイムデータ同期
- **WebRTC**: スマホカメラ映像配信
- **端末間通信**: シンプルなメッセージング
- **接続監視**: 全端末の接続状態管理

### 📹 映像配信
- **スマホ配信**: 簡易カメラ配信システム
- **タブレット受信**: 遅延機能付き映像表示
- **GoPro対応**: USB接続での外部カメラ配信
- **全画面表示**: タッチ操作での全画面切り替え

## 🚀 デプロイ手順

### 1. Firebase CLIのインストール
```bash
npm install -g firebase-tools
```

### 2. Firebaseにログイン
```bash
firebase login
```

### 3. プロジェクトの初期化
```bash
firebase init hosting
```

### 4. デプロイ
```bash
firebase deploy
```

## 📁 プロジェクト構成

```
tablet/
├── index.html                    # メインHTML
├── css/
│   └── style.css                # スタイルシート
├── js/
│   ├── firebase-config.js       # Firebase設定
│   ├── app.js                   # メインアプリケーション
│   ├── simple-communication.js  # シンプル通信システム
│   ├── connection-manager.js    # 接続管理システム
│   └── simple-camera.js         # スマホカメラシステム
├── images/                      # 画像ファイル
├── firebase.json               # Firebase設定
├── database.rules.json         # データベースルール
└── README.md                   # このファイル
```

## 🔧 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **バックエンド**: Firebase (Hosting, Database, Authentication)
- **通信**: WebRTC (PeerJS), Firebase Realtime Database
- **ライブラリ**: PeerJS, Firebase SDK

## 📱 使用方法

### 基本操作
1. **サイトにアクセス**: `https://your-project.firebaseapp.com`
2. **端末タイプ選択**: 画面下部のボタンで端末タイプを選択
3. **機能利用**: 各端末に応じた機能を利用

### スマホカメラ配信
1. **スマホ**: カメラ画面 → 「📹 カメラ開始」 → 「🚀 配信開始」
2. **タブレット**: カメラ画面 → 「📺 タブレットで表示」
3. **自動接続**: スマホからの映像が自動で表示

### マスター制御
1. **マスター画面**: 全端末の統合制御
2. **チーム管理**: チーム進行の一括制御
3. **車両番号**: 豪華列車風車両番号の制御
4. **接続監視**: 全端末の接続状態確認

## 🔍 デバッグ機能

### コンソールコマンド
```javascript
// 全システム状態確認
debugApp.checkAll()

// 通信テスト
testComm.test()

// カメラシステム
simpleCamera.start()
simpleCamera.stream()
simpleCamera.stop()
```

### 接続状態確認
- **右上の接続インジケーター**: リアルタイム接続状態
- **緑色**: 接続中
- **黄色**: 接続中（警告）
- **赤色**: 切断中

## ⚙️ 設定

### Firebase設定
`js/firebase-config.js`でFirebase設定を確認・変更：
```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebaseio.com",
    projectId: "your-project-id",
    // ...
};
```

### データベースルール
`database.rules.json`でセキュリティルールを設定

## 🛠️ 開発

### ローカル開発
1. **Firebase Emulator起動**:
   ```bash
   firebase emulators:start
   ```

2. **ローカルサーバー起動**:
   ```bash
   python -m http.server 8000
   # または
   npx serve .
   ```

### ファイル構成
- **新機能追加**: `js/`フォルダに新しいJSファイルを作成
- **スタイル追加**: `css/style.css`にCSSを追加
- **画像追加**: `images/`フォルダに画像を配置

## 📞 サポート

### よくある問題
1. **接続エラー**: インターネット接続を確認
2. **カメラエラー**: ブラウザのカメラ許可を確認
3. **Firebaseエラー**: 設定ファイルを確認

### 技術サポート
- **ブラウザ**: Chrome, Safari, Firefox, Edge
- **デバイス**: PC, タブレット, スマートフォン
- **ネットワーク**: Wi-Fi, モバイルデータ

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

---

**最終更新**: 2024年12月
**バージョン**: 1.0.0 