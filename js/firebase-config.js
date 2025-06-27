// Firebase設定
// 注意: 実際の本番環境では、これらの設定値を環境変数や設定ファイルから読み込むようにしてください
const firebaseConfig = {
    // ここにFirebaseプロジェクトの設定を入力してください
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Firebase初期化
let app;
let database;

try {
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('Firebase初期化完了');
} catch (error) {
    console.error('Firebase初期化エラー:', error);
}

// データベース参照
const dbRef = {
    // デバイス管理
    devices: database.ref('devices'),
    
    // 公演状態
    showState: database.ref('showState'),
    
    // 現在のシーン
    currentScene: database.ref('currentScene'),
    
    // システム設定
    settings: database.ref('settings')
};

// Firebase接続状態監視
database.ref('.info/connected').on('value', (snapshot) => {
    const connected = snapshot.val();
    const statusElement = document.getElementById('connectionStatus');
    
    if (connected) {
        statusElement.textContent = 'オンライン';
        statusElement.className = 'status online';
        console.log('Firebaseに接続されました');
    } else {
        statusElement.textContent = 'オフライン';
        statusElement.className = 'status offline';
        console.log('Firebaseから切断されました');
    }
});

// エラーハンドリング
window.addEventListener('error', (e) => {
    if (e.error && e.error.message.includes('firebase')) {
        console.error('Firebase関連エラー:', e.error);
        
        // ユーザーに分かりやすいエラーメッセージを表示
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = '接続エラー';
        statusElement.className = 'status offline';
    }
});

// Firebase設定状況の確認
function checkFirebaseConfig() {
    const isConfigured = firebaseConfig.apiKey !== "your-api-key-here";
    
    if (!isConfigured) {
        console.warn('Firebase設定が未完了です。js/firebase-config.jsファイルを編集してください。');
        
        // 設定未完了の場合のダミーデータでテスト可能にする
        return false;
    }
    
    return true;
}

// 設定状況をエクスポート
window.firebaseConfigured = checkFirebaseConfig(); 