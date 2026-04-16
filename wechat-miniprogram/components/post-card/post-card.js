const util = require('../../utils/util.js');

Component({
  properties: {
    post: {
      type: Object,
      value: {}
    },
    showDelete: {
      type: Boolean,
      value: false
    }
  },

  data: {
    schoolColors: {
      '南部中学': '#1a6fc4',
      '南部二中': '#7c3aed',
      '南部三中': '#059669',
      '大桥中学': '#d97706',
      '东坝中学': '#dc2626',
      '建兴中学': '#0891b2'
    }
  },

  methods: {
    onDelete() {
      const { post } = this.properties;
      if (post && post.id) {
        this.triggerEvent('delete', { id: post.id });
      }
    },

    onImageTap() {
      const { post } = this.properties;
      if (post && post.image) {
        wx.previewImage({
          current: post.image,
          urls: [post.image]
        });
      }
    },

    formatTimeAgo(dateStr) {
      return util.formatTimeAgo(dateStr);
    },

    getSchoolColor(schoolName) {
      if (!schoolName) return '#1a6fc4';
      const { schoolColors } = this.data;
      
      if (schoolColors[schoolName]) {
        return schoolColors[schoolName];
      }
      
      for (const [name, color] of Object.entries(schoolColors)) {
        if (schoolName.includes(name)) {
          return color;
        }
      }
      
      return '#1a6fc4';
    }
  }
});
