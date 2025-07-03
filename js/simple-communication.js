// シンプルな端末間通信システム
class SimpleCommunication {
    constructor() {
        this.deviceId = this.generateDeviceId();
        this.isConnected = false;
        this.messageListeners = new Map();
        
        console.log('シンプル通信システム初期化 - デバイスID:', this.deviceId);
        this.init();
    }

    // 初期化
    init() {
        // Firebase接続確認
        this.checkFirebaseConnection();
        
        // メッセージ監視開始
        this.startMessageListener();
        
        // 接続状態監視
        this.startConnectionMonitor();
    }

    // デバイスID生成
    generateDeviceId() {
        let deviceId = localStorage.getItem('simple_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            localStorage.setItem('simple_device_id', deviceId);
        }
        return deviceId;
    }

    // Firebase接続確認
    checkFirebaseConnection() {
        if (typeof database !== 'undefined' && database) {
            console.log('Firebase接続確認中...');
            
            // 接続状態監視
            database.ref('.info/connected').on('value', (snapshot) => {
                this.isConnected = snapshot.val() === true;
                console.log('Firebase接続状態:', this.isConnected ? '接続中' : '切断中');
                
                if (this.isConnected) {
                    this.onConnected();
                } else {
                    this.onDisconnected();
                }
            });
        } else {
            console.error('Firebase が初期化されていません');
            setTimeout(() => this.checkFirebaseConnection(), 1000);
        }
    }

