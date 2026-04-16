// ===== 全局状态 =====
let currentUser = null;
let filterState = { school: '', level: '', year: '', classname: '' };
let resTab = 'all', actTab = 'all';
let postImageData = '';
let alumniAvatarData = '';
let profileAvatarData = '';
let schoolChartInstance = null;
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
function showToast(msg, duration = 2000) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }
function confirm(msg, cb) {
  $('confirmMsg').textContent = msg;
  const btn = $('confirmOk');
  btn.onclick = () => { closeModal('confirmModal'); cb(); };
  openModal('confirmModal');
}
function avatarHtml(avatar, name, cls = '') {
  if (avatar) return `<img src="${avatar}" onerror="this.style.display='none';this.nextSibling.style.display='flex'" alt=""><span style="display:none" class="${cls}-text">${(name||'?')[0]}</span>`;
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
  if (token) {
    try {
      // 尝试获取当前用户信息
      const user = await UserSvc.getMe();
      if (user) {
        currentUser = user;
      }
    } catch (err) {
      // Token 无效，清除
      localStorage.removeItem('nb_token');
      localStorage.removeItem('nb_session');
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
  // 异步登录
  UserSvc.login(u, p).then(user => {
    if (!user) { $('loginError').style.display = 'block'; return; }
    $('loginError').style.display = 'none';
    currentUser = user;
    localStorage.setItem('nb_session', user.id);
    $('loginPage').style.display = 'none';
    startApp();
  }).catch(err => {
    console.error('登录失败:', err);
    $('loginError').style.display = 'block';
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
  const isLoggedIn = !!currentUser;
  
  // 管理员权限控制
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  const isSuperAdmin = Perm.isSuperAdmin(currentUser);
  document.querySelectorAll('.superadmin-only').forEach(el => {
    el.style.display = isSuperAdmin ? '' : 'none';
  });
  
  // 登录用户可见的操作按钮（添加校友、发布资源等）
  document.querySelectorAll('.login-required').forEach(el => {
    el.style.display = isLoggedIn ? '' : 'none';
  });
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
    renderSchoolChart(alumni);
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

function renderSchoolChart(alumni) {
  const counts = SCHOOLS.map(s => alumni.filter(a => a.school === s.name).length);
  const el = $('schoolChart');
  if (schoolChartInstance) { schoolChartInstance.dispose(); }
  schoolChartInstance = echarts.init(el);

  const colors = [
    ['#4338ca','#818cf8'],['#7c3aed','#a78bfa'],['#059669','#34d399'],
    ['#d97706','#fbbf24'],['#dc2626','#f87171'],['#0891b2','#22d3ee']
  ];
  const labels = SCHOOLS.map(s => s.name.replace('中学','中').replace('南部','南'));

  schoolChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#4338ca', fontSize: 10, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#818cf8', fontSize: 9 }
    },
    series: [{
      name: '校友人数',
      type: 'bar',
      data: counts.map((v, i) => ({
        value: v,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[i][0] },
            { offset: 1, color: colors[i][1] }
          ])
        },
        label: {
          show: true, position: 'top',
          formatter: v > 0 ? v : '',
          textStyle: { color: '#1e1b4b', fontSize: 11, fontWeight: 'bold' }
        }
      })),
      barWidth: '40%'
    }]
  });
}

