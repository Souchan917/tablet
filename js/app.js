// メインアプリケーションクラス
class MysteryShowApp {
    constructor() {
        this.deviceManager = null;
        this.sceneController = null;
        this.isInitialized = false;
        
        // アプリケーション初期化
        this.init();
    }
    
    // アプリケーション初期化
    async init() {
        try {
            window.logger.info('アプリケーション初期化開始');
            
            // DOM読み込み完了を待機
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
            } else {
                this.initializeComponents();
            }
            
        } catch (error) {
            window.errorHandler.handleError(error, 'アプリケーション初期化');
        }
    }
    
    // コンポーネント初期化
    initializeComponents() {
        try {
            // デバイスマネージャー初期化
            this.deviceManager = new DeviceManager();
            window.deviceManager = this.deviceManager;
            
            // シーンコントローラー初期化
            this.sceneController = new SceneController();
            window.sceneController = this.sceneController;
            
            // 初期状態設定
            this.setupInitialState();
            
            // アプリケーション完了通知
            this.onAppReady();
            
            this.isInitialized = true;
            window.logger.info('アプリケーション初期化完了');
            
        } catch (error) {
            window.errorHandler.handleError(error, 'コンポーネント初期化');
        }
    }
    
    // 初期状態設定
    setupInitialState() {
        // デフォルト値を設定
        const deviceNameInput = document.getElementById('deviceName');
        const deviceTypeSelect = document.getElementById('deviceType');
        
        if (deviceNameInput) {
            deviceNameInput.value = window.config.get('defaults.deviceName') || 'タブレット';
        }
        
        if (deviceTypeSelect) {
            deviceTypeSelect.value = window.config.get('defaults.deviceType') || 'tablet';
        }
        
        // 初期シーンの表示
        this.sceneController.displayScene(0);
        
        // Firebase設定状況の確認と表示
        this.checkFirebaseStatus();
    }
    
    // Firebase状況確認
    checkFirebaseStatus() {
        if (!window.firebaseConfigured) {
            this.showFirebaseConfigNotice();
        }
    }
    
    // Firebase設定通知表示
    showFirebaseConfigNotice() {
        const notice = document.createElement('div');
        notice.className = 'firebase-notice';
        notice.innerHTML = `
            <div class="notice-content">
                <h3>⚠️ Firebase設定が必要です</h3>
                <p>複数端末の同期を行うには、Firebase設定が必要です。</p>
                <p>現在はテストモードで動作しています。</p>
                <details>
                    <summary>設定方法</summary>
                    <ol>
                        <li>Firebase Console (https://console.firebase.google.com/) でプロジェクトを作成</li>
                        <li>Realtime Database を有効化</li>
                        <li>js/firebase-config.js ファイルの設定値を更新</li>
                    </ol>
                </details>
                <button onclick="this.parentElement.parentElement.remove()">理解しました</button>
            </div>
        `;
        notice.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(255, 193, 7, 0.95);
            color: #333;
            padding: 15px;
            z-index: 2000;
            border-bottom: 3px solid #ffc107;
        `;
        
        const noticeContent = notice.querySelector('.notice-content');
        noticeContent.style.cssText = `
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        `;
        
        document.body.insertBefore(notice, document.body.firstChild);
    }
    
    // アプリケーション準備完了時の処理
    onAppReady() {
        // ローディング画面を隠す
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
        
        // 準備完了イベントを発火
        const readyEvent = new CustomEvent('mysteryShowReady', {
            detail: {
                deviceManager: this.deviceManager,
                sceneController: this.sceneController
            }
        });
        document.dispatchEvent(readyEvent);
        
        window.logger.info('謎解き公演システム準備完了');
    }
    
    // デバイス接続状態の取得
    getConnectionStatus() {
        return {
            isConnected: this.deviceManager ? this.deviceManager.isOnline : false,
            deviceInfo: this.deviceManager ? this.deviceManager.getDeviceInfo() : null,
            connectedDevices: this.deviceManager ? this.deviceManager.getConnectedDevices() : []
        };
    }
    
    // 現在のシーン情報取得
    getCurrentSceneInfo() {
        return {
            currentScene: this.sceneController ? this.sceneController.getCurrentScene() : 0,
            showState: this.sceneController ? this.sceneController.getShowState() : 'stopped',
            sceneData: this.sceneController ? this.sceneController.getSceneData(this.sceneController.getCurrentScene()) : null
        };
    }
    
    // システム状態取得
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            firebaseConfigured: window.firebaseConfigured,
            connection: this.getConnectionStatus(),
            scene: this.getCurrentSceneInfo(),
            config: window.config.getAll()
        };
    }
    
    // アプリケーション終了処理
    shutdown() {
        try {
            if (this.deviceManager) {
                this.deviceManager.disconnect();
            }
            
            window.logger.info('アプリケーション終了');
        } catch (error) {
            window.errorHandler.handleError(error, 'アプリケーション終了');
        }
    }
}

// キーボードショートカット
class KeyboardShortcuts {
    constructor(app) {
        this.app = app;
        this.setupShortcuts();
    }
    
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + 数字でシーン切り替え（管理者のみ）
            if ((e.ctrlKey || e.metaKey) && e.key >= '0' && e.key <= '5') {
                e.preventDefault();
                const sceneId = parseInt(e.key);
                if (this.app.sceneController && this.app.deviceManager) {
                    const deviceInfo = this.app.deviceManager.getDeviceInfo();
                    if (deviceInfo.type === 'admin') {
                        this.app.sceneController.changeScene(sceneId);
                    }
                }
            }
            
            // Ctrl/Cmd + Shift + S でシステム状態をコンソールに出力
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                console.log('システム状態:', this.app.getSystemStatus());
            }
            
            // F11 でフルスクリーン切り替え
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// 開発者向けコンソール関数
function setupDevConsole() {
    if (window.config.get('ui.showDebugInfo')) {
        window.mysteryShow = {
            getStatus: () => window.app.getSystemStatus(),
            switchScene: (sceneId) => window.sceneController.changeScene(sceneId),
            getDevices: () => window.deviceManager.getConnectedDevices(),
            getConfig: () => window.config.getAll(),
            resetConfig: () => window.config.reset()
        };
        
        console.log('🎭 謎解き公演システム - 開発者コンソール');
        console.log('利用可能なコマンド:');
        console.log('  mysteryShow.getStatus() - システム状態取得');
        console.log('  mysteryShow.switchScene(id) - シーン切り替え');
        console.log('  mysteryShow.getDevices() - デバイス一覧');
        console.log('  mysteryShow.getConfig() - 設定取得');
        console.log('  mysteryShow.resetConfig() - 設定リセット');
    }
}

// パフォーマンス監視
function setupPerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            
            window.logger.info('ページ読み込み完了', {
                duration: loadTime,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                domInteractive: perfData.domInteractive - perfData.domContentLoadedEventStart
            });
        });
    }
}

// サービスワーカー登録（PWA対応）
function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.config.get('ui.enablePWA')) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                window.logger.info('Service Worker 登録成功', registration);
            })
            .catch(error => {
                window.logger.error('Service Worker 登録失敗', error);
            });
    }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    // メインアプリケーション初期化
    window.app = new MysteryShowApp();
    
    // キーボードショートカット初期化
    window.shortcuts = new KeyboardShortcuts(window.app);
    
    // 開発者コンソール設定
    setupDevConsole();
    
    // パフォーマンス監視
    setupPerformanceMonitoring();
    
    // サービスワーカー登録
    registerServiceWorker();
});

// ページ離脱時の処理
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.shutdown();
    }
});

// エラー時の回復処理
window.addEventListener('error', (e) => {
    // 重要なエラーの場合、自動回復を試行
    if (e.error && e.error.message.includes('Firebase')) {
        setTimeout(() => {
            location.reload();
        }, 5000);
    }
}); 