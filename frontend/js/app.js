// 过滤浏览器扩展引起的错误
window.addEventListener('error', function(event) {
  if (event.message && event.message.includes('listener indicated an asynchronous response')) {
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message && 
      event.reason.message.includes('listener indicated an asynchronous response')) {
    event.preventDefault();
    return false;
  }
});

// ===== 全局状态 =====
let currentUser = null;
let filterState = { school: '', level: '', year: '', classname: '' };

// 图片预览功能
function openImagePreview(imageUrl) {
  if (!imageUrl) return;
  const modal = $('imagePreviewModal');
  const img = $('previewImage');
  img.src = imageUrl;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeImagePreview() {
  const modal = $('imagePreviewModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// 导出校友资料为Excel
async function exportAlumniExcel() {
  console.log('=== 开始导出校友资料 ===');
  console.log('currentUser:', currentUser);
  
  if (!currentUser) {
    console.error('未登录');
    showToast('请先登录', 'error');
    return;
  }
  
  if (currentUser.role !== 'superadmin') {
    console.error('不是超级管理员，当前角色:', currentUser.role);
    showToast('仅超级管理员可导出', 'error');
    return;
  }
  
  try {
    console.log('权限验证通过，开始调用API...');
    showToast('正在导出...', 'info');
    
    const token = localStorage.getItem('nb_token');  // 修改为正确的key
    console.log('Token:', token ? '存在 (长度:' + token.length + ')' : '不存在');
    
    if (!token) {
      showToast('请先登录', 'error');
      return;
    }
    
    const apiUrl = '/api/admin/export-alumni';
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      let errorMessage = '导出失败';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    console.log('API调用成功，开始下载...');
    
    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = '校友资料.xlsx';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?="?([^";]+)"?/);
      if (match) {
        fileName = decodeURIComponent(match[1]);
      }
    }
    console.log('文件名:', fileName);
    
    // 下载文件
    const blob = await response.blob();
    console.log('Blob size:', blob.size);
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('导出完成');
    showToast('导出成功', 'success');
  } catch (e) {
    console.error('导出失败:', e);
    console.error('错误堆栈:', e.stack);
    showToast('导出失败: ' + (e.message || '请检查网络'), 'error');
  }
}
let resTab = 'all', actTab = 'all';
let postImageData = '';
let alumniAvatarData = '';
let profileAvatarData = '';
let isNavigating = false; // 防抖锁

// 分页状态
const pagination = {
  alumni: { page: 1, pageSize: 10, hasMore: true, loading: false, allData: [] },
  resource: { page: 1, pageSize: 10, hasMore: true, loading: false, allData: [] },
  activity: { page: 1, pageSize: 10, hasMore: true, loading: false, allData: [] }
};

// ===== 骨架屏控制函数 =====
function showPageLoading(pageId) {
  const skeleton = document.getElementById('skeleton' + pageId.charAt(0).toUpperCase() + pageId.slice(1));
  if (skeleton) skeleton.style.display = '';
}

function hidePageLoading(pageId) {
  const skeleton = document.getElementById('skeleton' + pageId.charAt(0).toUpperCase() + pageId.slice(1));
  if (skeleton) skeleton.style.display = 'none';
}

function showRetry(container, retryFn) {
  if (typeof container === 'string') container = document.getElementById(container);
  if (!container) return;
  container.innerHTML = `
    <div class="retry-wrap">
      <div>加载失败</div>
      <button class="retry-btn" onclick="(${retryFn.toString()})()">点击重试</button>
    </div>
  `;
}

// ===== 认证模块 =====
const Auth = {
  isLoggedIn() {
    return !!currentUser;
  },
  requireAuth() {
    if (!currentUser) {
      showLoginPrompt();
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!currentUser) {
      showLoginPrompt();
      return false;
    }
    if (!Perm.isAnyAdmin(currentUser)) {
      showToast('需要管理员权限');
      return false;
    }
    return true;
  }
};

// 登录提示弹窗
function showLoginPrompt() {
  openModal('loginPromptModal');
}

function closeLoginPrompt() {
  closeModal('loginPromptModal');
}

function goLogin() {
  closeLoginPrompt();
  $('mainApp').style.display = 'none';
  $('loginPage').style.display = 'flex';
}

// ===== 工具函数 =====
function $(id) { return document.getElementById(id); }

// 去除HTML标签
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// 从富文本中提取第一张图片
function extractFirstImage(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

// 从富文本中提取第一个视频
function extractFirstVideo(html) {
  if (!html) return null;
  const match = html.match(/<video[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}
function showToast(msg, duration = 2000) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
function openModal(id) { 
  $(id).classList.add('open'); 
  
  // 初始化富文本编辑器
  if (id === 'addResourceModal' && !window.resQuill) {
    initResourceEditor();
  }
  if (id === 'addActivityModal' && !window.actQuill) {
    initActivityEditor();
  }
}

// 初始化资源编辑器
function initResourceEditor() {
  window.resQuill = new Quill('#resEditor', {
    theme: 'snow',
    placeholder: '详细描述资源内容，支持图文视頻混排...',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image', 'video'],
        ['clean']
      ]
    }
  });
  
  // 自定义图片上传
  window.resQuill.getModule('toolbar').addHandler('image', () => {
    $('resImageUpload').click();
  });
  
  // 自定义视频上传
  window.resQuill.getModule('toolbar').addHandler('video', () => {
    $('resVideoUpload').click();
  });
  
  // 监听内容变化，调试用
  window.resQuill.on('text-change', function() {
    console.log('[Resource Editor] Content changed');
  });
}

// 初始化活动编辑器
function initActivityEditor() {
  window.actQuill = new Quill('#actEditor', {
    theme: 'snow',
    placeholder: '活动详情，支持图文视頻混排...',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image', 'video'],
        ['clean']
      ]
    }
  });
  
  // 自定义图片上传
  window.actQuill.getModule('toolbar').addHandler('image', () => {
    $('actImageUpload').click();
  });
  
  // 自定义视频上传
  window.actQuill.getModule('toolbar').addHandler('video', () => {
    $('actVideoUpload').click();
  });
  
  // 监听内容变化，调试用
  window.actQuill.on('text-change', function() {
    console.log('[Activity Editor] Content changed');
  });
}

// 处理资源图片上传
async function handleResourceImageUpload(input) {
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过5MB');
    return;
  }
  
  try {
    showToast('正在上传图片...');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/media', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('nb_token')
      },
      body: formData
    });
    
    const result = await response.json();
    if (result.code === 200) {
      // 插入图片到编辑器
      const range = window.resQuill.getSelection(true);
      window.resQuill.insertEmbed(range.index, 'image', result.data.url);
      window.resQuill.setSelection(range.index + 1);
      showToast('图片上传成功');
    } else {
      showToast(result.message || '图片上传失败');
    }
  } catch (err) {
    console.error('图片上传失败:', err);
    showToast('图片上传失败，请检查网络');
  }
  
  input.value = '';
}

// 处理活动图片上传
async function handleActivityImageUpload(input) {
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过5MB');
    return;
  }
  
  try {
    showToast('正在上传图片...');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/media', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('nb_token')
      },
      body: formData
    });
    
    const result = await response.json();
    if (result.code === 200) {
      // 插入图片到编辑器
      const range = window.actQuill.getSelection(true);
      window.actQuill.insertEmbed(range.index, 'image', result.data.url);
      window.actQuill.setSelection(range.index + 1);
      showToast('图片上传成功');
    } else {
      showToast(result.message || '图片上传失败');
    }
  } catch (err) {
    console.error('图片上传失败:', err);
    showToast('图片上传失败，请检查网络');
  }
  
  input.value = '';
}

// 处理资源视频上传
async function handleResourceVideoUpload(input) {
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  if (file.size > 200 * 1024 * 1024) {
    showToast('视频大小不能超过200MB');
    return;
  }
  
  try {
    showToast('正在上传视频...');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/media', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('nb_token')
      },
      body: formData
    });
    
    const result = await response.json();
    if (result.code === 200) {
      // 插入视频到编辑器（使用 iframe 嵌入视频）
      const range = window.resQuill.getSelection(true);
      const videoEmbed = `<iframe class="ql-video" frameborder="0" allowfullscreen="true" src="${result.data.url}"></iframe>`;
      window.resQuill.clipboard.dangerouslyPasteHTML(range.index, videoEmbed);
      window.resQuill.setSelection(range.index + 1);
      showToast('视频上传成功');
    } else {
      showToast(result.message || '视频上传失败');
    }
  } catch (err) {
    console.error('视频上传失败:', err);
    showToast('视频上传失败，请检查网络');
  }
  
  input.value = '';
}

// 处理活动视频上传
async function handleActivityVideoUpload(input) {
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  if (file.size > 200 * 1024 * 1024) {
    showToast('视频大小不能超过200MB');
    return;
  }
  
  try {
    showToast('正在上传视频...');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/media', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('nb_token')
      },
      body: formData
    });
    
    const result = await response.json();
    if (result.code === 200) {
      // 插入视频到编辑器
      const range = window.actQuill.getSelection(true);
      const videoEmbed = `<iframe class="ql-video" frameborder="0" allowfullscreen="true" src="${result.data.url}"></iframe>`;
      window.actQuill.clipboard.dangerouslyPasteHTML(range.index, videoEmbed);
      window.actQuill.setSelection(range.index + 1);
      showToast('视频上传成功');
    } else {
      showToast(result.message || '视频上传失败');
    }
  } catch (err) {
    console.error('视频上传失败:', err);
    showToast('视频上传失败，请检查网络');
  }
  
  input.value = '';
}
function closeModal(id) { $(id).classList.remove('open'); }
function confirm(msg, cb) {
  $('confirmMsg').textContent = msg;
  const btn = $('confirmOk');
  btn.onclick = () => { closeModal('confirmModal'); cb(); };
  openModal('confirmModal');
}
function avatarHtml(avatar, name, cls = '') {
  if (avatar) return `<img src="${avatar}" onclick="openImagePreview('${avatar}')" style="cursor:pointer" onerror="this.style.display='none';this.nextSibling.style.display='flex'" alt=""><span style="display:none" class="${cls}-text">${(name||'?')[0]}</span>`;
  return `<span class="${cls}-text">${(name||'?')[0]}</span>`;
}
function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
  if (diff < 2592000000) return Math.floor(diff/86400000) + '天前';
  return d.toLocaleDateString('zh-CN');
}
function fmtDateTime(s) {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function animateNum(el, target, duration = 1200) {
  const start = 0, step = target / (duration / 16);
  let cur = 0;
  const timer = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = Math.floor(cur);
    if (cur >= target) clearInterval(timer);
  }, 16);
}
function resTypeName(t) { return {job:'招聘',project:'项目',invest:'投资',other:'其他'}[t]||t; }
function resTypeClass(t) { return 'type-' + t; }

// ===== 启动 =====
window.addEventListener('DOMContentLoaded', async () => {
  const startTime = Date.now();
  const minDisplayTime = 500; // 最小显示时间 500ms

  const token = localStorage.getItem('nb_token');
  const savedUser = localStorage.getItem('nb_user');
  
  if (token && savedUser) {
    try {
      // 尝试获取当前用户信息
      const user = await UserSvc.getMe();
      if (user) {
        currentUser = user;
        console.log('[Init] Session restored:', currentUser);
      } else {
        localStorage.removeItem('nb_token');
        localStorage.removeItem('nb_session');
        localStorage.removeItem('nb_user');
      }
    } catch (err) {
      // Token 无效，清除
      localStorage.removeItem('nb_token');
      localStorage.removeItem('nb_session');
      localStorage.removeItem('nb_user');
    }
  }

  // 游客也可以进入应用
  await startApp();

  // 确保最小显示时间
  const elapsed = Date.now() - startTime;
  if (elapsed < minDisplayTime) {
    await new Promise(r => setTimeout(r, minDisplayTime - elapsed));
  }
  $('splashPage').style.display = 'none';
});