    // 接続時の処理
    onConnected() {
        console.log('Firebase接続成功');
        
        // デバイス情報を登録
        const deviceInfo = {
            id: this.deviceId,
            timestamp: Date.now(),
            connected: true,
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        database.ref(`simple_devices/${this.deviceId}`).set(deviceInfo);
        
        // 接続状態表示を更新
        this.updateConnectionDisplay(true);
    }

    // 切断時の処理
    onDisconnected() {
        console.log('Firebase接続切断');
        this.updateConnectionDisplay(false);
    }

    // メッセージ監視開始
    startMessageListener() {
        if (typeof database === 'undefined') {
            setTimeout(() => this.startMessageListener(), 1000);
            return;
        }

        console.log('メッセージ監視開始');
        
        // 全体メッセージ監視
        database.ref('simple_messages').on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message && message.senderId !== this.deviceId) {
                console.log('メッセージ受信:', message);
                this.handleMessage(message);
            }
        });

        // 個別メッセージ監視
        database.ref(`simple_messages_direct/${this.deviceId}`).on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message) {
                console.log('個別メッセージ受信:', message);
                this.handleMessage(message);
            }
        });
    }

    // 接続状態監視
    startConnectionMonitor() {
        setInterval(() => {
            if (this.isConnected) {
                // 生存確認
                database.ref(`simple_devices/${this.deviceId}/lastSeen`).set(Date.now());
            }
        }, 30000); // 30秒ごと
    }

    // メッセージ送信（全体）
    sendMessage(type, data = {}) {
        if (!this.isConnected) {
            console.error('Firebase未接続のため送信できません');
            return Promise.reject(new Error('Firebase未接続'));
        }

        const message = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            senderId: this.deviceId,
            type: type,
            data: data,
            timestamp: Date.now()
        };

        console.log('メッセージ送信:', message);
        
        return database.ref('simple_messages').push(message).then(() => {
            console.log('メッセージ送信完了');
            return message;
        }).catch(error => {
            console.error('メッセージ送信エラー:', error);
            throw error;
        });
    }

    // メッセージ送信（個別）
    sendDirectMessage(targetDeviceId, type, data = {}) {
        if (!this.isConnected) {
            console.error('Firebase未接続のため送信できません');
            return Promise.reject(new Error('Firebase未接続'));
        }

        const message = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            senderId: this.deviceId,
            targetId: targetDeviceId,
            type: type,
            data: data,
            timestamp: Date.now()
        };

        console.log('個別メッセージ送信:', message);
        
        return database.ref(`simple_messages_direct/${targetDeviceId}`).push(message).then(() => {
            console.log('個別メッセージ送信完了');
            return message;
        }).catch(error => {
            console.error('個別メッセージ送信エラー:', error);
            throw error;
        });
    }

    // メッセージ処理
    handleMessage(message) {
        const { type, data, senderId } = message;
        
        // 登録されたリスナーを実行
        if (this.messageListeners.has(type)) {
            const listeners = this.messageListeners.get(type);
            listeners.forEach(listener => {
                try {
                    listener(data, senderId, message);
                } catch (error) {
                    console.error('メッセージリスナーエラー:', error);
                }
            });
        }

        // デフォルト処理
        switch (type) {
            case 'ping':
                console.log(`Ping受信: ${senderId}`);
                this.sendDirectMessage(senderId, 'pong', { originalTimestamp: data.timestamp });
                break;
                
            case 'pong':
                console.log(`Pong受信: ${senderId}`);
                break;
                
            case 'test':
                console.log(`テストメッセージ受信: ${senderId}`, data);
                break;
                
            default:
                console.log(`未知のメッセージタイプ: ${type}`, message);
        }
    }

    // メッセージリスナー登録
    addMessageListener(type, callback) {
        if (!this.messageListeners.has(type)) {
            this.messageListeners.set(type, []);
        }
        this.messageListeners.get(type).push(callback);
        console.log(`メッセージリスナー登録: ${type}`);
    }

    // メッセージリスナー削除
    removeMessageListener(type, callback) {
        if (this.messageListeners.has(type)) {
            const listeners = this.messageListeners.get(type);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
                console.log(`メッセージリスナー削除: ${type}`);
            }
        }
    }

    // 接続中のデバイス一覧取得
    getConnectedDevices() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Firebase未接続'));
                return;
            }

            database.ref('simple_devices').once('value', (snapshot) => {
                const devices = snapshot.val() || {};
                const connectedDevices = Object.values(devices).filter(device => {
                    const age = Date.now() - (device.lastSeen || device.timestamp);
                    return age < 120000; // 2分以内
                });
                resolve(connectedDevices);
            }, reject);
        });
    }

    // 接続状態表示更新
    updateConnectionDisplay(connected) {
        const indicator = document.querySelector('.connection-indicator');
        if (indicator) {
            indicator.className = 'connection-indicator ' + (connected ? 'online' : 'offline');
            indicator.title = connected ? 'Firebase接続中' : 'Firebase切断中';
        }
    }

    // 通信テスト
    testCommunication() {
        console.log('通信テスト開始');
        
        const testData = {
            message: 'テスト通信',
            timestamp: Date.now()
        };
        
        return this.sendMessage('test', testData);
    }

    // Ping送信
    ping() {
        console.log('Ping送信');
        return this.sendMessage('ping', { timestamp: Date.now() });
    }

    // 状態取得
    getStatus() {
        return {
            deviceId: this.deviceId,
            isConnected: this.isConnected,
            messageListeners: Array.from(this.messageListeners.keys())
        };
    }
}

// グローバルインスタンス
let simpleCommunication = null;

// 初期化関数
function initSimpleCommunication() {
    if (!simpleCommunication) {
        simpleCommunication = new SimpleCommunication();
        window.simpleCommunication = simpleCommunication;
        
        // デバッグ用グローバル関数
        window.testComm = {
            // 状態確認
            status: () => simpleCommunication.getStatus(),
            
            // テスト送信
            test: (message = 'テストメッセージ') => {
                return simpleCommunication.sendMessage('test', { message });
            },
            
            // Ping送信
            ping: () => simpleCommunication.ping(),
            
            // 接続デバイス一覧
            devices: () => simpleCommunication.getConnectedDevices(),
            
            // 個別メッセージ送信
            direct: (deviceId, message) => {
                return simpleCommunication.sendDirectMessage(deviceId, 'test', { message });
            }
        };
        
        console.log('シンプル通信システム初期化完了');
        console.log('デバッグコマンド: testComm.status(), testComm.test(), testComm.ping()');
    }
    return simpleCommunication;
}

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initSimpleCommunication();
    }, 1000);
}); 