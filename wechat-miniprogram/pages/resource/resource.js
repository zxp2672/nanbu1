// pages/resource/resource.js
const resourceService = require('../../services/resource.js');
const auth = require('../../utils/auth.js');
const util = require('../../utils/util.js');

Page({
  data: {
    resourceList: [],
    categories: [
      { key: 'all', label: '全部' },
      { key: 'job', label: '招聘' },
      { key: 'project', label: '项目' },
      { key: 'invest', label: '投资' },
      { key: 'other', label: '其他' }
    ],
    activeCategory: 'all',
    loading: false,
    showAddForm: false,
    newResource: {
      title: '',
      type: 'job',
      description: '',
      contact: ''
    },
    currentUserId: 0
  },

  onLoad() {
    // 获取当前用户ID
    const userInfo = auth.getUserInfo();
    if (userInfo) {
      this.setData({ currentUserId: userInfo.id || 0 });
    }
    this.loadResources();
  },

  onPullDownRefresh() {
    this.loadResources().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShow() {
    // 从其他页面返回时刷新
    this.loadResources();
  },

  // 加载资源列表
  async loadResources() {
    this.setData({ loading: true });
    try {
      const { activeCategory } = this.data;
      const type = activeCategory === 'all' ? '' : activeCategory;
      const resources = await resourceService.getAll(type);
      
      // 处理资源数据，添加格式化时间
      const processedResources = (resources || []).map(r => ({
        ...r,
        timeAgo: util.formatTimeAgo(r.createdAt)
      }));
      
      this.setData({
        resourceList: processedResources,
        loading: false
      });
    } catch (err) {
      console.error('加载资源失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    }
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
    this.loadResources();
  },

  // 显示添加表单
  showAdd() {
    if (!auth.requireAuth()) {
      return;
    }
    this.setData({
      showAddForm: true,
      newResource: {
        title: '',
        type: 'job',
        description: '',
        contact: ''
      }
    });
  },

  // 隐藏添加表单
  hideAdd() {
    this.setData({ showAddForm: false });
  },

  // 表单输入绑定
  onAddInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`newResource.${field}`]: value
    });
  },

  // 切换资源类型
  onTypeChange(e) {
    const typeIndex = e.detail.value;
    const types = ['job', 'project', 'invest', 'other'];
    this.setData({
      'newResource.type': types[typeIndex]
    });
  },

  // 提交资源
  async submitResource() {
    const { newResource } = this.data;
    
    if (!newResource.title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return;
    }
    
    if (!newResource.description.trim()) {
      wx.showToast({
        title: '请输入描述',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '提交中...' });
      await resourceService.add(newResource);
      wx.hideLoading();
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });
      this.hideAdd();
      this.loadResources();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '发布失败',
        icon: 'none'
      });
    }
  },

  // 删除资源
  onDeleteResource(e) {
    const { id } = e.detail;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条资源吗？',
      confirmColor: '#ff4466',
      success: (res) => {
        if (res.confirm) {
          this.doDeleteResource(id);
        }
      }
    });
  },

  // 执行删除
  async doDeleteResource(id) {
    try {
      wx.showLoading({ title: '删除中...' });
      await resourceService.remove(id);
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      this.loadResources();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '删除失败',
        icon: 'none'
      });
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '南部县校友会联盟 - 资源共享',
      path: '/pages/resource/resource'
    };
  }
});