function doLogin() {
  const u = $('loginUser').value.trim(), p = $('loginPass').value;
  
  console.log('[Login] Attempting login with username:', u);
  
  // 基本验证
  if (!u) {
    $('loginError').textContent = '请输入用户名';
    $('loginError').style.display = 'block';
    return;
  }
  if (!p) {
    $('loginError').textContent = '请输入密码';
    $('loginError').style.display = 'block';
    return;
  }
  
  // 异步登录
  UserSvc.login(u, p).then(user => {
    console.log('[Login] Login response user:', user);
    if (!user) { 
      $('loginError').textContent = '登录失败，未返回用户信息';
      $('loginError').style.display = 'block'; 
      return; 
    }
    $('loginError').style.display = 'none';
    currentUser = user;
    localStorage.setItem('nb_session', user.id);
    localStorage.setItem('nb_user', JSON.stringify(user));
    console.log('[Login] Login successful, user:', user);
    $('loginPage').style.display = 'none';
    startApp();
  }).catch(err => {
    console.error('[Login] 登录失败:', err);
    console.error('[Login] Error stack:', err.stack);
    
    // 根据错误码显示具体错误信息
    const errMsg = err.message || '';
    if (errMsg.includes('用户名不存在')) {
      $('loginError').textContent = '用户名不存在，请先注册';
    } else if (errMsg.includes('密码错误')) {
      $('loginError').textContent = '密码错误，请重新输入';
    } else if (errMsg.includes('401')) {
      $('loginError').textContent = '用户名或密码错误';
    } else if (errMsg.includes('Failed to fetch')) {
      $('loginError').textContent = '无法连接到服务器，请检查网络';
    } else {
      $('loginError').textContent = '登录失败: ' + errMsg;
    }
    $('loginError').style.display = 'block';
  });
}

// 显示注册表单
function showRegisterForm() {
  $('loginForm').style.display = 'none';
  $('registerForm').style.display = 'block';
  $('loginPageTitle').textContent = '用户注册';
  $('registerError').style.display = 'none';
}

// 显示登录表单
function showLoginForm() {
  $('loginForm').style.display = 'block';
  $('registerForm').style.display = 'none';
  $('loginPageTitle').textContent = '校友登录';
  $('loginError').style.display = 'none';
}

// 显示忘记密码
function showForgotPassword() {
  openModal('forgotPasswordModal');
  $('forgotUsername').value = currentUser ? currentUser.username : '';
  $('newPassword').value = '';
  $('confirmNewPassword').value = '';
  $('forgotPasswordError').style.display = 'none';
  $('forgotPasswordSuccess').style.display = 'none';
}

// 重置密码
async function doResetPassword() {
  const username = $('forgotUsername').value.trim();
  const newPassword = $('newPassword').value;
  const confirmPassword = $('confirmNewPassword').value;
  
  // 验证
  if (!username) {
    $('forgotPasswordError').textContent = '请输入用户名';
    $('forgotPasswordError').style.display = 'block';
    $('forgotPasswordSuccess').style.display = 'none';
    return;
  }
  
  if (!newPassword || newPassword.length < 6 || newPassword.length > 20) {
    $('forgotPasswordError').textContent = '密码需要6-20位';
    $('forgotPasswordError').style.display = 'block';
    $('forgotPasswordSuccess').style.display = 'none';
    return;
  }
  
  if (newPassword !== confirmPassword) {
    $('forgotPasswordError').textContent = '两次输入的密码不一致';
    $('forgotPasswordError').style.display = 'block';
    $('forgotPasswordSuccess').style.display = 'none';
    return;
  }
  
  try {
    const token = localStorage.getItem('nb_token');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, newPassword })
    });
    
    const result = await res.json();
    
    if (result.code === 200) {
      $('forgotPasswordError').style.display = 'none';
      $('forgotPasswordSuccess').textContent = '密码重置成功！请使用新密码登录';
      $('forgotPasswordSuccess').style.display = 'block';
      
      // 清空密码输入框
      $('newPassword').value = '';
      $('confirmNewPassword').value = '';
      
      // 2秒后关闭弹窗
      setTimeout(() => {
        closeModal('forgotPasswordModal');
        $('forgotPasswordSuccess').style.display = 'none';
      }, 2000);
    } else {
      $('forgotPasswordError').textContent = result.message || '密码重置失败';
      $('forgotPasswordError').style.display = 'block';
      $('forgotPasswordSuccess').style.display = 'none';
    }
  } catch (err) {
    console.error('密码重置失败:', err);
    $('forgotPasswordError').textContent = '密码重置失败，请稍后重试';
    $('forgotPasswordError').style.display = 'block';
    $('forgotPasswordSuccess').style.display = 'none';
  }
}

// 注册
function doRegister() {
  const username = $('regUsername').value.trim();
  const password = $('regPassword').value;
  const password2 = $('regPassword2').value;
  const name = $('regName').value.trim();
  
  // 验证
  if (!username || username.length < 4 || username.length > 20) {
    $('registerError').textContent = '用户名需要4-20位字母或数字';
    $('registerError').style.display = 'block';
    return;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    $('registerError').textContent = '用户名只能包含字母、数字和下划线';
    $('registerError').style.display = 'block';
    return;
  }
  
  if (!password || password.length < 6 || password.length > 20) {
    $('registerError').textContent = '密码需要6-20位';
    $('registerError').style.display = 'block';
    return;
  }
  
  if (password !== password2) {
    $('registerError').textContent = '两次输入的密码不一致';
    $('registerError').style.display = 'block';
    return;
  }
  
  if (!name) {
    $('registerError').textContent = '请填写真实姓名';
    $('registerError').style.display = 'block';
    return;
  }
  
  // 调用注册 API
  UserSvc.register(username, password, name).then(user => {
    if (!user) {
      $('registerError').textContent = '注册失败，用户名可能已存在';
      $('registerError').style.display = 'block';
      return;
    }
    
    // 注册成功，自动登录
    $('registerError').style.display = 'none';
    currentUser = user;
    localStorage.setItem('nb_session', user.id);
    localStorage.setItem('nb_user', JSON.stringify(user));
    console.log('[Register] Registration successful, user:', user);
    
    // 直接进入应用，并弹出完善资料对话框
    $('loginPage').style.display = 'none';
    startApp();
    
    // 延迟弹出完善资料对话框
    setTimeout(() => {
      showToast('注册成功！请完善您的校友资料', 'success');
      setTimeout(() => {
        openModal('addAlumniModal');
      }, 500);
    }, 800);
  }).catch(err => {
    console.error('注册失败:', err);
    
    // 根据错误码显示具体错误信息
    const errMsg = err.message || '';
    if (errMsg.includes('用户名已存在') || errMsg.includes('409')) {
      $('registerError').textContent = '用户名已存在，请更换用户名';
    } else if (errMsg.includes('用户名')) {
      $('registerError').textContent = errMsg;
    } else if (errMsg.includes('密码')) {
      $('registerError').textContent = errMsg;
    } else if (errMsg.includes('姓名')) {
      $('registerError').textContent = errMsg;
    } else {
      $('registerError').textContent = '注册失败，请稍后重试';
    }
    $('registerError').style.display = 'block';
  });
}

function doLogout() {
  localStorage.removeItem('nb_session');
  localStorage.removeItem('nb_token');
  currentUser = null;
  $('mainApp').style.display = 'none';
  $('loginPage').style.display = 'flex';
}

async function startApp() {
  document.body.style.touchAction = 'manipulation';
  $('mainApp').style.display = 'flex';
  
  console.log('[App] startApp called, currentUser:', currentUser);
  console.log('[App] DOM ready:', document.readyState);
  
  // 等待 DOM 完全加载
  if (document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve));
  }
  
  applyPermissions();
  await renderHomePage();
  await renderAlumniFilter();
  await renderAlumniList();
  await renderResourceList();
  await renderActivityList();
  await renderMePage();
}

function applyPermissions() {
  const isAdmin = Perm.isAnyAdmin(currentUser);
  const isSuperAdmin = Perm.isSuperAdmin(currentUser);
  const isLoggedIn = !!currentUser;
  
  console.log('[Permissions] ========== APPLY PERMISSIONS ==========');
  console.log('[Permissions] currentUser:', currentUser);
  console.log('[Permissions] currentUser.role:', currentUser ? currentUser.role : 'N/A');
  console.log('[Permissions] isAdmin:', isAdmin, 'isSuperAdmin:', isSuperAdmin, 'isLoggedIn:', isLoggedIn);
  
  // 管理员权限控制
  const adminElements = document.querySelectorAll('.admin-only');
  console.log('[Permissions] Found .admin-only elements:', adminElements.length);
  adminElements.forEach((el, index) => {
    if (isAdmin) {
      // 根据元素类型决定 display 值
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'button') {
        // 按钮元素：使用 inline-block
        el.classList.add('admin-inline');
        el.classList.remove('admin-visible', 'admin-flex');
        el.style.display = 'inline-block';
      } else if (tagName === 'div' && el.classList.contains('settings-item')) {
        el.classList.add('admin-flex');
        el.classList.remove('admin-visible', 'admin-inline');
        el.style.display = 'flex';
      } else {
        el.classList.add('admin-visible');
        el.classList.remove('admin-inline', 'admin-flex');
        el.style.display = 'block';
      }
      console.log(`[Permissions] .admin-only [${index}]:`, el.className.trim(), '-> SHOW');
    } else {
      el.classList.remove('admin-visible', 'admin-inline', 'admin-flex');
      el.style.display = 'none';
      console.log(`[Permissions] .admin-only [${index}]:`, el.className.trim(), '-> HIDE');
    }
  });
  
  // 超级管理员权限控制
  const superadminElements = document.querySelectorAll('.superadmin-only');
  console.log('[Permissions] Found .superadmin-only elements:', superadminElements.length);
  superadminElements.forEach((el, index) => {
    if (isSuperAdmin) {
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'button' || tagName === 'span') {
        el.classList.add('admin-inline');
        el.classList.remove('admin-visible', 'admin-flex');
      } else {
        el.classList.add('admin-visible');
        el.classList.remove('admin-inline', 'admin-flex');
      }
      console.log(`[Permissions] .superadmin-only [${index}]:`, el.className.trim(), '-> SHOW');
    } else {
      el.classList.remove('admin-visible', 'admin-inline', 'admin-flex');
      console.log(`[Permissions] .superadmin-only [${index}]:`, el.className.trim(), '-> HIDE');
    }
  });
  
  console.log('[Permissions] ========== END PERMISSIONS ==========');
}

