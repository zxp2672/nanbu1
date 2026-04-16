// pages/activity-detail/activity-detail.js
const activityService = require('../../services/activity.js');
const auth = require('../../utils/auth.js');
const util = require('../../utils/util.js');

Page({
  data: {
    activity: null,
    loading: true,
    isSignedUp: false,
    signingUp: false,
    activityId: null
  },

  async onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({
        title: '活动ID不存在',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ activityId: id });
    await this.loadActivityDetail(id);
    
    // 如果已登录，检查报名状态
    if (auth.isLoggedIn()) {
      await this.checkSignupStatus(id);
    }
  },

  // 加载活动详情
  async loadActivityDetail(id) {
    this.setData({ loading: true });
    try {
      const activity = await activityService.getById(id);
      
      // 计算活动状态
      const statusInfo = this.getStatusInfo(activity);
      
      this.setData({
        activity: {
          ...activity,
          ...statusInfo,
          organizerName: activity.organizer?.name || activity.organizerName || '管理员'
        },
        loading: false
      });
      
      // 更新导航栏标题
      if (activity.name) {
        wx.setNavigationBarTitle({
          title: activity.name
        });
      }
    } catch (err) {
      console.error('加载活动详情失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    }
  },

  // 检查报名状态
  async checkSignupStatus(id) {
    try {
      const isSignedUp = await activityService.isSignedUp(id);
      this.setData({ isSignedUp });
    } catch (err) {
      console.error('检查报名状态失败:', err);
    }
  },

  // 获取活动状态信息
  getStatusInfo(activity) {
    if (!activity || !activity.startTime || !activity.endTime) {
      return { status: 'unknown', statusText: '未知', statusColor: '#7b8ca8' };
    }
    
    const now = new Date().getTime();
    const startTime = new Date(activity.startTime).getTime();
    const endTime = new Date(activity.endTime).getTime();
    
    let status, statusText, statusColor;
    
    if (now < startTime) {
      status = 'upcoming';
      statusText = '即将开始';
      statusColor = '#00d4ff'; // 青蓝
    } else if (now >= startTime && now <= endTime) {
      status = 'ongoing';
      statusText = '进行中';
      statusColor = '#00ff88'; // 绿色
    } else {
      status = 'ended';
      statusText = '已结束';
      statusColor = '#7b8ca8'; // 灰色
    }
    
    return { status, statusText, statusColor };
  },

  // 报名
  async doSignup() {
    if (!auth.requireAuth()) {
      return;
    }
    
    const { activity, activityId } = this.data;
    
    // 检查活动是否已结束
    if (activity.status === 'ended') {
      wx.showToast({
        title: '活动已结束',
        icon: 'none'
      });
      return;
    }
    
    // 检查是否已满员
    if (activity.capacity > 0 && activity.signups && activity.signups.length >= activity.capacity) {
      wx.showToast({
        title: '报名人数已满',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ signingUp: true });
    
    try {
      await activityService.signup(activityId);
      this.setData({ 
        isSignedUp: true,
        signingUp: false 
      });
      wx.showToast({
        title: '报名成功',
        icon: 'success'
      });
      // 刷新活动详情
      await this.loadActivityDetail(activityId);
    } catch (err) {
      this.setData({ signingUp: false });
      wx.showToast({
        title: err.message || '报名失败',
        icon: 'none'
      });
    }
  },

  // 取消报名
  async doCancelSignup() {
    const { activityId } = this.data;
    
    const res = await wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      confirmColor: '#ff4466'
    });
    
    if (!res.confirm) {
      return;
    }
    
    this.setData({ signingUp: true });
    
    try {
      await activityService.cancelSignup(activityId);
      this.setData({ 
        isSignedUp: false,
        signingUp: false 
      });
      wx.showToast({
        title: '已取消报名',
        icon: 'success'
      });
      // 刷新活动详情
      await this.loadActivityDetail(activityId);
    } catch (err) {
      this.setData({ signingUp: false });
      wx.showToast({
        title: err.message || '取消失败',
        icon: 'none'
      });
    }
  },

  // 分享
  onShareAppMessage() {
    const { activity, activityId } = this.data;
    return {
      title: activity?.name || '南部县校友会联盟 - 活动详情',
      path: `/pages/activity-detail/activity-detail?id=${activityId}`
    };
  },

  // 格式化时间
  formatDateTime(dateStr) {
    return util.formatDateTime(dateStr);
  }
});
