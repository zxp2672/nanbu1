// 用户服务
const api = require('../utils/api');
const auth = require('../utils/auth');

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise}
 */
function login(username, password) {
  return api.post('/api/auth/login', { username, password }).then(res => {
    // 保存token和用户信息
    if (res.token) {
      auth.setToken(res.token);
    }
    if (res.user) {
      auth.setUserInfo(res.user);
    }
    return res;
  });
}

/**
 * 获取当前登录用户信息
 * @returns {Promise}
 */
function getMe() {
  return api.get('/api/auth/me');
}

/**
 * 获取所有用户
 * @returns {Promise}
 */
function getAll() {
  return api.get('/api/users');
}

/**
 * 根据ID获取用户
 * @param {number} id - 用户ID
 * @returns {Promise}
 */
function getById(id) {
  return api.get(`/api/users/${id}`);
}

/**
 * 更新用户信息
 * @param {number} id - 用户ID
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
function update(id, data) {
  return api.put(`/api/users/${id}`, data);
}

/**
 * 更新当前用户资料
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
function updateProfile(data) {
  return api.put('/api/users/profile', data);
}

/**
 * 添加用户
 * @param {object} data - 用户数据
 * @returns {Promise}
 */
function add(data) {
  return api.post('/api/users', data);
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 * @returns {Promise}
 */
function remove(id) {
  return api.del(`/api/users/${id}`);
}

module.exports = {
  login,
  getMe,
  getAll,
  getById,
  update,
  updateProfile,
  add,
  remove
};
