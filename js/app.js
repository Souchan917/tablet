// Firebase初期化（CDN版）
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

// Firebase初期化（CDN版）
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 共通変数
let teams = [];
let currentCarNumber = 3600;

// チーム初期化
function initializeTeams() {
    teams = [];
    for (let i = 1; i <= 11; i++) {
        teams.push({
            id: i,
            name: `チーム${i}`,
            progress: 0,
            maxProgress: 10 // 仮の最大進捗値
        });
    }
}

// Firestoreからチーム進捗を取得
async function loadTeamProgress() {
    try {
        for (let i = 1; i <= 11; i++) {
            const teamDoc = await db.collection('teams').doc(i.toString()).get();
            if (teamDoc.exists) {
                const data = teamDoc.data();
                const teamIndex = teams.findIndex(t => t.id === i);
                if (teamIndex !== -1) {
                    teams[teamIndex].progress = data.progress || 0;
                }
            }
        }
    } catch (error) {
        console.error('チーム進捗の取得に失敗:', error);
    }
}

// チーム進捗を保存
async function saveTeamProgress(teamId, progress) {
    try {
        await db.collection('teams').doc(teamId.toString()).set({
            progress: progress,
            lastUpdated: new Date()
        }, { merge: true });
    } catch (error) {
        console.error('チーム進捗の保存に失敗:', error);
    }
}

// 車両番号を取得
async function loadCarNumber() {
    try {
        const carDoc = await db.collection('global').doc('carNumber').get();
        if (carDoc.exists) {
            currentCarNumber = carDoc.data().value || 3600;
        }
    } catch (error) {
        console.error('車両番号の取得に失敗:', error);
    }
}

// 車両番号を保存
async function saveCarNumber(number) {
    try {
        await db.collection('global').doc('carNumber').set({
            value: number,
            lastUpdated: new Date()
        });
        currentCarNumber = number;
    } catch (error) {
        console.error('車両番号の保存に失敗:', error);
    }
}

// 車両番号のリアルタイム監視
function watchCarNumber(callback) {
    const unsubscribe = db.collection('global').doc('carNumber').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            currentCarNumber = data.value || 3600;
            callback(currentCarNumber);
        }
    });
    return unsubscribe;
}

// チーム進捗のリアルタイム監視
function watchTeamProgress(callback) {
    const unsubscribeFunctions = [];
    
    for (let i = 1; i <= 11; i++) {
        const unsubscribe = db.collection('teams').doc(i.toString()).onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const teamIndex = teams.findIndex(t => t.id === i);
                if (teamIndex !== -1) {
                    teams[teamIndex].progress = data.progress || 0;
                    callback(teams);
                }
            }
        });
        unsubscribeFunctions.push(unsubscribe);
    }
    
    return () => {
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
}

// 進捗に応じた画像パスを取得
function getProgressImage(progress, isBack = false) {
    const imageFolder = isBack ? 'images/back' : 'images/front';
    return `${imageFolder}/progress_${progress}.jpg`;
}

// 全画面表示機能
function toggleFullscreen(element) {
    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
            console.error('フルスクリーンモードに失敗:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// 戻るボタン機能
function goBack() {
    window.location.href = 'index.html';
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeTeams();
    loadTeamProgress();
    loadCarNumber();
    
    // 戻るボタンの設定
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', goBack);
    }
});

// エクスポート（モジュール形式でない場合はwindowオブジェクトに追加）
window.PuzzleSystem = {
    teams,
    currentCarNumber,
    loadTeamProgress,
    saveTeamProgress,
    loadCarNumber,
    saveCarNumber,
    watchCarNumber,
    watchTeamProgress,
    getProgressImage,
    toggleFullscreen,
    goBack
}; 