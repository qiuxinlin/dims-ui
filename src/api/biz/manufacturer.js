import request from '@/utils/request'

// 查询
export function list(query) {
  return request({
    url: '/manufacturers',
    method: 'post',
    data: query
  })
}

// 查询详细
export function get(id) {
  return request({
    url: '/manufacturer/' + id,
    method: 'get'
  })
}

// 新增
export function add(data) {
  return request({
    url: '/manufacturer',
    method: 'post',
    data: data
  })
}

// 修改
export function update(data) {
  return request({
    url: '/manufacturer',
    method: 'put',
    data: data
  })
}

// 删除
export function del(id) {
  return request({
    url: '/manufacturer/delete',
    method: 'post',
    data: id
  })
}
