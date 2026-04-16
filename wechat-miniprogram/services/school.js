// 学校服务
const api = require('../utils/api');

/**
 * 获取所有学校列表
 * @returns {Promise}
 */
function getAll() {
  return api.get('/api/schools');
}

/**
 * 根据ID获取学校详情
 * @param {number} id - 学校ID
 * @returns {Promise}
 */
function getById(id) {
  return api.get(`/api/schools/${id}`);
}

/**
 * 根据名称获取学校
 * @param {string} name - 学校名称
 * @returns {Promise}
 */
function getByName(name) {
  return api.get(`/api/schools/by-name/${encodeURIComponent(name)}`);
}

module.exports = {
  getAll,
  getById,
  getByName
};
