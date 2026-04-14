// ===== 混合版本：API + 本地缓存 =====
// 这个版本兼容原app.js的同步调用方式，同时后台同步到服务器

const SCHOOLS = [
  { id: 's1', name: '南部中学', short: 'nb1', icon: '🏫', desc: '南部县重点高中', founded: 1950, color: '#1a6fc4' },
  { id: 's2', name: '南部二中', short: 'nb2', icon: '🏫', desc: '南部县第二中学', founded: 1962, color: '#7c3aed' },
  { id: 's3', name: '南部三中', short: 'nb3', icon: '🏫', desc: '南部县第三中学', founded: 1975, color: '#059669' },
  { id: 's4', name: '大桥中学', short: 'dq', icon: '🏫', desc: '大桥镇中学', founded: 1968, color: '#d97706' },
  { id: 's5', name: '东坝中学', short: 'db', icon: '🏫', desc: '东坝镇中学', founded: 1972, color: '#dc2626' },
  { id: 's6', name: '建兴中学', short: 'jx', icon: '🏫', desc: '建兴镇中学', founded: 1980, color: '#0891b2' },
];

const Perm = {
  isSuperAdmin(u) { return u && u.role === 'superadmin'; },
  isAnyAdmin(u) { return u && ['superadmin','school_admin','grade_admin','class_admin'].includes(u.role); },
  canManageAlumni(u, a) {
    if (!u || !a) return false;
    if (u.role === 'superadmin') return true;
    const s = u.adminScope || {};
    if (u.role === 'school_admin') return a.school === s.school;
    if (u.role === 'grade_admin') return a.school === s.school && a.level === s.level && String(a.year) === String(s.year);
    if (u.role === 'class_admin') return a.school === s.school && a.level === s.level && String(a.year) === String(s.year) && a.classname === s.classname;
    return false;
  },
  roleLabel(role) {
    return { superadmin: '总管理员', school_admin: '学校管理员', grade_admin: '年级管理员', class_admin: '班级管理员', user: '普通用户' }[role] || role;
  }
};

// 本地存储工具（兼容原data.js）
const DB = {
  get(key, def = []) { 
    try { 
      const data = localStorage.getItem('nb_' + key);
      return data ? JSON.parse(data) : def; 
    } catch { 
      return def; 
    } 
  },
  set(key, v) { 
    localStorage.setItem('nb_' + key, JSON.stringify(v)); 
  },
  id() { 
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); 
  }
};

// API基础URL
const API_BASE = '/api';

// 异步API调用
async function apiCall(method, endpoint, body = null) {
  const token = localStorage.getItem('nb_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const response = await fetch(API_BASE + endpoint, options);
    const data = await response.json();
    if (data.code !== 200) throw new Error(data.message);
    return data.data;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
}

// 同步获取缓存，异步更新
function syncGet(key) {
  return DB.get(key);
}

function syncSet(key, data) {
  DB.set(key, data);
  // 后台同步到服务器（如果有token）
  const token = localStorage.getItem('nb_token');
  if (token) {
    // 异步同步到服务器
    setTimeout(() => syncToServer(key, data), 0);
  }
}

// 后台同步到服务器
async function syncToServer(key, data) {
  try {
    if (key === 'alumni') {
      // 同步校友数据到服务器
      await apiCall('POST', '/alumni/batch', { alumni: data });
    }
  } catch (e) {
    console.log('后台同步失败:', e);
  }
}

// 从服务器加载数据到本地缓存
async function loadFromServer() {
  try {
    const token = localStorage.getItem('nb_token');
    if (!token) return;
    
    // 加载校友数据
    const alumni = await apiCall('GET', '/alumni');
    if (alumni && alumni.length > 0) {
      DB.set('alumni', alumni);
    }
    
    // 加载资源数据
    const resources = await apiCall('GET', '/resources');
    if (resources && resources.length > 0) {
      DB.set('resources', resources);
    }
    
    // 加载活动数据
    const activities = await apiCall('GET', '/activities');
    if (activities && activities.length > 0) {
      DB.set('activities', activities);
    }
    
    // 加载动态数据
    const posts = await apiCall('GET', '/posts');
    if (posts && posts.length > 0) {
      DB.set('posts', posts);
    }
    
    console.log('✅ 数据已从服务器同步到本地');
  } catch (error) {
    console.log('从服务器加载数据失败:', error);
  }
}

// 用户服务
const UserSvc = {
  _currentUser: null,
  
  login(username, password) {
    // 先检查本地用户
    const users = DB.get('users');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      this._currentUser = user;
      localStorage.setItem('nb_session', user.id);
      // 尝试API登录获取token
      this._apiLogin(username, password);
      return user;
    }
    return null;
  },
  
  async _apiLogin(username, password) {
    try {
      const result = await apiCall('POST', '/auth/login', { username, password });
      if (result.token) {
        localStorage.setItem('nb_token', result.token);
        // 同步服务器数据到本地
        await loadFromServer();
      }
    } catch (e) {
      console.log('API登录失败，使用本地模式');
    }
  },
  
  getById(id) {
    if (this._currentUser && this._currentUser.id === id) return this._currentUser;
    const users = DB.get('users');
    return users.find(u => u.id === id);
  },
  
  getAll() {
    return DB.get('users');
  },
  
  update(id, data) {
    const users = this.getAll();
    const i = users.findIndex(u => u.id === id);
    if (i !== -1) {
      users[i] = { ...users[i], ...data };
      DB.set('users', users);
      if (this._currentUser && this._currentUser.id === id) {
        this._currentUser = users[i];
      }
      return users[i];
    }
    return null;
  },
  
  add(data) {
    const users = this.getAll();
    if (users.find(u => u.username === data.username)) return null;
    const item = { 
      ...data, 
      id: DB.id(), 
      adminScope: data.adminScope || {}, 
      createdAt: new Date().toISOString().split('T')[0] 
    };
    users.push(item);
    DB.set('users', users);
    return item;
  },
  
  delete(id) {
    const users = this.getAll();
    if (users.find(u => u.id === id && u.username === 'admin')) return false;
    DB.set('users', users.filter(u => u.id !== id));
    return true;
  }
};

