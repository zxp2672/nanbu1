// 管理后台页
const auth = require('../../utils/auth');
const userService = require('../../services/user');
const alumniService = require('../../services/alumni');

Page({
  data: {
    activeTab: 'pending',
    pendingList: [],
    alumniList: [],
    userList: [],
    loading: false,
    userInfo: null,
    isSuperAdmin: false,
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
    },
    // 状态标签样式
    statusStyles: {
      'pending': { bg: 'rgba(255, 170, 0, 0.15)', color: '#ffaa00' },
      'approved': { bg: 'rgba(0, 255, 136, 0.15)', color: '#00ff88' },
      'rejected': { bg: 'rgba(255, 68, 102, 0.15)', color: '#ff4466' }
    }
  },

  onLoad() {
    this.checkPermission();
  },

  // 检查权限
  checkPermission() {
    const userInfo = auth.getUserInfo();
    
    // 检查是否为管理员
    if (!auth.isAnyAdmin(userInfo)) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限访问管理后台',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    const isSuperAdmin = auth.isSuperAdmin(userInfo);
    this.setData({
      userInfo,
      isSuperAdmin
    });

    // 加载待审核列表
    this.loadPending();
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    switch (tab) {
      case 'pending':
        this.loadPending();
        break;
      case 'alumni':
        this.loadAlumni();
        break;
      case 'users':
        if (this.data.isSuperAdmin) {
          this.loadUsers();
        }
        break;
    }
  },

  // 加载待审核校友
  loadPending() {
    this.setData({ loading: true });
    alumniService.getPending()
      .then(list => {
        this.setData({
          pendingList: list || [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载待审核列表失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 加载所有校友
  loadAlumni() {
    this.setData({ loading: true });
    alumniService.getAll()
      .then(list => {
        this.setData({
          alumniList: list || [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载校友列表失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 加载所有用户（仅超级管理员）
  loadUsers() {
    if (!this.data.isSuperAdmin) return;
    
    this.setData({ loading: true });
    userService.getAll()
      .then(list => {
        this.setData({
          userList: list || [],
          loading: false
        });
      })
      .catch(err => {
        console.error('加载用户列表失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 通过校友审核
  approveAlumni(e) {
    const id = e.currentTarget.dataset.id;
    alumniService.approve(id)
      .then(() => {
        wx.showToast({
          title: '已通过',
          icon: 'success'
        });
        this.loadPending();
      })
      .catch(err => {
        console.error('审核失败:', err);
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none'
        });
      });
  },

  // 拒绝校友审核
  rejectAlumni(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝该校友申请吗？',
      confirmColor: '#ff4466',
      success: (res) => {
        if (res.confirm) {
          alumniService.reject(id)
            .then(() => {
              wx.showToast({
                title: '已拒绝',
                icon: 'success'
              });
              this.loadPending();
            })
            .catch(err => {
              console.error('拒绝失败:', err);
              wx.showToast({
                title: err.message || '操作失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 删除校友
  deleteAlumni(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该校友吗？此操作不可恢复。',
      confirmColor: '#ff4466',
      success: (res) => {
        if (res.confirm) {
          alumniService.remove(id)
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadAlumni();
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

  // 删除用户
  deleteUser(e) {
    const id = e.currentTarget.dataset.id;
    const { userInfo } = this.data;
    
    // 不能删除自己
    if (id === userInfo.id) {
      wx.showToast({
        title: '不能删除自己',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该用户吗？此操作不可恢复。',
      confirmColor: '#ff4466',
      success: (res) => {
        if (res.confirm) {
          userService.remove(id)
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadUsers();
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

  // 获取角色标签颜色
  getRoleColor(role) {
    return this.data.roleColors[role] || '#7b8ca8';
  },

  // 获取角色中文名
  getRoleName(role) {
    return this.data.roleNames[role] || '用户';
  },

  // 获取状态样式
  getStatusStyle(status) {
    return this.data.statusStyles[status] || { bg: 'rgba(123, 140, 168, 0.15)', color: '#7b8ca8' };
  }
});
