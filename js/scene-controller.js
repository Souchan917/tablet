// シーン制御クラス
class SceneController {
    constructor() {
        this.currentScene = 0;
        this.showState = 'stopped'; // stopped, playing, paused
        this.sceneData = this.initializeSceneData();
        this.isAdmin = false;
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // シーン状態の監視
        this.monitorSceneState();
    }
    
    // シーンデータ初期化
    initializeSceneData() {
        return {
            0: {
                id: 0,
                title: '待機画面',
                content: '公演開始をお待ちください...',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                animation: 'fade-in'
            },
            1: {
                id: 1,
                title: 'オープニング',
                content: `
                    <div class="scene-content-wrapper">
                        <h2>謎解き公演へようこそ</h2>
                        <p>これから不思議な世界へご案内いたします</p>
                        <div class="scene-animation">✨</div>
                    </div>
                `,
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                animation: 'slide-in'
            },
            2: {
                id: 2,
                title: 'パズルの部屋',
                content: `
                    <div class="scene-content-wrapper">
                        <h2>第一の謎</h2>
                        <p>古い書庫で見つけた暗号を解いてください</p>
                        <div class="puzzle-area">
                            <div class="code-display">A1B5C3D7</div>
                            <p>ヒント: 数字の順番に注目してください</p>
                        </div>
                    </div>
                `,
                background: 'linear-gradient(135deg, #4834d4, #686de0)',
                animation: 'fade-in'
            },
            3: {
                id: 3,
                title: '魔法の鏡',
                content: `
                    <div class="scene-content-wrapper">
                        <h2>第二の謎</h2>
                        <p>鏡に映った文字を読み取ってください</p>
                        <div class="mirror-text">ᴙoɿɿiM ɒnid⊥</div>
                        <p>何と書いてあるでしょうか？</p>
                    </div>
                `,
                background: 'linear-gradient(135deg, #00d2d3, #54a0ff)',
                animation: 'slide-in'
            },
            4: {
                id: 4,
                title: '時計台の秘密',
                content: `
                    <div class="scene-content-wrapper">
                        <h2>第三の謎</h2>
                        <p>時計の針が指す時刻に隠された秘密とは？</p>
                        <div class="clock-display">🕒</div>
                        <p>2時10分... この時刻が意味するものは？</p>
                    </div>
                `,
                background: 'linear-gradient(135deg, #ff9ff3, #f368e0)',
                animation: 'fade-in'
            },
            5: {
                id: 5,
                title: 'エンディング',
                content: `
                    <div class="scene-content-wrapper">
                        <h2>おめでとうございます！</h2>
                        <p>全ての謎を解き明かしました</p>
                        <div class="celebration">🎉🎊🎉</div>
                        <p>謎解き公演をお楽しみいただき、ありがとうございました</p>
                    </div>
                `,
                background: 'linear-gradient(135deg, #feca57, #ff9f43)',
                animation: 'slide-in'
            }
        };
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // 公演制御ボタン
        const startButton = document.getElementById('startShow');
        const pauseButton = document.getElementById('pauseShow');
        const resetButton = document.getElementById('resetShow');
        
        if (startButton) {
            startButton.addEventListener('click', () => this.startShow());
        }
        
        if (pauseButton) {
            pauseButton.addEventListener('click', () => this.pauseShow());
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetShow());
        }
        
