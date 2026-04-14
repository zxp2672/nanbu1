// API基础配置
const API_BASE_URL = '/api';

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
async function request(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok || data.code !== 200) {
            throw new Error(data.message || '请求失败');
        }
        
        return data.data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// GET请求
function get(url) {
    return request(url, { method: 'GET' });
}

// POST请求
function post(url, body) {
    return request(url, {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

// PUT请求
function put(url, body) {
    return request(url, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

// DELETE请求
function del(url) {
    return request(url, { method: 'DELETE' });
}

// ===== 认证API =====
const AuthAPI = {
    login: (username, password) => post('/auth/login', { username, password }),
    getMe: () => get('/auth/me')
};

// ===== 校友API =====
const AlumniAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return get(`/alumni?${query}`);
    },
    getPending: () => get('/alumni/pending'),
    getById: (id) => get(`/alumni/${id}`),
    create: (data) => post('/alumni', data),
    update: (id, data) => put(`/alumni/${id}`, data),
    delete: (id) => del(`/alumni/${id}`),
    approve: (id) => post(`/alumni/${id}/approve`, {}),
    reject: (id) => post(`/alumni/${id}/reject`, {}),
    getYears: (school, level) => get(`/alumni/years?school=${school || ''}&level=${level || ''}`),
    getClasses: (school, level, year) => get(`/alumni/classes?school=${school || ''}&level=${level || ''}&year=${year || ''}`),
    getStatsBySchool: () => get('/alumni/stats/by-school'),
    getCounts: () => get('/alumni/stats/count')
};

// ===== 资源API =====
const ResourceAPI = {
    getAll: (type) => get(`/resources?type=${type || 'all'}`),
    getById: (id) => get(`/resources/${id}`),
    create: (data) => post('/resources', data),
    update: (id, data) => put(`/resources/${id}`, data),
    delete: (id) => del(`/resources/${id}`),
    getMy: () => get('/resources/my')
};

// ===== 活动API =====
const ActivityAPI = {
    getAll: (status) => get(`/activities?status=${status || 'all'}`),
    getById: (id) => get(`/activities/${id}`),
    create: (data) => post('/activities', data),
    update: (id, data) => put(`/activities/${id}`, data),
    delete: (id) => del(`/activities/${id}`),
    signup: (id) => post(`/activities/${id}/signup`, {}),
    cancel: (id) => post(`/activities/${id}/cancel`, {}),
    isSignedUp: (id) => get(`/activities/${id}/is-signed-up`),
    getMy: () => get('/activities/my')
};

// ===== 动态API =====
const PostAPI = {
    getAll: () => get('/posts'),
    getRecent: (limit) => get(`/posts/recent?limit=${limit || 5}`),
    getById: (id) => get(`/posts/${id}`),
    create: (data) => post('/posts', data),
    delete: (id) => del(`/posts/${id}`),
    getMy: () => get('/posts/my')
};

// ===== 学校API =====
const SchoolAPI = {
    getAll: () => get('/schools'),
    getById: (id) => get(`/schools/${id}`),
    getByName: (name) => get(`/schools/by-name/${name}`)
};

// ===== 用户API =====
const UserAPI = {
    getAll: () => get('/users'),
    getById: (id) => get(`/users/${id}`),
    create: (data) => post('/users', data),
    update: (id, data) => put(`/users/${id}`, data),
    delete: (id) => del(`/users/${id}`),
    updateProfile: (data) => put('/users/profile', data)
};
