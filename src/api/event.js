import { axios } from 'utils/axios'

const fetchEvent = async (id) => {
  const { data } = await axios.post('data', { fields: 3 })
  const { stadiums, schedule } = data?.data || {}
  const event = schedule?.[id]
  if (!event) {
    return Promise.reject(new Error('Event not found'))
  }
  if (event.stadium) {
    const scheme_url = stadiums[event.stadium]?.scheme_blob
    if (scheme_url) {
      const { data } = await axios.get(scheme_url)
      event.categories = data.categories
      event.schemeCode = data.scheme
    }
  }
  return event
}

export const getEventQuery = (id, options) => ({
  queryKey: ['event', id],
  queryFn: () => fetchEvent(id),
  staleTime: 5 * 60 * 1000,
  retry: 0,
  ...options
})
