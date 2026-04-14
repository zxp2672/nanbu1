// ===== API集成服务（替代localStorage） =====

// 获取Token
function getToken() {
  return localStorage.getItem('nb_token');
}

// 设置Token
function setToken(token) {
  localStorage.setItem('nb_token', token);
}

// 清除Token
function clearToken() {
  localStorage.removeItem('nb_token');
  localStorage.removeItem('nb_session');
}

// 通用请求函数
async function apiRequest(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// GET请求
function apiGet(url) {
  return apiRequest(url, { method: 'GET' });
}

// POST请求
function apiPost(url, body) {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// PUT请求
function apiPut(url, body) {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

// DELETE请求
function apiDelete(url) {
  return apiRequest(url, { method: 'DELETE' });
}

// ===== API服务 =====
const API = {
  // 认证
  auth: {
    login: (username, password) => apiPost('/api/auth/login', { username, password }),
    getMe: () => apiGet('/api/auth/me')
  },
  
  // 校友
  alumni: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiGet(`/api/alumni?${query}`);
    },
    getApproved: () => apiGet('/api/alumni?status=approved'),
    getPending: () => apiGet('/api/alumni?status=pending'),
    getById: (id) => apiGet(`/api/alumni/${id}`),
    create: (data) => apiPost('/api/alumni', data),
    update: (id, data) => apiPut(`/api/alumni/${id}`, data),
    delete: (id) => apiDelete(`/api/alumni/${id}`),
    approve: (id) => apiPost(`/api/alumni/${id}/approve`, {}),
    reject: (id) => apiPost(`/api/alumni/${id}/reject`, {}),
    getYears: (school, level) => apiGet(`/api/alumni/years?school=${school||''}&level=${level||''}`),
    getClasses: (school, level, year) => apiGet(`/api/alumni/classes?school=${school||''}&level=${level||''}&year=${year||''}`)
  },
  
  // 资源
  resources: {
    getAll: (type) => apiGet(`/api/resources?type=${type||'all'}`),
    getById: (id) => apiGet(`/api/resources/${id}`),
    create: (data) => apiPost('/api/resources', data),
    update: (id, data) => apiPut(`/api/resources/${id}`, data),
    delete: (id) => apiDelete(`/api/resources/${id}`),
    getMy: () => apiGet('/api/resources/my')
  },
  
  // 活动
  activities: {
    getAll: (status) => apiGet(`/api/activities?status=${status||'all'}`),
    getById: (id) => apiGet(`/api/activities/${id}`),
    create: (data) => apiPost('/api/activities', data),
    update: (id, data) => apiPut(`/api/activities/${id}`, data),
    delete: (id) => apiDelete(`/api/activities/${id}`),
    signup: (id) => apiPost(`/api/activities/${id}/signup`, {}),
    cancel: (id) => apiPost(`/api/activities/${id}/cancel`, {}),
    getMy: () => apiGet('/api/activities/my')
  },
  
  // 动态
  posts: {
    getAll: () => apiGet('/api/posts'),
    getRecent: (limit) => apiGet(`/api/posts/recent?limit=${limit||5}`),
    create: (data) => apiPost('/api/posts', data),
    delete: (id) => apiDelete(`/api/posts/${id}`),
    getMy: () => apiGet('/api/posts/my')
  },
  
  // 用户
  users: {
    getAll: () => apiGet('/api/users'),
    getById: (id) => apiGet(`/api/users/${id}`),
    create: (data) => apiPost('/api/users', data),
    update: (id, data) => apiPut(`/api/users/${id}`, data),
    delete: (id) => apiDelete(`/api/users/${id}`),
    updateProfile: (data) => apiPut('/api/users/profile', data)
  },
  
  // 学校
  schools: {
    getAll: () => apiGet('/api/schools')
  }
};

// 导出供使用
window.API = API;
window.getToken = getToken;
window.setToken = setToken;
window.clearToken = clearToken;
