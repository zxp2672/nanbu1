const app = getApp();
const userService = require('../../services/user');
const auth = require('../../utils/auth');

Page({
  data: {
    username: '',
    password: '',
    loading: false,
    showDemo: true
  },

  onLoad() {
    // 如果已登录，直接跳转到首页
    if (auth.isLoggedIn()) {
      wx.switchTab({
        url: '/pages/home/home'
      });
    }
  },

  // 用户名输入
  onInputUsername(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 密码输入
  onInputPassword(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 登录
  async doLogin() {
    const { username, password } = this.data;

    // 验证非空
    if (!username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (!password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '登录中...' });

    try {
      const res = await userService.login(username.trim(), password);
      
      if (res.token && res.user) {
        // 保存token和用户信息
        auth.setToken(res.token);
        auth.setUserInfo(res.user);
        
        // 更新全局数据
        app.globalData.userInfo = res.user;
        app.globalData.isLoggedIn = true;

        wx.hideLoading();
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 延迟跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/home'
          });
        }, 1000);
      } else {
        throw new Error('登录响应数据不完整');
      }
    } catch (error) {
      wx.hideLoading();
      this.setData({ loading: false });
      
      const errorMsg = error.message || '登录失败，请检查用户名和密码';
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 演示账号快速填入
  demoLogin(e) {
    const { username, password } = e.currentTarget.dataset;
    this.setData({
      username,
      password
    });
  },

  // 切换演示账号显示
  toggleDemo() {
    this.setData({
      showDemo: !this.data.showDemo
    });
  }
});
