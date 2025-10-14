import {axios} from "../utils/axios";

export async function CreateOrder(seats, succeeded_url, failed_url = window.location.href, promocode = null) {
  const orderData = {
    b_payment_way: 2,
    b_options: {
      tickets: {
        seats,
      },
    },
  };
  
  // Добавляем промокод если есть
  if (promocode) {
    orderData.b_pc = promocode;
  }
  
  var data = {
    appUrl: JSON.stringify({succeeded:succeeded_url,failed:failed_url}),
    data: JSON.stringify(orderData),
  };
  try {
    return await axios.post("drive", data);
  } catch (e) {
    console.log(e)
    return Promise.reject()
  }
}