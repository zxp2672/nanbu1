// pages/activity/activity.js
const activityService = require('../../services/activity.js');
const util = require('../../utils/util.js');

Page({
  data: {
    activityList: [],
    filters: [
      { key: 'all', label: '全部' },
      { key: 'upcoming', label: '即将开始' },
      { key: 'ongoing', label: '进行中' },
      { key: 'ended', label: '已结束' }
    ],
    activeFilter: 'all',
    loading: false
  },

  onLoad() {
    this.loadActivities();
  },

  onPullDownRefresh() {
    this.loadActivities().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShow() {
    this.loadActivities();
  },

  // 加载活动列表
  async loadActivities() {
    this.setData({ loading: true });
    try {
      const { activeFilter } = this.data;
      const status = activeFilter === 'all' ? '' : activeFilter;
      const activities = await activityService.getAll(status);
      
      // 处理活动数据
      const processedActivities = (activities || []).map(a => ({
        ...a,
        organizerName: a.organizer?.name || a.organizerName || '管理员'
      }));
      
      this.setData({
        activityList: processedActivities,
        loading: false
      });
    } catch (err) {
      console.error('加载活动失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
    }
  },

  // 切换筛选
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });
    this.loadActivities();
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '南部县校友会联盟 - 校友活动',
      path: '/pages/activity/activity'
    };
  }
});
