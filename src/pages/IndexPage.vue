<script setup lang="ts">
import { nextTick, ref } from 'vue'
import logo from '@/assets/logo.png'
import { marked } from 'marked'
import { addChat, delChat, listChat } from '@/api/chat'
import { listChatMessage, sendImageMessage, sendTextMessage, streamMessage, unSubscribe } from '@/api/chat/message'
import type { ChatVO } from '@/api/chat/types'
import type { ChatMessageVO } from '@/api/chat/message/types'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { globalHeaders } from '@/utils/request'
import type { AxiosResponse } from 'axios'
import type { ModelVO } from '@/api/model/types'
import ImagePreview from '@/components/ImagePreview.vue'
import ClipboardJS from 'clipboard'
import { useToast } from 'vue-toast-notification'

const toast = useToast()
const modelList = ref<ModelVO[]>([])
const currentChatId = ref<number | null>(null)
const chatType = ref<string>('text')
const chatList = ref<ChatVO[]>([])
const chatMessageList = ref<ChatMessageVO[]>([])
const sendMessage = ref('')
const model = ref('BAIDU')
const sessionId = ref<string | null>(null)
const tempMessage = ref<ChatMessageVO>({} as ChatMessageVO)
const sendBtn = ref(false)
const messageDivRef = ref<HTMLDivElement | null>(null)

const changeType = (type: string) => {
  chatType.value = type
  if (type === 'text') {
    model.value = 'BAIDU'
  } else {
    model.value = 'BAIDU'
  }
  queryChatList()
}

const handeCreateChat = () => {
  currentChatId.value = null
  chatMessageList.value = []
}

const changeChat = (chatId: number | null) => {
  console.log('切换会话', chatId)
  currentChatId.value = chatId
  queryChatMessageList()
}

const handeAddChat = async (title: string) => {
  const res = await addChat(chatType.value, title)
  console.log(res)
  chatList.value.unshift(res.data)
  currentChatId.value = res.data.id
  changeChat(currentChatId.value)
}

const handeDelChat = async (chatId: number) => {
  console.log('删除会话', chatId)
  await delChat(chatId)
  if (chatList.value.length > 0) {
    currentChatId.value = chatList.value[0].id
    queryChatMessageList()
  }
}

const handeSend = async () => {
  if (sendMessage.value !== '') {
    if (!currentChatId.value) {
      await handeAddChat(sendMessage.value)
    }
    let res: AxiosResponse<ChatMessageVO>
    if (chatType.value === 'text') {
      res = await sendTextMessage(model.value, currentChatId.value, sendMessage.value)
    } else {
      res = await sendImageMessage(model.value, currentChatId.value, sendMessage.value)
    }
    chatMessageList.value.push(res.data)
    await nextTick(() => {
      scrollToBottom()
    })
    sessionId.value = res.data.messageId
    sendMessage.value = ''
    tempMessage.value = {
      role: 'assistant',
      contentType: 'TEXT',
      content: '加载中...',
    } as ChatMessageVO
    await nextTick(() => {
      scrollToBottom()
    })
    eventMessage()
    setTimeout(async () => {
      if (sessionId.value) {
        await streamMessage(sessionId.value)
      }
    }, 500)
  }
}

const handeSendMessage = () => {
  if (sendMessage.value !== '') {
    sendBtn.value = true
    handeSend()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  console.log(event)
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      event.preventDefault()
      // 手动添加换行符
      sendMessage.value += '\n'
    } else {
      handeSendMessage()
      event.preventDefault()
    }
  }
}

const eventMessage = () => {
  const eventSource = new EventSourcePolyfill(import.meta.env.VITE_APP_BASE_API + '/sse/subscribe?sessionId=' + sessionId.value, {
    headers: globalHeaders(),
  })

  eventSource.addEventListener('open', (event) => {
    console.log('open', event)
  })
  let isAdd = false

  eventSource.addEventListener('message', (event) => {
    console.log('message', event)
    const data = event.data
    if (data !== '[END]') {
      console.log(data)
      const message: ChatMessageVO = JSON.parse(data)
      if (message.status === 2) {
        if (!isAdd) {
          tempMessage.value = message
          isAdd = true
        } else {
          tempMessage.value.content += message.content
          nextTick(() => {
            scrollToBottom()
          })
        }
      }
    } else {
      eventSource.close()
      if (sessionId.value) {
        unSubscribe(sessionId.value)
      }
      sendBtn.value = false
      sessionId.value = null
      chatMessageList.value.push(tempMessage.value)
      nextTick(() => {
        scrollToBottom()
      })
    }
  })

  eventSource.addEventListener('error', (event) => {
    console.error('error', event)
    sendBtn.value = false
  })
}

