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
        console.log('Firebase初期化を開始...', firebaseConfig);
        
        // Firebase初期化
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        console.log('Firebase初期化完了、接続状態監視を開始...');
        
        // 接続状態を監視
        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            isConnected = snapshot.val() === true;
            console.log('Firebase接続状態変更:', isConnected);
            updateConnectionStatus();
        });
        
        // 接続テスト
        database.ref('test').set({
            timestamp: Date.now(),
            message: 'Firebase接続テスト'
        }).then(() => {
            console.log('Firebase書き込みテスト成功');
        }).catch(error => {
            console.error('Firebase書き込みテストエラー:', error);
        });
        
        console.log('Firebase初期化成功');
        return true;
    } catch (error) {
        console.error('Firebase初期化エラー:', error);
        console.error('エラーの詳細:', error.message);
        return false;
    }
}

// 接続状態表示の更新
function updateConnectionStatus() {
    let statusElement = document.getElementById('connection-indicator');
    if (!statusElement) {
        // HTMLに既存の接続インジケーターを使用
        statusElement = document.querySelector('.connection-indicator');
    }
    
    if (statusElement) {
        if (isConnected) {
            statusElement.style.backgroundColor = 'rgba(76, 175, 80, 0.7)'; // 緑色（接続中）
            statusElement.title = 'Firebase接続中';
        } else {
            statusElement.style.backgroundColor = 'rgba(244, 67, 54, 0.7)'; // 赤色（切断中）
            statusElement.title = 'Firebase切断中';
        }
    }
    
    console.log('Firebase接続状態:', isConnected ? '接続中' : '切断中');
}

// データベース操作関数
function writeData(path, data) {
    return new Promise((resolve, reject) => {
        if (database) {
            console.log(`Firebase書き込み: ${path}`, data);
            database.ref(path).set(data)
                .then((result) => {
                    console.log(`Firebase書き込み成功: ${path}`);
                    resolve(result);
                })
                .catch((error) => {
                    console.error(`Firebase書き込みエラー: ${path}`, error);
                    reject(error);
                });
        } else {
            console.warn('Firebase未接続 - ローカルモードで動作中');
            resolve();
        }
    });
}

function readData(path, callback) {
    if (database) {
        console.log(`Firebase読み込み監視開始: ${path}`);
        try {
            database.ref(path).on('value', (snapshot) => {
                console.log(`Firebase読み込み: ${path}`, snapshot.val());
                callback(snapshot);
            }, (error) => {
                console.error(`Firebase読み込みエラー: ${path}`, error);
            });
        } catch (error) {
            console.error(`Firebase監視設定エラー: ${path}`, error);
        }
    } else {
        console.warn('Firebase未接続 - ローカルモードで動作中');
    }
}

function removeListener(path, callback) {
    if (database) {
        console.log(`Firebase監視停止: ${path}`);
        try {
            database.ref(path).off('value', callback);
        } catch (error) {
            console.error(`Firebase監視停止エラー: ${path}`, error);
        }
    }
}

// コマンド送信関数（タイムスタンプ付き）
function sendCommand(target, command, data) {
    const commandData = {
        command: command,
        data: data || {},
        timestamp: Date.now(),
        sender: window.location.hostname + '_' + Date.now()
    };
    
    const path = `commands/${target}`;
    console.log(`コマンド送信: ${target} -> ${command}`, commandData);
    
    return writeData(path, commandData);
}

// デバイス登録関数
function registerDevice(deviceType, deviceId) {
    const deviceData = {
        type: deviceType,
        id: deviceId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        lastSeen: Date.now()
    };
    
    const path = `devices/${deviceId}`;
    console.log(`デバイス登録: ${deviceType}`, deviceData);
    
    return writeData(path, deviceData);
}

// デバイス状態更新（定期的に実行）
function updateDeviceStatus(deviceId) {
    if (database) {
        const path = `devices/${deviceId}/lastSeen`;
        return writeData(path, Date.now());
    }
    return Promise.resolve();
}

// Firebase接続テスト用の関数
function testFirebaseConnection() {
    console.log('Firebase接続テストを開始...');
    
    if (!database) {
        console.error('Firebase database が初期化されていません');
        return Promise.reject(new Error('Database not initialized'));
    }
    
    const testPath = `test/connection_test_${Date.now()}`;
    const testData = {
        timestamp: Date.now(),
        message: 'Firebase接続テスト',
        device: navigator.userAgent
    };
    
    return writeData(testPath, testData)
        .then(() => {
            console.log('Firebase書き込みテスト成功');
            return new Promise((resolve) => {
                database.ref(testPath).once('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data && data.message === 'Firebase接続テスト') {
                        console.log('Firebase読み込みテスト成功');
                        resolve(true);
                    } else {
                        console.error('Firebase読み込みテストで異常なデータ:', data);
                        resolve(false);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Firebase接続テストエラー:', error);
            return false;
        });
}

// グローバルに関数を公開（デバッグ用）
window.testFirebaseConnection = testFirebaseConnection;
window.firebaseDebug = {
    database: () => database,
    isConnected: () => isConnected,
    writeData: writeData,
    readData: readData,
    sendCommand: sendCommand,
    registerDevice: registerDevice
};

// 初期化実行
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM読み込み完了、Firebase初期化を開始...');
    
    // Firebase SDKが読み込まれているかを確認
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK が読み込まれていません！');
        console.error('HTMLファイルで Firebase SDK のスクリプトタグを確認してください。');
        return;
    }
    
    // Firebase SDKのバージョン確認
    console.log('Firebase SDK version:', firebase.SDK_VERSION);
    
    // Firebase初期化
    const initResult = initializeFirebase();
    
    if (!initResult) {
        console.error('Firebase初期化に失敗しました');
        // 接続インジケーターを赤に設定
        const indicator = document.querySelector('.connection-indicator');
        if (indicator) {
            indicator.style.backgroundColor = 'rgba(244, 67, 54, 0.7)';
            indicator.title = 'Firebase初期化失敗';
        }
    }
    
    // 5秒後に再度接続状態を確認
    setTimeout(() => {
        console.log('5秒後の接続状態確認:', isConnected);
        if (!isConnected) {
            console.warn('Firebase接続が確立されていません。ネットワーク接続を確認してください。');
        }
    }, 5000);
}); 