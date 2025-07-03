// Firebase設定
const firebaseConfig = {
    apiKey: "AIzaSyDwSOsoNTIj0nq9I2kdH11MjUjbUv9qhFk",
    authDomain: "gatango-3ea57.firebaseapp.com",
    databaseURL: "https://gatango-3ea57-default-rtdb.firebaseio.com/",
    projectId: "gatango-3ea57",
    storageBucket: "gatango-3ea57.firebasestorage.app",
    messagingSenderId: "431233584497",
    appId: "1:431233584497:web:75ee10ee13c7691d6e3ad0",
    measurementId: "G-4134JZPRFQ"
};

// Firebase初期化
let database = null;
let isConnected = false;

// Firebase接続関数
function initializeFirebase() {
    try {
        // Firebase初期化
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        // 接続状態を監視
        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            isConnected = snapshot.val() === true;
            updateConnectionStatus();
        });
        
        console.log('Firebase初期化成功');
        return true;
    } catch (error) {
        console.error('Firebase初期化エラー:', error);
        return false;
    }
}

// 接続状態表示の更新
function updateConnectionStatus() {
    let statusElement = document.getElementById('connection-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'connection-status';
        statusElement.className = 'connection-status';
        document.body.appendChild(statusElement);
    }
    
    if (isConnected) {
        statusElement.textContent = '接続中';
        statusElement.className = 'connection-status connected';
    } else {
        statusElement.textContent = '切断中';
        statusElement.className = 'connection-status disconnected';
    }
}

// データベース操作関数
function writeData(path, data) {
    if (database && isConnected) {
        return database.ref(path).set(data);
    } else {
        console.warn('Firebase未接続 - ローカルモードで動作中');
        return Promise.resolve();
    }
}

function readData(path, callback) {
    if (database && isConnected) {
        database.ref(path).on('value', callback);
    } else {
        console.warn('Firebase未接続 - ローカルモードで動作中');
    }
}

function removeListener(path, callback) {
    if (database && isConnected) {
        database.ref(path).off('value', callback);
    }
}

// 初期化実行
document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
}); 