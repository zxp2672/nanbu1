const util = require('../../utils/util.js');

Component({
  properties: {
    resource: {
      type: Object,
      value: {}
    },
    currentUserId: {
      type: Number,
      value: 0
    }
  },

  data: {
    typeText: '其他资源',
    typeColor: '#7b8ca8',
    typeColorBg: '#7b8ca820',
    typeColorBorder: '#7b8ca840',
    timeAgo: ''
  },

  observers: {
    'resource.type': function(type) {
      const typeMap = {
        'job': { text: '招聘信息', color: '#00d4ff' },
        'project': { text: '项目合作', color: '#7c3aed' },
        'invest': { text: '投资机会', color: '#00ff88' },
        'other': { text: '其他资源', color: '#7b8ca8' }
      };
      const info = typeMap[type] || typeMap['other'];
      this.setData({
        typeText: info.text,
        typeColor: info.color,
        typeColorBg: info.color + '20',
        typeColorBorder: info.color + '40'
      });
    },
    'resource.createdAt': function(createdAt) {
      this.setData({
        timeAgo: createdAt ? util.formatTimeAgo(createdAt) : ''
      });
    }
  },

  methods: {
    onDelete() {
      const { resource } = this.properties;
      if (resource && resource.id) {
        this.triggerEvent('delete', { id: resource.id });
      }
    },

    formatTimeAgo(dateStr) {
      return util.formatTimeAgo(dateStr);
    }
  }
});
