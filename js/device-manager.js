// デバイス管理クラス
class DeviceManager {
    constructor() {
        this.deviceId = this.generateDeviceId();
        this.deviceInfo = {
            id: this.deviceId,
            name: '',
            type: 'tablet',
            status: 'offline',
            lastSeen: Date.now(),
            scene: 0
        };
        
        this.connectedDevices = new Map();
        this.isOnline = false;
        
        // デバイスIDを表示
        this.updateDeviceIdDisplay();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 接続状態の監視
        this.monitorConnection();
    }
    
    // デバイスID生成
    generateDeviceId() {
        return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }
    
    // デバイスID表示更新
    updateDeviceIdDisplay() {
        const deviceIdElement = document.getElementById('deviceId');
        if (deviceIdElement) {
            deviceIdElement.textContent = `デバイス: ${this.deviceId.substring(0, 12)}...`;
        }
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // デバイス接続ボタン
        const connectButton = document.getElementById('connectDevice');
        if (connectButton) {
            connectButton.addEventListener('click', () => this.connectDevice());
        }
        
        // デバイス名入力フィールド
        const deviceNameInput = document.getElementById('deviceName');
        if (deviceNameInput) {
            deviceNameInput.addEventListener('input', (e) => {
                this.deviceInfo.name = e.target.value;
            });
        }
        
        // デバイスタイプ選択
        const deviceTypeSelect = document.getElementById('deviceType');
        if (deviceTypeSelect) {
            deviceTypeSelect.addEventListener('change', (e) => {
                this.deviceInfo.type = e.target.value;
                this.updateUIForDeviceType(e.target.value);
            });
        }
    }
    
    // デバイスタイプに応じたUI更新
    updateUIForDeviceType(deviceType) {
        const adminPanel = document.getElementById('adminPanel');
        const tabletDisplay = document.getElementById('tabletDisplay');
        const deviceSetup = document.getElementById('deviceSetup');
        
        if (deviceType === 'admin') {
            adminPanel.style.display = 'block';
            tabletDisplay.style.display = 'none';
            deviceSetup.style.display = 'none';
        } else {
            adminPanel.style.display = 'none';
            tabletDisplay.style.display = 'flex';
            deviceSetup.style.display = 'none';
        }
    }
    
    // デバイス接続
    async connectDevice() {
        try {
            const deviceName = document.getElementById('deviceName').value.trim();
            const deviceType = document.getElementById('deviceType').value;
            
            if (!deviceName) {
                alert('デバイス名を入力してください');
                return;
            }
            
            this.deviceInfo.name = deviceName;
            this.deviceInfo.type = deviceType;
            this.deviceInfo.status = 'online';
            this.deviceInfo.lastSeen = Date.now();
            
            // Firebaseにデバイス情報を保存
            if (window.firebaseConfigured && database) {
                await dbRef.devices.child(this.deviceId).set(this.deviceInfo);
                console.log('デバイス情報をFirebaseに保存しました');
            } else {
                console.log('テストモード: デバイス情報をローカルに保存');
                this.simulateConnection();
            }
            
            this.isOnline = true;
            this.updateUIForDeviceType(deviceType);
            this.startHeartbeat();
            
            // 接続成功メッセージ
            this.showNotification('デバイスが正常に接続されました', 'success');
            
        } catch (error) {
            console.error('デバイス接続エラー:', error);
            this.showNotification('デバイス接続に失敗しました', 'error');
        }
    }
    
    // 接続状態監視
    monitorConnection() {
        if (window.firebaseConfigured && database) {
            // Firebaseデバイス一覧監視
            dbRef.devices.on('value', (snapshot) => {
                const devices = snapshot.val() || {};
                this.updateConnectedDevicesList(devices);
            });
            
            // 自デバイスの状態監視
            dbRef.devices.child(this.deviceId).on('value', (snapshot) => {
                const deviceData = snapshot.val();
                if (deviceData) {
                    this.deviceInfo = { ...this.deviceInfo, ...deviceData };
                }
            });
        } else {
            // テストモード用のダミーデータ
            this.setupTestMode();
        }
    }
    
    // テストモード設定
    setupTestMode() {
        console.log('テストモードで動作中');
        
        // ダミーデバイスデータ
        const dummyDevices = {
            'device_test1': {
                id: 'device_test1',
                name: 'テストタブレット1',
                type: 'tablet',
                status: 'online',
                lastSeen: Date.now(),
                scene: 1
            },
            'device_test2': {
                id: 'device_test2',
                name: 'テストモニター1',
                type: 'monitor',
                status: 'online',
                lastSeen: Date.now(),
                scene: 1
            }
        };
        
        setTimeout(() => {
            this.updateConnectedDevicesList(dummyDevices);
        }, 1000);
    }
    
    // 接続デバイス一覧更新
    updateConnectedDevicesList(devices) {
        const devicesGrid = document.getElementById('connectedDevices');
        if (!devicesGrid) return;
        
        devicesGrid.innerHTML = '';
        
        Object.values(devices).forEach(device => {
            const deviceCard = document.createElement('div');
            deviceCard.className = `device-card ${device.status}`;
            
            const lastSeenTime = new Date(device.lastSeen).toLocaleTimeString();
            
            deviceCard.innerHTML = `
                <h4>${device.name}</h4>
                <p>タイプ: ${this.getDeviceTypeText(device.type)}</p>
                <p>状態: ${device.status === 'online' ? 'オンライン' : 'オフライン'}</p>
                <p>シーン: ${device.scene || 0}</p>
                <p>最終接続: ${lastSeenTime}</p>
            `;
            
            devicesGrid.appendChild(deviceCard);
        });
        
        this.connectedDevices = new Map(Object.entries(devices));
    }
    
    // デバイスタイプテキスト取得
    getDeviceTypeText(type) {
        const typeMap = {
            'tablet': 'タブレット',
            'monitor': 'モニター',
            'admin': '管理者'
        };
        return typeMap[type] || type;
    }
    
    // ハートビート開始
    startHeartbeat() {
        setInterval(() => {
            if (this.isOnline && window.firebaseConfigured && database) {
                this.deviceInfo.lastSeen = Date.now();
                dbRef.devices.child(this.deviceId).update({
                    lastSeen: this.deviceInfo.lastSeen
                });
            }
        }, 30000); // 30秒ごとにハートビート
    }
    
    // 接続シミュレーション（テスト用）
    simulateConnection() {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = 'オンライン（テスト）';
        statusElement.className = 'status online';
    }
    
    // 通知表示
    showNotification(message, type = 'info') {
        // 簡単な通知システム
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // デバイス切断
    disconnect() {
        this.isOnline = false;
        this.deviceInfo.status = 'offline';
        
        if (window.firebaseConfigured && database) {
            dbRef.devices.child(this.deviceId).update({
                status: 'offline',
                lastSeen: Date.now()
            });
        }
    }
    
    // 現在のデバイス情報取得
    getDeviceInfo() {
        return this.deviceInfo;
    }
    
    // 接続デバイス一覧取得
    getConnectedDevices() {
        return Array.from(this.connectedDevices.values());
    }
}

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (window.deviceManager) {
        window.deviceManager.disconnect();
    }
}); 