// 校友服务
const AlumniSvc = {
  getAll() {
    return DB.get('alumni');
  },
  
  getApproved() {
    return this.getAll().filter(a => a.status === 'approved');
  },
  
  getPending() {
    return this.getAll().filter(a => a.status === 'pending');
  },
  
  getById(id) {
    return this.getAll().find(a => a.id === id);
  },
  
  add(data) {
    const list = this.getAll();
    const item = { 
      ...data, 
      id: DB.id(), 
      status: 'pending', 
      createdAt: new Date().toISOString().split('T')[0] 
    };
    list.push(item);
    DB.set('alumni', list);
    
    // 后台同步到服务器
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('POST', '/alumni', item).catch(e => console.log('同步失败:', e));
    }
    
    return item;
  },
  
  update(id, data) {
    const list = this.getAll();
    const i = list.findIndex(a => a.id === id);
    if (i !== -1) {
      list[i] = { ...list[i], ...data };
      DB.set('alumni', list);
      
      // 后台同步
      const token = localStorage.getItem('nb_token');
      if (token) {
        apiCall('PUT', `/alumni/${id}`, list[i]).catch(e => console.log('同步失败:', e));
      }
      
      return list[i];
    }
    return null;
  },
  
  approve(id) {
    return this.update(id, { status: 'approved' });
  },
  
  reject(id) {
    return this.update(id, { status: 'rejected' });
  },
  
  delete(id) {
    const list = this.getAll().filter(a => a.id !== id);
    DB.set('alumni', list);
    
    // 后台同步
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('DELETE', `/alumni/${id}`).catch(e => console.log('同步失败:', e));
    }
  },
  
  filter(school, level, year, classname) {
    let list = this.getApproved();
    if (school) list = list.filter(a => a.school === school);
    if (level) list = list.filter(a => a.level === level);
    if (year) list = list.filter(a => String(a.year) === String(year));
    if (classname) list = list.filter(a => a.classname === classname);
    return list;
  },
  
  search(q, school, level, year, classname) {
    let list = this.filter(school, level, year, classname);
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(lq) ||
        (a.classname && a.classname.includes(q)) ||
        (a.job && a.job.toLowerCase().includes(lq)) ||
        (a.company && a.company.toLowerCase().includes(lq)) ||
        (a.city && a.city.includes(q))
      );
    }
    return list;
  },
  
  getClasses(school, level, year) {
    return [...new Set(this.getApproved()
      .filter(a => (!school || a.school === school) && (!level || a.level === level) && (!year || String(a.year) === String(year)))
      .map(a => a.classname).filter(Boolean))].sort();
  }
};

