App({
  onLaunch() {
    // 检查登录态
    const token = wx.getStorageSync('nb_token');
    if (token) {
      // 获取用户信息
      const userService = require('./services/user');
      userService.getMe().then(user => {
        this.globalData.userInfo = user;
        this.globalData.isLoggedIn = true;
      }).catch(() => {
        wx.removeStorageSync('nb_token');
        this.globalData.isLoggedIn = false;
      });
    }
  },
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    schools: [
      { id: 's1', name: '南部中学', short: 'nb1', color: '#1a6fc4' },
      { id: 's2', name: '南部二中', short: 'nb2', color: '#7c3aed' },
      { id: 's3', name: '南部三中', short: 'nb3', color: '#059669' },
      { id: 's4', name: '大桥中学', short: 'dq', color: '#d97706' },
      { id: 's5', name: '东坝中学', short: 'db', color: '#dc2626' },
      { id: 's6', name: '建兴中学', short: 'jx', color: '#0891b2' }
    ]
  }
});
