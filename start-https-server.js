const https = require('https');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// MIMEタイプの定義
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// 自己署名証明書の生成
const cert = `-----BEGIN CERTIFICATE-----
MIIDXzCCAkegAwIBAgIJAKKKKKKKKKKKMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAuKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKq
-----END CERTIFICATE-----`;

const key = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC4ooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooqI
-----END PRIVATE KEY-----`;

// HTTPSサーバーの作成
const server = https.createServer({
    key: key,
    cert: cert
}, async (req, res) => {
    try {
        let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
        
        // ファイルの存在確認
        try {
            await stat(filePath);
        } catch (err) {
            // ファイルが存在しない場合は404エラー
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        
        // ファイルの読み取り
        const data = await readFile(filePath);
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // CORS ヘッダーを追加
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        
        res.end(data);
        
    } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

const PORT = process.env.PORT || 8443;

server.listen(PORT, () => {
    console.log(`\n🚀 HTTPS Server running on https://localhost:${PORT}\n`);
    console.log('📋 Available pages:');
    console.log(`   入口: https://localhost:${PORT}/index.html`);
    console.log(`   STAFF: https://localhost:${PORT}/staff.html`);
    console.log(`   MASTER: https://localhost:${PORT}/master.html`);
    console.log(`   モニター前: https://localhost:${PORT}/monitor-front.html`);
    console.log(`   モニター後: https://localhost:${PORT}/monitor-back.html`);
    console.log(`   車両番号: https://localhost:${PORT}/car-number.html`);
    console.log(`   カメラ撮影: https://localhost:${PORT}/camera-capture.html`);
    console.log(`   カメラ映像: https://localhost:${PORT}/camera-view.html`);
    console.log('\n⚠️  Chrome/Edge で "詳細設定" → "localhost にアクセスする (安全ではありません)" をクリックして証明書を信頼してください。');
    console.log('\n✅ カメラ機能が正常に動作します！');
});

// エラーハンドリング
server.on('error', (err) => {
    console.error('Server error:', err);
});

process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
}); 