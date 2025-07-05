// Firebase設定
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

// Firebase初期化
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase初期化完了");
} catch (error) {
    console.error("Firebase初期化エラー:", error);
}

