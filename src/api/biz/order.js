import request from '@/utils/request'

//查询药品
export function queryDrugs(query) {
    return request({
        url: '/drugs/all',
        method: 'post',
        data: query
    })
}

//创建
export function create(data) {
    return request({
        url: '/order',
        method: 'post',
        data: data
    })
}

//查询
export function list(query) {
    return request({
        url: '/orders',
        method: 'post',
        data: query
    })
}

export function sendOut(data) {
    return request({
        url: '/order/sendOut',
        method: 'post',
        data: data
    })
}

export function sendBack(data) {
    return request({
        url: '/order/sendBack',
        method: 'post',
        data: data
    })
}
