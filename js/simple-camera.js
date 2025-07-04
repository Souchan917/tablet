// スマホ専用簡易カメラ配信システム
class SimpleCameraSystem {
    constructor() {
        this.isInitialized = false;
        this.isStreaming = false;
        this.mediaStream = null;
        this.peer = null;
        this.currentCall = null;
        this.targetDeviceId = 'tabletcam'; // 固定の受信端末ID
        
        this.init();
    }

    // 初期化
    init() {
        console.log('スマホ簡易カメラシステム初期化');
        
        // PeerJSライブラリの確認
        if (typeof Peer === 'undefined') {
            console.error('PeerJSライブラリが読み込まれていません');
            this.showError('PeerJSライブラリが必要です');
            return;
        }

        this.isInitialized = true;
        this.setupUI();
        this.initializePeerJS();
    }

    // UI設定
    setupUI() {
        // カメラ画面に簡易UIを追加
        const cameraScreen = document.getElementById('camera-screen');
        if (!cameraScreen) return;

        // 既存のUIを非表示
        const existingUI = cameraScreen.querySelector('.camera-mode-selector');
        if (existingUI) {
            existingUI.style.display = 'none';
        }

        // 簡易UIを作成
        const simpleUI = document.createElement('div');
        simpleUI.className = 'simple-camera-ui';
        simpleUI.innerHTML = `
            <div class="simple-camera-header">
                <h3>📱 スマホカメラ配信</h3>
                <div class="connection-status" id="simple-camera-status">初期化中...</div>
            </div>
            
            <div class="simple-camera-controls">
                <button id="simple-start-camera" class="simple-camera-btn primary">
                    📹 カメラ開始
                </button>
                <button id="simple-start-stream" class="simple-camera-btn success" disabled>
                    🚀 配信開始
                </button>
                <button id="simple-stop-stream" class="simple-camera-btn danger" disabled>
                    ⏹️ 配信停止
                </button>
            </div>
            
            <div class="simple-camera-info">
                <div class="info-item">
                    <span class="info-label">配信先:</span>
                    <span class="info-value">タブレット端末</span>
                </div>
                <div class="info-item">
                    <span class="info-label">接続ID:</span>
                    <span class="info-value" id="simple-peer-id">---</span>
                </div>
                <div class="info-item">
                    <span class="info-label">状態:</span>
                    <span class="info-value" id="simple-stream-status">未接続</span>
                </div>
            </div>
            
            <div class="simple-camera-video">
                <video id="simple-local-video" autoplay muted playsinline></video>
            </div>
            
            <div class="simple-camera-help">
                <h4>📋 使用方法</h4>
                <ol>
                    <li>「カメラ開始」でカメラアクセス許可</li>
                    <li>「配信開始」でタブレットに配信</li>
                    <li>配信停止で終了</li>
                </ol>
                <p><strong>注意:</strong> タブレット側で「受信モード」を選択してください</p>
            </div>
        `;

        cameraScreen.appendChild(simpleUI);
        this.setupEventListeners();
    }

    // イベントリスナー設定
    setupEventListeners() {
        const startCameraBtn = document.getElementById('simple-start-camera');
        const startStreamBtn = document.getElementById('simple-start-stream');
        const stopStreamBtn = document.getElementById('simple-stop-stream');

        if (startCameraBtn) {
            startCameraBtn.addEventListener('click', () => {
                this.startCamera();
            });
        }

        if (startStreamBtn) {
            startStreamBtn.addEventListener('click', () => {
                this.startStreaming();
            });
        }

        if (stopStreamBtn) {
            stopStreamBtn.addEventListener('click', () => {
                this.stopStreaming();
            });
        }
    }

    // PeerJS初期化
    initializePeerJS() {
        try {
            const peerOptions = {
                debug: 2,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            };

            // ランダムIDでPeerJS接続
            this.peer = new Peer(peerOptions);

            this.peer.on('open', (id) => {
                console.log('PeerJS接続成功:', id);
                this.updatePeerId(id);
                this.updateStatus('接続完了。カメラを開始してください');
            });

            this.peer.on('error', (err) => {
                console.error('PeerJSエラー:', err);
                this.updateStatus(`接続エラー: ${err.message}`, 'error');
            });

            this.peer.on('disconnected', () => {
                console.log('PeerJS接続切断');
                this.updateStatus('接続が切断されました', 'warning');
                this.stopStreaming();
            });

        } catch (error) {
            console.error('PeerJS初期化エラー:', error);
            this.updateStatus('接続の初期化に失敗しました', 'error');
        }
    }

