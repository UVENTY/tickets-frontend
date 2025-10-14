import {axios} from "../utils/axios";

/**
 * Проверка промокода
 * @param {string} value - код промокода
 * @param {number} count - количество билетов
 * @returns {Promise} - данные о промокоде (discount, schedule, count)
 */
export async function CheckPromocode(value, count = 1) {
  try {
    const response = await axios.get(`promocode/check/`, {
      params: {
        value,
        count
      }
    });
    return response.data;
  } catch (e) {
    console.error('Promocode check error:', e);
    return Promise.reject(e);
  }
}

