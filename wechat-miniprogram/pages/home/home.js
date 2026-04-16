const app = getApp();
const alumniService = require('../../services/alumni');
const postService = require('../../services/post');
const activityService = require('../../services/activity');
const resourceService = require('../../services/resource');
const schoolService = require('../../services/school');

Page({
  data: {
    stats: {
      alumniCount: 0,
      activityCount: 0,
      resourceCount: 0,
      postCount: 0
    },
    schoolStats: [],
    schools: [],
    recentPosts: [],
    loading: false
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    try {
      // 并行调用所有API
      const [alumniStats, schoolStatsResult, posts, activities, resources, schools] = await Promise.all([
        alumniService.getStatsCount(),
        alumniService.getStatsBySchool(),
        postService.getRecent(5),
        activityService.getAll(),
        resourceService.getAll(),
        schoolService.getAll()
      ]);

      // 处理统计数据
      const stats = {
        alumniCount: (alumniStats && alumniStats.approved) ? alumniStats.approved : 0,
        activityCount: Array.isArray(activities) ? activities.length : 0,
        resourceCount: Array.isArray(resources) ? resources.length : 0,
        postCount: Array.isArray(posts) ? posts.length : 0
      };

      // 处理学校统计数据
      let schoolStatsData = [];
      if (schoolStatsResult && typeof schoolStatsResult === 'object' && !Array.isArray(schoolStatsResult)) {
        // 后端返回对象格式 { "南部中学": 50, "南部二中": 30 }
        const entries = Object.entries(schoolStatsResult);
        const total = entries.reduce((sum, [_, count]) => sum + (count || 0), 0);
        schoolStatsData = entries.map(([schoolName, count]) => ({
          school: schoolName,
          count: count || 0,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          color: this.getSchoolColor(schoolName)
        }));
      } else if (Array.isArray(schoolStatsResult)) {
        // 兼容数组格式
        const total = schoolStatsResult.reduce((sum, item) => sum + (item.count || 0), 0);
        schoolStatsData = schoolStatsResult.map(item => ({
          school: item.school || item.name,
          count: item.count || 0,
          percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
          color: this.getSchoolColor(item.school || item.name)
        }));
      }

      // 处理学校列表
      const schoolsData = Array.isArray(schools) ? schools.slice(0, 6) : [];

      // 处理最新动态
      const recentPostsData = Array.isArray(posts) ? posts : [];

      this.setData({
        stats,
        schoolStats: schoolStatsData,
        schools: schoolsData,
        recentPosts: recentPostsData
      });
    } catch (error) {
      console.error('加载首页数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  // 获取学校品牌色
  getSchoolColor(schoolName) {
    const schoolColors = {
      '南部中学': '#1a6fc4',
      '南部二中': '#7c3aed',
      '南部三中': '#059669',
      '大桥中学': '#d97706',
      '东坝中学': '#dc2626',
      '建兴中学': '#0891b2'
    };
    
    if (!schoolName) return '#1a6fc4';
    if (schoolColors[schoolName]) return schoolColors[schoolName];
    
    for (const [name, color] of Object.entries(schoolColors)) {
      if (schoolName.includes(name)) return color;
    }
    
    return '#1a6fc4';
  },

  // 跳转到校友页
  navigateToAlumni() {
    wx.switchTab({
      url: '/pages/alumni/alumni'
    });
  },

  // 跳转到活动页
  navigateToActivity() {
    wx.switchTab({
      url: '/pages/activity/activity'
    });
  },

  // 跳转到资源页
  navigateToResource() {
    wx.switchTab({
      url: '/pages/resource/resource'
    });
  },

  // 动态不需要独立详情页，移除跳转
});