// ===== 导航 =====
async function navigateTo(page, animType) {
  if (isNavigating) return;
  
  // 同页面不切换
  const currentPage = document.querySelector('.page.active');
  const currentPageId = currentPage ? currentPage.id.replace('page-', '') : '';
  if (currentPageId === page) return;
  
  isNavigating = true;
  
  const nextPage = $('page-' + page);
  if (!nextPage) { isNavigating = false; return; }
  
  // 确定动画类型
  const enterClass = animType === 'slideLeft' ? 'slide-in-right' : 
                     animType === 'slideRight' ? 'slide-in-left' : 'page-enter';
  const exitClass = animType === 'slideLeft' ? 'slide-out-left' : 
                    animType === 'slideRight' ? 'slide-out-right' : 'page-exit';
  
  // 1. 退出动画
  if (currentPage) {
    currentPage.classList.add(exitClass);
    await new Promise(r => setTimeout(r, animType ? 250 : 200));
    currentPage.classList.remove('active', exitClass, 'page-enter', 'page-exit', 'slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right');
  }
  
  // 2. 进入动画
  nextPage.classList.add('active', enterClass);
  await new Promise(r => setTimeout(r, animType ? 300 : 280));
  nextPage.classList.remove(enterClass);
  
  // 3. 更新底部导航高亮
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  
  // 4. 滚动到顶部
  const appBody = document.querySelector('.app-body');
  if (appBody) appBody.scrollTop = 0;
  
  // 5. 触发页面数据加载
  try {
    if (page === 'home') await renderHomePage();
    if (page === 'alumni') await renderAlumniList();
    if (page === 'resource') await renderResourceList();
    if (page === 'activity') await renderActivityList();
    if (page === 'admin') await renderAdminPage();
    if (page === 'me') await renderMePage();
  } catch(e) {
    console.error('页面渲染失败:', e);
  }
  
  isNavigating = false;
}

// ===== 首页 =====
async function renderHomePage() {
  // 确保学校数据已加载
  if (SCHOOLS.length === 0) {
    await loadSchools();
  }
  
  // 首页骨架屏默认显示，不需要手动显示
  try {
    // 并行获取数据
    const [alumni, activities, resources, posts] = await Promise.all([
      AlumniSvc.getApproved(),
      ActivitySvc.getAll(),
      ResourceSvc.getAll(),
      PostSvc.getAll()
    ]);
    
    // 数据加载成功，隐藏骨架屏
    hidePageLoading('home');
    
    animateNum($('statAlumni'), alumni.length || 0);
    animateNum($('statActivities'), activities.length || 0);
    animateNum($('statResources'), resources.length || 0);
    renderSchoolsList(alumni);
    renderHomeFeedWithData(posts);
  } catch (e) {
    console.error('渲染首页失败:', e);
    hidePageLoading('home');
    // 显示默认值
    $('statAlumni').textContent = '0';
    $('statActivities').textContent = '0';
    $('statResources').textContent = '0';
    // 显示重试按钮
    showRetry('homeFeed', () => renderHomePage());
  }
}

function renderSchoolsList(alumni) {
  $('schoolsList').innerHTML = SCHOOLS.map(s => {
    const cnt = alumni.filter(a => a.school === s.name).length;
    return `<div class="school-card" onclick="filterBySchool('${s.name}')">
      <div class="school-card-image" style="background-image: url('${s.image}'); background-size: cover; background-position: center;">
        <div class="school-card-overlay"></div>
      </div>
      <div class="school-card-content">
        <div class="school-card-name">${s.name}</div>
        <div class="school-card-count">${cnt} 位校友</div>
      </div>
    </div>`;
  }).join('');
}

function filterBySchool(name) {
  filterState = { school: name, level: '', year: '', classname: '' };
  navigateTo('alumni');
  renderAlumniFilter();
  renderAlumniList();
}

async function renderHomeFeed() {
  try {
    const posts = (await PostSvc.getAll()).slice(0, 5);
    renderHomeFeedWithData(posts);
  } catch (e) {
    $('homeFeed').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>加载失败</p></div>';
  }
}

function renderHomeFeedWithData(posts) {
  const sliced = posts.slice(0, 5);
  $('homeFeed').innerHTML = sliced.length ? sliced.map(p => feedItemHtml(p)).join('') :
    '<div class="empty-state"><div class="empty-state-icon">📭</div><p>暂无动态</p></div>';
  
  // 加载点赞状态
  if (currentUser) {
    setTimeout(() => loadPostLikes(), 100);
  }
}

function feedItemHtml(p) {
  return `<div class="feed-item" data-post-id="${p.id}">
    <div class="feed-avatar">${avatarHtml(p.avatar, p.author, 'feed-avatar')}</div>
    <div class="feed-body">
      <div class="feed-meta">
        <span class="feed-name">${p.author}</span>
        <span class="feed-school">${p.school||''}</span>
        <span class="feed-time">${fmtDate(p.createdAt)}</span>
      </div>
      <div class="feed-content">${p.content}</div>
      ${p.image ? `<img class="feed-img" src="${p.image}" onclick="openImagePreview('${p.image}')" style="cursor:pointer" alt="">` : ''}
      <!-- 点赞用户列表 -->
      <div class="feed-likers" id="likers-${p.id}" style="display:none">
        <span class="feed-likers-icon">❤️</span>
        <span class="feed-likers-names"></span>
      </div>
      <div class="feed-actions">
        <button class="feed-action-btn" onclick="togglePostLike('${p.id}', this)" data-post-id="${p.id}">
          <span class="action-icon">♡</span>
          <span class="action-count">0</span>
        </button>
      </div>
    </div>
  </div>`;
}

// ===== 校友页 =====
async function renderAlumniFilter() {
  const schools = ['', ...SCHOOLS.map(s => s.name)];
  const levels = ['', '初中', '高中'];
  const years = ['', ...await getYears()];
  const classes = filterState.school || filterState.level || filterState.year
    ? ['', ...(await AlumniSvc.getClasses(filterState.school, filterState.level, filterState.year))]
    : [];

  let html = `<div class="filter-label">学校</div><div class="filter-row filter-scroll">`;
  html += schools.map(s => `<div class="filter-chip${filterState.school===s?' active':''}" onclick="setFilter('school','${s}')">${s||'全部'}</div>`).join('');
  html += `</div>`;
  if (filterState.school) {
    html += `<div class="filter-label">学段</div><div class="filter-row filter-scroll">`;
    html += levels.map(l => `<div class="filter-chip${filterState.level===l?' active':''}" onclick="setFilter('level','${l}')">${l||'全部'}</div>`).join('');
    html += `</div>`;
  }
  if (filterState.school && filterState.level) {
    html += `<div class="filter-label">年份</div><div class="filter-row filter-scroll">`;
    html += years.map(y => `<div class="filter-chip${String(filterState.year)===String(y)?' active':''}" onclick="setFilter('year','${y}')">${y||'全部'}</div>`).join('');
    html += `</div>`;
  }
  if (classes.length > 1) {
    html += `<div class="filter-label">班级</div><div class="filter-row filter-scroll">`;
    html += classes.map(c => `<div class="filter-chip${filterState.classname===c?' active':''}" onclick="setFilter('classname','${c}')">${c||'全部'}</div>`).join('');
    html += `</div>`;
  }
  $('filterCascade').innerHTML = html;
}

async function getYears() {
  const all = await AlumniSvc.getApproved();
  const filtered = filterState.school ? all.filter(a => a.school === filterState.school) : all;
  const lf = filterState.level ? filtered.filter(a => a.level === filterState.level) : filtered;
  return [...new Set(lf.map(a => a.year).filter(Boolean))].sort((a,b) => b-a).map(String);
}

async function setFilter(key, val) {
  filterState[key] = val;
  if (key === 'school') { filterState.level = ''; filterState.year = ''; filterState.classname = ''; }
  if (key === 'level') { filterState.year = ''; filterState.classname = ''; }
  if (key === 'year') { filterState.classname = ''; }
  await renderAlumniFilter();
  await renderAlumniList();
}

async function renderAlumniList() {
  const q = $('alumniSearch') ? $('alumniSearch').value.trim() : '';
  
  // 显示骨架屏
  showPageLoading('alumni');
  
  try {
    // 重置分页状态
    pagination.alumni.page = 1;
    pagination.alumni.hasMore = true;
    pagination.alumni.loading = false;
    pagination.alumni.allData = [];
    
    // 隐藏加载更多指示器
    const indicator = $('loadMoreAlumni');
    if (indicator) {
      indicator.style.display = 'none';
      indicator.classList.remove('no-more');
    }
    
    let list = await AlumniSvc.search(q, filterState.school, filterState.level, filterState.year, filterState.classname);
    // 管理员可看到自己权限范围内的 pending
    if (Perm.isAnyAdmin(currentUser)) {
      const pending = (await AlumniSvc.getPending()).filter(a => Perm.canManageAlumni(currentUser, a));
      const pendingIds = new Set(list.map(a => a.id));
      pending.forEach(a => { if (!pendingIds.has(a.id)) list.push(a); });
    }

    // 存储完整数据用于分页
    pagination.alumni.allData = list;

    // 只显示第一页数据
    const pageData = list.slice(0, pagination.alumni.pageSize);

    // 检查是否还有更多数据
    if (list.length <= pagination.alumni.pageSize) {
      pagination.alumni.hasMore = false;
    }
    
    // 数据加载成功，隐藏骨架屏
    hidePageLoading('alumni');

    $('alumniList').innerHTML = pageData.length ? pageData.map(a => alumniCardHtml(a)).join('') :
      '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><p>暂无校友信息</p></div>';

    // 如果有更多数据，显示加载更多指示器
    if (pagination.alumni.hasMore && pageData.length > 0) {
      if (indicator) indicator.style.display = 'flex';
    }
  } catch (e) {
    console.error('渲染校友列表失败:', e);
    hidePageLoading('alumni');
    showRetry('alumniList', () => renderAlumniList());
  }
}

function alumniCardHtml(a) {
  return `<div class="alumni-card" onclick="showAlumniDetail('${a.id}')">
    ${a.status==='pending'?'<div class="alumni-pending-badge">待审核</div>':''}
    <div class="alumni-card-top">
      <div class="alumni-avatar">${avatarHtml(a.avatar, a.name, 'alumni-avatar')}</div>
      <div style="flex:1;min-width:0">
        <div class="alumni-name">${a.name}</div>
        <div class="alumni-job">${a.job||''}${a.company?' · '+a.company:''}</div>
      </div>
    </div>
    <div class="alumni-tags">
      ${a.school?`<span class="alumni-tag school">${a.school}</span>`:''}
      ${a.year?`<span class="alumni-tag">${a.year}届</span>`:''}
      ${a.classname?`<span class="alumni-tag">${a.classname}班</span>`:''}
      ${a.city?`<span class="alumni-tag city">📍${a.city}</span>`:''}
    </div>
  </div>`;
}