    // カメラ開始
    async startCamera() {
        try {
            this.updateStatus('カメラアクセス中...');
            
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // 背面カメラ優先
                },
                audio: false
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const localVideo = document.getElementById('simple-local-video');
            if (localVideo) {
                localVideo.srcObject = this.mediaStream;
            }

            this.updateStatus('カメラ開始完了。配信を開始できます');
            this.updateStreamStatus('カメラ準備完了');
            
            // 配信開始ボタンを有効化
            const startStreamBtn = document.getElementById('simple-start-stream');
            if (startStreamBtn) {
                startStreamBtn.disabled = false;
            }

        } catch (error) {
            console.error('カメラ開始エラー:', error);
            this.updateStatus(`カメラアクセス失敗: ${error.message}`, 'error');
        }
    }

    // 配信開始
    async startStreaming() {
        if (!this.mediaStream || !this.peer) {
            this.updateStatus('カメラまたは接続が準備されていません', 'error');
            return;
        }

        try {
            this.updateStatus('配信開始中...');
            
            // 固定ID「tabletcam」に接続
            const call = this.peer.call(this.targetDeviceId, this.mediaStream);
            
            call.on('stream', (remoteStream) => {
                console.log('配信開始成功');
                this.currentCall = call;
                this.isStreaming = true;
                this.updateStatus('配信中...', 'success');
                this.updateStreamStatus('配信中');
                
                // ボタン状態更新
                this.updateButtonStates();
            });

            call.on('close', () => {
                console.log('配信終了');
                this.stopStreaming();
            });

            call.on('error', (err) => {
                console.error('配信エラー:', err);
                this.updateStatus(`配信エラー: ${err.message}`, 'error');
                this.stopStreaming();
            });

        } catch (error) {
            console.error('配信開始エラー:', error);
            this.updateStatus(`配信開始失敗: ${error.message}`, 'error');
        }
    }

    // 配信停止
    stopStreaming() {
        if (this.currentCall) {
            this.currentCall.close();
            this.currentCall = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => {
                track.stop();
            });
            this.mediaStream = null;
        }

        this.isStreaming = false;
        this.updateStatus('配信停止');
        this.updateStreamStatus('未接続');
        this.updateButtonStates();

        // ビデオ要素をクリア
        const localVideo = document.getElementById('simple-local-video');
        if (localVideo) {
            localVideo.srcObject = null;
        }
    }

    // ボタン状態更新
    updateButtonStates() {
        const startCameraBtn = document.getElementById('simple-start-camera');
        const startStreamBtn = document.getElementById('simple-start-stream');
        const stopStreamBtn = document.getElementById('simple-stop-stream');

        if (startCameraBtn) {
            startCameraBtn.disabled = this.isStreaming;
        }

        if (startStreamBtn) {
            startStreamBtn.disabled = !this.mediaStream || this.isStreaming;
        }

        if (stopStreamBtn) {
            stopStreamBtn.disabled = !this.isStreaming;
        }
    }

    // 状態更新
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('simple-camera-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `connection-status ${type}`;
        }
        console.log(`[カメラシステム] ${message}`);
    }

    // 配信状態更新
    updateStreamStatus(status) {
        const statusEl = document.getElementById('simple-stream-status');
        if (statusEl) {
            statusEl.textContent = status;
        }
    }

    // PeerID更新
    updatePeerId(id) {
        const idEl = document.getElementById('simple-peer-id');
        if (idEl) {
            idEl.textContent = id;
        }
    }

    // エラー表示
    showError(message) {
        this.updateStatus(message, 'error');
        alert(`カメラシステムエラー: ${message}`);
    }

    // クリーンアップ
    cleanup() {
        this.stopStreaming();
        
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }
}

// グローバルインスタンス
let simpleCameraSystem = null;

// 初期化関数
function initSimpleCameraSystem() {
    if (!simpleCameraSystem) {
        simpleCameraSystem = new SimpleCameraSystem();
        window.simpleCameraSystem = simpleCameraSystem;
        
        // デバッグ用グローバル関数
        window.simpleCamera = {
            start: () => simpleCameraSystem.startCamera(),
            stream: () => simpleCameraSystem.startStreaming(),
            stop: () => simpleCameraSystem.stopStreaming(),
            status: () => simpleCameraSystem.isStreaming ? '配信中' : '停止中',
            cleanup: () => simpleCameraSystem.cleanup()
        };
        
        console.log('スマホ簡易カメラシステム初期化完了');
        console.log('デバッグコマンド: simpleCamera.start(), simpleCamera.stream(), simpleCamera.stop()');
    }
    return simpleCameraSystem;
}

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    // カメラ画面が表示されたときに初期化
    setTimeout(() => {
        const cameraScreen = document.getElementById('camera-screen');
        if (cameraScreen && cameraScreen.style.display !== 'none') {
            initSimpleCameraSystem();
        }
    }, 1000);
});

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (simpleCameraSystem) {
        simpleCameraSystem.cleanup();
    }
}); 