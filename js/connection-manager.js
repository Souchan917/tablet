// 端末接続管理システム
class ConnectionManager {
    constructor() {
        this.deviceId = this.generateDeviceId();
        this.deviceType = null;
        this.isOnline = navigator.onLine;
        this.isFirebaseConnected = false;
        this.heartbeatInterval = null;
        this.connectionCheckInterval = null;
        this.lastHeartbeat = null;
        this.connectionHistory = [];
        
        this.init();
    }

    // 初期化
    init() {
        console.log('接続管理システム初期化 - デバイスID:', this.deviceId);
        
        // ネットワーク状態の監視
        this.setupNetworkMonitoring();
        
        // Firebase接続状態の監視
        this.setupFirebaseMonitoring();
        
        // ハートビート開始
        this.startHeartbeat();
        
        // 接続状態チェック開始
        this.startConnectionCheck();
        
        // ページ離脱時の処理
        this.setupUnloadHandler();
    }

    // デバイスID生成
    generateDeviceId() {
        let deviceId = localStorage.getItem('tablet_device_id');
        if (!deviceId) {
            deviceId = 'tablet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tablet_device_id', deviceId);
        }
        return deviceId;
    }

    // ネットワーク監視の設定
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            console.log('ネットワーク接続復旧');
            this.isOnline = true;
            this.updateConnectionStatus();
            this.showConnectionNotification('ネットワーク接続復旧', 'success');
        });

        window.addEventListener('offline', () => {
            console.log('ネットワーク接続切断');
            this.isOnline = false;
            this.updateConnectionStatus();
            this.showConnectionNotification('ネットワーク接続切断', 'error');
        });
    }

    // Firebase監視の設定
    setupFirebaseMonitoring() {
        if (typeof database !== 'undefined' && database) {
            const connectedRef = database.ref('.info/connected');
            connectedRef.on('value', (snapshot) => {
                this.isFirebaseConnected = snapshot.val() === true;
                console.log('Firebase接続状態変更:', this.isFirebaseConnected);
                this.updateConnectionStatus();
                
                if (this.isFirebaseConnected) {
                    this.showConnectionNotification('Firebase接続成功', 'success');
                    this.registerDevice();
                    this.setupCommunicationTestListener();
                } else {
                    this.showConnectionNotification('Firebase接続切断', 'error');
                }
            });
        }
    }

    // 通信テスト要求の監視
    setupCommunicationTestListener() {
        if (!this.isFirebaseConnected) return;

        const testPath = `communication_test/${this.deviceId}`;
        database.ref(testPath).on('value', (snapshot) => {
            const testData = snapshot.val();
            if (testData && testData.fromDevice !== this.deviceId) {
                console.log('通信テスト要求受信:', testData);
                this.respondToCommunicationTest(testData);
            }
        });
    }

    // 通信テストに応答
    respondToCommunicationTest(testData) {
        const response = {
            testId: testData.testId,
            fromDevice: testData.fromDevice,
            toDevice: this.deviceId,
            timestamp: Date.now(),
            response: 'OK',
            deviceInfo: {
                type: this.deviceType,
                id: this.deviceId,
                isOnline: this.isOnline,
                isFirebaseConnected: this.isFirebaseConnected
            }
        };

        const responsePath = `communication_test_response/${testData.fromDevice}/${testData.testId}`;
        writeData(responsePath, response).then(() => {
            console.log('通信テスト応答送信:', response);
        }).catch(error => {
            console.error('通信テスト応答エラー:', error);
        });
    }

    // デバイス登録
    registerDevice() {
        if (!this.isFirebaseConnected) return;

        const deviceData = {
            id: this.deviceId,
            type: this.deviceType || 'unknown',
            timestamp: Date.now(),
            lastSeen: Date.now(),
            isOnline: this.isOnline,
            isFirebaseConnected: this.isFirebaseConnected,
            userAgent: navigator.userAgent,
            url: window.location.href,
            screen: {
                width: screen.width,
                height: screen.height
            },
            connection: this.getConnectionInfo()
        };

        const path = `devices/active/${this.deviceId}`;
        writeData(path, deviceData).then(() => {
            console.log('デバイス登録成功:', deviceData);
        }).catch(error => {
            console.error('デバイス登録エラー:', error);
        });
    }

    // 接続情報取得
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            };
        }
        return null;
    }

    // ハートビート開始
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 30000); // 30秒ごと
        
        // 初回実行
        this.sendHeartbeat();
    }

    // ハートビート送信
    sendHeartbeat() {
        if (!this.isFirebaseConnected) return;

        this.lastHeartbeat = Date.now();
        const heartbeatData = {
            deviceId: this.deviceId,
            timestamp: this.lastHeartbeat,
            isOnline: this.isOnline,
            isFirebaseConnected: this.isFirebaseConnected,
            deviceType: this.deviceType
        };

        const path = `heartbeat/${this.deviceId}`;
        writeData(path, heartbeatData).then(() => {
            console.log('ハートビート送信成功');
        }).catch(error => {
            console.error('ハートビート送信エラー:', error);
        });
    }

    // 接続状態チェック開始
    startConnectionCheck() {
        this.connectionCheckInterval = setInterval(() => {
            this.checkConnectionHealth();
        }, 60000); // 1分ごと
    }

    // 接続健康状態チェック
    checkConnectionHealth() {
        const now = Date.now();
        const lastHeartbeatAge = this.lastHeartbeat ? now - this.lastHeartbeat : null;
        
        const healthStatus = {
            timestamp: now,
            deviceId: this.deviceId,
            isOnline: this.isOnline,
            isFirebaseConnected: this.isFirebaseConnected,
            lastHeartbeatAge: lastHeartbeatAge,
            connectionHistory: this.connectionHistory.slice(-10) // 最新10件
        };

        // 接続履歴に追加
        this.connectionHistory.push({
            timestamp: now,
            isOnline: this.isOnline,
            isFirebaseConnected: this.isFirebaseConnected
        });

        // 履歴を最新50件に制限
        if (this.connectionHistory.length > 50) {
            this.connectionHistory = this.connectionHistory.slice(-50);
        }

        // Firebase に送信
        if (this.isFirebaseConnected) {
            const path = `health/${this.deviceId}`;
            writeData(path, healthStatus);
        }

        console.log('接続健康状態:', healthStatus);
    }

    // デバイスタイプ設定
    setDeviceType(type) {
        this.deviceType = type;
        console.log('デバイスタイプ設定:', type);
        
        // 即座にデバイス情報を更新
        if (this.isFirebaseConnected) {
            this.registerDevice();
        }
    }

    // 接続状態表示更新
    updateConnectionStatus() {
        const indicator = document.querySelector('.connection-indicator');
        if (!indicator) return;

        // 接続状態に応じて色を変更
        if (this.isOnline && this.isFirebaseConnected) {
            indicator.style.backgroundColor = 'rgba(76, 175, 80, 0.8)'; // 緑
            indicator.title = 'オンライン・Firebase接続中';
        } else if (this.isOnline && !this.isFirebaseConnected) {
            indicator.style.backgroundColor = 'rgba(255, 193, 7, 0.8)'; // 黄色
            indicator.title = 'オンライン・Firebase切断中';
        } else {
            indicator.style.backgroundColor = 'rgba(244, 67, 54, 0.8)'; // 赤
            indicator.title = 'オフライン';
        }

        // Firebase に状態更新を送信
        if (this.isFirebaseConnected) {
            this.registerDevice();
        }
    }

    // 接続通知表示
    showConnectionNotification(message, type) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            console.log(`接続通知: ${message} (${type})`);
        }
    }

    // 他のデバイスの状態取得
    getOtherDevices() {
        return new Promise((resolve, reject) => {
            if (!this.isFirebaseConnected) {
                reject(new Error('Firebase未接続'));
                return;
            }

            database.ref('devices/active').once('value', (snapshot) => {
                const devices = snapshot.val() || {};
                const otherDevices = Object.values(devices).filter(device => 
                    device.id !== this.deviceId
                );
                resolve(otherDevices);
            }, reject);
        });
    }

    // 通信テスト
    async testCommunication(targetDeviceId) {
        if (!this.isFirebaseConnected) {
            throw new Error('Firebase未接続');
        }

        const testMessage = {
            fromDevice: this.deviceId,
            toDevice: targetDeviceId,
            timestamp: Date.now(),
            message: '通信テスト',
            testId: Math.random().toString(36).substr(2, 9)
        };

        const path = `communication_test/${targetDeviceId}`;
        await writeData(path, testMessage);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('通信テストタイムアウト'));
            }, 10000); // 10秒でタイムアウト

            const responsePath = `communication_test_response/${this.deviceId}/${testMessage.testId}`;
            database.ref(responsePath).on('value', (snapshot) => {
                const response = snapshot.val();
                if (response) {
                    clearTimeout(timeout);
                    resolve(response);
                }
            });
        });
    }

    // ページ離脱時の処理
    setupUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // ページ非表示時の処理
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('ページが非表示になりました');
            } else {
                console.log('ページが表示されました');
                if (this.isFirebaseConnected) {
                    this.registerDevice();
                }
            }
        });
    }

    // クリーンアップ
    cleanup() {
        console.log('接続管理システムクリーンアップ');
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }

        // デバイス情報をアーカイブに移動
        if (this.isFirebaseConnected) {
            const archivePath = `devices/archive/${this.deviceId}_${Date.now()}`;
            const activePath = `devices/active/${this.deviceId}`;
            
            writeData(archivePath, {
                deviceId: this.deviceId,
                disconnectedAt: Date.now(),
                lastActiveType: this.deviceType
            });
            
            writeData(activePath, null); // アクティブリストから削除
        }
    }

    // デバッグ情報取得
    getDebugInfo() {
        return {
            deviceId: this.deviceId,
            deviceType: this.deviceType,
            isOnline: this.isOnline,
            isFirebaseConnected: this.isFirebaseConnected,
            lastHeartbeat: this.lastHeartbeat,
            connectionHistory: this.connectionHistory.slice(-5),
            connectionInfo: this.getConnectionInfo()
        };
    }
}

