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
        url: '/stockRecords',
        method: 'post',
        data: query
    })
}