const queryChatList = async () => {
  const res: any = await listChat(chatType.value)
  chatList.value = res.rows
  if (chatList.value.length > 0) {
    currentChatId.value = chatList.value[0].id
    queryChatMessageList()
  }
}

const queryChatMessageList = async () => {
  const res: any = await listChatMessage(currentChatId.value)
  chatMessageList.value = res.rows
  await nextTick(() => {
    scrollToBottom()
  })
}

const scrollToBottom = () => {
  if (messageDivRef.value) {
    messageDivRef.value.scrollTop = messageDivRef.value.scrollHeight
  }
}

const getHtml = (content: string): string => {
  const res = marked.parse(content, {
    gfm: true,
    breaks: true,
  })
  let html: string = ''
  if (typeof res === 'string') {
    html = res
  } else {
    res.then((value) => {
      html = value
    })
  }
  return html
}

const handleClipboard = (content: string, index: number | null) => {
  const selector = index !== null ? '.copy-btn-' + index : '.copy-btn'
  const clipboard = new ClipboardJS(selector, {
    text: () => content,
  })

  clipboard.on('success', () => {
    toast.success('复制成功')
    clipboard.destroy()
  })

  clipboard.on('error', (e) => {
    toast.error('复制失败')
    clipboard.destroy()
  })
}

/*const queryModelList = async () => {
  const res = await listModel()
  modelList.value = res.data
}*/