// 资源服务
const ResourceSvc = {
  getAll() {
    return DB.get('resources').sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  },
  
  add(data) {
    const list = DB.get('resources');
    const item = { 
      ...data, 
      id: DB.id(), 
      createdAt: new Date().toISOString().split('T')[0] 
    };
    list.push(item);
    DB.set('resources', list);
    
    // 后台同步
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('POST', '/resources', item).catch(e => console.log('同步失败:', e));
    }
    
    return item;
  },
  
  update(id, data) {
    const list = DB.get('resources');
    const i = list.findIndex(r => r.id === id);
    if (i !== -1) {
      list[i] = { ...list[i], ...data };
      DB.set('resources', list);
      
      // 后台同步
      const token = localStorage.getItem('nb_token');
      if (token) {
        apiCall('PUT', `/resources/${id}`, list[i]).catch(e => console.log('同步失败:', e));
      }
    }
  },
  
  delete(id) {
    const list = DB.get('resources').filter(r => r.id !== id);
    DB.set('resources', list);
    
    // 后台同步
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('DELETE', `/resources/${id}`).catch(e => console.log('同步失败:', e));
    }
  },
  
  filter(type) {
    const list = this.getAll();
    return type && type !== 'all' ? list.filter(r => r.type === type) : list;
  },
  
  getByUser(uid) {
    return this.getAll().filter(r => r.authorId === uid);
  }
};

// 活动服务
const ActivitySvc = {
  getAll() {
    return DB.get('activities').sort((a,b) => new Date(b.startTime)-new Date(a.startTime));
  },
  
  getById(id) {
    return this.getAll().find(a => a.id === id);
  },
  
  add(data) {
    const list = DB.get('activities');
    const item = { 
      ...data, 
      id: DB.id(), 
      signups: [], 
      createdAt: new Date().toISOString().split('T')[0] 
    };
    list.push(item);
    DB.set('activities', list);
    
    // 后台同步
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('POST', '/activities', item).catch(e => console.log('同步失败:', e));
    }
    
    return item;
  },
  
  update(id, data) {
    const list = DB.get('activities');
    const i = list.findIndex(a => a.id === id);
    if (i !== -1) {
      list[i] = { ...list[i], ...data };
      DB.set('activities', list);
      
      // 后台同步
      const token = localStorage.getItem('nb_token');
      if (token) {
        apiCall('PUT', `/activities/${id}`, list[i]).catch(e => console.log('同步失败:', e));
      }
    }
  },
  
  delete(id) {
    const list = DB.get('activities').filter(a => a.id !== id);
    DB.set('activities', list);
    
    // 后台同步
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('DELETE', `/activities/${id}`).catch(e => console.log('同步失败:', e));
    }
  },
  
  getStatus(a) {
    const now = new Date(), s = new Date(a.startTime), e = a.endTime ? new Date(a.endTime) : null;
    if (now < s) return 'upcoming';
    if (e && now > e) return 'ended';
    return 'ongoing';
  },
  
  signup(id, user) {
    const list = DB.get('activities');
    const i = list.findIndex(a => a.id === id);
    if (i === -1) return false;
    if (!list[i].signups) list[i].signups = [];
    if (list[i].signups.find(s => s.userId === user.userId)) return 'already';
    if (list[i].capacity > 0 && list[i].signups.length >= list[i].capacity) return 'full';
    
    list[i].signups.push({ 
      userId: user.userId, 
      name: user.name || user.username, 
      avatar: user.avatar || '', 
      time: new Date().toISOString() 
    });
    DB.set('activities', list);
    
    // 后台同步
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('POST', `/activities/${id}/signup`, {}).catch(e => console.log('同步失败:', e));
    }
    
    return true;
  },
  
  cancelSignup(id, userId) {
    const list = DB.get('activities');
    const i = list.findIndex(a => a.id === id);
    if (i !== -1) {
      list[i].signups = (list[i].signups || []).filter(s => s.userId !== userId);
      DB.set('activities', list);
      
      // 后台同步
      const token = localStorage.getItem('nb_token');
      if (token) {
        apiCall('POST', `/activities/${id}/cancel`, {}).catch(e => console.log('同步失败:', e));
      }
    }
  },
  
  filter(status) {
    const list = this.getAll();
    return status && status !== 'all' ? list.filter(a => this.getStatus(a) === status) : list;
  },
  
  getByUser(uid) {
    return this.getAll().filter(a => (a.signups||[]).find(s => s.userId === uid));
  }
};

