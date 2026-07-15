import instance from './axios'

export const libraryAPI = {
  // 获取图库列表
  getList(params) {
    return instance.get('/library/list', { params })
  },
  
  // 上传图片
  uploadImage(data) {
    return instance.post('/library/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 删除图片
  deleteImage(id) {
    return instance.delete(`/library/${id}`)
  }
}