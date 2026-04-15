// ===== 全局状态 =====
let currentUser = null;
let filterState = { school: '', level: '', year: '', classname: '' };
let resTab = 'all', actTab = 'all';
let postImageData = '';
let alumniAvatarData = '';
let profileAvatarData = '';
let schoolChartInstance = null;

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
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    $('splashPage').style.display = 'none';
    const saved = localStorage.getItem('nb_session');
    if (saved) {
      const u = UserSvc.getById(saved);
      if (u) { currentUser = u; startApp(); return; }
    }
    $('loginPage').style.display = 'flex';
  }, 2000);
});

function doLogin() {
  const u = $('loginUser').value.trim(), p = $('loginPass').value;
  const user = UserSvc.login(u, p);
  if (!user) { $('loginError').style.display = 'block'; return; }
  $('loginError').style.display = 'none';
  currentUser = user;
  localStorage.setItem('nb_session', user.id);
  $('loginPage').style.display = 'none';
  startApp();
}

function doLogout() {
  localStorage.removeItem('nb_session');
  currentUser = null;
  $('mainApp').style.display = 'none';
  $('loginPage').style.display = 'flex';
}

async function startApp() {
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
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  const isSuperAdmin = Perm.isSuperAdmin(currentUser);
  document.querySelectorAll('.superadmin-only').forEach(el => {
    el.style.display = isSuperAdmin ? '' : 'none';
  });
}

// ===== 导航 =====
async function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = $('page-' + page);
  if (pg) pg.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');
  if (page === 'home') await renderHomePage();
  if (page === 'admin') await renderAdminPage();
  if (page === 'me') await renderMePage();
}

// ===== 首页 =====
async function renderHomePage() {
  try {
    const alumni = await AlumniSvc.getApproved();
    const activities = await ActivitySvc.getAll();
    const resources = await ResourceSvc.getAll();
    animateNum($('statAlumni'), alumni.length || 0);
    animateNum($('statActivities'), activities.length || 0);
    animateNum($('statResources'), resources.length || 0);
    renderSchoolChart(alumni);
    renderSchoolsList(alumni);
    await renderHomeFeed();
  } catch (e) {
    console.error('渲染首页失败:', e);
    // 显示默认值
    $('statAlumni').textContent = '0';
    $('statActivities').textContent = '0';
    $('statResources').textContent = '0';
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
    $('homeFeed').innerHTML = posts.length ? posts.map(p => feedItemHtml(p)).join('') :
      '<div class="empty-state"><div class="empty-state-icon">📭</div><p>暂无动态</p></div>';
  } catch (e) {
    $('homeFeed').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>加载失败</p></div>';
  }
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
  try {
    let list = await AlumniSvc.search(q, filterState.school, filterState.level, filterState.year, filterState.classname);
    // 管理员可看到自己权限范围内的 pending
    if (Perm.isAnyAdmin(currentUser)) {
      const pending = (await AlumniSvc.getPending()).filter(a => Perm.canManageAlumni(currentUser, a));
      const pendingIds = new Set(list.map(a => a.id));
      pending.forEach(a => { if (!pendingIds.has(a.id)) list.push(a); });
    }
    $('alumniList').innerHTML = list.length ? list.map(a => alumniCardHtml(a)).join('') :
      '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><p>暂无校友信息</p></div>';
  } catch (e) {
    console.error('渲染校友列表失败:', e);
    $('alumniList').innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><p>加载失败</p></div>';
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
          ${a.status==='pending'?`<span class="alumni-tag" style="color:var(--warn)">待审核</span>`:''}
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
  btn.classList.add('active'); resTab = type; await renderResourceList();
}
async function renderResourceList() {
  try {
    const list = await ResourceSvc.filter(resTab);
    $('resourceList').innerHTML = list.length ? list.map(r => resourceCardHtml(r)).join('') :
      '<div class="empty-state"><div class="empty-state-icon">📦</div><p>暂无资源</p></div>';
  } catch (e) {
    $('resourceList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>加载失败</p></div>';
  }
}
function resourceCardHtml(r) {
  const canDel = currentUser && (r.authorId === currentUser.id || Perm.isSuperAdmin(currentUser));
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
  btn.classList.add('active'); actTab = status; await renderActivityList();
}
async function renderActivityList() {
  try {
    const list = await ActivitySvc.filter(actTab);
    $('activityList').innerHTML = list.length ? list.map(a => actCardHtml(a)).join('') :
      '<div class="empty-state"><div class="empty-state-icon">🎉</div><p>暂无活动</p></div>';
  } catch (e) {
    $('activityList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎉</div><p>加载失败</p></div>';
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
      ${signups.length>12?`<div class="signup-avatar-item"><div class="signup-avatar-img" style="display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text3)">+${signups.length-12}</div></div>`:''}
    </div>
  </div>`;
}
function showActivityDetail(id) {
  const a = ActivitySvc.getById(id);
  if (!a) return;
  const status = ActivitySvc.getStatus(a);
  const isSignedUp = (a.signups||[]).find(s => s.userId === currentUser.id);
  const isFull = a.capacity > 0 && (a.signups||[]).length >= a.capacity;
  $('activityDetailBody').innerHTML = `
    <div style="margin-bottom:12px">
      <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:12px">${a.name}</div>
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
function submitPost() {
  const content = $('postContent').value.trim();
  if (!content) { showToast('请输入内容'); return; }
  PostSvc.add({ content, image: postImageData,
    author: currentUser.name||currentUser.username, author_id: currentUser.id,
    avatar: currentUser.avatar||'', school: currentUser.school||'' });
  $('postContent').value = ''; postImageData = '';
  $('postImagePreview').innerHTML = '';
  showToast('发布成功'); renderMyPosts(); renderHomeFeed();
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
  const data = { name: $('profileName').value.trim(), school: $('profileSchool').value,
    level: $('profileLevel').value, year: parseInt($('profileYear').value)||'',
    classname: $('profileClass').value.trim(), job: $('profileJob').value.trim(),
    city: $('profileCity').value.trim(), bio: $('profileBio').value.trim(),
    avatar: profileAvatarData || $('profileAvatarUrl').value.trim() };
  await UserSvc.updateProfile(data);
  currentUser = await UserSvc.getMe();
  profileAvatarData = '';
  showToast('资料已保存'); await renderMePage();
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
}
function deleteUser(id) {
  confirm('确定删除该用户？', async () => { await UserSvc.delete(id); await renderAdminUsers(); showToast('已删除'); });
}

// ===== 重置数据 =====
function resetData() { DataStore.reset(); }
