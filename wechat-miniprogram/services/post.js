// 动态服务
const api = require('../utils/api');

/**
 * 获取所有动态列表
 * @returns {Promise}
 */
function getAll() {
  return api.get('/api/posts');
}

/**
 * 根据ID获取动态详情
 * @param {number} id - 动态ID
 * @returns {Promise}
 */
function getById(id) {
  return api.get(`/api/posts/${id}`);
}

/**
 * 添加动态
 * @param {object} data - 动态数据
 * @returns {Promise}
 */
function add(data) {
  return api.post('/api/posts', data);
}

/**
 * 删除动态
 * @param {number} id - 动态ID
 * @returns {Promise}
 */
function remove(id) {
  return api.del(`/api/posts/${id}`);
}

/**
 * 获取最近动态
 * @param {number} limit - 数量限制
 * @returns {Promise}
 */
function getRecent(limit = 10) {
  return api.get('/api/posts/recent', { limit });
}

/**
 * 获取我发布的动态
 * @returns {Promise}
 */
function getMy() {
  return api.get('/api/posts/my');
}

module.exports = {
  getAll,
  getById,
  add,
  remove,
  getRecent,
  getMy
};
