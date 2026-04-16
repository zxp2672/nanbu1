// pages/alumni-detail/alumni-detail.js
const alumniService = require('../../services/alumni.js');

Page({
  data: {
    alumni: null,
    loading: true,
    schoolColors: {
      '南部中学': '#1a6fc4',
      '南部二中': '#7c3aed',
      '南部三中': '#059669',
      '大桥中学': '#d97706',
      '东坝中学': '#dc2626',
      '建兴中学': '#0891b2'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.loadAlumni(options.id);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载校友详情
  async loadAlumni(id) {
    this.setData({ loading: true });
    try {
      const res = await alumniService.getById(id);
      const alumni = res.data || res;
      this.setData({
        alumni: alumni,
        loading: false
      });
    } catch (err) {
      console.error('加载校友详情失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 获取学校颜色
  getSchoolColor(schoolName) {
    if (!schoolName) return '#1a6fc4';
    const { schoolColors } = this.data;
    
    // 尝试直接匹配
    if (schoolColors[schoolName]) {
      return schoolColors[schoolName];
    }
    
    // 尝试包含匹配
    for (const [name, color] of Object.entries(schoolColors)) {
      if (schoolName.includes(name)) {
        return color;
      }
    }
    
    return '#1a6fc4';
  },

  // 拨打电话
  makeCall() {
    const { alumni } = this.data;
    if (!alumni || !alumni.phone) {
      wx.showToast({
        title: '暂无电话号码',
        icon: 'none'
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: alumni.phone,
      fail: (err) => {
        if (err.errMsg !== 'makePhoneCall:fail cancel') {
          wx.showToast({
            title: '拨打失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
