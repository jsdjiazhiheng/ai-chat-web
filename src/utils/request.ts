import { getToken } from '@/utils/auth'
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { tansParams } from '@/utils/index'
import { decryptBase64, decryptWithAes, encryptBase64, encryptWithAes, generateAesKey } from '@/utils/crypto'
import { decrypt, encrypt } from '@/utils/jsencrypt'
import { HttpStatus } from '@/enums/HttpStatus'
import errorCode from '@/utils/errorCode'
import { useToast } from 'vue-toast-notification'

const toast = useToast();

const encryptHeader = 'encrypt-key';
export const isRelogin = { show: false }

export const globalHeaders = () => {
  return {
    Authorization: 'Bearer ' + getToken(),
    clientid: import.meta.env.VITE_APP_CLIENT_ID,
  }
}

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'
axios.defaults.headers['clientid'] = import.meta.env.VITE_APP_CLIENT_ID
// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
})


// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {

    const isToken = (config.headers || {}).isToken === false;

    // 是否需要加密
    const isEncrypt = (config.headers || {}).isEncrypt === 'true';

    if (getToken() && !isToken) {
      config.headers['Authorization'] = 'Bearer ' + getToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
    }

    // get请求映射params参数
    if (config.method === 'get' && config.params) {
      let url = config.url + '?' + tansParams(config.params);
      url = url.slice(0, -1);
      config.params = {};
      config.url = url;
    }

    // 当开启参数加密
    if (isEncrypt && (config.method === 'post' || config.method === 'put')) {
      // 生成一个 AES 密钥
      const aesKey = generateAesKey();
      config.headers[encryptHeader] = encrypt(encryptBase64(aesKey));
      config.data = typeof config.data === 'object' ? encryptWithAes(JSON.stringify(config.data), aesKey) : encryptWithAes(config.data, aesKey);
    }
    // FormData数据去请求头Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config
  },
  (error: Error) => {
    console.log(error)
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (res: AxiosResponse) => {
    // 加密后的 AES 秘钥
    const keyStr = res.headers[encryptHeader];
    // 加密
    if (keyStr != null && keyStr != '') {
      const data = res.data;
      // 请求体 AES 解密
      const base64Str = decrypt(keyStr);
      // base64 解码 得到请求头的 AES 秘钥
      const aesKey = decryptBase64(base64Str.toString());
      // aesKey 解码 data
      const decryptData = decryptWithAes(data, aesKey);
      // 将结果 (得到的是 JSON 字符串) 转为 JSON
      res.data = JSON.parse(decryptData);
    }
    // 未设置状态码则默认成功状态
    const code = res.data.code || HttpStatus.SUCCESS;
    // 获取错误信息
    const msg = errorCode[code] || res.data.msg || errorCode['default'];
    // 二进制数据则直接返回
    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
      return res.data;
    }
    if (code === 401) {
      // prettier-ignore
      if (!isRelogin.show) {
        isRelogin.show = true;
        toast.error('登录状态已过期，请重新登录', {
          type: 'error',
          position: 'top-right',
          duration: 5 * 1000,
        })
        /*useUserStore().logout().then(() => {
          location.href = import.meta.env.VITE_APP_CONTEXT_PATH + 'index';
        });*/
        location.href = import.meta.env.VITE_APP_CONTEXT_PATH + 'login';
      }
      return Promise.reject('无效的会话，或者会话已过期，请重新登录。');
    } else if (code === HttpStatus.SERVER_ERROR) {
      console.log(msg);
      toast.error(msg)
      return Promise.reject(new Error(msg));
    } else if (code === HttpStatus.WARN) {
      toast.error(msg)
      return Promise.reject(new Error(msg));
    } else if (code !== HttpStatus.SUCCESS) {
      toast.error(msg)
      return Promise.reject('error');
    } else {
      return Promise.resolve(res.data);
    }
  },
  (error: any) => {
    let { message } = error;
    if (message == 'Network Error') {
      message = '后端接口连接异常';
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时';
    } else if (message.includes('Request failed with status code')) {
      message = '系统接口' + message.splice(message.length - 3) + '异常';
    }
    toast.error(message, {
      type: 'error',
      position: 'top-right',
      duration: 5 * 1000,
    })
    return Promise.reject(error);
  }
);

// 导出 axios 实例
export default service;