// 动态服务
const PostSvc = {
  getAll() {
    return DB.get('posts').sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  },
  
  getByUser(uid) {
    return this.getAll().filter(p => p.authorId === uid);
  },
  
  add(data) {
    const list = DB.get('posts');
    const item = { 
      ...data, 
      id: DB.id(), 
      createdAt: new Date().toISOString() 
    };
    list.push(item);
    DB.set('posts', list);
    
    // 后台同步
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('POST', '/posts', item).catch(e => console.log('同步失败:', e));
    }
    
    return item;
  },
  
  delete(id) {
    const list = DB.get('posts').filter(p => p.id !== id);
    DB.set('posts', list);
    
    // 后台同步
    const token = localStorage.getItem('nb_token');
    if (token) {
      apiCall('DELETE', `/posts/${id}`).catch(e => console.log('同步失败:', e));
    }
  }
};

// 演示数据
const DEMO = {
  users: [
    { id: 'u0', username: 'admin', password: '123456', role: 'superadmin', name: '总管理员', school: '', level: '', year: '', classname: '', job: '系统管理员', city: '南充', bio: '南部县校友会联盟总管理员', avatar: '', adminScope: {}, createdAt: '2024-01-01' },
    { id: 'u_nb1', username: 'nb1_admin', password: '123456', role: 'school_admin', name: '南部中学管理员', school: '南部中学', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部中学' }, createdAt: '2024-01-01' },
    { id: 'u_nb2', username: 'nb2_admin', password: '123456', role: 'school_admin', name: '南部二中管理员', school: '南部二中', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部二中' }, createdAt: '2024-01-01' },
    { id: 'u_nb3', username: 'nb3_admin', password: '123456', role: 'school_admin', name: '南部三中管理员', school: '南部三中', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部三中' }, createdAt: '2024-01-01' },
    { id: 'u_dq', username: 'dq_admin', password: '123456', role: 'school_admin', name: '大桥中学管理员', school: '大桥中学', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '大桥中学' }, createdAt: '2024-01-01' },
    { id: 'u_db', username: 'db_admin', password: '123456', role: 'school_admin', name: '东坝中学管理员', school: '东坝中学', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '东坝中学' }, createdAt: '2024-01-01' },
    { id: 'u_jx', username: 'jx_admin', password: '123456', role: 'school_admin', name: '建兴中学管理员', school: '建兴中学', level: '', year: '', classname: '', job: '学校管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '建兴中学' }, createdAt: '2024-01-01' },
    { id: 'u_nb1_2005_1', username: 'nb1_2005_1', password: '123456', role: 'class_admin', name: '南部中学2005级1班管理员', school: '南部中学', level: '高中', year: 2005, classname: '高三(1)班', job: '班级管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部中学', level: '高中', year: 2005, classname: '高三(1)班' }, createdAt: '2024-01-01' },
    { id: 'u_nb1_2010_2', username: 'nb1_2010_2', password: '123456', role: 'class_admin', name: '南部中学2010级2班管理员', school: '南部中学', level: '高中', year: 2010, classname: '高三(2)班', job: '班级管理员', city: '南充', bio: '', avatar: '', adminScope: { school: '南部中学', level: '高中', year: 2010, classname: '高三(2)班' }, createdAt: '2024-01-01' },
    { id: 'u2', username: 'user', password: '123456', role: 'user', name: '张同学', school: '南部中学', level: '高中', year: 2010, classname: '高三(2)班', job: '软件工程师', city: '成都', bio: '', avatar: '', adminScope: {}, createdAt: '2024-01-02' },
  ],
  alumni: [],
  resources: [],
  activities: [],
  posts: []
};

// 初始化数据
function initData() {
  if (!localStorage.getItem('nb_v2_initialized')) {
    console.log('初始化本地数据...');
    DB.set('users', DEMO.users);
    DB.set('alumni', DEMO.alumni);
    DB.set('resources', DEMO.resources);
    DB.set('activities', DEMO.activities);
    DB.set('posts', DEMO.posts);
    localStorage.setItem('nb_v2_initialized', '1');
  }
  
  // 尝试从服务器加载数据（如果有token）
  const token = localStorage.getItem('nb_token');
  if (token) {
    loadFromServer();
  }
}

function resetData() {
  DB.set('users', DEMO.users);
  DB.set('alumni', DEMO.alumni);
  DB.set('resources', DEMO.resources);
  DB.set('activities', DEMO.activities);
  DB.set('posts', DEMO.posts);
  localStorage.removeItem('nb_v2_initialized');
  localStorage.setItem('nb_v2_initialized', '1');
}

// 启动初始化
initData();
