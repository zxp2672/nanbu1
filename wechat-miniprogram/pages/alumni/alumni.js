// pages/alumni/alumni.js
const alumniService = require('../../services/alumni.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    alumniList: [],
    keyword: '',
    schools: ['全部', '南部中学', '南部二中', '南部三中', '大桥中学', '东坝中学', '建兴中学'],
    levels: ['全部', '初中', '高中'],
    years: ['全部'],
    classes: ['全部'],
    selectedSchool: 0,
    selectedLevel: 0,
    selectedYear: 0,
    selectedClass: 0,
    loading: false,
    showAddForm: false,
    newAlumni: {
      name: '',
      school: '',
      level: '',
      year: '',
      classname: '',
      phone: '',
      job: '',
      company: '',
      city: '',
      bio: ''
    }
  },

  onLoad(options) {
    // 如果从首页点击学校进入，设置筛选条件
    if (options.school) {
      const schoolName = decodeURIComponent(options.school);
      const schoolIndex = this.data.schools.indexOf(schoolName);
      if (schoolIndex > 0) {
        this.setData({ selectedSchool: schoolIndex });
      }
    }
    this.loadAlumni();
  },

  onPullDownRefresh() {
    this.loadAlumni().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载校友列表
  async loadAlumni() {
    this.setData({ loading: true });
    try {
      const params = this.buildFilterParams();
      const res = await alumniService.getAll(params);
      const alumni = res.data || res || [];
      this.setData({
        alumniList: alumni,
        loading: false
      });
    } catch (err) {
      console.error('加载校友列表失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 构建筛选参数
  buildFilterParams() {
    const { keyword, schools, levels, years, classes, selectedSchool, selectedLevel, selectedYear, selectedClass } = this.data;
    const params = {};
    
    if (keyword) params.keyword = keyword;
    if (selectedSchool > 0) params.school = schools[selectedSchool];
    if (selectedLevel > 0) params.level = levels[selectedLevel];
    if (selectedYear > 0) params.year = years[selectedYear];
    if (selectedClass > 0) params.classname = classes[selectedClass];
    
    return params;
  },

  // 搜索
  onSearch(e) {
    this.setData({ keyword: e.detail.value }, () => {
      this.loadAlumni();
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 学校选择变更
  async onSchoolChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      selectedSchool: index,
      selectedLevel: 0,
      selectedYear: 0,
      selectedClass: 0,
      years: ['全部'],
      classes: ['全部']
    });
    
    // 级联加载年份列表
    if (index > 0) {
      await this.loadYears();
    }
    this.loadAlumni();
  },

  // 学段选择变更
  async onLevelChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      selectedLevel: index,
      selectedYear: 0,
      selectedClass: 0,
      years: ['全部'],
      classes: ['全部']
    });
    
    // 级联加载年份列表
    if (this.data.selectedSchool > 0) {
      await this.loadYears();
    }
    this.loadAlumni();
  },

  // 年份选择变更
  async onYearChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      selectedYear: index,
      selectedClass: 0,
      classes: ['全部']
    });
    
    // 级联加载班级列表
    if (index > 0) {
      await this.loadClasses();
    }
    this.loadAlumni();
  },

  // 班级选择变更
  onClassChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ selectedClass: index });
    this.loadAlumni();
  },

  // 加载年份列表
  async loadYears() {
    const { schools, levels, selectedSchool, selectedLevel } = this.data;
    try {
      const school = selectedSchool > 0 ? schools[selectedSchool] : '';
      const level = selectedLevel > 0 ? levels[selectedLevel] : '';
      const res = await alumniService.getYears(school, level);
      const years = res.data || res || [];
      this.setData({
        years: ['全部', ...years.map(String)]
      });
    } catch (err) {
      console.error('加载年份列表失败:', err);
    }
  },

  // 加载班级列表
  async loadClasses() {
    const { schools, levels, years, selectedSchool, selectedLevel, selectedYear } = this.data;
    try {
      const school = selectedSchool > 0 ? schools[selectedSchool] : '';
      const level = selectedLevel > 0 ? levels[selectedLevel] : '';
      const year = selectedYear > 0 ? years[selectedYear] : '';
      const res = await alumniService.getClasses(school, level, year);
      const classes = res.data || res || [];
      this.setData({
        classes: ['全部', ...classes.map(String)]
      });
    } catch (err) {
      console.error('加载班级列表失败:', err);
    }
  },

  // 显示添加表单
  showAdd() {
    if (!auth.requireAuth()) {
      return;
    }
    this.setData({
      showAddForm: true,
      newAlumni: {
        name: '',
        school: '',
        level: '',
        year: '',
        classname: '',
        phone: '',
        job: '',
        company: '',
        city: '',
        bio: ''
      }
    });
  },

  // 隐藏添加表单
  hideAdd() {
    this.setData({ showAddForm: false });
  },

  // 阻止冒泡
  preventBubble() {},

  // 表单输入
  onAddFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`newAlumni.${field}`]: value
    });
  },

  // 学校选择器变更
  onAddSchoolChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'newAlumni.school': this.data.schools[index]
    });
  },

  // 学段选择器变更
  onAddLevelChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'newAlumni.level': this.data.levels[index]
    });
  },

  // 提交添加校友
  async submitAdd() {
    const { newAlumni } = this.data;
    
    // 验证必填字段
    if (!newAlumni.name || !newAlumni.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!newAlumni.school) {
      wx.showToast({ title: '请选择学校', icon: 'none' });
      return;
    }
    if (!newAlumni.level) {
      wx.showToast({ title: '请选择学段', icon: 'none' });
      return;
    }
    
    try {
      await alumniService.add({
        ...newAlumni,
        status: 'pending'
      });
      
      wx.showToast({
        title: '提交成功，等待审核',
        icon: 'success'
      });
      
      this.setData({ showAddForm: false });
      this.loadAlumni();
    } catch (err) {
      console.error('添加校友失败:', err);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    }
  }
});
