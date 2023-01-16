import request from '@/utils/request'

//查询药品
export function queryDrugs(query) {
    return request({
        url: '/drugs/all',
        method: 'post',
        data: query
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

//入库
export function submitStockIn(data) {
    return request({
        url: '/stockIn',
        method: 'post',
        data: data
    })
}

//入库
export function submitStockOut(data) {
    return request({
        url: '/stockOut',
        method: 'post',
        data: data
    })
}

