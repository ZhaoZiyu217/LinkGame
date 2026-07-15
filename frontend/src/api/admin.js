import instance from './axios'

export const adminAPI = {
  // 获取数据概览
  getOverview() {
    return instance.get('/admin/overview')
  },
  
  // 获取全院学习记录
  getRecords(params) {
    return instance.get('/admin/records', { params })
  },
  
  // 导出学习数据
  exportData() {
    return instance.get('/admin/export', {
      responseType: 'blob'
    })
  },
  
  // 获取医院信息
  getHospital() {
    return instance.get('/admin/hospital')
  },
  
  // 更新医院信息
  updateHospital(data) {
    return instance.put('/admin/hospital', data)
  },
  
  // ===== 验证管理员密码 =====
  verifyPassword(password) {
    return instance.post('/admin/verify-password', { password })
  }
}