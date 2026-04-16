// 个人中心页
const auth = require('../../utils/auth');
const userService = require('../../services/user');
const postService = require('../../services/post');

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    activeTab: 'posts',
    myPosts: [],
    loading: false,
    showPostForm: false,
    newPostContent: '',
    editMode: false,
    editForm: {},
    // 角色标签颜色映射
    roleColors: {
      'superadmin': '#ffaa00',
      'school_admin': '#7c3aed',
      'grade_admin': '#0891b2',
      'class_admin': '#1a6fc4',
      'user': '#7b8ca8'
    },
    // 角色中文名映射
    roleNames: {
      'superadmin': '总管理员',
      'school_admin': '学校管理员',
      'grade_admin': '年级管理员',
      'class_admin': '班级管理员',
      'user': '普通用户'
    }
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    // 每次显示时刷新登录状态和数据
    this.checkLogin();
    if (this.data.isLoggedIn && this.data.activeTab === 'posts') {
      this.loadMyPosts();
    }
  },

  // 检查登录状态
  checkLogin() {
    const isLoggedIn = auth.isLoggedIn();
    const userInfo = auth.getUserInfo();
    
    this.setData({
      isLoggedIn,
      userInfo
    });

    if (isLoggedIn) {
      // 如果当前在posts tab，加载我的动态
      if (this.data.activeTab === 'posts') {
        this.loadMyPosts();
      }
      // 如果当前在profile tab，初始化编辑表单
      if (this.data.activeTab === 'profile') {
        this.initEditForm();
      }
    }
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    switch (tab) {
      case 'posts':
        if (this.data.isLoggedIn) {
          this.loadMyPosts();
        }
        break;
      case 'profile':
        if (this.data.isLoggedIn) {
          this.initEditForm();
        }
        break;
      case 'settings':
        // 设置tab无需额外加载
        break;
    }
  },

  // 加载我的动态
  loadMyPosts() {
    if (!this.data.isLoggedIn) return;
    
    this.setData({ loading: true });
    postService.getMy()
      .then(posts => {
        this.setData({
          myPosts: posts || [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载动态失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 跳转到登录页
  goLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },
  
  // 选择并上传头像
  chooseAvatar() {
    if (!this.data.isLoggedIn) {
      this.goLogin();
      return;
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath;
        this.uploadAvatar(filePath);
      }
    });
  },
  
  // 上传头像到服务器
  uploadAvatar(filePath) {
    const api = require('../../utils/api');
      
    wx.showLoading({ title: '上传中...' });
      
    wx.uploadFile({
      url: api.getBaseUrl() + '/api/upload/avatar',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': 'Bearer ' + auth.getToken()
      },
      success: (res) => {
        wx.hideLoading();
        try {
          const result = JSON.parse(res.data);
          if (result.code === 200 && result.data && result.data.url) {
            const fullUrl = api.getBaseUrl() + result.data.url;
            this.setData({ 'userInfo.avatar': fullUrl });
            // 更新本地存储
            const userInfo = auth.getUserInfo();
            if (userInfo) {
              userInfo.avatar = fullUrl;
              auth.setUserInfo(userInfo);
            }
            // 更新全局数据
            const app = getApp();
            if (app.globalData && app.globalData.userInfo) {
              app.globalData.userInfo.avatar = fullUrl;
            }
            wx.showToast({ title: '头像更新成功', icon: 'success' });
          } else {
            wx.showToast({ title: result.message || '上传失败', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 显示发布动态弹窗
  showPostDialog() {
    this.setData({
      showPostForm: true,
      newPostContent: ''
    });
  },

  // 隐藏发布动态弹窗
  hidePostDialog() {
    this.setData({
      showPostForm: false,
      newPostContent: ''
    });
  },

  // 动态内容输入
  onPostInput(e) {
    this.setData({
      newPostContent: e.detail.value
    });
  },

  // 提交动态
  submitPost() {
    const content = this.data.newPostContent.trim();
    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });
    postService.add({ content })
      .then(() => {
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        });
        this.setData({
          showPostForm: false,
          newPostContent: ''
        });
        this.loadMyPosts();
      })
      .catch(err => {
        console.error('发布失败:', err);
        wx.showToast({
          title: err.message || '发布失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 删除动态
  onDeletePost(e) {
    const { id } = e.detail;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条动态吗？',
      confirmColor: '#ff4466',
      success: (res) => {
        if (res.confirm) {
          postService.remove(id)
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadMyPosts();
            })
            .catch(err => {
              console.error('删除失败:', err);
              wx.showToast({
                title: err.message || '删除失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 初始化编辑表单
  initEditForm() {
    const { userInfo } = this.data;
    if (userInfo) {
      this.setData({
        editForm: {
          name: userInfo.name || '',
          job: userInfo.job || '',
          city: userInfo.city || '',
          school: userInfo.school || '',
          bio: userInfo.bio || ''
        }
      });
    }
  },

  // 切换编辑模式
  toggleEdit() {
    const { editMode, userInfo } = this.data;
    if (!editMode) {
      // 进入编辑模式，初始化表单
      this.initEditForm();
    }
    this.setData({ editMode: !editMode });
  },

  // 编辑字段输入
  onEditInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`editForm.${field}`]: value
    });
  },

  // 保存资料
  saveProfile() {
    const { editForm } = this.data;
    
    this.setData({ loading: true });
    userService.updateProfile(editForm)
      .then(updatedUser => {
        // 更新本地缓存
        const userInfo = { ...this.data.userInfo, ...editForm };
        auth.setUserInfo(userInfo);
        
        // 更新全局数据
        const app = getApp();
        if (app) {
          app.globalData.userInfo = userInfo;
        }
        
        this.setData({
          userInfo,
          editMode: false,
          loading: false
        });
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('保存失败:', err);
        wx.showToast({
          title: err.message || '保存失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 退出登录
  doLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmColor: '#ff4466',
      success: (res) => {
        if (res.confirm) {
          auth.logout();
          // 清除页面状态
          this.setData({
            userInfo: null,
            isLoggedIn: false,
            myPosts: [],
            activeTab: 'posts'
          });
        }
      }
    });
  },

  // 进入管理后台
  goAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    });
  },

  // 获取角色标签颜色
  getRoleColor(role) {
    return this.data.roleColors[role] || '#7b8ca8';
  },

  // 获取角色中文名
  getRoleName(role) {
    return this.data.roleNames[role] || '用户';
  },

  // 检查是否为管理员
  isAnyAdmin() {
    return auth.isAnyAdmin(this.data.userInfo);
  }
});
