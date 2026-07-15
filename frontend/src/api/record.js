import instance from './axios'

export const recordAPI = {
  saveExamRecord(data) {
    return instance.post('/records/exam', data)
  },
  
  savePracticeScore(data) {
    return instance.post('/records/practice', data)
  },
  
  getRecords(params) {
    return instance.get('/records/list', { params })
  },
  
  getStatistics() {
    return instance.get('/records/statistics')
  },
  
  getRanking() {
    return instance.get('/records/ranking')
  }
}