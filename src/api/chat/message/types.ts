export interface ChatMessageVO {
  id: number,
  chatId: number,
  messageId: string,
  parentMessageId: string,
  model: string,
  modelVersion: string,
  role: string,
  content: string,
  imageList: string[],
  contentType: string,
  finishReason: string,
  status: number,
  totalTokens: number
}