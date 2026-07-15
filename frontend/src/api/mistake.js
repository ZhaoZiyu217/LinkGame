import instance from './axios'

export const mistakeAPI = {
  // 保存错题
  saveMistakes(data) {
    return instance.post('/mistakes/save', data)
  },
  
  // 获取错题列表
  getMistakes(params) {
    return instance.get('/mistakes/list', { params })
  },
  
  // 删除错题
  deleteMistake(id) {
    return instance.delete(`/mistakes/${id}`)
  },
  
  // 获取错题统计
  getStatistics() {
    return instance.get('/mistakes/statistics')
  }
}