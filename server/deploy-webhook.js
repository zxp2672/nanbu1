/**
 * GitHub Webhook 自动部署服务
 * 监听 GitHub push 事件，自动拉取代码并重启应用
 * 端口: 9000
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

// Webhook 密钥（在 GitHub 仓库设置中配置相同的值）
const WEBHOOK_SECRET = 'nanbu-deploy-secret-2024';
const DEPLOY_SCRIPT = path.join(__dirname, 'auto-deploy.sh');
const PORT = 9000;

function verifySignature(payload, signature) {
    if (!signature) return false;
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook') {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        const signature = req.headers['x-hub-signature-256'];

        if (!verifySignature(body, signature)) {
            console.log('[Webhook] 签名验证失败');
            res.writeHead(401);
            res.end('Unauthorized');
            return;
        }

        let payload;
        try {
            payload = JSON.parse(body);
        } catch (e) {
            res.writeHead(400);
            res.end('Bad Request');
            return;
        }

        // 只处理 main 分支的 push
        if (payload.ref !== 'refs/heads/main') {
            res.writeHead(200);
            res.end('Ignored');
            return;
        }

        console.log(`[Webhook] 收到推送: ${payload.head_commit?.message || '无提交信息'}`);
        res.writeHead(200);
        res.end('Deploying...');

        // 执行部署脚本
        exec(`bash ${DEPLOY_SCRIPT}`, (err, stdout, stderr) => {
            if (err) {
                console.error('[Deploy] 部署失败:', err.message);
                console.error(stderr);
            } else {
                console.log('[Deploy] 部署成功');
                console.log(stdout);
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`Webhook 服务运行在端口 ${PORT}`);
    console.log(`接收地址: http://47.109.159.143:${PORT}/webhook`);
});
