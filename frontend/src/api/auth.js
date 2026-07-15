import instance from './axios'

export const authAPI = {
  login(data) {
    return instance.post('/auth/login', data)
  },
  
  register(data) {
    return instance.post('/auth/register', data)
  },
  
  getCurrentUser() {
    return instance.get('/auth/me')
  }
}