function renderSchoolsList(alumni) {
  $('schoolsList').innerHTML = SCHOOLS.map(s => {
    const cnt = alumni.filter(a => a.school === s.name).length;
    return `<div class="school-card" onclick="filterBySchool('${s.name}')">
      <div class="school-card-icon">${s.icon}</div>
      <div class="school-card-name">${s.name}</div>
      <div class="school-card-count">${cnt} 位校友</div>
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
}

function feedItemHtml(p) {
  return `<div class="feed-item">
    <div class="feed-avatar">${avatarHtml(p.avatar, p.author, 'feed-avatar')}</div>
    <div class="feed-body">
      <div class="feed-meta">
        <span class="feed-name">${p.author}</span>
        <span class="feed-school">${p.school||''}</span>
        <span class="feed-time">${fmtDate(p.createdAt)}</span>
      </div>
      <div class="feed-content">${p.content}</div>
      ${p.image ? `<img class="feed-img" src="${p.image}" alt="">` : ''}
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
      ${a.classname?`<span class="alumni-tag">${a.classname}</span>`:''}
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
  const posts = (await PostSvc.getAll()).filter(p => p.authorId && a.userId && p.authorId === a.userId).slice(0, 5);
  const resources = (await ResourceSvc.getAll()).filter(r => r.authorId && a.userId && r.authorId === a.userId);
  const activities = (await ActivitySvc.getAll()).filter(act => (act.signups||[]).find(s => a.userId && s.userId === a.userId));

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
          ${a.classname?`<span class="alumni-tag">${a.classname}</span>`:''}
          ${a.status==='pending'?`<span class="alumni-tag" style="color:var(--warning)">待审核</span>`:''}
        </div>
      </div>
    </div>
    <div class="detail-info-grid">
      <div class="detail-info-item"><div class="detail-info-label">城市</div><div class="detail-info-value">📍 ${a.city||'未填写'}</div></div>
      <div class="detail-info-item"><div class="detail-info-label">联系电话</div><div class="detail-info-value">${canManage&&a.phone?a.phone:'🔒 仅管理员可见'}</div></div>
    </div>
    ${a.bio?`<div class="detail-bio">${a.bio}</div>`:''}
    <div class="detail-tabs">
      <button class="detail-tab active" onclick="switchDetailTab(this,'dtPosts')">动态(${posts.length})</button>
      <button class="detail-tab" onclick="switchDetailTab(this,'dtRes')">资源(${resources.length})</button>
      <button class="detail-tab" onclick="switchDetailTab(this,'dtAct')">活动(${activities.length})</button>
    </div>
    <div id="dtPosts">${posts.length?posts.map(p=>feedItemHtml(p)).join(''):'<div class="empty-state"><div class="empty-state-icon">📭</div><p>暂无动态</p></div>'}</div>
    <div id="dtRes" style="display:none">${resources.length?resources.map(r=>`<div class="resource-card" style="margin-bottom:8px"><div class="resource-header"><span class="resource-type-badge ${resTypeClass(r.type)}">${resTypeName(r.type)}</span><span class="resource-title">${r.title}</span></div><div class="resource-desc">${r.desc}</div></div>`).join(''):'<div class="empty-state"><div class="empty-state-icon">📦</div><p>暂无资源</p></div>'}</div>
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
  const name = $('aName').value.trim(), school = $('aSchool').value;
  if (!name || !school) { showToast('请填写姓名和学校'); return; }
  const avatar = alumniAvatarData || $('aAvatarUrl').value.trim();
  const data = { name, school, level: $('aLevel').value, year: parseInt($('aYear').value)||'',
    classname: $('aClass').value.trim(), phone: $('aPhone').value.trim(),
    job: $('aJob').value.trim(), company: $('aCompany').value.trim(),
    city: $('aCity').value.trim(), bio: $('aBio').value.trim(), avatar,
    user_id: currentUser.id };
  const editId = $('editAlumniId').value;
  try {
    if (editId) {
      await AlumniSvc.update(editId, data); showToast('已更新');
    } else {
      await AlumniSvc.add(data); showToast('已提交，等待审核');
    }
    alumniAvatarData = '';
    closeModal('addAlumniModal');
    await renderAlumniList(); await renderAdminPage();
  } catch (e) {
    console.error('保存失败:', e);
    showToast('保存失败: ' + (e.message || '请检查网络'));
  }
}

function previewAlumniAvatar(url) {
  const el = $('alumniAvatarPreview');
  if (url) { el.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentNode.textContent='👤'">`; }
  else { el.textContent = '👤'; }
}
function handleAlumniAvatarFile(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { alumniAvatarData = e.target.result; previewAlumniAvatar(alumniAvatarData); };
  reader.readAsDataURL(file);
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
  return `<div class="resource-card">
    <div class="resource-header">
      <span class="resource-type-badge ${resTypeClass(r.type)}">${resTypeName(r.type)}</span>
      <span class="resource-title">${r.title}</span>
    </div>
    <div class="resource-desc">${r.desc}</div>
    <div class="resource-footer">
      <span>${r.author} · ${fmtDate(r.createdAt)}</span>
      <span class="resource-contact">${r.contact||''}</span>
      ${canDel?`<button class="btn btn-danger btn-sm" onclick="deleteResource('${r.id}')">删除</button>`:''}
    </div>
  </div>`;
}
async function saveResource() {
  const title = $('rTitle').value.trim(), desc = $('rDesc').value.trim();
  if (!title || !desc) { showToast('请填写标题和描述'); return; }
  const editId = $('editResId').value;
  const data = { title, type: $('rType').value, description: desc, contact: $('rContact').value.trim(),
    author: currentUser.name || currentUser.username, author_id: currentUser.id };
  try {
    if (editId) { await ResourceSvc.update(editId, data); showToast('已更新'); }
    else { await ResourceSvc.add(data); showToast('发布成功'); }
    closeModal('addResourceModal');
    $('rTitle').value=''; $('rDesc').value=''; $('rContact').value=''; $('editResId').value='';
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
  return `<div class="activity-card" onclick="showActivityDetail('${a.id}')">
    <div class="activity-status-bar ${barCls}"></div>
    <div class="activity-body">
      <div class="activity-name">${a.name}</div>
      <div class="activity-info">
        <div class="activity-info-row"><span>🕐</span><span>${fmtDateTime(a.startTime)}${a.endTime?' ~ '+fmtDateTime(a.endTime):''}</span></div>
        <div class="activity-info-row"><span>📍</span><span>${a.location||'待定'}</span></div>
        <div class="activity-info-row"><span>👤</span><span>发起人：${a.organizer?.name||'管理员'}</span></div>
      </div>
      <div class="activity-footer">
        <span class="activity-status-tag ${tagCls}">${statusLabel}</span>
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
  const isSignedUp = (a.signups||[]).find(s => s.userId === currentUser.id);
  const isFull = a.capacity > 0 && (a.signups||[]).length >= a.capacity;
  $('activityDetailBody').innerHTML = `
    <div style="margin-bottom:12px">
      <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:12px">${a.name}</div>
      <div class="activity-info">
        <div class="activity-info-row"><span>🕐</span><span>${fmtDateTime(a.startTime)}${a.endTime?' ~ '+fmtDateTime(a.endTime):''}</span></div>
        <div class="activity-info-row"><span>📍</span><span>${a.location||'待定'}</span></div>
        <div class="activity-info-row"><span>👤</span><span>发起人：${a.organizer?.name||'管理员'}</span></div>
      </div>
      ${a.desc?`<div class="detail-bio">${a.desc}</div>`:''}
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
  const editId = $('editActId').value;
  const data = { name, start_time: $('actStart').value, end_time: $('actEnd').value,
    location: $('actLocation').value.trim(), capacity: parseInt($('actCapacity').value)||0,
    description: $('actDesc').value.trim(),
    organizer_name: currentUser.name || currentUser.username,
    organizer_id: currentUser.id };
  try {
    if (editId) { await ActivitySvc.update(editId, data); showToast('已更新'); }
    else { await ActivitySvc.add(data); showToast('活动已发布'); }
    closeModal('addActivityModal');
    $('actName').value=''; $('actStart').value=''; $('actEnd').value='';
    $('actLocation').value=''; $('actCapacity').value=''; $('actDesc').value=''; $('editActId').value='';
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
        ${p.image?`<img class="feed-img" src="${p.image}" alt="">`:''}
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
    const data = { name: $('profileName').value.trim(), school: $('profileSchool').value,
      level: $('profileLevel').value, year: parseInt($('profileYear').value)||'',
      classname: $('profileClass').value.trim(), job: $('profileJob').value.trim(),
      city: $('profileCity').value.trim(), bio: $('profileBio').value.trim(),
      avatar: profileAvatarData || $('profileAvatarUrl').value.trim() };
    await UserSvc.updateProfile(data);
    currentUser = await UserSvc.getMe();
    profileAvatarData = '';
    showToast('资料已保存'); await renderMePage();
  } catch (e) {
    showToast('保存失败: ' + (e.message || '请检查网络'));
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
          <div class="pending-meta">${a.school||''} ${a.year||''} ${a.classname||''}</div>
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