async function showAlumniDetail(id) {
  // 游客需要登录才能查看详情
  if (!Auth.requireAuth()) return;
  const a = await AlumniSvc.getById(id);
  if (!a) return;
  const canManage = Perm.canManageAlumni(currentUser, a);
  
  // 使用user_id筛选（数据库字段名）
  const userId = a.user_id || a.userId;
  
  console.log('[Alumni Detail] 校友:', a.name, 'user_id:', userId);
  console.log('[Alumni Detail] 校友完整数据:', a);
  
  // 筛选该用户的动态、资源、活动
  // 强制刷新缓存，确保获取最新数据
  const allPosts = await PostSvc.getAll(true);
  console.log('[Alumni Detail] 所有动态数量:', allPosts.length);
  console.log('[Alumni Detail] 第一条动态:', allPosts[0]);
  
  // 兼容author_id和authorId两种字段名
  // 同时支持user_id匹配和用户名匹配（解决数据不一致问题）
  const posts = userId ? allPosts.filter(p => {
    const aid = p.author_id || p.authorId;
    // 通过user_id匹配 或 通过用户名匹配
    return aid === userId || (a.name && p.author === a.name);
  }).slice(0, 5) : [];
  console.log('[Alumni Detail] 筛选后动态数量:', posts.length);
  
  // 强制刷新资源缓存，确保获取最新数据
  const allResources = await ResourceSvc.getAll(true);
  console.log('[Alumni Detail] 所有资源数量:', allResources.length);
  if (allResources.length > 0) {
    console.log('[Alumni Detail] 第一个资源:', allResources[0]);
    console.log('[Alumni Detail] 资源字段:', Object.keys(allResources[0]));
    console.log('[Alumni Detail] 资源description:', allResources[0].description);
    console.log('[Alumni Detail] 资源desc:', allResources[0].desc);
  }
  
  const resources = userId ? allResources.filter(r => {
    const aid = r.author_id || r.authorId;
    return aid === userId || (a.name && r.author === a.name);
  }) : [];
  console.log('[Alumni Detail] 筛选后资源数量:', resources.length);
  
  // 强制刷新活动缓存，确保获取最新数据
  const allActivities = await ActivitySvc.getAll(true);
  console.log('[Alumni Detail] 所有活动数量:', allActivities.length);
  if (allActivities.length > 0) {
    console.log('[Alumni Detail] 第一个活动:', allActivities[0]);
    console.log('[Alumni Detail] 活动字段:', Object.keys(allActivities[0]));
    if (allActivities[0].signups && allActivities[0].signups.length > 0) {
      console.log('[Alumni Detail] 第一个活动的报名:', allActivities[0].signups[0]);
      console.log('[Alumni Detail] 报名字段:', Object.keys(allActivities[0].signups[0]));
    }
  }
  
  const activities = userId ? allActivities.filter(act => {
    const signups = act.signups || [];
    const found = signups.find(s => {
      const uid = s.userId || s.user_id;
      // 通过user_id匹配 或 通过name字段匹配
      return uid === userId || (a.name && s.name === a.name);
    });
    if (found) {
      console.log('[Alumni Detail] 找到活动:', act.name, '报名人:', found.name);
    }
    return found;
  }) : [];
  console.log('[Alumni Detail] 筛选后活动数量:', activities.length);
  console.log('[Alumni Detail] userId:', userId, '校友名称:', a.name);
  
  // 联系方式显示逻辑：管理员或已审核校友可见
  const canSeeContact = canManage || currentUser.role === 'user';
  const phoneDisplay = canSeeContact && a.phone ? a.phone : (canManage ? '未填写' : '🔒 仅校友可见');

  $('alumniDetailBody').innerHTML = `
    <div class="detail-hero">
      <div class="detail-avatar">${avatarHtml(a.avatar, a.name, 'detail-avatar')}</div>
      <div>
        <div class="detail-name">${a.name}</div>
        <div class="detail-job">${a.job||''}${a.company?' @ '+a.company:''}</div>
        <div class="detail-tags">
          ${a.school?`<span class="alumni-tag school">${a.school}</span>`:''}
          ${a.level?`<span class="alumni-tag">${a.level}</span>`:''}
          ${a.year?`<span class="alumni-tag">${a.year}届</span>`:''}
          ${a.classname?`<span class="alumni-tag">${a.classname}班</span>`:''}
          ${a.status==='pending'?`<span class="alumni-tag" style="color:var(--warning)">待审核</span>`:''}
        </div>
      </div>
    </div>
    <div class="detail-info-grid">
      <div class="detail-info-item"><div class="detail-info-label">城市</div><div class="detail-info-value">📍 ${a.city||'未填写'}</div></div>
      <div class="detail-info-item"><div class="detail-info-label">联系电话</div><div class="detail-info-value">${phoneDisplay}</div></div>
    </div>
    ${a.bio?`<div class="detail-bio">${a.bio}</div>`:''}
    <div class="detail-tabs">
      <button class="detail-tab active" onclick="switchDetailTab(this,'dtPosts')">动态(${posts.length})</button>
      <button class="detail-tab" onclick="switchDetailTab(this,'dtRes')">资源(${resources.length})</button>
      <button class="detail-tab" onclick="switchDetailTab(this,'dtAct')">活动(${activities.length})</button>
    </div>
    <div id="dtPosts">${posts.length?posts.map(p=>feedItemHtml(p)).join(''):'<div class="empty-state"><div class="empty-state-icon">📭</div><p>暂无动态</p></div>'}</div>
    <div id="dtRes" style="display:none">${resources.length?resources.map(r=>{
      console.log('[Alumni Detail] 渲染资源:', r.title, 'description:', r.description, 'desc:', r.desc);
      const desc = r.description || r.desc || r.content || '';
      return `<div class="resource-card" style="margin-bottom:8px"><div class="resource-header"><span class="resource-type-badge ${resTypeClass(r.type)}">${resTypeName(r.type)}</span><span class="resource-title">${r.title}</span></div><div class="resource-desc">${stripHtml(desc).substring(0, 100)}${desc.length > 100 ? '...' : ''}</div></div>`;
    }).join(''):'<div class="empty-state"><div class="empty-state-icon">📦</div><p>暂无资源</p></div>'}</div>
    <div id="dtAct" style="display:none">${activities.length?activities.map(a=>actCardHtml(a)).join(''):'<div class="empty-state"><div class="empty-state-icon">🎉</div><p>暂无活动</p></div>'}</div>
  `;
  let footer = '';
  if (canManage) {
    if (a.status === 'pending') {
      footer += `<button class="btn btn-success btn-sm" onclick="approveAlumni('${a.id}')">✓ 通过</button>`;
      footer += `<button class="btn btn-danger btn-sm" onclick="rejectAlumni('${a.id}')">✗ 拒绝</button>`;
    }
    footer += `<button class="btn btn-secondary btn-sm" onclick="editAlumni('${a.id}')">编辑</button>`;
    footer += `<button class="btn btn-danger btn-sm" onclick="deleteAlumni('${a.id}')">删除</button>`;
  }
  $('alumniDetailFooter').innerHTML = footer;
  openModal('alumniDetailModal');
}

function switchDetailTab(btn, panelId) {
  btn.closest('.modal-body').querySelectorAll('.detail-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['dtPosts','dtRes','dtAct'].forEach(id => { const el = $(id); if(el) el.style.display = 'none'; });
  const panel = $(panelId); if (panel) panel.style.display = '';
}

async function approveAlumni(id) {
  await AlumniSvc.approve(id); closeModal('alumniDetailModal');
  showToast('已通过审核'); await renderAlumniList(); await renderAdminPage();
}
async function rejectAlumni(id) {
  await AlumniSvc.reject(id); closeModal('alumniDetailModal');
  showToast('已拒绝'); await renderAlumniList(); await renderAdminPage();
}
function deleteAlumni(id) {
  confirm('确定删除该校友信息？', async () => {
    await AlumniSvc.delete(id); closeModal('alumniDetailModal');
    showToast('已删除'); await renderAlumniList(); await renderAdminPage();
  });
}
async function editAlumni(id) {
  const a = await AlumniSvc.getById(id);
  if (!a) return;
  closeModal('alumniDetailModal');
  $('alumniModalTitle').textContent = '编辑校友';
  $('editAlumniId').value = id;
  $('aAvatarUrl').value = a.avatar||'';
  alumniAvatarData = '';
  previewAlumniAvatar(a.avatar||'');
  $('aName').value = a.name||'';
  $('aSchool').value = a.school||'';
  $('aLevel').value = a.level||'';
  $('aYear').value = a.year||'';
  $('aClass').value = a.classname||'';
  $('aPhone').value = a.phone||'';
  $('aJob').value = a.job||'';
  $('aCompany').value = a.company||'';
  $('aCity').value = a.city||'';
  $('aBio').value = a.bio||'';
  openModal('addAlumniModal');
}

async function saveAlumni() {
  const name = $('aName').value.trim();
  const school = $('aSchool').value;
  const level = $('aLevel').value;
  const yearValue = $('aYear').value.trim();
  const classValue = $('aClass').value.trim();
  const phone = $('aPhone').value.trim();
  
  // 必填字段验证
  if (!name) { showToast('请填写姓名'); return; }
  if (!school) { showToast('请选择学校'); return; }
  if (!level) { showToast('请选择学段'); return; }
  
  // 验证入学年份（必须4位数字）
  if (!yearValue || !/^\d{4}$/.test(yearValue)) {
    showToast('入学年份必须是4位数字，如 2010');
    return;
  }
  const year = parseInt(yearValue);
  if (year < 1950 || year > 2030) {
    showToast('入学年份应在1950-2030之间');
    return;
  }
  
  // 验证班级（必须1-20的整数）
  if (!classValue || !/^\d{1,2}$/.test(classValue)) {
    showToast('班级必须是1-20的数字');
    return;
  }
  const classname = parseInt(classValue);
  if (classname < 1 || classname > 20) {
    showToast('班级必须在1-20之间');
    return;
  }
  
  if (!phone) { showToast('请填写联系电话'); return; }
  
  // 手机号格式验证
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    showToast('请填写正确的手机号码');
    return;
  }
  
  const avatar = alumniAvatarData || $('aAvatarUrl').value.trim();
  const data = { 
    name, 
    school, 
    level, 
    year, 
    classname,
    phone,
    job: $('aJob').value.trim(), 
    company: $('aCompany').value.trim(),
    city: $('aCity').value.trim(), 
    bio: $('aBio').value.trim(), 
    avatar,
    user_id: currentUser.id 
  };
  const editId = $('editAlumniId').value;
  try {
    if (editId) {
      await AlumniSvc.update(editId, data); 
      showToast('资料已更新', 'success');
    } else {
      await AlumniSvc.add(data); 
      showToast('资料已提交，等待管理员审核', 'success');
    }
    alumniAvatarData = '';
    closeModal('addAlumniModal');
    await renderAlumniList(); 
    await renderAdminPage();
  } catch (e) {
    console.error('保存失败:', e);
    showToast('保存失败: ' + (e.message || '请检查网络'), 'error');
  }
}

function previewAlumniAvatar(url) {
  const el = $('alumniAvatarPreview');
  if (url) { el.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentNode.textContent='👤'">`; }
  else { el.textContent = '👤'; }
}

// 验证入学年份输入（只能4位数字）
function validateYearInput(input) {
  let value = input.value.replace(/\D/g, ''); // 移除非数字字符
  if (value.length > 4) value = value.substring(0, 4); // 限制4位
  input.value = value;
}

// 验证班级输入（只能1-20的整数）
function validateClassInput(input) {
  let value = input.value.replace(/\D/g, ''); // 移除非数字字符
  if (value.length > 2) value = value.substring(0, 2); // 限制2位
  
  // 如果输入了数字，验证范围
  if (value) {
    const num = parseInt(value);
    if (num < 1) value = '1';
    if (num > 20) value = '20';
  }
  
  input.value = value;
}
function handleAlumniAvatarFile(input) {
  const file = input.files[0];
  if (!file) return;
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件', 'error');
    input.value = ''; // 清空input
    return;
  }
  
  // 验证文件大小（最大5MB）
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过5MB', 'error');
    input.value = ''; // 清空input
    return;
  }
  
  const reader = new FileReader();
  reader.onload = e => {
    alumniAvatarData = e.target.result;
    previewAlumniAvatar(alumniAvatarData);
    showToast('头像已选择', 'success');
  };
  reader.onerror = () => {
    showToast('图片读取失败，请重试', 'error');
    input.value = ''; // 清空input
  };
  reader.readAsDataURL(file);
  
  // 清空input，允许重复选择同一文件
  input.value = '';
}

