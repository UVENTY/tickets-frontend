import * as cart from './cart'
import * as event from './event'
import * as user from './user'

export default {
  cart,
  common,
  event,
  user
}

/* function createUseApi(requestMap) {
  return function useApi(path) {
    path = typeof path === 'string' ? path.split('.') : path
    if (!Array.isArray(path)) {
      throw new Error('Path must be a string or an array')
    }
    const requestConfig = 
  }
} */