import type { ModelVO } from '@/api/model/types'
import request from '@/utils/request'
import type { AxiosPromise } from 'axios'

/**
 * 查询模型列表
 * @returns {*}
 */
export const listModel = (type: string): AxiosPromise<ModelVO[]> => {
  return request({
    url: '/gpt/model/getModelList',
    method: 'get',
    params: {
      type: type,
    },
  })
}