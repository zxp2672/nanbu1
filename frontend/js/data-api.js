// ===== API版本的数据服务（替换localStorage版本） =====
// 使用方法：在index.html中，将 <script src="js/data.js"></script> 替换为 <script src="js/data-api.js"></script>

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

// 获取当前用户
function getCurrentUser() {
  const user = localStorage.getItem('nb_user');
  return user ? JSON.parse(user) : null;
}

// 保存用户信息
function setCurrentUser(user) {
  localStorage.setItem('nb_user', JSON.stringify(user));
}

// API请求封装
async function apiCall(url, options = {}) {
  const token = localStorage.getItem('nb_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  
  if (data.code !== 200) throw new Error(data.message || '请求失败');
  return data.data;
}

// 用户服务
const UserSvc = {
  async login(username, password) {
    const result = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    localStorage.setItem('nb_token', result.token);
    setCurrentUser(result.user);
    return result.user;
  },
  async getMe() {
    try {
      const user = await apiCall('/api/auth/me');
      setCurrentUser(user);
      return user;
    } catch {
      return null;
    }
  },
  getById(id) {
    const user = getCurrentUser();
    return user && user.id === id ? user : null;
  },
  update(id, data) {
    // TODO: 调用API更新
    const user = getCurrentUser();
    if (user && user.id === id) {
      Object.assign(user, data);
      setCurrentUser(user);
    }
    return user;
  },
  getAll() { return []; }, // TODO: 实现API调用
  add(data) { return null; }, // TODO: 实现API调用
  delete(id) { return false; } // TODO: 实现API调用
};

// 校友服务
const AlumniSvc = {
  _cache: null,
  async getAll() {
    if (!this._cache) {
      this._cache = await apiCall('/api/alumni').catch(() => []);
    }
    return this._cache;
  },
  async getApproved() {
    return (await this.getAll()).filter(a => a.status === 'approved');
  },
  async getPending() {
    return (await this.getAll()).filter(a => a.status === 'pending');
  },
  async getById(id) {
    return (await this.getAll()).find(a => a.id === id);
  },
  async add(data) {
    const result = await apiCall('/api/alumni', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this._cache = null;
    return result;
  },
  async update(id, data) {
    await apiCall(`/api/alumni/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    this._cache = null;
    return data;
  },
  async approve(id) {
    await apiCall(`/api/alumni/${id}/approve`, { method: 'POST', body: '{}' });
    this._cache = null;
  },
  async reject(id) {
    await apiCall(`/api/alumni/${id}/reject`, { method: 'POST', body: '{}' });
    this._cache = null;
  },
  async delete(id) {
    await apiCall(`/api/alumni/${id}`, { method: 'DELETE' });
    this._cache = null;
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
  _cache: null,
  async getAll() {
    if (!this._cache) {
      this._cache = await apiCall('/api/resources').catch(() => []);
    }
    return this._cache.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  },
  async add(data) {
    const result = await apiCall('/api/resources', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this._cache = null;
    return result;
  },
  async update(id, data) {
    await apiCall(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    this._cache = null;
  },
  async delete(id) {
    await apiCall(`/api/resources/${id}`, { method: 'DELETE' });
    this._cache = null;
  },
  async filter(type) {
    const list = await this.getAll();
    return type && type !== 'all' ? list.filter(r => r.type === type) : list;
  }
};

// 活动服务
const ActivitySvc = {
  _cache: null,
  async getAll() {
    if (!this._cache) {
      this._cache = await apiCall('/api/activities').catch(() => []);
    }
    return this._cache.sort((a,b) => new Date(b.start_time)-new Date(a.start_time));
  },
  async getById(id) {
    return (await this.getAll()).find(a => a.id === id);
  },
  async add(data) {
    const result = await apiCall('/api/activities', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this._cache = null;
    return result;
  },
  async update(id, data) {
    await apiCall(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    this._cache = null;
  },
  async delete(id) {
    await apiCall(`/api/activities/${id}`, { method: 'DELETE' });
    this._cache = null;
  },
  getStatus(a) {
    const now = new Date(), s = new Date(a.start_time), e = a.end_time ? new Date(a.end_time) : null;
    if (now < s) return 'upcoming';
    if (e && now > e) return 'ended';
    return 'ongoing';
  },
  async signup(id) {
    const result = await apiCall(`/api/activities/${id}/signup`, {
      method: 'POST',
      body: '{}'
    });
    this._cache = null;
    return result;
  },
  async cancelSignup(id) {
    await apiCall(`/api/activities/${id}/cancel`, {
      method: 'POST',
      body: '{}'
    });
    this._cache = null;
  },
  async filter(status) {
    const list = await this.getAll();
    return status && status !== 'all' ? list.filter(a => this.getStatus(a) === status) : list;
  }
};

// 动态服务
const PostSvc = {
  _cache: null,
  async getAll() {
    if (!this._cache) {
      this._cache = await apiCall('/api/posts').catch(() => []);
    }
    return this._cache.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  },
  async add(data) {
    const result = await apiCall('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this._cache = null;
    return result;
  },
  async delete(id) {
    await apiCall(`/api/posts/${id}`, { method: 'DELETE' });
    this._cache = null;
  }
};

// 初始化（从API加载数据）
async function initApp() {
  // 尝试获取当前用户
  const token = localStorage.getItem('nb_token');
  if (token) {
    await UserSvc.getMe();
  }
}