// ===== 资源页 =====
async function switchResTab(btn, type) {
  document.querySelectorAll('#page-resource .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); resTab = type; 
  // 重置分页状态
  pagination.resource.page = 1;
  pagination.resource.hasMore = true;
  pagination.resource.loading = false;
  pagination.resource.allData = [];
  await renderResourceList();
}
async function renderResourceList() {
  // 显示骨架屏
  showPageLoading('resource');
  
  try {
    // 重置分页状态
    pagination.resource.page = 1;
    pagination.resource.hasMore = true;
    pagination.resource.loading = false;
    pagination.resource.allData = [];
    
    // 隐藏加载更多指示器
    const indicator = $('loadMoreResource');
    if (indicator) {
      indicator.style.display = 'none';
      indicator.classList.remove('no-more');
    }
    
    const list = await ResourceSvc.filter(resTab);

    // 存储完整数据用于分页
    pagination.resource.allData = list;

    // 只显示第一页数据
    const pageData = list.slice(0, pagination.resource.pageSize);

    // 检查是否还有更多数据
    if (list.length <= pagination.resource.pageSize) {
      pagination.resource.hasMore = false;
    }
    
    // 数据加载成功，隐藏骨架屏
    hidePageLoading('resource');

    $('resourceList').innerHTML = pageData.length ? pageData.map(r => resourceCardHtml(r)).join('') :
      '<div class="empty-state"><div class="empty-state-icon">📦</div><p>暂无资源</p></div>';

    // 如果有更多数据，显示加载更多指示器
    if (pagination.resource.hasMore && pageData.length > 0) {
      if (indicator) indicator.style.display = 'flex';
    }
  } catch (e) {
    console.error('渲染资源列表失败:', e);
    hidePageLoading('resource');
    showRetry('resourceList', () => renderResourceList());
  }
}
function resourceCardHtml(r) {
  const canDel = currentUser && (r.author_id === currentUser.id || Perm.isSuperAdmin(currentUser));
  const thumbnail = extractFirstImage(r.description || r.desc || '');
  const hasMedia = thumbnail || extractFirstVideo(r.description || r.desc || '');
  
  return `<div class="resource-card" onclick="showResourceDetail('${r.id}')" style="cursor:pointer">
    ${hasMedia ? `<div class="resource-thumbnail">
      ${thumbnail ? `<img src="${thumbnail}" alt="${r.title}" />` : ''}
      <div class="resource-type-badge ${resTypeClass(r.type)}">${resTypeName(r.type)}</div>
    </div>` : ''}
    <div class="resource-header">
      ${!hasMedia ? `<span class="resource-type-badge ${resTypeClass(r.type)}">${resTypeName(r.type)}</span>` : ''}
      <span class="resource-title">${r.title}</span>
    </div>
    <div class="resource-desc">${stripHtml(r.description || r.desc || '').substring(0, 100)}${(r.description || r.desc || '').length > 100 ? '...' : ''}</div>
    <div class="resource-footer">
      <span>${r.author} · ${fmtDate(r.createdAt)}</span>
      <span class="resource-contact">${r.contact||''}</span>
      ${canDel?`<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteResource('${r.id}')">删除</button>`:''}
    </div>
  </div>`;
}
async function saveResource() {
  const title = $('rTitle').value.trim(), type = $('rType').value, contact = $('rContact').value.trim();
  
  // 从富文本编辑器获取内容
  const desc = window.resQuill ? window.resQuill.root.innerHTML.trim() : '';
  
  if (!title) { showToast('请填写标题'); return; }
  if (!desc || desc === '<p><br></p>') { showToast('请填写详细描述'); return; }
  
  const editId = $('editResId').value;
  const data = { title, type, description: desc, contact,
    author: currentUser.name || currentUser.username, author_id: currentUser.id };
  try {
    if (editId) { await ResourceSvc.update(editId, data); showToast('已更新'); }
    else { await ResourceSvc.add(data); showToast('发布成功'); }
    closeModal('addResourceModal');
    // 清空表单
    $('rTitle').value=''; $('rContact').value=''; $('editResId').value='';
    if (window.resQuill) window.resQuill.setContents([]);
    await renderResourceList();
  } catch (e) {
    console.error('保存失败:', e);
    showToast('保存失败: ' + (e.message || '请检查网络'));
  }
}
function deleteResource(id) {
  confirm('确定删除该资源？', async () => { await ResourceSvc.delete(id); await renderResourceList(); showToast('已删除'); });
}

// ===== 活动页 =====
async function switchActTab(btn, status) {
  document.querySelectorAll('#page-activity .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); actTab = status; 
  // 重置分页状态
  pagination.activity.page = 1;
  pagination.activity.hasMore = true;
  pagination.activity.loading = false;
  pagination.activity.allData = [];
  await renderActivityList();
}
async function renderActivityList() {
  // 显示骨架屏
  showPageLoading('activity');
  
  try {
    // 重置分页状态
    pagination.activity.page = 1;
    pagination.activity.hasMore = true;
    pagination.activity.loading = false;
    pagination.activity.allData = [];
    
    // 隐藏加载更多指示器
    const indicator = $('loadMoreActivity');
    if (indicator) {
      indicator.style.display = 'none';
      indicator.classList.remove('no-more');
    }
    
    const list = await ActivitySvc.filter(actTab);

    // 存储完整数据用于分页
    pagination.activity.allData = list;

    // 只显示第一页数据
    const pageData = list.slice(0, pagination.activity.pageSize);

    // 检查是否还有更多数据
    if (list.length <= pagination.activity.pageSize) {
      pagination.activity.hasMore = false;
    }
    
    // 数据加载成功，隐藏骨架屏
    hidePageLoading('activity');

    $('activityList').innerHTML = pageData.length ? pageData.map(a => actCardHtml(a)).join('') :
      '<div class="empty-state"><div class="empty-state-icon">🎉</div><p>暂无活动</p></div>';

    // 如果有更多数据，显示加载更多指示器
    if (pagination.activity.hasMore && pageData.length > 0) {
      if (indicator) indicator.style.display = 'flex';
    }
  } catch (e) {
    console.error('渲染活动列表失败:', e);
    hidePageLoading('activity');
    showRetry('activityList', () => renderActivityList());
  }
}
function actCardHtml(a) {
  const status = ActivitySvc.getStatus(a);
  const statusLabel = {upcoming:'即将开始',ongoing:'进行中',ended:'已结束'}[status];
  const tagCls = 'tag-'+status, barCls = 'status-'+status;
  const cnt = (a.signups||[]).length;
  const thumbnail = extractFirstImage(a.description || a.desc || '');
  const hasMedia = thumbnail || extractFirstVideo(a.description || a.desc || '');
  
  return `<div class="activity-card" onclick="showActivityDetail('${a.id}')">
    ${hasMedia ? `<div class="activity-thumbnail">
      ${thumbnail ? `<img src="${thumbnail}" alt="${a.name}" />` : ''}
      <div class="activity-status-tag ${tagCls}">${statusLabel}</div>
    </div>` : ''}
    <div class="activity-status-bar ${barCls}"></div>
    <div class="activity-body">
      <div class="activity-name">${a.name}</div>
      <div class="activity-info">
        <div class="activity-info-row"><span>🕐</span><span>${fmtDateTime(a.startTime)}${a.endTime?' ~ '+fmtDateTime(a.endTime):''}</span></div>
        <div class="activity-info-row"><span>📍</span><span>${a.location||'待定'}</span></div>
        <div class="activity-info-row"><span>👤</span><span>发起人：${a.organizer?.name||'管理员'}</span></div>
      </div>
      <div class="activity-footer">
        ${!hasMedia ? `<span class="activity-status-tag ${tagCls}">${statusLabel}</span>` : ''}
        <span class="activity-signup-count">已报名 ${cnt}${a.capacity>0?' / '+a.capacity:''} 人</span>
      </div>
    </div>
    ${cnt>0?signupRollHtml(a.signups):''}
  </div>`;
}
function signupRollHtml(signups) {
  const show = signups.slice(0, 12);
  return `<div class="signup-roll">
    <div class="signup-roll-title">报名接龙（${signups.length}人）</div>
    <div class="signup-avatars">
      ${show.map((s,i) => `<div class="signup-avatar-item">
        <div class="signup-avatar-img">${s.avatar?`<img src="${s.avatar}" alt="">`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--accent)">${(s.name||'?')[0]}</div>`}</div>
        <div class="signup-avatar-name">${i===0?'👑'+s.name:s.name}</div>
      </div>`).join('')}
      ${signups.length>12?`<div class="signup-avatar-item"><div class="signup-avatar-img" style="display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-muted)">+${signups.length-12}</div></div>`:''}
    </div>
  </div>`;
}
async function showActivityDetail(id) {
  // 游客需要登录才能查看详情
  if (!Auth.requireAuth()) return;
  const a = await ActivitySvc.getById(id);
  if (!a) return;
  const status = ActivitySvc.getStatus(a);
  const isSignedUp = (a.signups||[]).find(s => s.user_id === currentUser.id || s.userId === currentUser.id);
  const isFull = a.capacity > 0 && (a.signups||[]).length >= a.capacity;
  console.log('[Activity] showActivityDetail:', { id, isSignedUp, signups: a.signups, currentUserId: currentUser.id });
  $('activityDetailBody').innerHTML = `
    <div style="margin-bottom:12px">
      <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:12px">${a.name}</div>
      <div class="activity-info">
        <div class="activity-info-row"><span>🕐</span><span>${fmtDateTime(a.startTime)}${a.endTime?' ~ '+fmtDateTime(a.endTime):''}</span></div>
        <div class="activity-info-row"><span>📍</span><span>${a.location||'待定'}</span></div>
        <div class="activity-info-row"><span>👤</span><span>发起人：${a.organizer?.name||'管理员'}</span></div>
      </div>
      ${a.description || a.desc ? `<div class="detail-bio" style="margin-top:16px;background:#f9fafb;">${a.description || a.desc}</div>` : ''}
      ${signupRollHtml(a.signups||[])}
    </div>
  `;
  let footer = '';
  if (status !== 'ended') {
    if (isSignedUp) {
      footer += `<button class="btn btn-warn btn-sm" onclick="cancelSignup('${a.id}')">取消报名</button>`;
    } else if (!isFull) {
      footer += `<button class="btn btn-primary btn-sm" onclick="doSignup('${a.id}')">立即报名</button>`;
    } else {
      footer += `<button class="btn btn-secondary btn-sm" disabled>名额已满</button>`;
    }
  }
  if (Perm.isAnyAdmin(currentUser)) {
    footer += `<button class="btn btn-secondary btn-sm" onclick="editActivity('${a.id}')">编辑</button>`;
    footer += `<button class="btn btn-danger btn-sm" onclick="deleteActivity('${a.id}')">删除</button>`;
  }
  $('activityDetailFooter').innerHTML = footer;
  openModal('activityDetailModal');
}

async function showResourceDetail(id) {
  // 游客需要登录才能查看详情
  if (!Auth.requireAuth()) return;
  
  try {
    const r = await ResourceSvc.getById(id);
    if (!r) {
      showToast('资源不存在');
      return;
    }
    
    const canDel = currentUser && (r.author_id === currentUser.id || Perm.isSuperAdmin(currentUser));
    
    $('activityDetailBody').innerHTML = `
      <div style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span class="resource-type-badge ${resTypeClass(r.type)}" style="font-size:12px">${resTypeName(r.type)}</span>
          <span style="font-size:18px;font-weight:700;color:var(--text-primary)">${r.title}</span>
        </div>
        <div class="activity-info">
          <div class="activity-info-row"><span>👤</span><span>发布人：${r.author || '未知'}</span></div>
          <div class="activity-info-row"><span>📅</span><span>${fmtDate(r.createdAt)}</span></div>
          ${r.contact ? `<div class="activity-info-row"><span>📞</span><span>联系方式：${r.contact}</span></div>` : ''}
        </div>
        <div class="detail-bio" style="margin-top:16px;background:#f9fafb;">${r.description || r.desc || '暂无描述'}</div>
      </div>
    `;
    
    let footer = '';
    if (canDel) {
      footer += `<button class="btn btn-danger btn-sm" onclick="deleteResource('${r.id}');closeModal('activityDetailModal');">删除</button>`;
    }
    footer += `<button class="btn btn-secondary btn-sm" onclick="closeModal('activityDetailModal')">关闭</button>`;
    $('activityDetailFooter').innerHTML = footer;
    
    openModal('activityDetailModal');
  } catch (e) {
    console.error('[Resource] Show detail error:', e);
    showToast('加载失败');
  }
}

async function doSignup(id) {
  const a = await ActivitySvc.getById(id);
  if (!a) return;
  await ActivitySvc.signup(id);
  closeModal('activityDetailModal');
  showToast('报名成功！'); await renderActivityList();
}
async function cancelSignup(id) {
  await ActivitySvc.cancelSignup(id);
  closeModal('activityDetailModal');
  showToast('已取消报名'); await renderActivityList();
}
async function saveActivity() {
  const name = $('actName').value.trim();
  if (!name) { showToast('请填写活动名称'); return; }
  
  // 从富文本编辑器获取内容
  const desc = window.actQuill ? window.actQuill.root.innerHTML.trim() : '';
  
  // 调试：输出HTML内容
  console.log('[Save Activity] Description HTML:', desc);
  console.log('[Save Activity] Description length:', desc.length);
  
  const editId = $('editActId').value;
  const data = { name, start_time: $('actStart').value, end_time: $('actEnd').value,
    location: $('actLocation').value.trim(), capacity: parseInt($('actCapacity').value)||0,
    description: desc,
    organizer_name: currentUser.name || currentUser.username,
    organizer_id: currentUser.id };
  try {
    if (editId) { await ActivitySvc.update(editId, data); showToast('已更新'); }
    else { await ActivitySvc.add(data); showToast('活动已发布'); }
    closeModal('addActivityModal');
    // 清空表单
    $('actName').value=''; $('actStart').value=''; $('actEnd').value='';
    $('actLocation').value=''; $('actCapacity').value=''; $('editActId').value='';
    if (window.actQuill) window.actQuill.setContents([]);
    await renderActivityList();
  } catch (e) {
    console.error('保存失败:', e);
    showToast('保存失败: ' + (e.message || '请检查网络'));
  }
}
async function editActivity(id) {
  const a = await ActivitySvc.getById(id); if (!a) return;
  closeModal('activityDetailModal');
  $('actModalTitle').textContent = '编辑活动';
  $('editActId').value = id;
  $('actName').value = a.name||'';
  $('actStart').value = a.start_time ? a.start_time.slice(0,16) : '';
  $('actEnd').value = a.end_time ? a.end_time.slice(0,16) : '';
  $('actLocation').value = a.location||'';
  $('actCapacity').value = a.capacity||'';
  $('actDesc').value = a.description||'';
  openModal('addActivityModal');
}
function deleteActivity(id) {
  confirm('确定删除该活动？', async () => {
    await ActivitySvc.delete(id); closeModal('activityDetailModal');
    showToast('已删除'); await renderActivityList();
  });
}

// ===== 我的页 =====
function renderMePage() {
  const guestPrompt = $('guestPrompt');
  const meContent = $('meContent');
  
  if (!currentUser) {
    // 游客：显示登录提示
    if (guestPrompt) guestPrompt.style.display = '';
    if (meContent) meContent.style.display = 'none';
    return;
  }
  
  // 已登录：显示用户内容
  if (guestPrompt) guestPrompt.style.display = 'none';
  if (meContent) meContent.style.display = '';
  
  const u = currentUser;
  $('meHero').innerHTML = `
    <div class="me-avatar">${avatarHtml(u.avatar, u.name||u.username, 'me-avatar')}</div>
    <div class="me-info">
      <div class="me-name">${u.name||u.username}</div>
      <div class="me-role">${roleLabel(u.role)}</div>
      <div class="me-meta">${u.school||''}${u.classname?' · '+u.classname:''}</div>
    </div>
  `;
  const av = $('composeAvatar');
  if (av) av.innerHTML = avatarHtml(u.avatar, u.name||u.username, 'feed-avatar');
  loadProfileForm();
  renderMyPosts();
}
function roleLabel(r) {
  return {superadmin:'总管理员',school_admin:'学校管理员',grade_admin:'年级管理员',class_admin:'班级管理员',user:'普通用户'}[r]||r;
}
function switchMeTab(btn, panel) {
  document.querySelectorAll('.me-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  $('mePostsPanel').style.display = panel==='posts' ? '' : 'none';
  $('meProfilePanel').style.display = panel==='profile' ? '' : 'none';
  $('meSettingsPanel').style.display = panel==='settings' ? '' : 'none';
}
async function renderMyPosts() {
  const posts = (await PostSvc.getAll()).filter(p => p.author_id === currentUser.id);
  $('myPostsList').innerHTML = posts.length ? posts.map(p => `
    <div class="feed-item">
      <div class="feed-avatar">${avatarHtml(p.avatar, p.author, 'feed-avatar')}</div>
      <div class="feed-body">
        <div class="feed-meta">
          <span class="feed-name">${p.author}</span>
          <span class="feed-time">${fmtDate(p.createdAt)}</span>
          <button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="deletePost('${p.id}')">删除</button>
        </div>
        <div class="feed-content">${p.content}</div>
        ${p.image?`<img class="feed-img" src="${p.image}" onclick="openImagePreview('${p.image}')" style="cursor:pointer" alt="">`:''}
      </div>
    </div>`).join('') : '<div class="empty-state"><div class="empty-state-icon">📭</div><p>还没有发布动态</p></div>';
}
async function submitPost() {
  const content = $('postContent').value.trim();
  if (!content) { showToast('请输入内容'); return; }
  try {
    await PostSvc.add({ content, image: postImageData,
      author: currentUser.name||currentUser.username, author_id: currentUser.id,
      avatar: currentUser.avatar||'', school: currentUser.school||'' });
    $('postContent').value = ''; postImageData = '';
    $('postImagePreview').innerHTML = '';
    showToast('发布成功'); renderMyPosts(); renderHomeFeed();
  } catch (e) {
    showToast('发布失败: ' + (e.message || '请检查网络'));
  }
}
function handlePostImage(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    postImageData = e.target.result;
    $('postImagePreview').innerHTML = `<img class="post-img-preview" src="${postImageData}" alt="">`;
  };
  reader.readAsDataURL(file);
}
function deletePost(id) {
  confirm('确定删除该动态？', async () => { await PostSvc.delete(id); await renderMyPosts(); await renderHomeFeed(); showToast('已删除'); });
}

// 点赞/取消点赞
async function togglePostLike(postId, btn) {
  if (!Auth.requireAuth()) return;
  
  const icon = btn.querySelector('.action-icon');
  const count = btn.querySelector('.action-count');
  
  try {
    const result = await PostSvc.toggleLike(postId);
    
    if (result.liked) {
      // 已点赞
      icon.textContent = '❤️';
      icon.style.color = '#ef4444';
      btn.classList.add('liked');
    } else {
      // 取消点赞
      icon.textContent = '♡';
      icon.style.color = '';
      btn.classList.remove('liked');
    }
    
    count.textContent = result.count;
    
    // 重新加载点赞列表
    const likes = await PostSvc.getLikes(postId);
    renderLikersList(postId, likes.likers || [], result.count);
  } catch (e) {
    console.error('点赞失败:', e);
    showToast('操作失败');
  }
}

// 加载动态点赞状态
async function loadPostLikes() {
  if (!currentUser) return;
  
  const buttons = document.querySelectorAll('.feed-action-btn');
  for (const btn of buttons) {
    const postId = btn.dataset.postId;
    try {
      const likes = await PostSvc.getLikes(postId);
      const icon = btn.querySelector('.action-icon');
      const count = btn.querySelector('.action-count');
      
      count.textContent = likes.count;
      
      if (likes.liked) {
        icon.textContent = '❤️';
        icon.style.color = '#ef4444';
        btn.classList.add('liked');
      }
      
      // 显示点赞用户列表
      renderLikersList(postId, likes.likers || [], likes.count);
    } catch (e) {
      console.error('加载点赞状态失败:', e);
    }
  }
}

// 渲染点赞用户列表
function renderLikersList(postId, likers, totalCount) {
  console.log(`渲染点赞列表 - 动态ID: ${postId}, 点赞数: ${totalCount}, 用户数: ${likers.length}`);
  console.log('点赞用户:', likers);
  
  const likersEl = document.getElementById(`likers-${postId}`);
  if (!likersEl) {
    console.warn(`找不到点赞容器: likers-${postId}`);
    return;
  }
  
  if (likers.length === 0 || totalCount === 0) {
    console.log('无点赞，隐藏列表');
    likersEl.style.display = 'none';
    return;
  }
  
  // 显示最多3个用户名
  const displayNames = likers.slice(0, 3).map(u => u.name);
  let namesText = displayNames.join('、');
  
  if (totalCount > 3) {
    namesText += ` 等${totalCount}人`;
  } else if (totalCount > 0) {
    namesText += ' 觉得很赞';
  }
  
  console.log(`显示文本: ${namesText}`);
  likersEl.querySelector('.feed-likers-names').textContent = namesText;
  likersEl.style.display = 'block';
}
function loadProfileForm() {
  const u = currentUser;
  $('profileName').value = u.name||'';
  $('profileSchool').value = u.school||'';
  $('profileLevel').value = u.level||'';
  $('profileYear').value = u.year||'';
  $('profileClass').value = u.classname||'';
  $('profileJob').value = u.job||'';
  $('profileCity').value = u.city||'';
  $('profileBio').value = u.bio||'';
  $('profileAvatarUrl').value = u.avatar||'';
  const prev = $('avatarPreview');
  if (u.avatar) { prev.innerHTML = `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover" alt="">`; }
  else { prev.textContent = '📷'; }
}
async function saveProfile() {
  try {
    const name = $('profileName').value.trim();
    const school = $('profileSchool').value;
    const level = $('profileLevel').value;
    const yearValue = $('profileYear').value.trim();
    const classValue = $('profileClass').value.trim();
    
    // 验证班级（如果填写了）
    let classname = '';
    if (classValue) {
      if (!/^\d{1,2}$/.test(classValue)) {
        showToast('班级必须是1-20的数字');
        return;
      }
      classname = parseInt(classValue);
      if (classname < 1 || classname > 20) {
        showToast('班级必须在1-20之间');
        return;
      }
    }
    
    // 验证入学年份（如果填写了）
    let year = '';
    if (yearValue) {
      if (!/^\d{4}$/.test(yearValue)) {
        showToast('入学年份必须是4位数字');
        return;
      }
      year = parseInt(yearValue);
      if (year < 1950 || year > 2030) {
        showToast('入学年份应在1950-2030之间');
        return;
      }
    }
    
    const data = { 
      name, 
      school, 
      level, 
      year,
      classname, 
      job: $('profileJob').value.trim(), 
      city: $('profileCity').value.trim(), 
      bio: $('profileBio').value.trim(), 
      avatar: profileAvatarData || $('profileAvatarUrl').value.trim() 
    };
    
    await UserSvc.updateProfile(data);
    currentUser = await UserSvc.getMe();
    profileAvatarData = '';
    showToast('资料已保存', 'success');
    await renderMePage();
  } catch (e) {
    console.error('保存资料失败:', e);
    showToast('保存失败: ' + (e.message || '请检查网络'), 'error');
  }
}
function handleAvatarChange(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    profileAvatarData = e.target.result;
    const prev = $('avatarPreview');
    prev.innerHTML = `<img src="${profileAvatarData}" style="width:100%;height:100%;object-fit:cover" alt="">`;
  };
  reader.readAsDataURL(file);
}
function previewAvatarUrl(url) {
  const prev = $('avatarPreview');
  if (url) { prev.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.textContent='📷'" alt="">`; }
  else { prev.textContent = '📷'; }
}

// ===== 管理页 =====
async function renderAdminPage() {
  const pending = (await AlumniSvc.getPending()).filter(a => Perm.canManageAlumni(currentUser, a));
  const managed = (await AlumniSvc.getAll()).filter(a => Perm.canManageAlumni(currentUser, a));
  const users = await UserSvc.getAll();
  $('adminPendingCount').textContent = pending.length;
  $('adminAlumniCount').textContent = managed.length;
  const uc = $('adminUserCount'); if (uc) uc.textContent = users.length;
}
async function showAdminSection(section) {
  if (section === 'pending') await renderAdminPending();
  if (section === 'alumni') await renderAdminAlumni();
  if (section === 'schools') await renderAdminSchools();
  if (section === 'users') await renderAdminUsers();
}
async function renderAdminPending() {
  const list = (await AlumniSvc.getPending()).filter(a => Perm.canManageAlumni(currentUser, a));
  $('adminContent').innerHTML = `<div class="admin-section">
    <div class="admin-section-title">待审核校友（${list.length}）</div>
    <div class="pending-list">${list.length ? list.map(a => `
      <div class="pending-item">
        <div class="alumni-avatar" style="width:40px;height:40px">${avatarHtml(a.avatar,a.name,'alumni-avatar')}</div>
        <div class="pending-info">
          <div class="pending-name">${a.name}</div>
          <div class="pending-meta">${a.school||''} ${a.year||''}届 ${a.classname||''}班</div>
        </div>
        <div class="pending-actions">
          <button class="btn btn-success btn-sm" onclick="approveAlumni('${a.id}')">通过</button>
          <button class="btn btn-danger btn-sm" onclick="rejectAlumni('${a.id}')">拒绝</button>
          <button class="btn btn-secondary btn-sm" onclick="showAlumniDetail('${a.id}')">详情</button>
        </div>
      </div>`).join('') : '<div class="empty-state"><div class="empty-state-icon">✅</div><p>暂无待审核</p></div>'}
    </div>
  </div>`;
}
async function renderAdminAlumni() {
  const list = (await AlumniSvc.getAll()).filter(a => Perm.canManageAlumni(currentUser, a));
  $('adminContent').innerHTML = `<div class="admin-section">
    <div class="admin-section-title">校友管理（${list.length}）</div>
    <table class="admin-table">
      <thead><tr><th>姓名</th><th>学校</th><th>年份/班级</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>${list.map(a => `<tr>
        <td>${a.name}</td><td>${a.school||'-'}</td>
        <td>${a.year||''}${a.classname?' '+a.classname:''}</td>
        <td><span class="badge ${a.status==='approved'?'badge-green':a.status==='pending'?'badge-warn':'badge-danger'}">${{approved:'已通过',pending:'待审核',rejected:'已拒绝'}[a.status]||a.status}</span></td>
        <td style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm" onclick="showAlumniDetail('${a.id}')">详情</button>
          <button class="btn btn-danger btn-sm" onclick="deleteAlumni('${a.id}')">删除</button>
        </td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;
}
async function renderAdminUsers() {
  if (!Perm.isSuperAdmin(currentUser)) return;
  const list = await UserSvc.getAll();
  $('adminContent').innerHTML = `<div class="admin-section">
    <div class="admin-section-title">用户管理（${list.length}）<button class="btn btn-primary btn-sm" onclick="openAddUser()">添加用户</button></div>
    <table class="admin-table">
      <thead><tr><th>用户名</th><th>昵称</th><th>角色</th><th>操作</th></tr></thead>
      <tbody>${list.map(u => `<tr>
        <td>${u.username}</td><td>${u.name||'-'}</td>
        <td>${roleLabel(u.role)}</td>
        <td style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm" onclick="editUser('${u.id}')">编辑</button>
          ${u.id!==currentUser.id?`<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">删除</button>`:''}
        </td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;
}

async function renderAdminSchools() {
  if (!Perm.isSuperAdmin(currentUser)) return;
  
  // 从 API 加载学校数据
  const res = await fetch('/api/schools');
  const data = await res.json();
  const list = data.data || [];
  
  $('adminContent').innerHTML = `<div class="admin-section">
    <div class="admin-section-title">学校管理（${list.length}）<button class="btn btn-primary btn-sm" onclick="openAddSchool()">添加学校</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:12px">
      ${list.map(s => `
        <div class="school-manage-card" style="background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:all 0.3s">
          <div style="height:120px;background-image:url('${s.image || ''}');background-size:cover;background-position:center;position:relative">
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(to bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.5))"></div>
            <div style="position:absolute;bottom:8px;left:12px;color:#fff;font-size:16px;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,0.3)">${s.name}</div>
          </div>
          <div style="padding:12px">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${s.description || '暂无简介'}</div>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <span style="font-size:11px;background:${s.color};color:#fff;padding:2px 8px;border-radius:10px">${s.icon || '🏫'}</span>
              <span style="font-size:12px;color:var(--text-muted)">${s.founded_year ? s.founded_year + '年建校' : ''}</span>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-secondary btn-sm" style="flex:1" onclick="editSchool('${s.id}')">编辑</button>
              <button class="btn btn-danger btn-sm" onclick="deleteSchool('${s.id}','${s.name}')">删除</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function openAddSchool() {
  $('schoolModalTitle').textContent = '添加学校';
  $('editSchoolId').value = '';
  $('sName').value = '';
  $('sShort').value = '';
  $('sIcon').value = '🏫';
  $('sImage').value = '';
  $('sColor').value = '#1a6fc4';
  $('sYear').value = '';
  $('sDesc').value = '';
  // 重置图片预览
  $('schoolImagePreviewImg').style.display = 'none';
  $('schoolImagePlaceholder').style.display = 'block';
  $('schoolImageUpload').value = '';
  openModal('addSchoolModal');
}

// 处理学校图片上传
async function handleSchoolImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件');
    return;
  }
  
  // 验证文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过5MB');
    return;
  }
  
  showToast('正在上传图片...');
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('nb_token');
    const res = await fetch('/api/upload/school-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await res.json();
    if (result.code === 200) {
      const imageUrl = result.data.url;
      $('sImage').value = imageUrl;
      // 显示预览
      $('schoolImagePreviewImg').src = imageUrl;
      $('schoolImagePreviewImg').style.display = 'block';
      $('schoolImagePlaceholder').style.display = 'none';
      showToast('图片上传成功');
    } else {
      showToast(result.message || '上传失败');
    }
  } catch (e) {
    console.error('[School] Image upload error:', e);
    showToast('上传失败: ' + e.message);
  }
}

