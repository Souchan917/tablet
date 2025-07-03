// アプリケーションメインロジック
class TabletApp {
    constructor() {
        this.currentScreen = 'selection-screen';
        this.deviceType = null;
        this.teams = [];
        this.currentStep = 1;
        this.maxSteps = 10; // 最大ステップ数（必要に応じて変更）
        this.steps = {
            1: { name: '開始前', monitorFront: 'step1-front.jpg', monitorBack: 'step1-back.jpg', vehicleNumber: '001' },
            2: { name: 'ステップ2', monitorFront: 'step2-front.jpg', monitorBack: 'step2-back.jpg', vehicleNumber: '002' },
            3: { name: 'ステップ3', monitorFront: 'step3-front.jpg', monitorBack: 'step3-back.jpg', vehicleNumber: '003' },
            4: { name: 'ステップ4', monitorFront: 'step4-front.jpg', monitorBack: 'step4-back.jpg', vehicleNumber: '004' },
            5: { name: 'ステップ5', monitorFront: 'step5-front.jpg', monitorBack: 'step5-back.jpg', vehicleNumber: '005' },
            6: { name: 'ステップ6', monitorFront: 'step6-front.jpg', monitorBack: 'step6-back.jpg', vehicleNumber: '006' },
            7: { name: 'ステップ7', monitorFront: 'step7-front.jpg', monitorBack: 'step7-back.jpg', vehicleNumber: '007' },
            8: { name: 'ステップ8', monitorFront: 'step8-front.jpg', monitorBack: 'step8-back.jpg', vehicleNumber: '008' },
            9: { name: 'ステップ9', monitorFront: 'step9-front.jpg', monitorBack: 'step9-back.jpg', vehicleNumber: '009' },
            10: { name: 'ステップ10', monitorFront: 'step10-front.jpg', monitorBack: 'step10-back.jpg', vehicleNumber: '010' }
        };
        
        // 豪華列車車両番号機能
        this.maxCars = 3600;
        this.autoDecreaseInterval = null;
        
        // タップカウンター
        this.tapCounts = {
            vehicle: 0,
            monitorFront: 0,
            monitorBack: 0
        };
        
        this.init();
    }

    init() {
        this.initializeTeams();
        this.setupEventListeners();
        this.setupFirebaseListeners();
        this.showScreen('selection-screen');
    }

    // チーム初期化
    initializeTeams() {
        this.teams = [];
        for (let i = 1; i <= 12; i++) {
            this.teams.push({
                id: i,
                name: `チーム${i}`,
                currentStep: 1,
                isActive: false
            });
        }
    }

    // 画面遷移
    showScreen(screenId) {
        // 現在のactive画面を非表示
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            activeScreen.classList.remove('active');
        }

