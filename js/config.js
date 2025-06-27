// アプリケーション設定
const AppConfig = {
    // アプリケーション情報
    name: '謎解き公演制御システム',
    version: '1.0.0',
    
    // デフォルト設定
    defaults: {
        deviceName: 'タブレット',
        deviceType: 'tablet',
        autoConnect: false,
        showAnimations: true,
        soundEnabled: true
    },
    
    // シーンの自動切り替え設定
    sceneSettings: {
        autoAdvance: false,
        sceneDuration: 60000, // 60秒
        transitionDuration: 1000 // 1秒
    },
    
    // UI設定
    ui: {
        showDebugInfo: false,
        compactMode: false,
        theme: 'default'
    },
    
    // 接続設定
    connection: {
        heartbeatInterval: 30000, // 30秒
        reconnectAttempts: 5,
        reconnectDelay: 3000 // 3秒
    },
    
    // ログ設定
    logging: {
        level: 'info', // debug, info, warn, error
        enableConsole: true,
        enableRemote: false
    }
};

// 設定の読み込みと保存
class ConfigManager {
    constructor() {
        this.config = { ...AppConfig };
        this.loadSettings();
    }
    
    // 設定読み込み
    loadSettings() {
        try {
            const savedConfig = localStorage.getItem('mystery-show-config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
            }
        } catch (error) {
            console.warn('設定の読み込みに失敗しました:', error);
        }
    }
    
    // 設定保存
    saveSettings() {
        try {
            localStorage.setItem('mystery-show-config', JSON.stringify(this.config));
        } catch (error) {
            console.error('設定の保存に失敗しました:', error);
        }
    }
    
    // 設定取得
    get(key) {
        return this.getNestedValue(this.config, key);
    }
    
    // 設定更新
    set(key, value) {
        this.setNestedValue(this.config, key, value);
        this.saveSettings();
    }
    
    // ネストした値の取得
    getNestedValue(obj, key) {
        return key.split('.').reduce((current, prop) => {
            return current && current[prop] !== undefined ? current[prop] : undefined;
        }, obj);
    }
    
    // ネストした値の設定
    setNestedValue(obj, key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, prop) => {
            if (!current[prop]) current[prop] = {};
            return current[prop];
        }, obj);
        target[lastKey] = value;
    }
    
    // 設定リセット
    reset() {
        this.config = { ...AppConfig };
        localStorage.removeItem('mystery-show-config');
    }
    
    // 全設定取得
    getAll() {
        return { ...this.config };
    }
}

// ログ管理
class Logger {
    constructor(config) {
        this.config = config;
        this.levels = ['debug', 'info', 'warn', 'error'];
    }
    
    log(level, message, data = null) {
        const levelIndex = this.levels.indexOf(level);
        const configLevelIndex = this.levels.indexOf(this.config.get('logging.level'));
        
        if (levelIndex >= configLevelIndex) {
            if (this.config.get('logging.enableConsole')) {
                const timestamp = new Date().toISOString();
                const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
                
                console[level === 'debug' ? 'log' : level](logMessage, data || '');
            }
            
            if (this.config.get('logging.enableRemote')) {
                this.sendRemoteLog(level, message, data);
            }
        }
    }
    
    debug(message, data) {
        this.log('debug', message, data);
    }
    
    info(message, data) {
        this.log('info', message, data);
    }
    
    warn(message, data) {
        this.log('warn', message, data);
    }
    
    error(message, data) {
        this.log('error', message, data);
    }
    
    sendRemoteLog(level, message, data) {
        // リモートログ送信機能（必要に応じて実装）
        // Firebase Functionsやサーバーエンドポイントに送信
    }
}

// ユーティリティ関数
const Utils = {
    // UUIDv4生成
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    // 日付フォーマット
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },
    
    // 待機関数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // デバウンス関数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // スロットル関数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 深いコピー
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        return obj;
    },
    
    // ランダム文字列生成
    randomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};

// エラーハンドリング
class ErrorHandler {
    constructor(logger) {
        this.logger = logger;
        this.setupGlobalHandlers();
    }
    
    setupGlobalHandlers() {
        // 未処理のエラー
        window.addEventListener('error', (event) => {
            this.logger.error('グローバルエラー', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
        
        // 未処理のPromise拒否
        window.addEventListener('unhandledrejection', (event) => {
            this.logger.error('未処理のPromise拒否', {
                reason: event.reason
            });
        });
    }
    
    handleError(error, context = '') {
        this.logger.error(`エラー発生 ${context}`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// グローバル変数として設定オブジェクトを作成
window.config = new ConfigManager();
window.logger = new Logger(window.config);
window.errorHandler = new ErrorHandler(window.logger);
window.utils = Utils; 