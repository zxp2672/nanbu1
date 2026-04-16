const util = require('../../utils/util.js');

Component({
  properties: {
    alumni: {
      type: Object,
      value: {}
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
    onTap() {
      const { alumni } = this.properties;
      if (alumni && alumni.id) {
        wx.navigateTo({
          url: `/pages/alumni-detail/alumni-detail?id=${alumni.id}`
        });
      }
    },

    getSchoolColor(schoolName) {
      if (!schoolName) return '#1a6fc4';
      const { schoolColors } = this.data;
      
      // 尝试直接匹配
      if (schoolColors[schoolName]) {
        return schoolColors[schoolName];
      }
      
      // 尝试包含匹配
      for (const [name, color] of Object.entries(schoolColors)) {
        if (schoolName.includes(name)) {
          return color;
        }
      }
      
      return '#1a6fc4';
    },

    getAvatarText(name, school) {
      if (!name) return '?';
      const firstChar = name.charAt(0);
      return firstChar;
    }
  }
});