// 预览学校图片URL
function previewSchoolImageUrl(url) {
  if (url && url.trim()) {
    $('schoolImagePreviewImg').src = url.trim();
    $('schoolImagePreviewImg').style.display = 'block';
    $('schoolImagePlaceholder').style.display = 'none';
  } else {
    $('schoolImagePreviewImg').style.display = 'none';
    $('schoolImagePlaceholder').style.display = 'block';
  }
}

async function editSchool(id) {
  const res = await fetch('/api/schools');
  const data = await res.json();
  const s = data.data.find(x => x.id === id);
  if (!s) return;
  
  $('schoolModalTitle').textContent = '编辑学校';
  $('editSchoolId').value = id;
  $('sName').value = s.name || '';
  $('sShort').value = s.short_name || '';
  $('sIcon').value = s.icon || '🏫';
  $('sImage').value = s.image || '';
  $('sColor').value = s.color || '#1a6fc4';
  $('sYear').value = s.founded_year || '';
  $('sDesc').value = s.description || '';
  
  // 显示图片预览
  if (s.image) {
    $('schoolImagePreviewImg').src = s.image;
    $('schoolImagePreviewImg').style.display = 'block';
    $('schoolImagePlaceholder').style.display = 'none';
  } else {
    $('schoolImagePreviewImg').style.display = 'none';
    $('schoolImagePlaceholder').style.display = 'block';
  }
  
  openModal('addSchoolModal');
}

