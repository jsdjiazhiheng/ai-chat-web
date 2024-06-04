import request from '@/utils/request'
import type { AxiosPromise } from 'axios'
import type { ChatVO } from '@/api/chat/types'

/**
 * 查询会话列表
 * @param contentType text/image
 * @returns {*}
 */
export const listChat = (contentType: string): AxiosPromise<ChatVO[]> => {
  return request({
    url: '/gpt/chat/list',
    method: 'get',
    params: {
      contentType: contentType,
    },
  })
}

/**
 * 新增会话
 * @param contentType
 * @param title
 */
export const addChat = (contentType: string, title: string) => {
  return request({
    url: '/gpt/chat',
    method: 'post',
    data: {
      contentType: contentType,
      title: title,
    },
  })
}

/**
 * 删除会话
 * @param id
 */
export const delChat = (id: string | number) => {
  return request({
    url: '/gpt/chat/' + id,
    method: 'delete',
  })
}
