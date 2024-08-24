import { CATEGORY_CHECK_PATH_ID, CHECK_PATH_ID, SEAT_CLASS } from "../const"
import { isEqualStr } from "./string"

const xmlType = "http://www.w3.org/2000/svg"

export const createCheckElement = ({ x = 0, y = 0, className, d = 'M 1.5 3.5 L 3 5 L 6 2' } = {}) => {
  const check = document.createElementNS(xmlType, 'path')
  check.setAttribute('d', d)
  check.setAttribute('stroke-linecap', 'round')
  check.setAttribute('stroke-linejoin', 'round')
  check.setAttribute('class', className)
  if (x || y) {
    check.setAttribute('style', `transform: translate(${(x || 0)}px, ${(y || 0)}px)`)
  }
  return check
}

export const createFilterElement = ({ id = 'filter-blur', blur = 1.2 }) => {
  const el = document.createElementNS(xmlType, 'filter')
  el.id = id
  el.innerHTML = '<feGaussianBlur in="SourceGraphic" stdDeviation="' + blur + '"></feGaussianBlur>'
  return el
}

export const createUse = (attrs) => {
  const el = document.createElementNS(xmlType, 'use')
  Object.entries(attrs).forEach(([ attr, val ]) => {
    el.setAttribute(attr, val)
  })
  return el
}

const insertAfter = (el, insertEl) => {
  const parent = el?.parentNode
  if (!parent) return
  const next = el?.nextElementSibling
  return next ?
    parent.insertBefore(insertEl, next) :
    parent.appendChild(insertEl)
}

// Функция для упрощения работы с местом. Принимает dom-элемент места (path)
// и отдает набор методов для работы с ним
export const svgSeat = (el, details = {}) => {
  const { x, y } = el.getBBox()
  const seat = {
    // Получение значения атрибута data-${attribute}
    get: (attribute, defaultValue) =>Array.isArray(attribute) ?
      attribute.map(attr => seat.get(attr, defaultValue)) :
      el?.getAttribute(`data-${attribute}`) || defaultValue,
    // Изменение значения атрибута data-${attribute}
    set: (attribute, value) => el?.setAttribute(`data-${attribute}`, value) || seat,
    has: (attribute) => el.hasAttribute(`data-${attribute}`),
    // Проверка наличия галочки у места (выводится если билет в корзине)
    hasCheck: () => {
      const next = (seat.isMultiple() ? seat.getTitleNode() : el)?.nextElementSibling
      return !!next && isEqualStr(next.tagName, 'use') && [`#${CHECK_PATH_ID}`, `#${CATEGORY_CHECK_PATH_ID}`].includes(next.getAttribute('href'))
    },
    // Добавить галочку, если ее нет
    addCheck: () => {
      if (seat.hasCheck()) return
      if (seat.isMultiple()) {
        const node = seat.getTitleNode()
        if (!node) return
        const { x, y } = node.getBBox()
        console.log(node, x, y);
        
        insertAfter(node, createUse({ x: x - 15, y: y + 6, class: 'category-check', href: `#${CATEGORY_CHECK_PATH_ID}` }))
        el.style.cursor = 'auto'
      } else {
        insertAfter(el, createUse({ x: x + 1.5, y: y + 1.8, class: 'seat-check', href: `#${CHECK_PATH_ID}` }))
      }
      return seat
    },
    // Удалить галочку, если она есть
    removeCheck: () => {
      if (!seat.hasCheck()) return
      const check = (seat.isMultiple() ? seat.getTitleNode() : el)?.nextElementSibling
      check.classList.add('seat-check-out')
      check.addEventListener('transitionend', () => check.remove())
      if (seat.isMultiple()) el.removeAttribute('style')
      return seat
    },
    // Переключить галочку
    toggleChecked: () => {
      seat.hasCheck() ? seat.removeCheck() : seat.addCheck()
      return seat
    },
    // Вызов без аргументов вернет значение галочки
    // Вызов с аргументом установит галочку в соответствии с этим значением
    checked: val => {
      if (val === undefined || val === null) return seat.w()
      val ? seat.addCheck() : seat.removeCheck()
      return seat
    },
    // Вызов без аргументов вернет текущее значение
    // Вызов с аргументом установит или снимет дизейбл
    disabled: val => {
      if (val === undefined) return seat.has('disabled')
      val ? el.setAttribute('data-disabled', '') : el.removeAttribute('data-disabled')
      return seat
    },
    // Проверка множественности места (танцпол - множественное место)
    isMultiple: () => !seat.get('seat') && !seat.get('row'),
    // Получить элемент с названием категории (только для множественных)
    getTitleNode: () => {
      if (!seat.isMultiple()) return null
      const selector = `.title-${seat.get('category').toUpperCase()}`
      return el.ownerSVGElement.querySelector(selector)
    },
    // Получить уникалный ключ места
    getKey: () => seat.isMultiple() ? seat.get('category') : seat.get(['row', 'seat']).join('-'),
    // Проверка на соответствие объекту. Например, чтобы проверить соответствие ряду A и месту 2
    // вызывается svgSeat(el).matches({ row: 'A', seat: 2 })
    matches: obj => Object.entries(obj).reduce((acc, [key, value]) => acc && isEqualStr(seat.get(key), value), true),
    // Поиск первого соответствующего места в массиве
    findMatches: (seats) => seats.find(s => seat.matches(s)),
    // Сравнение с объектом. Места считаются равными, если совпадает ряд и место,
    // а при их отсутствии если совпадает категория
    isEqual: item => {
      const cat = item.category
      if (seat.isMultiple()) {
        return seat.get('category') === cat
      }
      return seat.get('category') === cat && seat.get(['row', 'seat']).join('-') === [item.row, item.seat].join('-')
    },
    // Преобразование места в объект
    toObject: () => {
      return {
        category: seat.get('category'),
        row: seat.get('row', '-1'),
        seat: seat.get('seat'),
        price: seat.get('price'),
      }
    },
  }

  return seat
}

svgSeat.from = obj => {
  if (obj && obj instanceof SVGElement) {
    return obj.hasAttribute('data-category') ? svgSeat(obj) : null
  }
  
  const el = (!obj.row || obj.row === '-1' || obj.row === '0') ?
    document.querySelector(`.${SEAT_CLASS}[data-category="${obj.category}"]`) :
    document.querySelector(`.${SEAT_CLASS}[data-row="${obj.row}"][data-seat="${obj.seat}"]`)
  return el ? svgSeat(el) : null
}