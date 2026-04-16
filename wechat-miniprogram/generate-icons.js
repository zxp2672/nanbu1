/**
 * TabBar 图标生成脚本
 * 使用纯 Node.js 生成 81x81 像素的 PNG 图标文件
 * 
 * 生成 10 个图标：
 * - 普通态（灰色 #7b8ca8）：home.png, alumni.png, resource.png, activity.png, me.png
 * - 选中态（青蓝色 #00d4ff）：home-active.png, alumni-active.png, resource-active.png, activity-active.png, me-active.png
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 图标尺寸
const SIZE = 81;

// 颜色定义
const COLORS = {
    normal: { r: 0x7b, g: 0x8c, b: 0xa8, a: 255 },      // 灰色 #7b8ca8
    active: { r: 0x00, g: 0xd4, b: 0xff, a: 255 }       // 青蓝色 #00d4ff
};

/**
 * 计算 CRC32 校验值
 */
function crc32(data) {
    const table = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c;
    }
    
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

/**
 * 创建 PNG chunk
 */
function createChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);
    
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    
    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

/**
 * 创建 IHDR chunk
 */
function createIHDR(width, height) {
    const data = Buffer.alloc(13);
    data.writeUInt32BE(width, 0);   // 宽度
    data.writeUInt32BE(height, 4);  // 高度
    data.writeUInt8(8, 8);          // 位深度 (8 bits per channel)
    data.writeUInt8(6, 9);          // 颜色类型 (6 = RGBA)
    data.writeUInt8(0, 10);         // 压缩方法 (0 = deflate)
    data.writeUInt8(0, 11);         // 滤波方法 (0 = standard)
    data.writeUInt8(0, 12);         // 隔行扫描 (0 = none)
    return createChunk('IHDR', data);
}

/**
 * 创建 IEND chunk
 */
function createIEND() {
    return createChunk('IEND', Buffer.alloc(0));
}

/**
 * 创建图像数据（未压缩的原始像素数据）
 */
function createRawImageData(drawFunc, color) {
    const rawData = [];
    
    for (let y = 0; y < SIZE; y++) {
        // 每行开头添加滤波类型字节 (0 = None)
        rawData.push(0);
        for (let x = 0; x < SIZE; x++) {
            const pixel = drawFunc(x, y, color);
            rawData.push(pixel.r, pixel.g, pixel.b, pixel.a);
        }
    }
    
    return Buffer.from(rawData);
}

/**
 * 创建 IDAT chunk
 */
function createIDAT(rawData) {
    const compressed = zlib.deflateSync(rawData);
    return createChunk('IDAT', compressed);
}

/**
 * 生成完整的 PNG 文件
 */
