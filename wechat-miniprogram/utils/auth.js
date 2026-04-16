// 认证与权限工具

const TOKEN_KEY = 'nb_token';
const USER_KEY = 'nb_user';

/**
 * 获取token
 * @returns {string|null}
 */
function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || null;
}

/**
 * 设置token
 * @param {string} token
 */
function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token);
}

/**
 * 移除token
 */
function removeToken() {
  wx.removeStorageSync(TOKEN_KEY);
}

/**
 * 获取用户信息
 * @returns {object|null}
 */
function getUserInfo() {
  const user = wx.getStorageSync(USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * 设置用户信息
 * @param {object} user
 */
function setUserInfo(user) {
  wx.setStorageSync(USER_KEY, JSON.stringify(user));
}

/**
 * 移除用户信息
 */
function removeUserInfo() {
  wx.removeStorageSync(USER_KEY);
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!getToken();
}

/**
 * 检查登录状态，未登录时跳转到登录页
 * @returns {boolean}
 */
function requireAuth() {
  if (!isLoggedIn()) {
    wx.navigateTo({
      url: '/pages/login/login'
    });
    return false;
  }
  return true;
}

/**
 * 检查是否为超级管理员
 * @param {object} user
 * @returns {boolean}
 */
function isSuperAdmin(user) {
  return user && user.role === 'superadmin';
}

/**
 * 检查是否为任意管理员（超级/学校/年级/班级）
 * @param {object} user
 * @returns {boolean}
 */
function isAnyAdmin(user) {
  if (!user || !user.role) return false;
  const adminRoles = ['superadmin', 'school_admin', 'grade_admin', 'class_admin'];
  return adminRoles.includes(user.role);
}

/**
 * 检查是否可以管理指定校友
 * @param {object} user - 当前用户
 * @param {object} alumni - 校友信息
 * @returns {boolean}
 */
function canManageAlumni(user, alumni) {
  if (!user || !alumni) return false;
  
  // 超级管理员可以管理所有
  if (isSuperAdmin(user)) return true;
  
  // 学校管理员可以管理本校
  if (user.role === 'school_admin') {
    return user.school === alumni.school;
  }
  
  // 年级管理员可以管理本校同年级
  if (user.role === 'grade_admin') {
    return user.school === alumni.school && user.level === alumni.level;
  }
  
  // 班级管理员可以管理本校同年级同班级
  if (user.role === 'class_admin') {
    return user.school === alumni.school && 
           user.level === alumni.level && 
           user.className === alumni.className;
  }
  
  return false;
}

/**
 * 退出登录
 */
function logout() {
  removeToken();
  removeUserInfo();
  
  // 重置全局数据
  const app = getApp();
  if (app) {
    app.globalData.userInfo = null;
    app.globalData.isLoggedIn = false;
  }
  
  // 跳转到登录页
  wx.reLaunch({
    url: '/pages/login/login'
  });
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  isLoggedIn,
  requireAuth,
  isSuperAdmin,
  isAnyAdmin,
  canManageAlumni,
  logout
};
