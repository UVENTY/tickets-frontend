import { axios } from 'utils/axios'
import { renameKeys } from 'utils'
const isArray = Array.isArray
const entries = Object.entries

const selectFlatArray = data =>
  Object.values(data.trip).reduce((tickets, group) => {
    const commonData = renameKeys({
      sc_id: 'event_id',
      stadium: 'hall_id',
      t_start_datetime: 'date_start',
    }, group, true)
    let limit = 0
    const { seats_sold = {}, price: pricesList = [] } = group.t_options || {}
    entries(seats_sold).forEach(([category, rows]) => {
      entries(rows).forEach(([row, seats]) => {
        entries(seats).forEach(([seat, seatOptions]) => {
          // Фильтруем свои оплаченные билеты, и забронированные, они всегда в списке приходят
          // но на схеме должны быть недоступны
          if (seatOptions.length >= 3) {
            return
          }

          const key = [category, row]
          const priceString = pricesList[isArray(seatOptions) ? seatOptions[0] : null]
          const [price, currency] = typeof priceString === 'string' ? priceString.split(' ') : []
          const range = seat.split(';').map(Number).filter(Boolean)
          if (range.length < 1) return
          Array.from(
            { length: range.length === 2 ? range[1] - range[0] + 1 : 1 },
            (_, i) => i + range[0]
          ).forEach(seat => tickets.push({
            ...commonData,
            category,
            row,
            seat,
            price: Number(price),
            currency,
            t_id: group.t_id,
            bookingLimit: seatOptions[3] ? new Date(seatOptions[3]).getTime() : null,
            inCart: !!seatOptions[3] && new Date(seatOptions[3]).getTime() > Date.now(),
            id: `seat-${[...key, seat].join('-')}`
          }))
        })
      })
    })
    return tickets
  }, [])


async function fetchTickets(id) {
  const response = await axios.post(`trip/get?filter=${id}&lc=0`)
  return response.data
}

export const getTicketsQuery = (id, options) => ({
  queryKey: ['tickets', id],
  queryFn: () => fetchTickets(id).then(selectFlatArray),
  retry: 0,
  ...options
})