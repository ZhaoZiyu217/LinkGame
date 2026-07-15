import instance from './axios'

export const examAPI = {
  // 管理员：创建考试
  create(data) {
    return instance.post('/exam/create', data)
  },
  
  // 管理员：获取考试列表
  getList() {
    return instance.get('/exam/list')
  },
  
  // 管理员：结束考试
  endExam(id) {
    return instance.put(`/exam/${id}/end`)
  },
  
  // 用户：获取当前有效考试
  getCurrent() {
    return instance.get('/exam/current')
  }
}