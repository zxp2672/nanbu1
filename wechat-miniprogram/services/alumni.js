// 校友服务
const api = require('../utils/api');

/**
 * 获取所有校友列表
 * @param {object} params - 查询参数，可包含keyword, school, level, year, classname
 * @returns {Promise}
 */
function getAll(params = {}) {
  return api.get('/api/alumni', params);
}

/**
 * 根据ID获取校友详情
 * @param {number} id - 校友ID
 * @returns {Promise}
 */
function getById(id) {
  return api.get(`/api/alumni/${id}`);
}

/**
 * 添加校友
 * @param {object} data - 校友数据
 * @returns {Promise}
 */
function add(data) {
  return api.post('/api/alumni', data);
}

/**
 * 更新校友信息
 * @param {number} id - 校友ID
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
function update(id, data) {
  return api.put(`/api/alumni/${id}`, data);
}

/**
 * 删除校友
 * @param {number} id - 校友ID
 * @returns {Promise}
 */
function remove(id) {
  return api.del(`/api/alumni/${id}`);
}

/**
 * 审批通过校友
 * @param {number} id - 校友ID
 * @returns {Promise}
 */
function approve(id) {
  return api.post(`/api/alumni/${id}/approve`);
}

/**
 * 拒绝校友申请
 * @param {number} id - 校友ID
 * @returns {Promise}
 */
function reject(id) {
  return api.post(`/api/alumni/${id}/reject`);
}

/**
 * 获取待审批校友列表
 * @returns {Promise}
 */
function getPending() {
  return api.get('/api/alumni/pending');
}

/**
 * 获取入学年份列表
 * @param {string} school - 学校名称
 * @param {string} level - 学段
 * @returns {Promise}
 */
function getYears(school, level) {
  const params = {};
  if (school) params.school = school;
  if (level) params.level = level;
  return api.get('/api/alumni/years', params);
}

/**
 * 获取班级列表
 * @param {string} school - 学校名称
 * @param {string} level - 学段
 * @param {string} year - 入学年份
 * @returns {Promise}
 */
function getClasses(school, level, year) {
  const params = {};
  if (school) params.school = school;
  if (level) params.level = level;
  if (year) params.year = year;
  return api.get('/api/alumni/classes', params);
}

/**
 * 按学校统计校友数量
 * @returns {Promise}
 */
function getStatsBySchool() {
  return api.get('/api/alumni/stats/by-school');
}

/**
 * 获取校友总数
 * @returns {Promise}
 */
function getStatsCount() {
  return api.get('/api/alumni/stats/count');
}

module.exports = {
  getAll,
  getById,
  add,
  update,
  remove,
  approve,
  reject,
  getPending,
  getYears,
  getClasses,
  getStatsBySchool,
  getStatsCount
};