async function saveSchool() {
  const name = $('sName').value.trim();
  if (!name) { showToast('请填写学校名称'); return; }
  
  const editId = $('editSchoolId').value;
  const data = {
    name,
    short_name: $('sShort').value.trim(),
    icon: $('sIcon').value || '🏫',
    image: $('sImage').value.trim(),
    color: $('sColor').value,
    founded_year: parseInt($('sYear').value) || null,
    description: $('sDesc').value.trim()
  };
  
  try {
    const token = localStorage.getItem('nb_token');
    const url = editId ? `/api/schools/${editId}` : '/api/schools';
    const method = editId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    const result = await res.json();
    if (result.code === 200) {
      showToast(editId ? '学校已更新' : '学校已添加');
      closeModal('addSchoolModal');
      await renderAdminSchools();
      // 重新加载学校数据到全局
      await loadSchools();
      // 刷新首页
      if (currentPage === 'home') {
        await renderHomePage();
      }
    } else {
      showToast(result.message || '操作失败');
    }
  } catch (e) {
    showToast('网络错误: ' + e.message);
  }
}

async function deleteSchool(id, name) {
  showConfirm(`确定删除学校「${name}」吗？`, async () => {
    try {
      const token = localStorage.getItem('nb_token');
      const res = await fetch(`/api/schools/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      if (result.code === 200) {
        showToast('学校已删除');
        await renderAdminSchools();
        await loadSchools();
        if (currentPage === 'home') {
          await renderHomePage();
        }
      } else {
        showToast(result.message || '删除失败');
      }
    } catch (e) {
      showToast('网络错误: ' + e.message);
    }
  });
}
function openAddUser() {
  $('userModalTitle').textContent = '添加用户';
  $('editUserId').value = '';
  $('uUsername').value = ''; $('uPassword').value = '';
  $('uName').value = ''; $('uRole').value = 'user';
  renderAdminScopeFields();
  openModal('addUserModal');
}
async function editUser(id) {
  const u = await UserSvc.getById(id); if (!u) return;
  $('userModalTitle').textContent = '编辑用户';
  $('editUserId').value = id;
  $('uUsername').value = u.username||'';
  $('uPassword').value = '';
  $('uName').value = u.name||'';
  $('uRole').value = u.role||'user';
  renderAdminScopeFields(u.adminScope);
  openModal('addUserModal');
}
function renderAdminScopeFields(scope) {
  const role = $('uRole').value;
  let html = '';
  if (role === 'school_admin' || role === 'grade_admin' || role === 'class_admin') {
    html += `<div class="form-group"><label>管辖学校</label><select id="scopeSchool">
      <option value="">请选择</option>${SCHOOLS.map(s=>`<option value="${s.name}" ${scope?.school===s.name?'selected':''}>${s.name}</option>`).join('')}
    </select></div>`;
  }
  if (role === 'grade_admin' || role === 'class_admin') {
    html += `<div class="form-row">
      <div class="form-group"><label>学段</label><select id="scopeLevel">
        <option value="">全部</option><option value="初中" ${scope?.level==='初中'?'selected':''}>初中</option><option value="高中" ${scope?.level==='高中'?'selected':''}>高中</option>
      </select></div>
      <div class="form-group"><label>年份</label><input type="number" id="scopeYear" placeholder="如 2010" value="${scope?.year||''}"></div>
    </div>`;
  }
  if (role === 'class_admin') {
    html += `<div class="form-group"><label>班级</label><input type="text" id="scopeClass" placeholder="如 高三(2)班" value="${scope?.classname||''}"></div>`;
  }
  $('adminScopeFields').innerHTML = html;
}
async function saveUser() {
  try {
    const username = $('uUsername').value.trim(), role = $('uRole').value;
    if (!username) { showToast('请填写用户名'); return; }
    const editId = $('editUserId').value;
    const scope = {};
    const ss = $('scopeSchool'); if (ss) scope.school = ss.value;
    const sl = $('scopeLevel'); if (sl) scope.level = sl.value;
    const sy = $('scopeYear'); if (sy) scope.year = parseInt(sy.value)||'';
    const sc = $('scopeClass'); if (sc) scope.classname = sc.value.trim();
    const data = { username, role, name: $('uName').value.trim(), adminScope: scope };
    const pw = $('uPassword').value;
    if (pw) data.password = pw;
    if (editId) { await UserSvc.update(editId, data); showToast('已更新'); }
    else {
      if (!pw) { showToast('请填写密码'); return; }
      await UserSvc.add(data); showToast('用户已添加');
    }
    closeModal('addUserModal');
    await renderAdminUsers();
  } catch (e) {
    showToast('保存失败: ' + (e.message || '请检查网络'));
  }
}
function deleteUser(id) {
  confirm('确定删除该用户？', async () => { await UserSvc.delete(id); await renderAdminUsers(); showToast('已删除'); });
}

// ===== 重置数据 =====
function resetData() { DataStore.reset(); }

// ===== 下拉刷新模块 =====
(function initPullRefresh() {
  const appBody = document.querySelector('.app-body');
  const pullRefresh = document.getElementById('pullRefresh');
  if (!appBody || !pullRefresh) return;

  let startY = 0;
  let pulling = false;
  let isRefreshing = false;
  const THRESHOLD = 60; // 触发刷新的下拉距离

  const pullText = pullRefresh.querySelector('.pull-refresh-text');

  appBody.addEventListener('touchstart', function(e) {
    if (isRefreshing) return;
    if (appBody.scrollTop <= 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  appBody.addEventListener('touchmove', function(e) {
    if (!pulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    let pullDist = (currentY - startY) * 0.4; // 阻尼系数
    
    if (pullDist > 0 && appBody.scrollTop <= 0) {
      pullDist = Math.min(pullDist, 80);
      pullRefresh.style.transform = `translateY(${pullDist + 60}px)`;
      pullRefresh.classList.add('pulling');
      pullRefresh.classList.remove('refreshing');
      
      if (pullDist >= THRESHOLD) {
        pullText.textContent = '松开刷新';
      } else {
        pullText.textContent = '下拉刷新';
      }
    }
  }, { passive: true });

  appBody.addEventListener('touchend', async function(e) {
    if (!pulling || isRefreshing) return;
    pulling = false;
    
    const endY = e.changedTouches[0].clientY;
    const pullDist = (endY - startY) * 0.4;
    
    if (pullDist >= THRESHOLD && appBody.scrollTop <= 0) {
      // 触发刷新
      isRefreshing = true;
      pullRefresh.style.transform = `translateY(${60 + 60}px)`;
      pullRefresh.classList.remove('pulling');
      pullRefresh.classList.add('refreshing');
      pullText.textContent = '刷新中...';
      
      try {
        await doRefresh();
      } catch(e) {
        console.error('刷新失败:', e);
      }
      
      // 刷新完成，收起
      pullText.textContent = '刷新完成';
      await new Promise(r => setTimeout(r, 500));
      pullRefresh.style.transition = 'transform 0.3s ease';
      pullRefresh.style.transform = '';
      pullRefresh.classList.remove('refreshing');
      pullText.textContent = '下拉刷新';
      
      await new Promise(r => setTimeout(r, 300));
      pullRefresh.style.transition = '';
      isRefreshing = false;
    } else {
      // 未达阈值，回弹
      pullRefresh.style.transition = 'transform 0.3s ease';
      pullRefresh.style.transform = '';
      pullRefresh.classList.remove('pulling');
      
      await new Promise(r => setTimeout(r, 300));
      pullRefresh.style.transition = '';
    }
  });

  // 根据当前活跃页面刷新数据
  async function doRefresh() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const pageId = activePage.id.replace('page-', '');
    
    // 重置分页状态
    if (pagination[pageId]) {
      pagination[pageId].page = 1;
      pagination[pageId].hasMore = true;
      pagination[pageId].loading = false;
      pagination[pageId].allData = [];
    }
    
    // 调用现有的渲染函数刷新数据
    switch(pageId) {
      case 'home': 
        if (typeof renderHomePage === 'function') await renderHomePage();
        break;
      case 'alumni':
        if (typeof renderAlumniList === 'function') await renderAlumniList();
        break;
      case 'resource':
        if (typeof renderResourceList === 'function') await renderResourceList();
        break;
      case 'activity':
        if (typeof renderActivityList === 'function') await renderActivityList();
        break;
      case 'admin':
        if (typeof renderAdminPage === 'function') await renderAdminPage();
        break;
      case 'me':
        if (typeof renderMePage === 'function') await renderMePage();
        break;
    }
  }
})();

// ===== 触底加载更多模块 =====
(function initScrollLoad() {
  const appBody = document.querySelector('.app-body');
  if (!appBody) return;
  
  let scrollTimer = null;
  
  appBody.addEventListener('scroll', function() {
    if (scrollTimer) return;
    scrollTimer = requestAnimationFrame(() => {
      scrollTimer = null;
      
      const { scrollTop, clientHeight, scrollHeight } = appBody;
      // 距离底部100px时触发加载
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onReachBottom();
      }
    });
  }, { passive: true });
  
  async function onReachBottom() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    const pageId = activePage.id.replace('page-', '');
    
    if (pagination[pageId] && pagination[pageId].hasMore && !pagination[pageId].loading) {
      await loadMore(pageId);
    }
  }
})();

// 加载更多数据
async function loadMore(pageId) {
  const state = pagination[pageId];
  if (!state || state.loading || !state.hasMore) return;
  
  state.loading = true;
  const indicatorId = 'loadMore' + pageId.charAt(0).toUpperCase() + pageId.slice(1);
  const indicator = document.getElementById(indicatorId);
  if (indicator) {
    indicator.style.display = 'flex';
    indicator.classList.remove('no-more');
    const textEl = indicator.querySelector('.load-more-text');
    if (textEl) textEl.textContent = '加载中...';
  }
  
  try {
    state.page++;
    
    // 根据 pageId 获取对应数据并追加到列表
    let items = [];
    switch(pageId) {
      case 'alumni':
        items = await fetchAlumniPage(state.page, state.pageSize);
        appendAlumniItems(items);
        break;
      case 'resource':
        items = await fetchResourcePage(state.page, state.pageSize);
        appendResourceItems(items);
        break;
      case 'activity':
        items = await fetchActivityPage(state.page, state.pageSize);
        appendActivityItems(items);
        break;
    }
    
    if (items.length < state.pageSize) {
      state.hasMore = false;
      if (indicator) {
        indicator.classList.add('no-more');
        const textEl = indicator.querySelector('.load-more-text');
        if (textEl) textEl.textContent = '没有更多了';
      }
    }
  } catch(e) {
    console.error('加载更多失败:', e);
    state.page--; // 回退页码
    if (indicator) {
      const textEl = indicator.querySelector('.load-more-text');
      if (textEl) textEl.textContent = '加载失败，请重试';
    }
  }
  
  state.loading = false;
}

// 获取校友列表指定页数据（从缓存数据分页）
async function fetchAlumniPage(page, pageSize) {
  // 从缓存的 allData 中分页
  const list = pagination.alumni.allData;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return list.slice(start, end);
}

// 获取资源列表指定页数据（从缓存数据分页）
async function fetchResourcePage(page, pageSize) {
  // 从缓存的 allData 中分页
  const list = pagination.resource.allData;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return list.slice(start, end);
}

// 获取活动列表指定页数据（从缓存数据分页）
async function fetchActivityPage(page, pageSize) {
  // 从缓存的 allData 中分页
  const list = pagination.activity.allData;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return list.slice(start, end);
}

// 将新数据追加到现有校友列表DOM
function appendAlumniItems(items) {
  const container = document.getElementById('alumniList');
  if (!container || items.length === 0) return;
  
  // 如果当前显示的是空状态，先清空
  if (container.querySelector('.empty-state')) {
    container.innerHTML = '';
  }
  
  const html = items.map(a => alumniCardHtml(a)).join('');
  container.insertAdjacentHTML('beforeend', html);
}

// 将新数据追加到现有资源列表DOM
function appendResourceItems(items) {
  const container = document.getElementById('resourceList');
  if (!container || items.length === 0) return;
  
  // 如果当前显示的是空状态，先清空
  if (container.querySelector('.empty-state')) {
    container.innerHTML = '';
  }
  
  const html = items.map(r => resourceCardHtml(r)).join('');
  container.insertAdjacentHTML('beforeend', html);
}

// 将新数据追加到现有活动列表DOM
function appendActivityItems(items) {
  const container = document.getElementById('activityList');
  if (!container || items.length === 0) return;
  
  // 如果当前显示的是空状态，先清空
  if (container.querySelector('.empty-state')) {
    container.innerHTML = '';
  }
  
  const html = items.map(a => actCardHtml(a)).join('');
  container.insertAdjacentHTML('beforeend', html);
}

// ============ 手势滑动切换Tab ============
(function initSwipeGesture() {
  const appBody = document.querySelector('.app-body');
  if (!appBody) return;

  const TAB_ORDER = ['home', 'alumni', 'resource', 'activity', 'me'];
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let swiping = false;

  appBody.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    swiping = true;
  }, { passive: true });

  appBody.addEventListener('touchmove', function(e) {
    if (!swiping) return;
    // 如果垂直滑动距离大于水平，取消手势识别（用户在滚动页面）
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dy > dx + 10) {
      swiping = false;
    }
  }, { passive: true });

  appBody.addEventListener('touchend', function(e) {
    if (!swiping) return;
    swiping = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartX;
    const dy = endY - touchStartY;
    const dt = Date.now() - touchStartTime;

    // 条件：水平位移 > 80px，水平 > 垂直，时间 < 500ms
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) || dt > 500) return;

    // 获取当前活跃页面
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    const currentPageId = activePage.id.replace('page-', '');
    const currentIndex = TAB_ORDER.indexOf(currentPageId);
    if (currentIndex === -1) return;

    // 检查是否有弹窗/模态框打开，如果有就不触发
    const modal = document.querySelector('.modal.open');
    if (modal) return;

    if (dx < 0 && currentIndex < TAB_ORDER.length - 1) {
      // 向左滑 -> 切换到右侧 tab
      navigateTo(TAB_ORDER[currentIndex + 1], 'slideLeft');
    } else if (dx > 0 && currentIndex > 0) {
      // 向右滑 -> 切换到左侧 tab
      navigateTo(TAB_ORDER[currentIndex - 1], 'slideRight');
    }
  }, { passive: true });
})();
