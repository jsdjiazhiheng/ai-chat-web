import request from '@/utils/request'
import type { AxiosPromise } from 'axios'
import type { ChatMessageVO } from '@/api/chat/message/types'
import type { UnwrapRef } from 'vue'

/**
 * 查询会话消息列表
 * @param chatId
 * @returns {*}
 */
export const listChatMessage = (chatId?: number | null): AxiosPromise<ChatMessageVO[]> => {
  return request({
    url: '/gpt/chat/message/list',
    method: 'get',
    params: {
      chatId: chatId,
    },
  })
}

/**
 * 发送文本消息
 * @param type
 * @param chatId
 * @param content
 */
export const sendTextMessage = (type: string, chatId: number | null, content: string): AxiosPromise<ChatMessageVO> => {
  return request({
    url: '/sse/textChat',
    method: 'post',
    data: {
      type: type,
      chatId: chatId,
      content: content,
    },
  })
}

/**
 * 发送图片消息
 * @param type
 * @param chatId
 * @param content
 */
export const sendImageMessage = (type: string, chatId: number | null, content: string): AxiosPromise<ChatMessageVO> => {
  return request({
    url: '/sse/imageChat',
    method: 'post',
    data: {
      type: type,
      chatId: chatId,
      content: content,
    },
  })
}

export const streamMessage = (sessionId: string) => {
  return request({
    url: '/sse/textStreamChat',
    method: 'post',
    data: {
      sessionId: sessionId,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

export const unSubscribe = (sessionId: string) => {
  return request({
    url: '/sse/unSubscribe',
    method: 'get',
    params: {
      sessionId: sessionId,
    }
  })
}
