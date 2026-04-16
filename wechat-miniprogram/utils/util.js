// 通用工具函数

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {string|Date} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 * @param {string|Date} dateStr
 * @returns {string}
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 获取相对时间（刚刚/x分钟前/x小时前/x天前）
 * @param {string|Date} dateStr
 * @returns {string}
 */
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }
  
  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  
  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}天前`;
  }
  
  // 超过7天，返回日期
  return formatDate(dateStr);
}

/**
 * 获取活动状态
 * @param {object} activity - 活动对象，包含startTime和endTime
 * @returns {string} upcoming/ongoing/ended
 */
function getActivityStatus(activity) {
  if (!activity || !activity.startTime || !activity.endTime) {
    return 'unknown';
  }
  
  const now = new Date().getTime();
  const startTime = new Date(activity.startTime).getTime();
  const endTime = new Date(activity.endTime).getTime();
  
  if (now < startTime) {
    return 'upcoming';
  } else if (now >= startTime && now <= endTime) {
    return 'ongoing';
  } else {
    return 'ended';
  }
}

/**
 * 获取活动状态中文文本
 * @param {string} status - 状态码
 * @returns {string}
 */
function getActivityStatusText(status) {
  const statusMap = {
    'upcoming': '即将开始',
    'ongoing': '进行中',
    'ended': '已结束',
    'unknown': '未知'
  };
  return statusMap[status] || status;
}

/**
 * 截断文字
 * @param {string} str - 原字符串
 * @param {number} len - 最大长度
 * @returns {string}
 */
function truncate(str, len = 50) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}

/**
 * 根据学校名获取对应品牌色
 * @param {string} schoolName
 * @returns {string}
 */
function getSchoolColor(schoolName) {
  if (!schoolName) return '#1a6fc4';
  
  const colorMap = {
    '南部中学': '#1a6fc4',
    '南部二中': '#7c3aed',
    '南部三中': '#059669',
    '大桥中学': '#d97706',
    '东坝中学': '#dc2626',
    '建兴中学': '#0891b2'
  };
  
  // 尝试直接匹配
  if (colorMap[schoolName]) {
    return colorMap[schoolName];
  }
  
  // 尝试包含匹配
  for (const [name, color] of Object.entries(colorMap)) {
    if (schoolName.includes(name)) {
      return color;
    }
  }
  
  return '#1a6fc4';
}

module.exports = {
  formatDate,
  formatDateTime,
  formatTimeAgo,
  getActivityStatus,
  getActivityStatusText,
  truncate,
  getSchoolColor
};
