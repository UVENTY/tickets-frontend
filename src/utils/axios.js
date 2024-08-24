import axiosHttp from 'axios'
import { getFormData, omit } from 'utils'
import { getFromLocalStorage } from 'utils/common'
import { STORAGE_KEY_USER_HASH, STORAGE_KEY_USER_TOKEN } from 'const'

export const API_URL = "https://ibronevik.ru/taxi/c/TikShow/api/v1/"

export const axios = axiosHttp.create({
  baseURL: API_URL
})

axios.interceptors.request.use(config => {
  const { data, headers } = config
  if (config.baseURL === API_URL) {
    const formData = (data instanceof URLSearchParams || data instanceof FormData) ? data : getFormData(data)

    if (!headers.Anonymus) {
      const token = getFromLocalStorage(STORAGE_KEY_USER_TOKEN)
      const hash = getFromLocalStorage(STORAGE_KEY_USER_HASH)
      if (token && hash) {
        formData.append('token', token)
        formData.append('u_hash', hash)
      }
    }
    config.data = formData
  }
  return {
    ...config,
    headers: omit(headers, ['Anonymus'])
  }
})

axios.interceptors.response.use(response => {
  const { data: { code, status } = {} } = response
  if (!code || !status) {
    return response
  }
  if (Number(code) >= 300 || status !== 'success') {
    //throw new Error(JSON.stringify(response))
    return  response
  }
  return response?.data || response
})