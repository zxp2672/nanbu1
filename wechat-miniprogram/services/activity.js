// 活动服务
const api = require('../utils/api');

/**
 * 获取所有活动列表
 * @param {string} status - 可选状态筛选（upcoming/ongoing/ended）
 * @returns {Promise}
 */
function getAll(status) {
  const params = {};
  if (status) params.status = status;
  return api.get('/api/activities', params);
}

/**
 * 根据ID获取活动详情
 * @param {number} id - 活动ID
 * @returns {Promise}
 */
function getById(id) {
  return api.get(`/api/activities/${id}`);
}

/**
 * 添加活动
 * @param {object} data - 活动数据
 * @returns {Promise}
 */
function add(data) {
  return api.post('/api/activities', data);
}

/**
 * 更新活动信息
 * @param {number} id - 活动ID
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
function update(id, data) {
  return api.put(`/api/activities/${id}`, data);
}

/**
 * 删除活动
 * @param {number} id - 活动ID
 * @returns {Promise}
 */
function remove(id) {
  return api.del(`/api/activities/${id}`);
}

/**
 * 报名活动
 * @param {number} id - 活动ID
 * @returns {Promise}
 */
function signup(id) {
  return api.post(`/api/activities/${id}/signup`);
}

/**
 * 取消报名
 * @param {number} id - 活动ID
 * @returns {Promise}
 */
function cancelSignup(id) {
  return api.post(`/api/activities/${id}/cancel`);
}

/**
 * 检查是否已报名
 * @param {number} id - 活动ID
 * @returns {Promise}
 */
function isSignedUp(id) {
  return api.get(`/api/activities/${id}/is-signed-up`);
}

/**
 * 获取我报名的活动
 * @returns {Promise}
 */
function getMy() {
  return api.get('/api/activities/my');
}

module.exports = {
  getAll,
  getById,
  add,
  update,
  remove,
  signup,
  cancelSignup,
  isSignedUp,
  getMy
};