// グローバルインスタンス
let connectionManager = null;

// 初期化関数
function initializeConnectionManager() {
    if (!connectionManager) {
        connectionManager = new ConnectionManager();
        
        // グローバルに公開
        window.connectionManager = connectionManager;
        
        console.log('接続管理システム初期化完了');
    }
    return connectionManager;
}

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    // Firebase初期化を待つ
    setTimeout(() => {
        initializeConnectionManager();
    }, 1000);
});

// デバッグ用のグローバル関数
window.debugConnection = {
    // 接続状態確認
    status: () => {
        if (!connectionManager) {
            console.log('接続管理システムが初期化されていません');
            return;
        }
        
        const debugInfo = connectionManager.getDebugInfo();
        console.log('=== 接続デバッグ情報 ===');
        console.log('デバイスID:', debugInfo.deviceId);
        console.log('デバイスタイプ:', debugInfo.deviceType);
        console.log('オンライン状態:', debugInfo.isOnline);
        console.log('Firebase接続:', debugInfo.isFirebaseConnected);
        console.log('最終ハートビート:', new Date(debugInfo.lastHeartbeat).toLocaleString());
        console.log('接続履歴:', debugInfo.connectionHistory);
        console.log('接続情報:', debugInfo.connectionInfo);
        return debugInfo;
    },
    
    // 他のデバイス一覧取得
    devices: async () => {
        if (!connectionManager || !connectionManager.isFirebaseConnected) {
            console.log('Firebase未接続');
            return [];
        }
        
        try {
            const devices = await connectionManager.getOtherDevices();
            console.log('=== 接続中デバイス一覧 ===');
            devices.forEach((device, index) => {
                console.log(`${index + 1}. ${device.type} (${device.id})`);
                console.log(`   最終確認: ${new Date(device.lastSeen).toLocaleString()}`);
                console.log(`   オンライン: ${device.isOnline}, Firebase: ${device.isFirebaseConnected}`);
            });
            return devices;
        } catch (error) {
            console.error('デバイス一覧取得エラー:', error);
            return [];
        }
    },
    
    // 通信テスト
    test: async (targetDeviceId) => {
        if (!connectionManager || !connectionManager.isFirebaseConnected) {
            console.log('Firebase未接続');
            return;
        }
        
        try {
            console.log(`通信テスト開始: ${targetDeviceId}`);
            const result = await connectionManager.testCommunication(targetDeviceId);
            console.log('通信テスト成功:', result);
            return result;
        } catch (error) {
            console.error('通信テスト失敗:', error);
            return null;
        }
    },
    
    // Firebase接続テスト
    firebase: () => {
        if (typeof window.testFirebaseConnection === 'function') {
            return window.testFirebaseConnection();
        } else {
            console.log('Firebase接続テスト関数が見つかりません');
        }
    },
    
    // ハートビート手動送信
    heartbeat: () => {
        if (!connectionManager) {
            console.log('接続管理システムが初期化されていません');
            return;
        }
        
        connectionManager.sendHeartbeat();
        console.log('ハートビートを手動送信しました');
    },
    
    // 接続ログ表示
    logs: () => {
        if (!connectionManager) {
            console.log('接続管理システムが初期化されていません');
            return;
        }
        
        console.log('=== 接続履歴 ===');
        connectionManager.connectionHistory.forEach((entry, index) => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            console.log(`${index + 1}. ${time} - オンライン:${entry.isOnline}, Firebase:${entry.isFirebaseConnected}`);
        });
        
        return connectionManager.connectionHistory;
    },
    
    // ヘルプ表示
    help: () => {
        console.log('=== 接続デバッグ コマンド ===');
        console.log('debugConnection.status()     - 接続状態確認');
        console.log('debugConnection.devices()    - 他デバイス一覧');
        console.log('debugConnection.test(id)     - 通信テスト');
        console.log('debugConnection.firebase()   - Firebase接続テスト');
        console.log('debugConnection.heartbeat()  - ハートビート送信');
        console.log('debugConnection.logs()       - 接続履歴表示');
        console.log('debugConnection.help()       - このヘルプ');
        console.log('');
        console.log('例: debugConnection.test("tablet_123...")');
    }
};

// 初回ヘルプ表示
setTimeout(() => {
    console.log('🔗 端末接続管理システムが利用可能です');
    console.log('デバッグコマンド: debugConnection.help()');
}, 2000); 