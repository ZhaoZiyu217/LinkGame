import instance from './axios'

export const userAPI = {
  // 获取用户信息
  getUserInfo(id) {
    return instance.get(`/users/${id}`)
  },
  
  // 更新用户信息
  updateUserInfo(data) {
    return instance.put('/users/profile', data)
  },
  
  // 获取排行榜
  getRanking() {
    return instance.get('/users/ranking')
  }
}