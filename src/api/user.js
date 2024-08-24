import { useQuery } from '@tanstack/react-query'
import { getPhantomUser, PHANTOM_PASSWORD, STORAGE_KEY_USER_EMAIL, STORAGE_KEY_USER_HASH, STORAGE_KEY_USER_TOKEN } from 'const'
import { axios } from 'utils/axios'
import { getFromLocalStorage, setLocalStorage } from 'utils/common'

const login = async () => {
  let user
  if (getFromLocalStorage(STORAGE_KEY_USER_TOKEN) && getFromLocalStorage(STORAGE_KEY_USER_HASH)) {
    try {
      user = await axios.post('user')
    } catch (e) {
      user = null
    }
  }
  if (!user) {
    const userData = getPhantomUser()
    user = await axios.post('register', { ...userData, st: 1 })
      .then((response) => {
        const { data } = response
        if (data.token && data.u_hash) {
          setLocalStorage(STORAGE_KEY_USER_EMAIL, userData.u_email)
          setLocalStorage(STORAGE_KEY_USER_TOKEN, data.token)
          setLocalStorage(STORAGE_KEY_USER_HASH, data.u_hash)
        }
        return response
      })
  }
  return user.status === 'success'
}

export const useUser = () => useQuery({
  queryKey: ['user'],
  queryFn: login,
  staleTime: Infinity,
})

export async function updateUser(data) {
  return await axios.post('user', {
    data: JSON.stringify(data),
  });
}

export async function AuthUser(email = "", phone = "", auth_type = "e-mail") {
  if (email === null || email === undefined) {
    auth_type = "phone";
  }
  var data = {
    login: email || phone,
    type: auth_type,
    password: PHANTOM_PASSWORD
  };
  var { auth_hash } = await axios.post("auth", data, { headers: { Anonymus: true } });
  var req = await axios.post("token", {"auth_hash": auth_hash}, { headers: { Anonymus: true } });
  return {
    token: req.data.token,
    u_hash: req.data.u_hash,
    u_id: req.auth_user.u_id,
  };
}