function generatePNG(drawFunc, color) {
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const ihdr = createIHDR(SIZE, SIZE);
    const rawData = createRawImageData(drawFunc, color);
    const idat = createIDAT(rawData);
    const iend = createIEND();
    
    return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * 绘制圆形
 */
function drawCircle(cx, cy, radius, x, y, color, filled = true) {
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (filled) {
        return dist <= radius;
    } else {
        return dist <= radius && dist >= radius - 3;
    }
}

/**
 * 绘制矩形
 */
function drawRect(x1, y1, x2, y2, x, y) {
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}

/**
 * 绘制三角形
 */
function drawTriangle(x1, y1, x2, y2, x3, y3, px, py) {
    const area = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
    const area1 = Math.abs((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py));
    const area2 = Math.abs((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py));
    const area3 = Math.abs((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py));
    return Math.abs(area - (area1 + area2 + area3)) < 100;
}

// ============= 图标绘制函数 =============

/**
 * Home 图标 - 房子形状（三角形屋顶 + 方形底部）
 */
function drawHome(x, y, color) {
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    
    // 透明背景
    let pixel = { r: 0, g: 0, b: 0, a: 0 };
    
    // 房屋主体（方形）
    if (drawRect(23, 38, 57, 62, x, y)) {
        pixel = { ...color };
    }
    
    // 屋顶（三角形）
    if (y >= 18 && y <= 40) {
        const roofWidth = (y - 18) * 1.7;
        if (x >= cx - roofWidth && x <= cx + roofWidth) {
            pixel = { ...color };
        }
    }
    
    // 门（镂空）
    if (drawRect(35, 48, 45, 62, x, y)) {
        pixel = { r: 0, g: 0, b: 0, a: 0 };
    }
    
    return pixel;
}

/**
 * Alumni 图标 - 人形图案（圆形头部 + 梯形身体）
 */
function drawAlumni(x, y, color) {
    const cx = SIZE / 2;
    
    let pixel = { r: 0, g: 0, b: 0, a: 0 };
    
    // 头部（圆形）
    if (drawCircle(cx, 24, 10, x, y, color)) {
        pixel = { ...color };
    }
    
    // 身体（梯形/圆角矩形）
    if (y >= 36 && y <= 62) {
        const bodyWidth = 12 + (y - 36) * 0.3;
        if (x >= cx - bodyWidth && x <= cx + bodyWidth) {
            pixel = { ...color };
        }
    }
    
    // 左臂
    if (y >= 38 && y <= 52) {
        if ((x >= 15 && x <= 22) || (x >= 59 && x <= 66)) {
            pixel = { ...color };
        }
    }
    
    return pixel;
}

/**
 * Resource 图标 - 方形文件图案
 */
function drawResource(x, y, color) {
    const cx = SIZE / 2;
    
    let pixel = { r: 0, g: 0, b: 0, a: 0 };
    
    // 文件主体（圆角方形）
    if (x >= 20 && x <= 60 && y >= 15 && y <= 65) {
        // 圆角处理
        const corners = [
            { x: 25, y: 20 },
            { x: 55, y: 20 },
            { x: 25, y: 60 },
            { x: 55, y: 60 }
        ];
        
        let isCorner = false;
        for (const corner of corners) {
            const dist = Math.sqrt((x - corner.x) ** 2 + (y - corner.y) ** 2);
            if (dist > 5 && dist <= 8) {
                if ((x === corner.x && y === corner.y)) continue;
            }
        }
        
        pixel = { ...color };
    }
    
    // 文件折角效果（右上角三角形镂空）
    if (x >= 45 && x <= 60 && y >= 15 && y <= 30) {
        if (x + y >= 75) {
            pixel = { r: 0, g: 0, b: 0, a: 0 };
        }
    }
    
    // 文件内容线条（镂空）
    if (y >= 35 && y <= 37 && x >= 28 && x <= 52) {
        pixel = { r: 0, g: 0, b: 0, a: 0 };
    }
    if (y >= 42 && y <= 44 && x >= 28 && x <= 48) {
        pixel = { r: 0, g: 0, b: 0, a: 0 };
    }
    if (y >= 49 && y <= 51 && x >= 28 && x <= 52) {
        pixel = { r: 0, g: 0, b: 0, a: 0 };
    }
    
    return pixel;
}

/**
 * Activity 图标 - 日历图案
 */
function drawActivity(x, y, color) {
    const cx = SIZE / 2;
    
    let pixel = { r: 0, g: 0, b: 0, a: 0 };
    
    // 日历主体（方形）
    if (x >= 18 && x <= 62 && y >= 25 && y <= 62) {
        pixel = { ...color };
    }
    
    // 日历顶部条
    if (x >= 18 && x <= 62 && y >= 25 && y <= 32) {
        pixel = { ...color };
    }
    
    // 挂钩
    if ((x >= 25 && x <= 30 && y >= 18 && y <= 28) ||
        (x >= 50 && x <= 55 && y >= 18 && y <= 28)) {
        pixel = { ...color };
    }
    
    // 日历格子（镂空）
    const gridX = [26, 36, 46];
    const gridY = [38, 47, 56];
    
    for (const gx of gridX) {
        for (const gy of gridY) {
            if (x >= gx && x <= gx + 6 && y >= gy && y <= gy + 5) {
                pixel = { r: 0, g: 0, b: 0, a: 0 };
            }
        }
    }
    
    return pixel;
}

/**
 * Me 图标 - 圆形人头图案
 */
function drawMe(x, y, color) {
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    
    let pixel = { r: 0, g: 0, b: 0, a: 0 };
    
    // 头部（大圆形）
    if (drawCircle(cx, 32, 18, x, y, color)) {
        pixel = { ...color };
    }
    
    // 肩膀（半圆/弧形）
    if (y >= 48 && y <= 65) {
        const shoulderY = y - 48;
        const shoulderWidth = 22 + shoulderY * 0.3;
        if (x >= cx - shoulderWidth && x <= cx + shoulderWidth) {
            // 顶部弧形过渡
            const dist = Math.sqrt((x - cx) ** 2 + (y - 48) ** 2);
            if (dist <= 26) {
                pixel = { ...color };
            }
        }
    }
    
    return pixel;
}

// ============= 主程序 =============

function main() {
    const iconsDir = path.join(__dirname, 'assets', 'icons');
    
    // 创建目录
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
        console.log(`✓ 创建目录: ${iconsDir}`);
    }
    
    // 定义图标
    const icons = [
        { name: 'home', draw: drawHome },
        { name: 'alumni', draw: drawAlumni },
        { name: 'resource', draw: drawResource },
        { name: 'activity', draw: drawActivity },
        { name: 'me', draw: drawMe }
    ];
    
    console.log('\n开始生成 TabBar 图标...\n');
    
    // 生成普通态图标
    for (const icon of icons) {
        const png = generatePNG(icon.draw, COLORS.normal);
        const filePath = path.join(iconsDir, `${icon.name}.png`);
        fs.writeFileSync(filePath, png);
        console.log(`✓ 生成: ${icon.name}.png (普通态, 灰色)`);
    }
    
    console.log('');
    
    // 生成选中态图标
    for (const icon of icons) {
        const png = generatePNG(icon.draw, COLORS.active);
        const filePath = path.join(iconsDir, `${icon.name}-active.png`);
        fs.writeFileSync(filePath, png);
        console.log(`✓ 生成: ${icon.name}-active.png (选中态, 青蓝色)`);
    }
    
    console.log('\n========================================');
    console.log('图标生成完成！');
    console.log(`共生成 ${icons.length * 2} 个图标文件`);
    console.log(`保存路径: ${iconsDir}`);
    console.log('========================================\n');
    
    // 列出生成的文件
    console.log('生成的文件列表:');
    const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png')).sort();
    for (const file of files) {
        const stat = fs.statSync(path.join(iconsDir, file));
        console.log(`  - ${file} (${stat.size} bytes)`);
    }
}

main();