        // 新しい画面を表示
        const newScreen = document.getElementById(screenId);
        if (newScreen) {
            newScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 選択画面のボタン
        document.getElementById('staff-btn').addEventListener('click', () => {
            this.deviceType = 'staff';
            this.showScreen('staff-screen');
            this.renderTeamGrid();
            this.updateCurrentStepDisplay();
            this.updateDeviceType();
        });

        document.getElementById('master-btn').addEventListener('click', () => {
            this.deviceType = 'master';
            this.showScreen('master-screen');
            this.updateDeviceType();
            this.setupMasterVehicleControls();
        });

        document.getElementById('monitor-front-btn').addEventListener('click', () => {
            this.deviceType = 'monitor-front';
            this.showScreen('monitor-front-screen');
            this.updateDeviceType();
            this.setupMonitorTapHandler('front');
        });

        document.getElementById('monitor-back-btn').addEventListener('click', () => {
            this.deviceType = 'monitor-back';
            this.showScreen('monitor-back-screen');
            this.updateDeviceType();
            this.setupMonitorTapHandler('back');
        });

        document.getElementById('camera-btn').addEventListener('click', () => {
            this.deviceType = 'camera';
            this.showScreen('camera-screen');
            this.updateDeviceType();
        });

        document.getElementById('vehicle-btn').addEventListener('click', () => {
            this.deviceType = 'vehicle';
            this.showScreen('vehicle-screen');
            this.updateDeviceType();
            this.initializeVehicleDisplay();
            this.setupVehicleTapHandler();
            this.setupFullscreenHandler();
        });

        // 戻るボタン
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 車両番号画面またはマスター画面から戻る場合は自動減少を停止
                if ((this.currentScreen === 'vehicle-screen' || this.currentScreen === 'master-screen') && this.stopAutoDecrease) {
                    this.stopAutoDecrease();
                }
                
                // 全画面表示中の場合は終了
                const isFullscreen = document.fullscreenElement || 
                                    document.webkitFullscreenElement || 
                                    document.mozFullScreenElement || 
                                    document.msFullscreenElement;
                
                if (isFullscreen) {
                    this.exitFullscreen();
                }
                
                // タップカウンターをリセット
                this.resetTapCounts();
                this.deviceType = null;
                this.showScreen('selection-screen');
                this.updateDeviceType();
            });
        });

        // スタッフ制御ボタン
        document.getElementById('next-all-teams').addEventListener('click', () => {
            this.nextAllTeams();
        });

        document.getElementById('prev-all-teams').addEventListener('click', () => {
            this.prevAllTeams();
        });

        document.getElementById('reset-all-teams').addEventListener('click', () => {
            this.resetAllTeams();
        });

        // 手動制御ボタン
        document.getElementById('manual-monitor-front').addEventListener('click', () => {
            this.sendCommand('monitor-front', 'show-image', { imageUrl: 'sample-image.jpg' });
        });

        document.getElementById('manual-monitor-back').addEventListener('click', () => {
            this.sendCommand('monitor-back', 'show-image', { imageUrl: 'sample-image.jpg' });
        });

        document.getElementById('manual-vehicle-send').addEventListener('click', () => {
            const vehicleNumber = document.getElementById('manual-vehicle-input').value;
            if (vehicleNumber) {
                this.sendCommand('vehicle', 'update-number', { number: vehicleNumber });
            }
        });
    }

    // Firebase リスナーの設定
    setupFirebaseListeners() {
        // デバイスタイプ別のリスナー設定
        this.setupMonitorListeners();
        this.setupVehicleListeners();
        this.setupCameraListeners();
    }

    // モニター用リスナー
    setupMonitorListeners() {
        // モニター前の制御を監視
        readData('commands/monitor-front', (snapshot) => {
            if (this.deviceType === 'monitor-front') {
                const commandData = snapshot.val();
                if (commandData && commandData.command === 'show-image') {
                    this.displayImage('monitor-front-display', commandData.data.imageUrl);
                }
            }
        });

        // モニター後の制御を監視
        readData('commands/monitor-back', (snapshot) => {
            if (this.deviceType === 'monitor-back') {
                const commandData = snapshot.val();
                if (commandData && commandData.command === 'show-image') {
                    this.displayImage('monitor-back-display', commandData.data.imageUrl);
                }
            }
        });
    }

    // 車両番号用リスナー
    setupVehicleListeners() {
        readData('commands/vehicle', (snapshot) => {
            if (this.deviceType === 'vehicle') {
                const commandData = snapshot.val();
                if (commandData && commandData.command === 'update-number') {
                    this.updateVehicleNumber(commandData.data.number);
                }
            }
        });
    }

    // カメラ用リスナー
    setupCameraListeners() {
        readData('commands/camera', (snapshot) => {
            if (this.deviceType === 'camera') {
                const data = snapshot.val();
                if (data && data.command === 'toggle') {
                    this.toggleCamera();
                }
            }
        });
    }

    // コマンド送信
    sendCommand(target, command, data) {
        const commandData = {
            command: command,
            data: data,
            timestamp: Date.now()
        };

        writeData(`commands/${target}`, commandData)
            .then(() => {
                console.log(`コマンド送信完了: ${target} - ${command}`);
                this.showNotification(`${target}に${command}コマンドを送信しました`);
            })
            .catch(error => {
                console.error('コマンド送信エラー:', error);
                this.showNotification('コマンド送信に失敗しました', 'error');
            });
    }

    // チームグリッド描画
    renderTeamGrid() {
        const teamGrid = document.getElementById('team-grid');
        if (!teamGrid) return;

        teamGrid.innerHTML = '';
        
        this.teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = `team-card ${team.isActive ? 'active' : ''}`;
            teamCard.innerHTML = `
                <div class="team-header">
                    <span class="team-name">${team.name}</span>
                    <span class="team-step">ステップ${team.currentStep}</span>
                </div>
                <div class="step-controls">
                    <button class="step-btn prev" onclick="app.changeTeamStep(${team.id}, -1)">前へ</button>
                    <button class="step-btn next" onclick="app.changeTeamStep(${team.id}, 1)">次へ</button>
                </div>
            `;
            teamGrid.appendChild(teamCard);
        });
    }

    // 現在のステップ表示を更新
    updateCurrentStepDisplay() {
        const stepInfo = document.getElementById('current-step-info');
        if (stepInfo && this.steps[this.currentStep]) {
            stepInfo.textContent = `ステップ${this.currentStep}: ${this.steps[this.currentStep].name}`;
        }
    }

    // 全チーム次へ
    nextAllTeams() {
        let changed = false;
        this.teams.forEach(team => {
            if (team.currentStep < this.maxSteps) {
                team.currentStep++;
                changed = true;
            }
        });
        
        if (changed) {
            this.currentStep = Math.max(...this.teams.map(t => t.currentStep));
            this.updateCurrentStepDisplay();
            this.renderTeamGrid();
            this.updateDisplays();
            this.showNotification('全チームを次のステップに進めました');
        }
    }

    // 全チーム前へ
    prevAllTeams() {
        let changed = false;
        this.teams.forEach(team => {
            if (team.currentStep > 1) {
                team.currentStep--;
                changed = true;
            }
        });
        
        if (changed) {
            this.currentStep = Math.max(...this.teams.map(t => t.currentStep));
            this.updateCurrentStepDisplay();
            this.renderTeamGrid();
            this.updateDisplays();
            this.showNotification('全チームを前のステップに戻しました');
        }
    }

    // 全チームリセット
    resetAllTeams() {
        this.teams.forEach(team => {
            team.currentStep = 1;
            team.isActive = false;
        });
        this.currentStep = 1;
        this.updateCurrentStepDisplay();
        this.renderTeamGrid();
        this.updateDisplays();
        this.showNotification('全チームをリセットしました');
    }

    // 個別チームのステップ変更
    changeTeamStep(teamId, direction) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        const newStep = team.currentStep + direction;
        if (newStep >= 1 && newStep <= this.maxSteps) {
            team.currentStep = newStep;
            this.currentStep = Math.max(...this.teams.map(t => t.currentStep));
            this.updateCurrentStepDisplay();
            this.renderTeamGrid();
            this.updateDisplays();
            this.showNotification(`${team.name}をステップ${newStep}に変更しました`);
        }
    }

    // 表示の更新
    updateDisplays() {
        const currentStepData = this.steps[this.currentStep];
        if (currentStepData) {
            // モニター前後の画像を更新
            this.sendCommand('monitor-front', 'show-image', { 
                imageUrl: `images/${currentStepData.monitorFront}`,
                step: this.currentStep
            });
            
            this.sendCommand('monitor-back', 'show-image', { 
                imageUrl: `images/${currentStepData.monitorBack}`,
                step: this.currentStep
            });
            
            // 車両番号を更新
            this.sendCommand('vehicle', 'update-number', { 
                number: currentStepData.vehicleNumber,
                step: this.currentStep
            });
        }
    }

    // 画像表示
    displayImage(displayId, imageUrl) {
        const display = document.getElementById(displayId);
        if (display) {
            display.innerHTML = `<img src="${imageUrl}" alt="表示画像" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        }
    }

    // 車両番号更新
    updateVehicleNumber(number) {
        const vehicleDisplay = document.getElementById('vehicle-number');
        if (vehicleDisplay) {
            vehicleDisplay.textContent = number.padStart(3, '0');
        }
    }

    // マスター画面の車両番号制御のセットアップ
    setupMasterVehicleControls() {
        const carInput = document.getElementById('carInput');
        const decrementBtn = document.getElementById('decrementBtn');
        const incrementBtn = document.getElementById('incrementBtn');
        const applyBtn = document.getElementById('applyBtn');
        const currentVehicleNumber = document.getElementById('currentVehicleNumber');
        const autoStatus = document.getElementById('autoStatus');

        if (!carInput || !decrementBtn || !incrementBtn || !applyBtn || !currentVehicleNumber || !autoStatus) {
            return;
        }

        // 車両番号を更新する関数
        const updateVehicleNumber = (number) => {
            if (number < 1) number = 1;
            
            // 表示を更新
            currentVehicleNumber.textContent = number;
            carInput.value = number;
            
            // 車両番号画面に反映
            this.updateVehicleDisplay(number);
        };

        // 自動的に番号を減少させる関数
        const startAutoDecrease = () => {
            if (this.autoDecreaseInterval) {
                clearInterval(this.autoDecreaseInterval);
            }
            
            autoStatus.textContent = '動作中';
            autoStatus.className = 'auto-status active';
            
            this.autoDecreaseInterval = setInterval(() => {
                const currentNumber = parseInt(carInput.value);
                if (currentNumber > 1) {
                    updateVehicleNumber(currentNumber - 1);
                } else {
                    // 1まで減少したら一旦停止
                    this.stopAutoDecrease();
                }
            }, 1000);
        };

        // 自動減少を停止する関数
        this.stopAutoDecrease = () => {
            if (this.autoDecreaseInterval) {
                clearInterval(this.autoDecreaseInterval);
                this.autoDecreaseInterval = null;
            }
            autoStatus.textContent = '停止中';
            autoStatus.className = 'auto-status';
        };

        // ボタンのイベントリスナー
        decrementBtn.addEventListener('click', () => {
            this.stopAutoDecrease();
            const currentNumber = parseInt(carInput.value);
            updateVehicleNumber(currentNumber - 1);
        });

        incrementBtn.addEventListener('click', () => {
            this.stopAutoDecrease();
            const currentNumber = parseInt(carInput.value);
            updateVehicleNumber(currentNumber + 1);
        });

        applyBtn.addEventListener('click', () => {
            this.stopAutoDecrease();
            const inputNumber = parseInt(carInput.value);
            updateVehicleNumber(inputNumber);
            // 適用ボタンを押したら自動減少を開始
            startAutoDecrease();
        });

        // 入力フィールドの変更イベント
        carInput.addEventListener('change', () => {
            this.stopAutoDecrease();
            const inputNumber = parseInt(carInput.value);
            if (isNaN(inputNumber) || inputNumber < 1) {
                carInput.value = 1;
            }
        });

        // 初期表示
        updateVehicleNumber(this.maxCars);
        // 自動減少を開始
        startAutoDecrease();
    }

    // 車両番号画面の初期化
    initializeVehicleDisplay() {
        const carName = document.querySelector('.car-name');
        if (carName) {
            carName.textContent = 'GATANGO';
        }
        
        // 現在の車両番号で表示更新
        const currentNumber = this.getCurrentVehicleNumber();
        this.updateVehicleDisplay(currentNumber);
    }

    // 現在の車両番号を取得
    getCurrentVehicleNumber() {
        const currentVehicleNumber = document.getElementById('currentVehicleNumber');
        if (currentVehicleNumber) {
            return parseInt(currentVehicleNumber.textContent) || this.maxCars;
        }
        return this.maxCars;
    }

    // 車両番号表示を更新
    updateVehicleDisplay(number) {
        const carNumber = document.getElementById('carNumber');
        if (carNumber) {
            carNumber.textContent = number;
            this.updateDigitClass(number);
        }
    }

    // 桁数に応じたクラスを更新する関数
    updateDigitClass(number) {
        const carNumber = document.getElementById('carNumber');
        if (!carNumber) return;
        
        // 既存の桁数クラスをすべて削除
        carNumber.classList.remove('digits-1', 'digits-2', 'digits-3', 'digits-4');
        
        // 桁数を計算
        const digitCount = number.toString().length;
        
        // 桁数に応じたクラスを追加
        carNumber.classList.add(`digits-${digitCount}`);
    }

    // 車両番号画面のタップハンドラー
    setupVehicleTapHandler() {
        const tapArea = document.getElementById('tap-area-vehicle');
        if (!tapArea) return;

        this.tapCounts.vehicle = 0;

        tapArea.addEventListener('click', () => {
            this.tapCounts.vehicle++;
            
            if (this.tapCounts.vehicle >= 5) {
                // 5回タップで戻る
                if (this.stopAutoDecrease) {
                    this.stopAutoDecrease();
                }
                
                // 全画面表示中の場合は終了
                const isFullscreen = document.fullscreenElement || 
                                    document.webkitFullscreenElement || 
                                    document.mozFullScreenElement || 
                                    document.msFullscreenElement;
                
                if (isFullscreen) {
                    this.exitFullscreen();
                }
                
                this.resetTapCounts();
                this.deviceType = null;
                this.showScreen('selection-screen');
                this.updateDeviceType();
            } else {
                // 3秒以内に次のタップがない場合はカウンターをリセット
                setTimeout(() => {
                    this.tapCounts.vehicle = 0;
                }, 3000);
            }
        });
    }

    // モニター画面のタップハンドラー
    setupMonitorTapHandler(type) {
        const tapArea = document.getElementById(`tap-area-monitor-${type}`);
        if (!tapArea) return;

        const tapKey = type === 'front' ? 'monitorFront' : 'monitorBack';
        this.tapCounts[tapKey] = 0;

        tapArea.addEventListener('click', () => {
            this.tapCounts[tapKey]++;
            
            if (this.tapCounts[tapKey] >= 2) {
                // 2回タップで戻る
                this.resetTapCounts();
                this.deviceType = null;
                this.showScreen('selection-screen');
                this.updateDeviceType();
            } else {
                // 3秒以内に次のタップがない場合はカウンターをリセット
                setTimeout(() => {
                    this.tapCounts[tapKey] = 0;
                }, 3000);
            }
        });
    }

    // タップカウンターをリセット
    resetTapCounts() {
        this.tapCounts.vehicle = 0;
        this.tapCounts.monitorFront = 0;
        this.tapCounts.monitorBack = 0;
    }

    // 全画面表示機能のセットアップ
    setupFullscreenHandler() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const fullscreenContainer = document.querySelector('.fullscreen-button-container');
        const trainContainer = document.querySelector('.train-container');
        
        if (!fullscreenBtn || !fullscreenContainer || !trainContainer) return;

        // 全画面表示ボタンのクリックイベント
        fullscreenBtn.addEventListener('click', () => {
            this.enterFullscreen();
        });

        // 全画面状態の変更を監視
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });

        // 他のブラウザ対応
        document.addEventListener('webkitfullscreenchange', () => {
            this.handleFullscreenChange();
        });

        document.addEventListener('mozfullscreenchange', () => {
            this.handleFullscreenChange();
        });

        document.addEventListener('MSFullscreenChange', () => {
            this.handleFullscreenChange();
        });
    }

    // 全画面表示に入る
    enterFullscreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { // Safari
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) { // Firefox
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) { // IE/Edge
            element.msRequestFullscreen();
        }
    }

    // 全画面表示から抜ける
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }

    // 全画面状態の変更を処理
    handleFullscreenChange() {
        const fullscreenContainer = document.querySelector('.fullscreen-button-container');
        const trainContainer = document.querySelector('.train-container');
        
        if (!fullscreenContainer || !trainContainer) return;

        // 全画面表示中かどうかを確認
        const isFullscreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement;

        if (isFullscreen) {
            // 全画面表示中：ボタンを非表示にし、フルスクリーンモードを適用
            fullscreenContainer.classList.add('fullscreen-hidden');
            trainContainer.classList.add('fullscreen-mode');
            
            // 車両番号表示を再調整
            const currentNumber = this.getCurrentVehicleNumber();
            this.updateVehicleDisplay(currentNumber);
        } else {
            // 全画面表示終了：ボタンを再表示し、フルスクリーンモードを解除
            fullscreenContainer.classList.remove('fullscreen-hidden');
            trainContainer.classList.remove('fullscreen-mode');
            
            // 車両番号表示を再調整
            const currentNumber = this.getCurrentVehicleNumber();
            this.updateVehicleDisplay(currentNumber);
        }
    }

    // カメラ切り替え
    toggleCamera() {
        const cameraView = document.getElementById('camera-view');
        if (cameraView) {
            // 実際のカメラ機能はここに実装
            cameraView.innerHTML = '<p>カメラが切り替わりました</p>';
        }
    }

    // デバイスタイプ更新
    updateDeviceType() {
        const deviceInfo = {
            type: this.deviceType,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };

        writeData(`devices/${this.generateDeviceId()}`, deviceInfo);
    }

    // デバイスID生成
    generateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    // 通知表示
    showNotification(message, type = 'success') {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 新しい通知を作成
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(notification);

        // フェードイン
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);

        // 3秒後に自動削除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TabletApp();
});

// ページ離脱時の処理
window.addEventListener('beforeunload', () => {
    // デバイス情報をクリア
    if (app && app.deviceType) {
        writeData(`devices/${app.generateDeviceId()}`, null);
    }
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('アプリケーションエラー:', event.error);
    if (app) {
        app.showNotification('アプリケーションエラーが発生しました', 'error');
    }
});

// Firebase接続エラー時の処理
window.addEventListener('offline', () => {
    if (app) {
        app.showNotification('オフラインモードで動作中', 'error');
    }
});

window.addEventListener('online', () => {
    if (app) {
        app.showNotification('オンラインに復帰しました', 'success');
    }
}); 