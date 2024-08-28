import { API_DIR, API_HOST, axios } from "utils/axios";

export const getConfigQuery = (options) => ({
  queryKey: ['config'],
  queryFn: () => axios.get(API_HOST + API_DIR + '/cache/data_TikShow.json'),
  select: ({ data }) => ({
    country: data.default_country,
    currency: data.default_currency,
    lang: data.default_lang
  }),
  staleTime: Infinity,
  ...options
})