        // シーン切り替えボタン
        const sceneButtons = document.querySelectorAll('.btn-scene');
        sceneButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const sceneId = parseInt(e.target.dataset.scene);
                this.changeScene(sceneId);
            });
        });
    }
    
    // シーン状態監視
    monitorSceneState() {
        if (window.firebaseConfigured && database) {
            // 現在のシーン監視
            dbRef.currentScene.on('value', (snapshot) => {
                const sceneId = snapshot.val();
                if (sceneId !== null && sceneId !== this.currentScene) {
                    this.currentScene = sceneId;
                    this.displayScene(sceneId);
                }
            });
            
            // 公演状態監視
            dbRef.showState.on('value', (snapshot) => {
                const state = snapshot.val();
                if (state && state !== this.showState) {
                    this.showState = state;
                    this.updateShowControls();
                }
            });
        } else {
            // テストモード
            console.log('シーン制御: テストモードで動作中');
        }
    }
    
    // 公演開始
    async startShow() {
        try {
            this.showState = 'playing';
            
            if (window.firebaseConfigured && database) {
                await dbRef.showState.set('playing');
                await dbRef.currentScene.set(1); // オープニングから開始
            } else {
                // テストモード
                this.currentScene = 1;
                this.displayScene(1);
            }
            
            this.updateShowControls();
            console.log('公演を開始しました');
            
        } catch (error) {
            console.error('公演開始エラー:', error);
        }
    }
    
    // 公演一時停止
    async pauseShow() {
        try {
            this.showState = 'paused';
            
            if (window.firebaseConfigured && database) {
                await dbRef.showState.set('paused');
            }
            
            this.updateShowControls();
            console.log('公演を一時停止しました');
            
        } catch (error) {
            console.error('公演一時停止エラー:', error);
        }
    }
    
    // 公演リセット
    async resetShow() {
        try {
            this.showState = 'stopped';
            this.currentScene = 0;
            
            if (window.firebaseConfigured && database) {
                await dbRef.showState.set('stopped');
                await dbRef.currentScene.set(0);
            } else {
                // テストモード
                this.displayScene(0);
            }
            
            this.updateShowControls();
            this.resetSceneButtons();
            console.log('公演をリセットしました');
            
        } catch (error) {
            console.error('公演リセットエラー:', error);
        }
    }
    
    // シーン変更
    async changeScene(sceneId) {
        try {
            if (!this.sceneData[sceneId]) {
                console.error('存在しないシーンです:', sceneId);
                return;
            }
            
            this.currentScene = sceneId;
            
            if (window.firebaseConfigured && database) {
                await dbRef.currentScene.set(sceneId);
                
                // 全デバイスのシーン情報を更新
                const devices = await dbRef.devices.once('value');
                const deviceUpdates = {};
                
                devices.forEach(child => {
                    deviceUpdates[`${child.key}/scene`] = sceneId;
                });
                
                await dbRef.devices.update(deviceUpdates);
            } else {
                // テストモード
                this.displayScene(sceneId);
            }
            
            this.updateSceneButtons(sceneId);
            console.log(`シーン ${sceneId} に変更しました`);
            
        } catch (error) {
            console.error('シーン変更エラー:', error);
        }
    }
    
    // シーン表示
    displayScene(sceneId) {
        const sceneContent = document.getElementById('sceneContent');
        if (!sceneContent) return;
        
        const scene = this.sceneData[sceneId];
        if (!scene) return;
        
        // アニメーションクラスをリセット
        sceneContent.className = 'scene-content';
        
        // 新しいコンテンツを設定
        setTimeout(() => {
            sceneContent.innerHTML = scene.content;
            sceneContent.style.background = scene.background;
            sceneContent.classList.add(scene.animation);
            
            // タブレット表示エリア全体の背景も更新
            const tabletDisplay = document.getElementById('tabletDisplay');
            if (tabletDisplay) {
                tabletDisplay.className = `tablet-display scene-${sceneId}`;
            }
        }, 50);
    }
    
    // 公演制御ボタンの状態更新
    updateShowControls() {
        const startButton = document.getElementById('startShow');
        const pauseButton = document.getElementById('pauseShow');
        const resetButton = document.getElementById('resetShow');
        
        if (!startButton || !pauseButton || !resetButton) return;
        
        switch (this.showState) {
            case 'playing':
                startButton.disabled = true;
                pauseButton.disabled = false;
                resetButton.disabled = false;
                break;
            case 'paused':
                startButton.disabled = false;
                pauseButton.disabled = true;
                resetButton.disabled = false;
                break;
            case 'stopped':
            default:
                startButton.disabled = false;
                pauseButton.disabled = true;
                resetButton.disabled = false;
                break;
        }
    }
    
    // シーンボタンの状態更新
    updateSceneButtons(activeScene) {
        const sceneButtons = document.querySelectorAll('.btn-scene');
        sceneButtons.forEach(button => {
            const sceneId = parseInt(button.dataset.scene);
            if (sceneId === activeScene) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // シーンボタンのリセット
    resetSceneButtons() {
        const sceneButtons = document.querySelectorAll('.btn-scene');
        sceneButtons.forEach(button => {
            button.classList.remove('active');
        });
    }
    
    // 管理者権限設定
    setAdminMode(isAdmin) {
        this.isAdmin = isAdmin;
        
        if (isAdmin) {
            // 管理者の場合、初期状態を待機画面に設定
            this.displayScene(0);
        }
    }
    
    // 現在のシーン取得
    getCurrentScene() {
        return this.currentScene;
    }
    
    // 公演状態取得
    getShowState() {
        return this.showState;
    }
    
    // シーンデータ取得
    getSceneData(sceneId) {
        return this.sceneData[sceneId];
    }
    
    // 全シーンデータ取得
    getAllSceneData() {
        return this.sceneData;
    }
} 