const util = require('../../utils/util.js');

Component({
  properties: {
    activity: {
      type: Object,
      value: {}
    }
  },

  data: {
    status: '',
    statusText: ''
  },

  observers: {
    'activity': function(activity) {
      if (activity && activity.startTime && activity.endTime) {
        const status = util.getActivityStatus(activity);
        const statusText = util.getActivityStatusText(status);
        this.setData({ status, statusText });
      }
    }
  },

  methods: {
    onTap() {
      const { activity } = this.properties;
      if (activity && activity.id) {
        wx.navigateTo({
          url: `/pages/activity-detail/activity-detail?id=${activity.id}`
        });
      }
    },

    formatDate(dateStr) {
      return util.formatDate(dateStr);
    },

    formatDateTime(dateStr) {
      return util.formatDateTime(dateStr);
    }
  }
});
