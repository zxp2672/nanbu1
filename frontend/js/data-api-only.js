// ===== 纯API版本 - 所有数据通过API存取（无localStorage缓存）=====

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

// 内存缓存（仅用于减少重复请求）
const _cache = {
  alumni: null,
  resources: null,
  activities: null,
  posts: null,
  users: null,
  lastFetch: {}
};

// 清除缓存
function clearCache(key) {
  if (key) {
    _cache[key] = null;
    _cache.lastFetch[key] = null;
  } else {
    _cache.alumni = null;
    _cache.resources = null;
    _cache.activities = null;
    _cache.posts = null;
    _cache.users = null;
    _cache.lastFetch = {};
  }
}

// API请求封装
async function apiCall(method, endpoint, body = null) {
  const token = localStorage.getItem('nb_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch('/api' + endpoint, options);
  const data = await response.json();
  
  if (data.code !== 200) throw new Error(data.message || '请求失败');
  return data.data;
}

// 用户服务
const UserSvc = {
  _currentUser: null,
  
  async login(username, password) {
    const result = await apiCall('POST', '/auth/login', { username, password });
    if (result.token) {
      localStorage.setItem('nb_token', result.token);
      localStorage.setItem('nb_session', result.user.id);
      this._currentUser = result.user;
    }
    return result.user;
  },
  
  async getMe() {
    try {
      const user = await apiCall('GET', '/auth/me');
      this._currentUser = user;
      return user;
    } catch {
      return null;
    }
  },
  
  getById(id) {
    if (this._currentUser && this._currentUser.id === id) return this._currentUser;
    return null; // 需要通过API获取
  },
  
  async getAll() {
    if (!_cache.users || Date.now() - (_cache.lastFetch.users || 0) > 60000) {
      _cache.users = await apiCall('GET', '/users');
      _cache.lastFetch.users = Date.now();
    }
    return _cache.users;
  },
  
  async update(id, data) {
    const result = await apiCall('PUT', `/users/${id}`, data);
    if (this._currentUser && this._currentUser.id === id) {
      this._currentUser = { ...this._currentUser, ...result };
    }
    clearCache('users');
    return result;
  },
  
  async add(data) {
    const result = await apiCall('POST', '/users', data);
    clearCache('users');
    return result;
  },
  
  async delete(id) {
    await apiCall('DELETE', `/users/${id}`);
    clearCache('users');
    return true;
  }
};

// 校友服务
const AlumniSvc = {
  async getAll(forceRefresh = false) {
    if (forceRefresh || !_cache.alumni || Date.now() - (_cache.lastFetch.alumni || 0) > 30000) {
      _cache.alumni = await apiCall('GET', '/alumni');
      _cache.lastFetch.alumni = Date.now();
    }
    return _cache.alumni || [];
  },
  
  async getApproved() {
    const all = await this.getAll();
    return all.filter(a => a.status === 'approved');
  },
  
  async getPending() {
    const all = await this.getAll();
    return all.filter(a => a.status === 'pending');
  },
  
  async getById(id) {
    try {
      return await apiCall('GET', `/alumni/${id}`);
    } catch {
      const all = await this.getAll();
      return all.find(a => a.id === id);
    }
  },
  
  async add(data) {
    const result = await apiCall('POST', '/alumni', data);
    clearCache('alumni');
    return result;
  },
  
  async update(id, data) {
    const result = await apiCall('PUT', `/alumni/${id}`, data);
    clearCache('alumni');
    return result;
  },
  
  async approve(id) {
    await apiCall('POST', `/alumni/${id}/approve`, {});
    clearCache('alumni');
  },
  
  async reject(id) {
    await apiCall('POST', `/alumni/${id}/reject`, {});
    clearCache('alumni');
  },
  
  async delete(id) {
    await apiCall('DELETE', `/alumni/${id}`);
    clearCache('alumni');
  },
  
  async filter(school, level, year, classname) {
    let list = await this.getApproved();
    if (school) list = list.filter(a => a.school === school);
    if (level) list = list.filter(a => a.level === level);
    if (year) list = list.filter(a => String(a.year) === String(year));
    if (classname) list = list.filter(a => a.classname === classname);
    return list;
  },
  
  async search(q, school, level, year, classname) {
    let list = await this.filter(school, level, year, classname);
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
  
  async getClasses(school, level, year) {
    const all = await this.getApproved();
    return [...new Set(all
      .filter(a => (!school || a.school === school) && (!level || a.level === level) && (!year || String(a.year) === String(year)))
      .map(a => a.classname).filter(Boolean))].sort();
  }
};

// 资源服务
const ResourceSvc = {
  async getAll(forceRefresh = false) {
    if (forceRefresh || !_cache.resources || Date.now() - (_cache.lastFetch.resources || 0) > 30000) {
      _cache.resources = await apiCall('GET', '/resources');
      _cache.lastFetch.resources = Date.now();
    }
    return _cache.resources || [];
  },
  
  async add(data) {
    const result = await apiCall('POST', '/resources', data);
    clearCache('resources');
    return result;
  },
  
  async update(id, data) {
    const result = await apiCall('PUT', `/resources/${id}`, data);
    clearCache('resources');
    return result;
  },
  
  async delete(id) {
    await apiCall('DELETE', `/resources/${id}`);
    clearCache('resources');
  },
  
  async filter(type) {
    const list = await this.getAll();
    return type && type !== 'all' ? list.filter(r => r.type === type) : list;
  },
  
  async getByUser(uid) {
    const list = await this.getAll();
    return list.filter(r => r.author_id === uid);
  }
};

// 活动服务
const ActivitySvc = {
  async getAll(forceRefresh = false) {
    if (forceRefresh || !_cache.activities || Date.now() - (_cache.lastFetch.activities || 0) > 30000) {
      _cache.activities = await apiCall('GET', '/activities');
      _cache.lastFetch.activities = Date.now();
    }
    return _cache.activities || [];
  },
  
  async getById(id) {
    try {
      return await apiCall('GET', `/activities/${id}`);
    } catch {
      const all = await this.getAll();
      return all.find(a => a.id === id);
    }
  },
  
  async add(data) {
    const result = await apiCall('POST', '/activities', data);
    clearCache('activities');
    return result;
  },
  
  async update(id, data) {
    const result = await apiCall('PUT', `/activities/${id}`, data);
    clearCache('activities');
    return result;
  },
  
  async delete(id) {
    await apiCall('DELETE', `/activities/${id}`);
    clearCache('activities');
  },
  
  getStatus(a) {
    const now = new Date(), s = new Date(a.start_time || a.startTime), e = (a.end_time || a.endTime) ? new Date(a.end_time || a.endTime) : null;
    if (now < s) return 'upcoming';
    if (e && now > e) return 'ended';
    return 'ongoing';
  },
  
  async signup(id) {
    await apiCall('POST', `/activities/${id}/signup`, {});
    clearCache('activities');
  },
  
  async cancelSignup(id) {
    await apiCall('POST', `/activities/${id}/cancel`, {});
    clearCache('activities');
  },
  
  async filter(status) {
    const list = await this.getAll();
    return status && status !== 'all' ? list.filter(a => this.getStatus(a) === status) : list;
  },
  
  async getByUser(uid) {
    const list = await this.getAll();
    return list.filter(a => (a.signups||[]).find(s => s.user_id === uid));
  }
};

// 动态服务
const PostSvc = {
  async getAll(forceRefresh = false) {
    if (forceRefresh || !_cache.posts || Date.now() - (_cache.lastFetch.posts || 0) > 30000) {
      _cache.posts = await apiCall('GET', '/posts');
      _cache.lastFetch.posts = Date.now();
    }
    return _cache.posts || [];
  },
  
  async getByUser(uid) {
    const list = await this.getAll();
    return list.filter(p => p.author_id === uid);
  },
  
  async add(data) {
    const result = await apiCall('POST', '/posts', data);
    clearCache('posts');
    return result;
  },
  
  async delete(id) {
    await apiCall('DELETE', `/posts/${id}`);
    clearCache('posts');
  }
};

// 初始化函数（检查登录状态）
async function initApp() {
  const token = localStorage.getItem('nb_token');
  if (token) {
    try {
      await UserSvc.getMe();
    } catch {
      localStorage.removeItem('nb_token');
      localStorage.removeItem('nb_session');
    }
  }
}

// 启动初始化
initApp();