onMounted(() => {
  //queryModelList()
  queryChatList()
})
</script>
<template>
  <div class="h-screen w-screen flex flex-row bg-app">

    <!-- 最左侧导航区域 -->
    <div class="flex flex-col items-center min-h-screen w-40 bg-blue-50 border-r border-gray-200 relative">
      <div class="border-b border-gray-300">
        <img :src="logo" alt="logo" />
      </div>
      <div class="flex flex-col w-full px-3.5">
        <div
          :class="chatType === 'text' ? 'bg-blue-100 text-blue-600': ''"
          class="mt-3 text-center w-full p-2 hover:cursor-pointer hover:bg-blue-100 rounded"
          @click="changeType('text')">
          <div>
            <span class="i-mdi-chat text-5xl"></span>
          </div>
          <div>对话</div>
        </div>
        <div
          class="mt-3 text-center w-full p-2 hover:cursor-pointer hover:bg-blue-100 rounded"
          :class="chatType === 'image' ? 'bg-blue-100 text-gray-700': ''"
          @click="changeType('image')">
          <div>
            <span class="i-mdi-image text-5xl"></span>
          </div>
          <div>图片</div>
        </div>
      </div>

      <div class="absolute bottom-0 w-full p-3.5">
        模型：{{ model }}
      </div>
    </div>

    <!-- 会话列表区域 -->
    <div class="flex flex-col h-screen w-52 bg-white">
      <div class="p-3.5 text-center text-blue-600 border-b border-gray-200">
        <span
          class="bg-blue-100 p-3.5 w-full block rounded-3xl hover:cursor-pointer"
          @click="handeCreateChat">新建会话</span>
      </div>
      <div class="flex flex-row items-center px-3.5">
        <div class="text-gray-400 p-3.5 pl-0">
          <span>历史对话</span>
        </div>
        <div class="flex-grow border-b border-gray-400"></div>
      </div>

      <!-- 会话列表 -->
      <div class="flex flex-col w-full text-gray-700 flex-grow overflow-y-auto">
        <div
          v-for="item in chatList " :key="item.id"
          :class="item.id === currentChatId ? 'bg-gray-100' : ''"
          class="flex items-center justify-between hover:bg-gray-100 p-3.5"
          @click="changeChat(item.id)"
        >
          <div class="flex flex-col flex-grow w-4/5">
            <div class="overflow-hidden whitespace-nowrap text-ellipsis">{{ item.title }}</div>
            <div class="text-xs">{{ item.createTime }}</div>
          </div>
          <div>
            <span class="i-mdi-delete text-xl hover:cursor-pointer" @click="handeDelChat(item.id)"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息区域 -->
    <div class="h-screen flex w-2/3 flex-grow justify-center">

      <div class="h-screen flex flex-col lg:w-8/12 md:w-10/12 sm:w-11/12">
        <!-- 可滚动的消息区域 -->
        <div ref="messageDivRef" class="flex-grow flex flex-col w-full mt-4 rounded scroll-smooth overflow-y-auto p-4 pr-8">
          <div class="flex flex-row my-3.5 p-3.5 items-start justify-start rounded text-black bg-white">
            <div class="mr-2 px-0.5">
              <span class="i-mdi-user text-4xl"></span>
            </div>
            <div class="w-max">
              <div>你好，我是AI助手~</div>
              <div>你有什么问题都可以随时问我</div>
            </div>
            <div class="w-10 ml-2.5"></div>
          </div>

          <template v-for="(item, messageIndex) in chatMessageList" :key="item.id">
            <div
              class="flex flex-row my-3.5 p-3.5 rounded"
              :class="item.role === 'user' ? 'text-black' : 'text-black bg-white'">
              <div v-if="item.role === 'user'" class="mr-2 px-0.5 justify-center items-center bg-blue-400 text-white rounded-full">
                <span class="i-mdi-user text-3xl"></span>
              </div>
              <div v-if="item.role === 'assistant'" class="mr-2 px-0.5">
                <span class="i-mdi-user text-3xl"></span>
              </div>
              <div class="w-max flex flex-col message-content">
                <div
                  v-if="item.contentType == 'TEXT' || (item.role === 'user' && item.contentType == 'IMAGE')"
                  v-highlight v-html="getHtml(item.content)"></div>
                <div
                  v-if="item.contentType == 'IMAGE' && item.role === 'assistant'"
                  class="flex flex-row justify-between items-start">
                  <div class="w-1/2 m-1.5">
                    <image-preview
                      v-for="(image, index) in item.imageList" :key="index"
                      :image-src="image"
                      :thumbnail="image"
                    />
                  </div>
                </div>
                <div v-if="item.role === 'assistant' && item.contentType == 'TEXT'"
                     class="w-full p-2.5 mt-3.5 flex flex-row justify-end">
                  <span @click="handleClipboard(item.content, messageIndex)"
                        class="i-mdi-content-copy text-xl hover:cursor-pointer"
                        :class="'copy-btn-' +  messageIndex"></span>
                </div>
              </div>
            </div>
          </template>

          <template v-if="sessionId !== null">
            <div class="flex flex-row my-3.5 items-start justify-start text-black">
              <div class="mr-2 px-0.5 bg-white rounded-full">
                <span class="i-mdi-user text-4xl"></span>
              </div>
              <div class="p-3.5 w-max message-content rounded bg-white">
                <div v-if="tempMessage.contentType == 'TEXT'" v-highlight v-html="getHtml(tempMessage.content)"></div>
                <div v-if="tempMessage.contentType == 'IMAGE'" class="flex flex-row justify-between items-start">
                  <image-preview
                    v-for="(image, index) in tempMessage.imageList" :key="index"
                    :image-src="image"
                    :thumbnail="image"
                  />
                </div>
                <div v-if="!sendBtn && tempMessage.contentType == 'TEXT'"
                     class="w-full p-2.5 mt-3.5 flex flex-row justify-end">
                  <span @click="handleClipboard(tempMessage.content, null)"
                        class="i-mdi-content-copy text-xl hover:cursor-pointer copy-btn"></span>
                </div>
              </div>
            </div>
          </template>

        </div>

        <div class="sticky bottom-0 w-full mt-4 pb-6">
          <div class="flex flex-row items-end w-full h-28 bg-white border border-blue-300 rounded p-3">
              <textarea
                v-model="sendMessage"
                class="flex-grow h-full border-none resize-none bg-transparent focus:outline-none overscroll-y-none"
                placeholder="请输入问题（shift+回车可换行输入）"
                @keydown="handleKeydown"
              ></textarea>
            <button
              class="text-white ml-2 px-4 py-2 rounded"
              :class="sendBtn ? 'bg-gray-200' : 'bg-blue-500'"
              :disabled="sendBtn"
              @click="handeSendMessage">
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>
<style scoped>
.bg-app {
  background-color: rgb(233, 237, 247);
}

textarea:hover,
textarea:focus {
  /* 去掉鼠标悬停和聚焦时的边框 */
  outline: none;
  --tw-ring-color: none;
  --tw-ring-shadow: none;
}

textarea::-webkit-scrollbar {
  display: none;
}

.message-content * {
  line-height: 1.5;
}


</style>