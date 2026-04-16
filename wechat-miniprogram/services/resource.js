// 资源服务
const api = require('../utils/api');

/**
 * 获取所有资源列表
 * @param {string} type - 可选资源类型筛选
 * @returns {Promise}
 */
function getAll(type) {
  const params = {};
  if (type) params.type = type;
  return api.get('/api/resources', params);
}

/**
 * 根据ID获取资源详情
 * @param {number} id - 资源ID
 * @returns {Promise}
 */
function getById(id) {
  return api.get(`/api/resources/${id}`);
}

/**
 * 添加资源
 * @param {object} data - 资源数据
 * @returns {Promise}
 */
function add(data) {
  return api.post('/api/resources', data);
}

/**
 * 更新资源信息
 * @param {number} id - 资源ID
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
function update(id, data) {
  return api.put(`/api/resources/${id}`, data);
}

/**
 * 删除资源
 * @param {number} id - 资源ID
 * @returns {Promise}
 */
function remove(id) {
  return api.del(`/api/resources/${id}`);
}

/**
 * 获取我发布的资源
 * @returns {Promise}
 */
function getMy() {
  return api.get('/api/resources/my');
}

module.exports = {
  getAll,
  getById,
  add,
  update,
  remove,
  getMy
};
