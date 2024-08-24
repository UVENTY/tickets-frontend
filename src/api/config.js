import { axios } from "utils/axios";

export const getConfigQuery = (options) => ({
  queryKey: ['config'],
  queryFn: () => axios.get('https://ibronevik.ru/taxi/cache/data_TikShow.json'),
  select: ({ data }) => ({
    country: data.default_country,
    currency: data.default_currency,
    lang: data.default_lang
  }),
  staleTime: Infinity,
  ...options
})