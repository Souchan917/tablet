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
            monitorBack: 0,
            camera: 0
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
            this.setupCameraScreen();
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
                
                // カメラ画面から戻る場合はカメラシステムを停止
                if (this.currentScreen === 'camera-screen' && this.cameraState) {
                    this.stopCameraSystem();
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
            
            // シンプル通信で全チーム進行通知を送信
            this.teams.forEach(team => {
                this.sendTeamProgressNotification(team.id, team.currentStep);
            });
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
            
            // シンプル通信で全チーム進行通知を送信
            this.teams.forEach(team => {
                this.sendTeamProgressNotification(team.id, team.currentStep);
            });
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
        
        // シンプル通信で全チームリセット通知を送信
        this.teams.forEach(team => {
            this.sendTeamProgressNotification(team.id, 1);
        });
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
            
            // シンプル通信でチーム進行通知を送信
            this.sendTeamProgressNotification(teamId, newStep);
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
            
            // 他のタブレットの車両番号画面にコマンドを送信
            this.sendVehicleCommand('set_number', { number: number });
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
            
            // 他のタブレットに自動減少開始を通知
            this.sendVehicleCommand('start_auto_decrease', {});
        };

        // 自動減少を停止する関数
        this.stopAutoDecrease = () => {
            if (this.autoDecreaseInterval) {
                clearInterval(this.autoDecreaseInterval);
                this.autoDecreaseInterval = null;
            }
            autoStatus.textContent = '停止中';
            autoStatus.className = 'auto-status';
            
            // 他のタブレットに自動減少停止を通知
            this.sendVehicleCommand('stop_auto_decrease', {});
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
        
        // 接続監視機能の初期化
        this.setupConnectionMonitoring();
        
        // シンプル通信機能の初期化
        this.setupSimpleCommunication();
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
        
        // Firebase通信の初期化
        this.vehicleDeviceId = 'vehicle_' + Date.now();
        registerDevice('vehicle', this.vehicleDeviceId);
        
        // 車両番号制御コマンドの監視
        this.setupVehicleCommandListener();
        
        // 定期的にデバイス状態を更新
        setInterval(() => {
            updateDeviceStatus(this.vehicleDeviceId);
        }, 30000); // 30秒ごと
        
        console.log('車両番号画面初期化完了 - デバイスID:', this.vehicleDeviceId);
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
        
        // Firebase に現在の車両番号を送信
        if (this.vehicleDeviceId) {
            writeData(`vehicle_status/${this.vehicleDeviceId}`, {
                currentNumber: number,
                timestamp: Date.now(),
                deviceId: this.vehicleDeviceId
            });
        }
        
        // シンプル通信で車両番号変更通知を送信
        this.sendVehicleNumberNotification(number);
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

    // 車両番号コマンドを送信する関数
    sendVehicleCommand(command, data) {
        const commandData = {
            command: command,
            data: data || {},
            timestamp: Date.now(),
            sender: this.generateDeviceId()
        };
        
        // 車両番号ブロードキャスト用の共通パス
        const broadcastPath = 'commands/vehicle_broadcast';
        
        console.log('車両番号コマンド送信:', commandData);
        
        // Firebase に送信
        writeData(broadcastPath, commandData).then(() => {
            console.log('車両番号コマンド送信完了');
        }).catch(error => {
            console.error('車両番号コマンド送信失敗:', error);
        });
    }

    // 車両番号制御コマンドの監視
    setupVehicleCommandListener() {
        if (!this.vehicleDeviceId) return;
        
        // 個別デバイス向けコマンド監視
        const commandPath = `commands/${this.vehicleDeviceId}`;
        readData(commandPath, (snapshot) => {
            const commandData = snapshot.val();
            if (commandData && commandData.timestamp) {
                console.log('車両番号制御コマンド受信:', commandData);
                
                // 3秒以内のコマンドのみ処理（古いコマンドを無視）
                const now = Date.now();
                if (now - commandData.timestamp < 3000) {
                    this.handleVehicleCommand(commandData);
                }
            }
        });
        
        // ブロードキャスト用コマンド監視
        const broadcastPath = 'commands/vehicle_broadcast';
        readData(broadcastPath, (snapshot) => {
            const commandData = snapshot.val();
            if (commandData && commandData.timestamp) {
                console.log('車両番号ブロードキャスト受信:', commandData);
                
                // 自分が送信したコマンドは無視
                if (commandData.sender !== this.generateDeviceId()) {
                    // 3秒以内のコマンドのみ処理
                    const now = Date.now();
                    if (now - commandData.timestamp < 3000) {
                        this.handleVehicleCommand(commandData);
                    }
                }
            }
        });
    }

    // 車両番号制御コマンドの処理
    handleVehicleCommand(commandData) {
        const { command, data } = commandData;
        
        switch (command) {
            case 'set_number':
                if (data.number && data.number > 0) {
                    this.updateVehicleDisplay(data.number);
                    console.log('車両番号設定:', data.number);
                }
                break;
                
            case 'increment':
                const currentNumber = this.getCurrentVehicleNumber();
                this.updateVehicleDisplay(currentNumber + 1);
                console.log('車両番号インクリメント:', currentNumber + 1);
                break;
                
            case 'decrement':
                const currentNum = this.getCurrentVehicleNumber();
                if (currentNum > 1) {
                    this.updateVehicleDisplay(currentNum - 1);
                    console.log('車両番号デクリメント:', currentNum - 1);
                }
                break;
                
            case 'start_auto_decrease':
                if (this.startAutoDecrease) {
                    this.startAutoDecrease();
                    console.log('自動減少開始');
                }
                break;
                
            case 'stop_auto_decrease':
                if (this.stopAutoDecrease) {
                    this.stopAutoDecrease();
                    console.log('自動減少停止');
                }
                break;
                
            default:
                console.log('未知のコマンド:', command);
        }
    }

    // 接続監視機能の設定
    setupConnectionMonitoring() {
        const refreshBtn = document.getElementById('refresh-connections');
        const testBtn = document.getElementById('test-all-communications');
        
        if (!refreshBtn || !testBtn) {
            console.log('接続監視機能の要素が見つかりません');
            return;
        }

        // 定期的な更新間隔（30秒）
        this.connectionUpdateInterval = setInterval(() => {
            this.updateConnectionDisplay();
        }, 30000);

        // ボタンイベントの設定
        refreshBtn.addEventListener('click', () => {
            this.updateConnectionDisplay();
            this.showNotification('接続状況を更新しました', 'success');
        });

        testBtn.addEventListener('click', () => {
            this.testAllCommunications();
        });

        // 初回表示
        this.updateConnectionDisplay();
        
        console.log('接続監視機能初期化完了');
    }

    // 接続状況表示の更新
    async updateConnectionDisplay() {
        const connectedCountEl = document.getElementById('connected-devices-count');
        const firebaseStatusEl = document.getElementById('firebase-status');
        const lastUpdateEl = document.getElementById('last-update');
        const deviceListEl = document.getElementById('device-list');

        if (!connectedCountEl || !firebaseStatusEl || !lastUpdateEl || !deviceListEl) {
            return;
        }

        try {
            // 接続管理システムから情報を取得
            if (window.connectionManager) {
                const isFirebaseConnected = window.connectionManager.isFirebaseConnected;
                firebaseStatusEl.textContent = isFirebaseConnected ? '接続中' : '切断中';
                firebaseStatusEl.style.color = isFirebaseConnected ? '#28a745' : '#dc3545';

                if (isFirebaseConnected) {
                    // アクティブデバイス一覧を取得
                    const devices = await window.connectionManager.getOtherDevices();
                    connectedCountEl.textContent = devices.length.toString();
                    
                    // デバイス一覧を表示
                    this.renderDeviceList(devices, deviceListEl);
                } else {
                    connectedCountEl.textContent = '0';
                    deviceListEl.innerHTML = '<p style="color: #dc3545;">Firebase接続が必要です</p>';
                }
            } else {
                firebaseStatusEl.textContent = '初期化中';
                firebaseStatusEl.style.color = '#ffc107';
                deviceListEl.innerHTML = '<p>接続管理システム初期化中...</p>';
            }

            // 最終更新時刻を設定
            const now = new Date();
            lastUpdateEl.textContent = now.toLocaleTimeString();

        } catch (error) {
            console.error('接続状況更新エラー:', error);
            deviceListEl.innerHTML = '<p style="color: #dc3545;">接続状況の取得に失敗しました</p>';
        }
    }

    // デバイス一覧を表示
    renderDeviceList(devices, container) {
        if (devices.length === 0) {
            container.innerHTML = '<p>他の接続端末はありません</p>';
            return;
        }

        const deviceItems = devices.map(device => {
            const lastSeenAge = Date.now() - (device.lastSeen || 0);
            const isRecentlyActive = lastSeenAge < 60000; // 1分以内
            
            let statusClass = 'offline';
            let statusText = 'オフライン';
            
            if (device.isOnline && device.isFirebaseConnected && isRecentlyActive) {
                statusClass = 'online';
                statusText = 'オンライン';
            } else if (device.isOnline && !device.isFirebaseConnected) {
                statusClass = 'warning';
                statusText = 'Firebase切断';
            }

            const deviceTypeName = this.getDeviceTypeName(device.type);
            const lastSeenText = this.formatLastSeen(lastSeenAge);

            return `
                <div class="device-item">
                    <div class="device-info">
                        <div class="device-name">${deviceTypeName} (${device.id.substring(0, 8)}...)</div>
                        <div class="device-details">最終確認: ${lastSeenText}</div>
                    </div>
                    <div class="device-status">
                        <div class="status-indicator ${statusClass}"></div>
                        <span class="status-text">${statusText}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = deviceItems;
    }

    // デバイスタイプ名を取得
    getDeviceTypeName(type) {
        const typeNames = {
            'staff': 'スタッフ画面',
            'master': 'マスター画面',
            'monitor_front': 'モニター前',
            'monitor_back': 'モニター後',
            'camera': 'カメラ画面',
            'vehicle': '車両番号画面',
            'unknown': '不明なデバイス'
        };
        return typeNames[type] || `${type}画面`;
    }

    // 最終確認時刻をフォーマット
    formatLastSeen(ageMs) {
        if (ageMs < 60000) {
            return `${Math.floor(ageMs / 1000)}秒前`;
        } else if (ageMs < 3600000) {
            return `${Math.floor(ageMs / 60000)}分前`;
        } else {
            return `${Math.floor(ageMs / 3600000)}時間前`;
        }
    }

    // 全端末通信テスト
    async testAllCommunications() {
        if (!window.connectionManager || !window.connectionManager.isFirebaseConnected) {
            this.showNotification('Firebase接続が必要です', 'error');
            return;
        }

        this.showNotification('通信テストを開始しています...', 'info');

        try {
            const devices = await window.connectionManager.getOtherDevices();
            
            if (devices.length === 0) {
                this.showNotification('テスト対象の端末がありません', 'warning');
                return;
            }

            let successCount = 0;
            let failCount = 0;

            // 各デバイスに順次テスト
            for (const device of devices) {
                try {
                    await window.connectionManager.testCommunication(device.id);
                    successCount++;
                    console.log(`通信テスト成功: ${device.id}`);
                } catch (error) {
                    failCount++;
                    console.error(`通信テスト失敗: ${device.id}`, error);
                }
            }

            // 結果表示
            const totalDevices = devices.length;
            const message = `通信テスト完了: 成功 ${successCount}/${totalDevices}`;
            const type = failCount === 0 ? 'success' : 'warning';
            
            this.showNotification(message, type);

            // 接続状況を再更新
            setTimeout(() => {
                this.updateConnectionDisplay();
            }, 1000);

        } catch (error) {
            console.error('通信テストエラー:', error);
            this.showNotification('通信テストでエラーが発生しました', 'error');
        }
    }

    // シンプル通信機能の設定
    setupSimpleCommunication() {
        const testBtn = document.getElementById('simple-test-btn');
        const pingBtn = document.getElementById('simple-ping-btn');
        const refreshBtn = document.getElementById('simple-refresh-btn');
        
        if (!testBtn || !pingBtn || !refreshBtn) {
            console.log('シンプル通信機能の要素が見つかりません');
            return;
        }

        // 通信ログ機能
        this.communicationLogs = [];
        this.maxLogEntries = 50;

        // ボタンイベントの設定
        testBtn.addEventListener('click', () => {
            this.sendSimpleTestMessage();
        });

        pingBtn.addEventListener('click', () => {
            this.sendSimplePing();
        });

        refreshBtn.addEventListener('click', () => {
            this.updateSimpleCommunicationStatus();
        });

        // メッセージリスナーの設定
        this.setupSimpleMessageListeners();

        // 定期的な状態更新
        this.simpleCommunicationUpdateInterval = setInterval(() => {
            this.updateSimpleCommunicationStatus();
        }, 10000); // 10秒ごと

        // 初回表示
        setTimeout(() => {
            this.updateSimpleCommunicationStatus();
        }, 2000);
        
        console.log('シンプル通信機能初期化完了');
    }

    // シンプルメッセージリスナーの設定
    setupSimpleMessageListeners() {
        if (!window.simpleCommunication) {
            setTimeout(() => this.setupSimpleMessageListeners(), 1000);
            return;
        }

        // テストメッセージ受信
        window.simpleCommunication.addMessageListener('test', (data, senderId) => {
            this.addCommunicationLog(`テストメッセージ受信: ${data.message || 'メッセージなし'}`, 'received');
        });

        // Ping受信
        window.simpleCommunication.addMessageListener('ping', (data, senderId) => {
            this.addCommunicationLog(`Ping受信: ${senderId}`, 'received');
        });

        // Pong受信
        window.simpleCommunication.addMessageListener('pong', (data, senderId) => {
            this.addCommunicationLog(`Pong受信: ${senderId}`, 'received');
        });

        // 車両番号変更通知
        window.simpleCommunication.addMessageListener('vehicle_number', (data, senderId) => {
            this.addCommunicationLog(`車両番号変更通知: ${data.number}`, 'received');
            
            // 車両番号画面が表示されている場合は更新
            if (document.getElementById('vehicle-screen').style.display !== 'none') {
                this.updateVehicleDisplay(data.number);
            }
        });

        // チーム進行通知
        window.simpleCommunication.addMessageListener('team_progress', (data, senderId) => {
            this.addCommunicationLog(`チーム進行通知: ${data.teamId} -> ${data.step}`, 'received');
        });

        console.log('シンプルメッセージリスナー設定完了');
    }

    // テストメッセージ送信
    async sendSimpleTestMessage() {
        if (!window.simpleCommunication || !window.simpleCommunication.isConnected) {
            this.showNotification('Firebase接続が必要です', 'error');
            return;
        }

        try {
            const message = 'テスト通信: ' + new Date().toLocaleTimeString();
            await window.simpleCommunication.sendMessage('test', { message });
            this.addCommunicationLog(`テストメッセージ送信: ${message}`, 'sent');
            this.showNotification('テストメッセージを送信しました', 'success');
        } catch (error) {
            console.error('テストメッセージ送信エラー:', error);
            this.addCommunicationLog(`テストメッセージ送信失敗: ${error.message}`, 'error');
            this.showNotification('テストメッセージの送信に失敗しました', 'error');
        }
    }

    // Ping送信
    async sendSimplePing() {
        if (!window.simpleCommunication || !window.simpleCommunication.isConnected) {
            this.showNotification('Firebase接続が必要です', 'error');
            return;
        }

        try {
            await window.simpleCommunication.ping();
            this.addCommunicationLog('Ping送信完了', 'sent');
            this.showNotification('Pingを送信しました', 'success');
        } catch (error) {
            console.error('Ping送信エラー:', error);
            this.addCommunicationLog(`Ping送信失敗: ${error.message}`, 'error');
            this.showNotification('Pingの送信に失敗しました', 'error');
        }
    }

    // シンプル通信状態更新
    async updateSimpleCommunicationStatus() {
        const statusEl = document.getElementById('simple-comm-status');
        const devicesEl = document.getElementById('simple-comm-devices');
        
        if (!statusEl || !devicesEl) return;

        try {
            if (window.simpleCommunication) {
                const isConnected = window.simpleCommunication.isConnected;
                statusEl.textContent = isConnected ? '接続中' : '切断中';
                statusEl.style.color = isConnected ? '#28a745' : '#dc3545';

                if (isConnected) {
                    const devices = await window.simpleCommunication.getConnectedDevices();
                    const otherDevices = devices.filter(d => d.id !== window.simpleCommunication.deviceId);
                    devicesEl.textContent = otherDevices.length.toString();
                } else {
                    devicesEl.textContent = '0';
                }
            } else {
                statusEl.textContent = '初期化中';
                statusEl.style.color = '#ffc107';
                devicesEl.textContent = '0';
            }
        } catch (error) {
            console.error('シンプル通信状態更新エラー:', error);
            statusEl.textContent = 'エラー';
            statusEl.style.color = '#dc3545';
            devicesEl.textContent = '0';
        }
    }

    // 通信ログ追加
    addCommunicationLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type
        };
        
        this.communicationLogs.push(logEntry);
        
        // ログ数制限
        if (this.communicationLogs.length > this.maxLogEntries) {
            this.communicationLogs = this.communicationLogs.slice(-this.maxLogEntries);
        }
        
        this.updateCommunicationLogDisplay();
    }

    // 通信ログ表示更新
    updateCommunicationLogDisplay() {
        const logContainer = document.getElementById('simple-comm-log');
        if (!logContainer) return;

        if (this.communicationLogs.length === 0) {
            logContainer.innerHTML = '<p>通信ログがありません</p>';
            return;
        }

        const logHTML = this.communicationLogs.slice(-10).map(entry => {
            return `
                <div class="log-entry ${entry.type}">
                    <span class="log-timestamp">${entry.timestamp}</span>
                    <span class="log-message">${entry.message}</span>
                </div>
            `;
        }).join('');

        logContainer.innerHTML = logHTML;
        
        // 最新ログまでスクロール
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // 車両番号変更通知の送信
    sendVehicleNumberNotification(number) {
        if (window.simpleCommunication && window.simpleCommunication.isConnected) {
            window.simpleCommunication.sendMessage('vehicle_number', { number });
            this.addCommunicationLog(`車両番号変更通知送信: ${number}`, 'sent');
        }
    }

    // チーム進行通知の送信
    sendTeamProgressNotification(teamId, step) {
        if (window.simpleCommunication && window.simpleCommunication.isConnected) {
            window.simpleCommunication.sendMessage('team_progress', { teamId, step });
            this.addCommunicationLog(`チーム進行通知送信: ${teamId} -> ${step}`, 'sent');
        }
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
        this.tapCounts.camera = 0;
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

    // カメラ画面の初期化
    setupCameraScreen() {
        this.cameraState = {
            mediaStream: null,
            frameBuffer: [],
            animationId: null,
            lastDrawTime: 0,
            delaySeconds: 1.0,
            isStreamStarted: false,
            currentDeviceId: null,
            cameraDevices: [],
            peer: null,
            currentCall: null,
            mode: null, // 'broadcast' or 'receive'
            isBroadcasting: false,
            isReceiving: false
        };
        
        this.setupCameraModeSelector();
        this.setupCameraTapHandler();
        
        // スマホカメラシステムの初期化
        this.initSimpleCameraSystem();
    }

    // スマホカメラシステムの初期化
    initSimpleCameraSystem() {
        // デバイス判定（簡易版）
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            console.log('モバイルデバイスを検出。スマホカメラシステムを初期化します');
            
            // 既存のカメラUIを非表示
            const cameraModeSelector = document.querySelector('.camera-mode-selector');
            if (cameraModeSelector) {
                cameraModeSelector.style.display = 'none';
            }
            
            // スマホカメラシステムを初期化
            setTimeout(() => {
                if (typeof initSimpleCameraSystem === 'function') {
                    initSimpleCameraSystem();
                }
            }, 500);
        } else {
            console.log('デスクトップデバイスを検出。通常のカメラシステムを使用します');
        }
    }

    // カメラモード選択の設定
    setupCameraModeSelector() {
        const broadcastModeBtn = document.getElementById('broadcast-mode-btn');
        const receiveModeBtn = document.getElementById('receive-mode-btn');
        
        broadcastModeBtn.addEventListener('click', () => {
            this.selectCameraMode('broadcast');
        });
        
        receiveModeBtn.addEventListener('click', () => {
            this.selectCameraMode('receive');
        });
    }

    // カメラモード選択
    selectCameraMode(mode) {
        this.cameraState.mode = mode;
        const cameraContainer = document.querySelector('.camera-container');
        
        // モードクラスを設定
        cameraContainer.classList.remove('broadcast-mode', 'receive-mode');
        cameraContainer.classList.add(`${mode}-mode`);
        
        if (mode === 'broadcast') {
            this.setupBroadcastMode();
        } else if (mode === 'receive') {
            this.setupReceiveMode();
        }
    }

    // 配信モードの初期化
    setupBroadcastMode() {
        this.initializePeerJS('broadcast');
        this.setupBroadcastControls();
        this.getCameraDevices();
        this.updateCameraStatus('カメラを選択して配信を開始してください');
    }

    // 受信モードの初期化
    setupReceiveMode() {
        this.initializePeerJS('receive');
        this.setupReceiveControls();
        this.updateCameraStatus('配信側からの接続を待機しています...');
    }

    // PeerJSの初期化
    initializePeerJS(mode) {
        try {
            // 既存の接続があれば閉じる
            if (this.cameraState.peer) {
                this.cameraState.peer.destroy();
                this.cameraState.peer = null;
            }

            const peerOptions = {
                debug: 2,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            };

            if (mode === 'broadcast') {
                // 配信側はランダムIDを生成
                this.cameraState.peer = new Peer(peerOptions);
            } else {
                // 受信側は固定ID「tabletcam」を使用
                this.cameraState.peer = new Peer('tabletcam', peerOptions);
            }

            this.cameraState.peer.on('open', (id) => {
                console.log('PeerJS接続成功:', id);
                if (mode === 'broadcast') {
                    document.getElementById('broadcast-peer-id').textContent = id;
                    this.updateCameraStatus(`配信ID: ${id} で待機中`);
                    this.showNotification('配信準備完了', 'success');
                } else {
                    document.getElementById('receive-peer-id').textContent = id;
                    this.updateCameraStatus('受信準備完了。配信側から接続を待機中...');
                    this.showNotification('受信準備完了', 'success');
                }
            });

            this.cameraState.peer.on('error', (err) => {
                console.error('PeerJS接続エラー:', err);
                let errorMsg = 'PeerJS接続エラー: ';
                
                if (err.type === 'unavailable-id') {
                    errorMsg += 'IDが既に使用されています。再試行中...';
                    // 3秒後にリトライ
                    setTimeout(() => {
                        this.initializePeerJS(mode);
                    }, 3000);
                } else if (err.type === 'network') {
                    errorMsg += 'ネットワーク接続の問題です。インターネット接続を確認してください。';
                } else if (err.type === 'peer-unavailable') {
                    errorMsg += '接続先が見つかりません。相手側が準備完了しているか確認してください。';
                } else {
                    errorMsg += err.message;
                }
                
                this.updateCameraStatus(errorMsg);
                this.showNotification(errorMsg, 'error');
            });

            this.cameraState.peer.on('disconnected', () => {
                console.log('PeerJS接続が切断されました');
                this.updateCameraStatus('接続が切断されました。再接続しています...');
                
                // 自動再接続を試行
                setTimeout(() => {
                    if (this.cameraState.peer && !this.cameraState.peer.destroyed) {
                        this.cameraState.peer.reconnect();
                    }
                }, 2000);
            });

            if (mode === 'receive') {
                // 受信側：着信処理
                this.cameraState.peer.on('call', (call) => {
                    console.log('着信を受信しました');
                    this.handleIncomingCall(call);
                });
            }

        } catch (error) {
            console.error('PeerJS初期化エラー:', error);
            this.updateCameraStatus('接続の初期化に失敗しました: ' + error.message);
            this.showNotification('PeerJS初期化失敗', 'error');
        }
    }

    // 配信モードコントロールの設定
    setupBroadcastControls() {
        const refreshBtn = document.getElementById('refresh-camera-btn');
        const cameraSelect = document.getElementById('camera-device-select');
        const startBroadcastBtn = document.getElementById('start-broadcast-btn');
        const stopBroadcastBtn = document.getElementById('stop-broadcast-btn');
        const fullscreenBtn = document.getElementById('fullscreen-camera-btn');

        // 更新ボタン
        refreshBtn.addEventListener('click', () => {
            this.getCameraDevices();
        });

        // カメラ選択
        cameraSelect.addEventListener('change', () => {
            this.cameraState.currentDeviceId = cameraSelect.value;
            if (this.cameraState.isBroadcasting) {
                this.stopBroadcasting();
                setTimeout(() => {
                    this.startBroadcasting();
                }, 100);
            }
        });

        // 配信開始ボタン
        startBroadcastBtn.addEventListener('click', () => {
            this.startBroadcasting();
        });

        // 配信停止ボタン
        stopBroadcastBtn.addEventListener('click', () => {
            this.stopBroadcasting();
        });

        // 全画面ボタン
        fullscreenBtn.addEventListener('click', () => {
            this.enterFullscreenCamera();
        });
    }

    // 受信モードコントロールの設定
    setupReceiveControls() {
        const delaySlider = document.getElementById('camera-delay-slider');
        const delayValue = document.getElementById('camera-delay-value');
        const startReceiveBtn = document.getElementById('start-receive-btn');
        const stopReceiveBtn = document.getElementById('stop-receive-btn');
        const fullscreenBtn = document.getElementById('fullscreen-receive-btn');

        // 遅延スライダーの設定
        delaySlider.addEventListener('input', () => {
            this.cameraState.delaySeconds = delaySlider.value / 10;
            delayValue.textContent = `${this.cameraState.delaySeconds.toFixed(1)}秒`;
            this.updateCameraStatus();
        });

        // 受信開始ボタン
        startReceiveBtn.addEventListener('click', () => {
            this.startReceiving();
        });

        // 受信停止ボタン
        stopReceiveBtn.addEventListener('click', () => {
            this.stopReceiving();
        });

        // 全画面ボタン
        fullscreenBtn.addEventListener('click', () => {
            this.enterFullscreenCamera();
        });

        // 初期値設定
        delayValue.textContent = `${this.cameraState.delaySeconds.toFixed(1)}秒`;
    }

    // カメラタップハンドラー
    setupCameraTapHandler() {
        const tapArea = document.getElementById('tap-area-camera');
        if (tapArea) {
            tapArea.addEventListener('click', (e) => {
                const rect = tapArea.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // 左上エリア（100x100px）のクリック
                if (x <= 100 && y <= 100) {
                    this.tapCounts.camera = (this.tapCounts.camera || 0) + 1;
                    
                    // 3秒以内に次のタップがなければカウンターリセット
                    if (this.tapCounts.camera === 1) {
                        setTimeout(() => {
                            this.tapCounts.camera = 0;
                        }, 3000);
                    }
                    
                    // 5回タップで戻る
                    if (this.tapCounts.camera >= 5) {
                        this.tapCounts.camera = 0;
                        this.stopCameraStream();
                        this.showScreen('selection-screen');
                    }
                }
            });
        }
    }

    // カメラデバイスの取得
    async getCameraDevices() {
        try {
            this.updateCameraStatus('カメラデバイスを検索中...');
            
            // まずカメラへのアクセス権限を取得
            try {
                // 一時的にカメラアクセスしてラベルを取得
                const tempStream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: false 
                });
                // すぐに停止
                tempStream.getTracks().forEach(track => track.stop());
                console.log('カメラアクセス権限を取得しました');
            } catch (permissionError) {
                console.warn('カメラアクセス権限が取得できませんでした:', permissionError);
                this.updateCameraStatus('カメラアクセス権限が必要です。ブラウザの設定で許可してください。');
                this.showNotification('カメラアクセス権限が必要です', 'error');
            }
            
            // デバイス一覧を取得
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('検出されたビデオデバイス:', videoDevices);
            
            const cameraSelect = document.getElementById('camera-device-select');
            if (!cameraSelect) {
                console.error('カメラ選択要素が見つかりません');
                return;
            }
            
            cameraSelect.innerHTML = '<option value="">カメラを選択してください</option>';
            
            this.cameraState.cameraDevices = videoDevices;
            
            if (videoDevices.length > 0) {
                videoDevices.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    // ラベルが空の場合は一般的な名前を使用
                    option.text = device.label || `カメラ ${index + 1} (${device.deviceId.substring(0, 8)}...)`;
                    cameraSelect.appendChild(option);
                });
                
                // 最初のカメラを自動選択
                if (videoDevices.length === 1) {
                    cameraSelect.selectedIndex = 1;
                    this.cameraState.currentDeviceId = videoDevices[0].deviceId;
                }
                
                this.updateCameraStatus(`${videoDevices.length}台のカメラが見つかりました。カメラを選択して配信を開始してください。`);
                this.showNotification(`${videoDevices.length}台のカメラを検出`, 'success');
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.text = 'カメラが見つかりません';
                cameraSelect.appendChild(option);
                
                this.updateCameraStatus('カメラデバイスが見つかりません。カメラの接続とブラウザの権限を確認してください。');
                this.showNotification('カメラが見つかりません', 'error');
            }
        } catch (error) {
            console.error('カメラデバイスの取得に失敗しました:', error);
            this.updateCameraStatus('カメラデバイスの取得に失敗しました。ブラウザの権限設定を確認してください。');
            this.showNotification('カメラデバイス取得失敗', 'error');
        }
    }

    // 配信開始
    async startBroadcasting() {
        try {
            // カメラが選択されているかチェック
            if (!this.cameraState.currentDeviceId) {
                this.updateCameraStatus('カメラを選択してください');
                this.showNotification('カメラを選択してください', 'error');
                return;
            }

            // PeerJS接続が準備できているかチェック
            if (!this.cameraState.peer || this.cameraState.peer.destroyed) {
                this.updateCameraStatus('接続が準備できていません。しばらく待ってから再試行してください。');
                this.showNotification('接続準備中です', 'error');
                return;
            }

            this.updateCameraStatus('カメラへのアクセスを要求中...');
            
            const constraints = {
                video: {
                    deviceId: { exact: this.cameraState.currentDeviceId },
                    width: { ideal: 1920, min: 640 },
                    height: { ideal: 1080, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                },
                audio: false
            };
            
            console.log('カメラ制約:', constraints);
            
            // カメラへのアクセス
            this.cameraState.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            console.log('カメラストリーム取得成功:', this.cameraState.mediaStream);
            
            // 元映像ビデオに設定
            const originalVideo = document.getElementById('original-camera');
            if (!originalVideo) {
                throw new Error('映像表示要素が見つかりません');
            }
            
            originalVideo.srcObject = this.cameraState.mediaStream;
            
            // ビデオがロードされたときの処理
            originalVideo.onloadedmetadata = () => {
                console.log('ビデオメタデータロード完了');
                this.updateCameraStatus('映像配信の準備が完了しました。tabletcamに接続中...');
                
                // 配信開始
                this.startPeerCall();
                
                // ボタン状態更新
                const startBtn = document.getElementById('start-broadcast-btn');
                const stopBtn = document.getElementById('stop-broadcast-btn');
                if (startBtn) startBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
                this.cameraState.isBroadcasting = true;
                
                this.showNotification('配信開始', 'success');
            };
            
            originalVideo.onerror = (error) => {
                console.error('ビデオ要素エラー:', error);
                this.updateCameraStatus('映像表示エラーが発生しました');
                this.showNotification('映像表示エラー', 'error');
            };
            
            // 映像再生開始
            originalVideo.play().catch(e => {
                console.error('ビデオの再生開始に失敗しました:', e);
                this.updateCameraStatus('ビデオの再生開始に失敗しました。再読み込みして再試行してください。');
                this.showNotification('ビデオ再生失敗', 'error');
            });
            
        } catch (error) {
            console.error('配信開始エラー:', error);
            let errorMsg = 'カメラアクセスエラー: ';
            
            if (error.name === 'NotFoundError') {
                errorMsg += '選択されたカメラが見つかりません。';
            } else if (error.name === 'NotAllowedError') {
                errorMsg += 'カメラアクセスが拒否されました。ブラウザの設定で許可してください。';
            } else if (error.name === 'NotReadableError') {
                errorMsg += 'カメラが他のアプリケーションで使用中です。';
            } else if (error.name === 'OverconstrainedError') {
                errorMsg += 'カメラの設定要求が満たせません。';
            } else {
                errorMsg += error.message;
            }
            
            this.updateCameraStatus(errorMsg);
            this.showNotification(errorMsg, 'error');
        }
    }

    // PeerJS通話開始
    startPeerCall() {
        if (!this.cameraState.peer || !this.cameraState.mediaStream) {
            this.updateCameraStatus('接続またはカメラの準備ができていません');
            this.showNotification('接続準備不完了', 'error');
            return;
        }

        try {
            console.log('tabletcamに発信中...');
            this.updateCameraStatus('tabletcamに接続中...');
            
            // 固定ID「tabletcam」に発信
            this.cameraState.currentCall = this.cameraState.peer.call('tabletcam', this.cameraState.mediaStream);
            
            if (!this.cameraState.currentCall) {
                throw new Error('通話の開始に失敗しました');
            }
            
            console.log('通話オブジェクト作成成功:', this.cameraState.currentCall);
            
            // 通話イベントの設定
            this.cameraState.currentCall.on('stream', (remoteStream) => {
                console.log('相手側のストリームを受信（配信側では使用しない）');
            });
            
            this.cameraState.currentCall.on('close', () => {
                console.log('通話が終了しました');
                this.updateCameraStatus('通話が終了しました');
                this.showNotification('通話終了', 'success');
                this.stopBroadcasting();
            });
            
            this.cameraState.currentCall.on('error', (err) => {
                console.error('通話中にエラーが発生しました:', err);
                let errorMsg = '通話エラー: ';
                
                if (err.type === 'peer-unavailable') {
                    errorMsg += 'tabletcamが見つかりません。受信側が準備できているか確認してください。';
                } else {
                    errorMsg += err.message;
                }
                
                this.updateCameraStatus(errorMsg);
                this.showNotification(errorMsg, 'error');
            });
            
            // 接続確立の確認
            setTimeout(() => {
                if (this.cameraState.currentCall && this.cameraState.currentCall.open) {
                    this.updateCameraStatus('tabletcam への配信が開始されました');
                    this.showNotification('配信中', 'success');
                } else if (this.cameraState.isBroadcasting) {
                    this.updateCameraStatus('tabletcamへの接続を試行中... 受信側が準備完了しているか確認してください。');
                    this.showNotification('接続試行中', 'error');
                }
            }, 3000);
            
        } catch (error) {
            console.error('通話開始エラー:', error);
            this.updateCameraStatus('通話開始に失敗しました: ' + error.message);
            this.showNotification('通話開始失敗', 'error');
        }
    }

    // 配信停止
    stopBroadcasting() {
        // 通話を終了
        if (this.cameraState.currentCall) {
            this.cameraState.currentCall.close();
            this.cameraState.currentCall = null;
        }
        
        // カメラストリームを停止
        if (this.cameraState.mediaStream) {
            this.cameraState.mediaStream.getTracks().forEach(track => track.stop());
            this.cameraState.mediaStream = null;
        }
        
        // ビデオ要素をクリア
        const originalVideo = document.getElementById('original-camera');
        originalVideo.srcObject = null;
        
        // ボタン状態更新
        const startBtn = document.getElementById('start-broadcast-btn');
        const stopBtn = document.getElementById('stop-broadcast-btn');
        startBtn.disabled = false;
        stopBtn.disabled = true;
        this.cameraState.isBroadcasting = false;
        
        this.updateCameraStatus('配信を停止しました');
    }

    // 受信開始
    startReceiving() {
        if (!this.cameraState.peer) {
            this.updateCameraStatus('接続が初期化されていません');
            return;
        }
        
        // ボタン状態更新
        const startBtn = document.getElementById('start-receive-btn');
        const stopBtn = document.getElementById('stop-receive-btn');
        startBtn.disabled = true;
        stopBtn.disabled = false;
        this.cameraState.isReceiving = true;
        
        this.updateCameraStatus('配信側からの接続を待機しています...');
    }

    // 受信停止
    stopReceiving() {
        // 通話を終了
        if (this.cameraState.currentCall) {
            this.cameraState.currentCall.close();
            this.cameraState.currentCall = null;
        }
        
        // 遅延処理を停止
        if (this.cameraState.animationId) {
            cancelAnimationFrame(this.cameraState.animationId);
            this.cameraState.animationId = null;
        }
        
        // ビデオ要素をクリア
        const remoteVideo = document.getElementById('remote-camera');
        const delayedVideo = document.getElementById('delayed-camera');
        remoteVideo.srcObject = null;
        delayedVideo.srcObject = null;
        
        // フレームバッファをクリア
        this.cameraState.frameBuffer = [];
        
        // ボタン状態更新
        const startBtn = document.getElementById('start-receive-btn');
        const stopBtn = document.getElementById('stop-receive-btn');
        startBtn.disabled = false;
        stopBtn.disabled = true;
        this.cameraState.isReceiving = false;
        
        this.updateCameraStatus('受信を停止しました');
    }

    // 着信処理
    handleIncomingCall(call) {
        console.log('着信を処理しています...');
        this.updateCameraStatus('配信側から接続されました。映像を受信中...');
        
        // 着信に応答（映像は送らない）
        call.answer();
        
        // 相手からのストリームを受信
        call.on('stream', (remoteStream) => {
            console.log('リモートストリームを受信しました');
            
            // リモートビデオに設定
            const remoteVideo = document.getElementById('remote-camera');
            remoteVideo.srcObject = remoteStream;
            
            // ビデオがロードされたときの処理
            remoteVideo.onloadedmetadata = () => {
                this.updateCameraStatus('映像受信開始。遅延処理を開始します...');
                
                // キャンバス設定
                const canvas = document.getElementById('camera-canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = remoteVideo.videoWidth || 1920;
                canvas.height = remoteVideo.videoHeight || 1080;
                
                // 遅延ビデオの設定
                const delayedVideo = document.getElementById('delayed-camera');
                delayedVideo.width = canvas.width;
                delayedVideo.height = canvas.height;
                
                // フレームバッファをクリア
                this.cameraState.frameBuffer = [];
                
                // 遅延描画ループ開始
                this.startDelayedDrawing();
                
                // ボタン状態更新
                const startBtn = document.getElementById('start-receive-btn');
                const stopBtn = document.getElementById('stop-receive-btn');
                startBtn.disabled = true;
                stopBtn.disabled = false;
            };
            
            // 映像再生開始
            remoteVideo.play().catch(e => {
                console.error('リモートビデオの再生開始に失敗しました:', e);
                this.updateCameraStatus('リモートビデオの再生開始に失敗しました');
            });
        });
        
        // 通話終了時の処理
        call.on('close', () => {
            console.log('通話が終了しました');
            this.updateCameraStatus('配信が終了しました');
            this.stopReceiving();
        });
        
        // エラー時の処理
        call.on('error', (err) => {
            console.error('通話中にエラーが発生しました:', err);
            this.updateCameraStatus('通話中にエラーが発生しました: ' + err.message);
        });
        
        // 現在の通話を保存
        this.cameraState.currentCall = call;
    }

    // カメラシステム全体の停止
    stopCameraSystem() {
        // 現在のモードに応じて適切な停止処理を実行
        if (this.cameraState.mode === 'broadcast' && this.cameraState.isBroadcasting) {
            this.stopBroadcasting();
        } else if (this.cameraState.mode === 'receive' && this.cameraState.isReceiving) {
            this.stopReceiving();
        }
        
        // PeerJS接続を閉じる
        if (this.cameraState.peer) {
            this.cameraState.peer.destroy();
            this.cameraState.peer = null;
        }
        
        // 全ての要素をリセット
        const cameraContainer = document.querySelector('.camera-container');
        cameraContainer.classList.remove('broadcast-mode', 'receive-mode');
        
        // 状態をリセット
        this.cameraState.mode = null;
        this.cameraState.isBroadcasting = false;
        this.cameraState.isReceiving = false;
        this.cameraState.currentCall = null;
        
        this.updateCameraStatus('カメラモードを選択してください');
    }

    // 遅延描画ループ開始（受信側用）
    startDelayedDrawing() {
        console.log('遅延描画ループを開始します');
        this.updateCameraStatus(`${this.cameraState.delaySeconds.toFixed(1)}秒の遅延で映像を表示しています。`);
        this.cameraState.lastDrawTime = performance.now();
        this.cameraState.animationId = requestAnimationFrame((timestamp) => this.drawDelayedFrame(timestamp));
    }

    // 遅延フレームの描画（受信側用）
    drawDelayedFrame(timestamp) {
        // 次のフレームを要求
        this.cameraState.animationId = requestAnimationFrame((timestamp) => this.drawDelayedFrame(timestamp));
        
        // 前回の描画から16ms（約60FPS）以上経過していることを確認
        if (timestamp - this.cameraState.lastDrawTime < 16) return;
        
        this.cameraState.lastDrawTime = timestamp;
        
        const remoteVideo = document.getElementById('remote-camera');
        const canvas = document.getElementById('camera-canvas');
        const ctx = canvas.getContext('2d');
        
        // ビデオが再生可能な状態か確認
        if (remoteVideo.readyState >= 2) {
            try {
                // 現在のフレームをキャプチャ
                ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // フレームをタイムスタンプと共にバッファに保存
                this.cameraState.frameBuffer.push({
                    imageData: imageData,
                    timestamp: timestamp
                });
                
                // バッファが大きくなりすぎないようにする（メモリ節約）
                while (this.cameraState.frameBuffer.length > 300) {
                    this.cameraState.frameBuffer.shift();
                }
                
                // 遅延時間（ミリ秒）
                const delayMs = this.cameraState.delaySeconds * 1000;
                
                // 表示すべきフレームを探す
                const targetTimestamp = timestamp - delayMs;
                let frameToShow = null;
                
                // 適切なフレームを探す
                for (let i = 0; i < this.cameraState.frameBuffer.length; i++) {
                    if (this.cameraState.frameBuffer[i].timestamp >= targetTimestamp) {
                        frameToShow = this.cameraState.frameBuffer[i];
                        break;
                    }
                    
                    if (i === this.cameraState.frameBuffer.length - 1) {
                        frameToShow = this.cameraState.frameBuffer[i];
                    }
                }
                
                // 適切なフレームがあれば表示
                if (frameToShow) {
                    ctx.putImageData(frameToShow.imageData, 0, 0);
                    
                    // キャンバスからビデオストリームに変換
                    const delayedVideo = document.getElementById('delayed-camera');
                    if (!delayedVideo.srcObject) {
                        delayedVideo.srcObject = canvas.captureStream();
                    }
                }
            } catch (error) {
                console.error('フレーム描画中にエラーが発生しました:', error);
                this.updateCameraStatus('映像の描画中にエラーが発生しました。再読み込みして再試行してください。');
            }
        }
    }

    // カメラ全画面表示
    enterFullscreenCamera() {
        const cameraContainer = document.querySelector('.camera-container');
        
        if (cameraContainer.requestFullscreen) {
            cameraContainer.requestFullscreen();
        } else if (cameraContainer.webkitRequestFullscreen) {
            cameraContainer.webkitRequestFullscreen();
        } else if (cameraContainer.mozRequestFullScreen) {
            cameraContainer.mozRequestFullScreen();
        } else if (cameraContainer.msRequestFullscreen) {
            cameraContainer.msRequestFullscreen();
        }
        
        // 全画面モードクラス追加
        cameraContainer.classList.add('fullscreen-camera');
    }

    // カメラステータス更新
    updateCameraStatus(message) {
        const statusElement = document.getElementById('camera-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        if (this.cameraState && this.cameraState.isStreamStarted) {
            // 遅延時間も表示
            const delayInfo = ` (遅延: ${this.cameraState.delaySeconds.toFixed(1)}秒)`;
            statusElement.textContent = message + delayInfo;
        }
    }

    // カメラ切り替え（既存のメソッドを更新）
    toggleCamera() {
        if (!this.cameraState || !this.cameraState.mode) {
            console.log('カメラモードが選択されていません');
            return;
        }
        
        if (this.cameraState.mode === 'broadcast') {
            if (this.cameraState.isBroadcasting) {
                this.stopBroadcasting();
            } else {
                this.startBroadcasting();
            }
        } else if (this.cameraState.mode === 'receive') {
            if (this.cameraState.isReceiving) {
                this.stopReceiving();
            } else {
                this.startReceiving();
            }
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
        
        // 接続管理システムにデバイスタイプを設定
        if (window.connectionManager) {
            window.connectionManager.setDeviceType(this.deviceType);
        }
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
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });

        // 新しい通知を作成
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 5秒後にフェードアウト
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
            }
        }, 5000);
    }

    // 接続状態確認
    checkConnectionStatus() {
        const connectionStatus = {
            firebase: {
                connected: false,
                error: null
            },
            simpleCommunication: {
                connected: false,
                deviceId: null,
                error: null
            },
            connectionManager: {
                connected: false,
                deviceId: null,
                error: null
            }
        };

        try {
            // Firebase接続確認
            if (typeof database !== 'undefined' && database) {
                connectionStatus.firebase.connected = true;
            } else {
                connectionStatus.firebase.error = 'Firebase未初期化';
            }

            // シンプル通信確認
            if (window.simpleCommunication) {
                connectionStatus.simpleCommunication.connected = window.simpleCommunication.isConnected;
                connectionStatus.simpleCommunication.deviceId = window.simpleCommunication.deviceId;
            } else {
                connectionStatus.simpleCommunication.error = 'シンプル通信未初期化';
            }

            // 接続管理システム確認
            if (window.connectionManager) {
                connectionStatus.connectionManager.connected = window.connectionManager.isFirebaseConnected;
                connectionStatus.connectionManager.deviceId = window.connectionManager.deviceId;
            } else {
                connectionStatus.connectionManager.error = '接続管理システム未初期化';
            }

        } catch (error) {
            console.error('接続状態確認エラー:', error);
        }

        return connectionStatus;
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TabletApp();

    // グローバルデバッグ関数
    window.debugApp = {
        // 接続状態確認
        status: () => {
            if (app) {
                return app.checkConnectionStatus();
            } else {
                console.log('アプリケーションが初期化されていません');
                return null;
            }
        },
        
        // 通信テスト
        testCommunication: () => {
            if (app && window.simpleCommunication) {
                return window.simpleCommunication.testCommunication();
            } else {
                console.log('通信システムが初期化されていません');
                return null;
            }
        },
        
        // デバイス一覧
        devices: () => {
            if (window.simpleCommunication) {
                return window.simpleCommunication.getConnectedDevices();
            } else {
                console.log('通信システムが初期化されていません');
                return [];
            }
        },
        
        // 車両番号送信テスト
        sendVehicleNumber: (number) => {
            if (app) {
                app.sendVehicleNumberNotification(number);
                console.log(`車両番号${number}を送信しました`);
            } else {
                console.log('アプリケーションが初期化されていません');
            }
        },
        
        // チーム進行通知テスト
        sendTeamProgress: (teamId, step) => {
            if (app) {
                app.sendTeamProgressNotification(teamId, step);
                console.log(`チーム${teamId}のステップ${step}を送信しました`);
            } else {
                console.log('アプリケーションが初期化されていません');
            }
        },
        
        // 全システム状態確認
        checkAll: () => {
            console.log('=== 全システム状態確認 ===');
            
            // Firebase状態
            console.log('Firebase:', typeof database !== 'undefined' && database ? '✓ 接続済み' : '✗ 未接続');
            
            // シンプル通信
            if (window.simpleCommunication) {
                console.log('シンプル通信:', window.simpleCommunication.isConnected ? '✓ 接続済み' : '✗ 未接続');
                console.log('  デバイスID:', window.simpleCommunication.deviceId);
            } else {
                console.log('シンプル通信: ✗ 未初期化');
            }
            
            // 接続管理システム
            if (window.connectionManager) {
                console.log('接続管理システム:', window.connectionManager.isFirebaseConnected ? '✓ 接続済み' : '✗ 未接続');
                console.log('  デバイスID:', window.connectionManager.deviceId);
            } else {
                console.log('接続管理システム: ✗ 未初期化');
            }
            
            // アプリケーション
            console.log('アプリケーション:', app ? '✓ 初期化済み' : '✗ 未初期化');
            
            return {
                firebase: typeof database !== 'undefined' && database,
                simpleCommunication: window.simpleCommunication?.isConnected || false,
                connectionManager: window.connectionManager?.isFirebaseConnected || false,
                app: !!app
            };
        },
        
        // ヘルプ表示
        help: () => {
            console.log('=== デバッグコマンド ===');
            console.log('debugApp.status()              - 接続状態確認');
            console.log('debugApp.testCommunication()   - 通信テスト');
            console.log('debugApp.devices()             - 接続デバイス一覧');
            console.log('debugApp.sendVehicleNumber(n)  - 車両番号送信');
            console.log('debugApp.sendTeamProgress(t,s) - チーム進行送信');
            console.log('debugApp.checkAll()            - 全システム状態確認');
            console.log('debugApp.help()                - このヘルプ');
        }
    };
    
    // 初期化完了通知
    setTimeout(() => {
        console.log('🚀 システム初期化完了');
        console.log('デバッグコマンド: debugApp.help()');
        console.log('シンプル通信: testComm.test()');
    }, 3000);
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