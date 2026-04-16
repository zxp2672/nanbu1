// HTTP请求封装

// 后端API基础地址
const BASE_URL = 'https://xy1.001tf.com';

/**
 * 基础请求方法
 * @param {string} url - 请求路径（不含BASE_URL）
 * @param {string} method - HTTP方法
 * @param {object} data - 请求数据
 * @param {object} header - 额外请求头
 * @returns {Promise} 返回Promise
 */
function request(url, method = 'GET', data = {}, header = {}) {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = wx.getStorageSync('nb_token');
    
    // 构建请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    };
    
    // 如果有token，添加Authorization头
    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`;
    }
    
    wx.request({
      url: `${BASE_URL}${url}`,
      method: method,
      data: data,
      header: requestHeader,
      success: (res) => {
        // 处理HTTP状态码
        if (res.statusCode === 200) {
          // 解析后端ApiResponse格式 {code, message, data}
          const response = res.data;
          if (response.code === 200 || response.code === 0) {
            // 成功，返回data字段
            resolve(response.data);
          } else {
            // 业务错误
            reject({
              code: response.code,
              message: response.message || '请求失败'
            });
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除token
          wx.removeStorageSync('nb_token');
          wx.removeStorageSync('nb_user');
          
          // 可选：跳转到登录页
          const pages = getCurrentPages();
          const currentPage = pages[pages.length - 1];
          if (currentPage && currentPage.route !== 'pages/login/login') {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
          
          reject({
            code: 401,
            message: '登录已过期，请重新登录'
          });
        } else {
          // 其他HTTP错误
          reject({
            code: res.statusCode,
            message: res.data?.message || `请求失败 (${res.statusCode})`
          });
        }
      },
      fail: (err) => {
        reject({
          code: -1,
          message: '网络请求失败，请检查网络连接'
        });
      }
    });
  });
}

/**
 * GET请求
 * @param {string} url - 请求路径
 * @param {object} data - 查询参数
 * @returns {Promise}
 */
function get(url, data = {}) {
  // 构建查询字符串
  const params = Object.keys(data)
    .filter(key => data[key] !== undefined && data[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
  
  const fullUrl = params ? `${url}?${params}` : url;
  return request(fullUrl, 'GET');
}

/**
 * POST请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求体数据
 * @returns {Promise}
 */
function post(url, data = {}) {
  return request(url, 'POST', data);
}

/**
 * PUT请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求体数据
 * @returns {Promise}
 */
function put(url, data = {}) {
  return request(url, 'PUT', data);
}

/**
 * DELETE请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求体数据（可选）
 * @returns {Promise}
 */
function del(url, data = {}) {
  return request(url, 'DELETE', data);
}

// 获取基础URL
function getBaseUrl() {
  return BASE_URL;
}

module.exports = {
  BASE_URL,
  getBaseUrl,
  request,
  get,
  post,
  put,
  del
};
