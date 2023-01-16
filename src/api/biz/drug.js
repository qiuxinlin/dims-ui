import request from '@/utils/request'

// 查询
export function list(query) {
  return request({
    url: '/drugs',
    method: 'post',
    data: query
  })
}

// 查询详细
export function get(id) {
  return request({
    url: '/drug/' + id,
    method: 'get'
  })
}

// 新增
export function add(data) {
  return request({
    url: '/drug',
    method: 'post',
    data: data
  })
}

// 修改
export function update(data) {
  return request({
    url: '/drug',
    method: 'put',
    data: data
  })
}

// 删除
export function del(id) {
  return request({
    url: '/drugs/delete',
    method: 'post',
    data: id
  })
}

// 查询所有生产商
export function getManufacturers() {
  return request({
    url: '/manufacturers/all',
    method: 'get'
  })
}
