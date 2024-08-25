import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { KeepScale, TransformComponent, useControls, useTransformComponent, useTransformContext } from 'react-zoom-pan-pinch'
import Hammer from 'hammerjs'
import { svgSeat } from 'utils/dom-scheme'
import { createDefs, createStyles, stringToSvg } from './utils'
import { SEAT_CLONE_CLASS } from 'const'
import SeatingTooltip from 'components/seating-tooltip'
import TicketsCounter from 'components/tickets-counter'
import classNames from 'classnames'

const mapSeat = (node, cb, joinToSelector = '') =>
  Array.from(node.querySelectorAll(`.svg-seat${joinToSelector}`)).map(cb)

const SvgScheme = forwardRef((props, outerRef) => {
  const [counters, setCounters] = useState([])
  const [tooltipSeat, setTooltipSeat] = useState({ visible: false })
  const [wrapperSize, setWrapperSize] = useState({ width: 'auto', height: '100%' })
  const [showOverlay, setShowOverlay] = useState(false)
  const { src, categories, cart, highlight, tickets, toggleInCart } = props
  const ref = useRef(null)
  const { zoomIn } = useControls()
  useImperativeHandle(outerRef, () => ref.current)

  const ticketsByCategory = useMemo(() => tickets.reduce((acc, ticket) => ({
    ...acc,
    [ticket.category]: (acc[ticket.category] || []).concat(ticket)
  }), {}), [tickets])

  const context = useTransformContext()
  
  const showSeatTooltip = el => {
    const { width, height, x, y } = ref.current.getBoundingClientRect()

    const elBounds = el.getBoundingClientRect()
    let dx = ((elBounds.x - x) + elBounds.width)
    let dy = ((elBounds.y - y) + elBounds.height)
    
    const seat = svgSeat(el)
    console.log(seat.get('ticket-id'));
    setTooltipSeat({
      visible: true,
      x: `${(dx / width) * 100}%`,
      y: `${(dy / height) * 100}%`,
      ticketId: seat.get('ticket-id'),
      text: seat.get('text'),
      delay: null
    })
    setShowOverlay(true)
  }

  const hideSeatTooltip = (delay) => {
    setTooltipSeat(prev => ({ ...prev, delay, visible: false }))
    setShowOverlay(false)
  }

  /* Обновление счетчиков билетов в корзине для всяких танцполов */
  useEffect(() => {
    if (!ref.current) return
    const cats = ref.current.querySelectorAll('.svg-seat[data-category]:not([data-row]):not([data-seat])')
    const svgBound = ref.current.getBBox()
    const counters = Array.from(cats).map(el => {
      const seat = svgSeat(el)
      const category = seat.get('category')
      const title = seat.getTitleNode()
      const bound = title ? title.getBBox() : el.getBBox()
      const left = bound.x + bound.width / 2
      const top = bound.y + (title ? 1.1 * bound.height : (2 / 3) * bound.height)
      const value = cart?.[category]?.items?.length || 0
      const visible = !!cart?.[category] || 0
      const max = ticketsByCategory[category]?.length || 0
      return {
        category,
        left: Math.round((left / svgBound.width) * 100) + '%',
        top: Math.round((top / svgBound.height) * 100) + '%',
        max,
        value,
        visible
      }
    })
    setCounters(counters)
  }, [cart, ticketsByCategory])

  /* Подсветка выбранной категории */
  useEffect(() => {
    const node = ref.current
    if (!highlight) {
      mapSeat(node, el => el.removeAttribute('style'), '')
      return
    }
    mapSeat(node, el => el.removeAttribute('style'), `[data-category="${highlight}"]`)
    mapSeat(node, el => el.style.fill = '#666', `:not([data-category="${highlight}"])`)
  }, [highlight])

  /* Рендер схемы в созданный svg */
  useEffect(() => {
    const node = ref.current
    if (!node || !src) return
    const svg = stringToSvg(src)
    // Черная галочка для мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1.5 3.5 L 3 5 L 6 2', className: 'seat-check', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', id: 'checked-seat-path' }])
    // Белая галочка для категории без мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1 3 L 4.25 6.25 L 10 0.5', className: 'category-check', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', id: 'checked-category-path' }])
    createStyles(svg, categories)

    if (node.hasChildNodes()) node.innerHTML = ''
    const width = Number(svg.attributes?.width?.value)
    const height = Number(svg.attributes?.height?.value)

    const el = document.querySelector('#svg-wrapper')
    if (width && height && el) {
      const ratio = width / height
      const elHeight = el.clientHeight
      const elWidth = elHeight * ratio
      setWrapperSize({ width: elWidth, height: '100%' })
    }

    let timer = null

    Array.from(svg.attributes).forEach(({ name, value }) => ['width', 'height'].includes(name) ?
      node.style[name] = 'auto' :
      node.setAttribute(name, value))
    Array.from(svg.children).forEach(child => node.appendChild(child))
    Array.from(node.querySelectorAll('.svg-seat')).forEach(el => {
      const [category, row, num] = ['category', 'row', 'seat'].map(attr => el.getAttribute(`data-${attr}`))
      el.id = `seat-${[category, row, num].filter(Boolean).join('-')}`
      const seat = svgSeat(el)
      let seatTicket = seat.isMultiple() ?
        tickets.filter(item => item.category === category) :
        tickets.find(item => item.id === el.id)

      if (!seatTicket || (Array.isArray(seatTicket) && !seatTicket.length)) {
        el.setAttribute('data-disabled', '')
      } else {
        seat.set('ticket-id', seatTicket.id)
        const hasInCart = seat.isMultiple() ? seatTicket.some(ticket => ticket.inCart) : seatTicket.inCart
        seat.checked(hasInCart)
        if (!seat.isMultiple()) {
          const svgBound = ref.current.getBBox()
          el.addEventListener('mouseover', (e) => {
            if (e.sourceCapabilities?.firesTouchEvents) return false
            timer && clearTimeout(timer)
            showSeatTooltip(el)
          })
          el.addEventListener('mouseout', (e) => {
            if (e.sourceCapabilities?.firesTouchEvents) return false
            timer = setTimeout(() => {
              hideSeatTooltip()
            }, 1000)
          })
        }
      }
    })
  }, [src])

  /* Обновить чекбоксы на местах */
  useEffect(() => {
    tickets.forEach(ticket => {
      let isMultiple = ['0', '-1'].includes(ticket.row)
      let id = `#${ticket.id}`
      if (isMultiple) id = `#seat-${ticket.category}`
      const el = ref.current.querySelector(id)
      if (!el) return

      const checked = isMultiple ? tickets.some(t => t.category === ticket.category && t.inCart) : ticket.inCart
      svgSeat(el).checked(checked)
    })
  }, [tickets])

  /* Обработка клик на месте */
  useEffect(() => {
    const svgEl = ref.current
    const hammer = new Hammer(svgEl)
    const handleTap = (event) => {
      if (context?.transformState?.scale && context.transformState.scale < 1.5) {
        zoomIn()
      }
      log('handle tap!!!')
      const isTouch = event.pointerType === 'touch'
      const el = event.target
      const seat = svgSeat.from(el)
      const isMultiple = seat && seat.isMultiple()
      const seatCat = seat ? seat.get('category') : ''
      const ticketsCat = ticketsByCategory?.[seatCat] || []
      const ticket = isMultiple && ticketsCat ? ticketsCat.find(item => !item.inCart) : tickets.find(t => t.id === el.id)
      const { visible, ticketId } = tooltipSeat

      if (ticket && !el.hasAttribute('data-disabled')) {
        Array.from(document.querySelectorAll('#clone-1, #clone-2')).forEach(el => el.remove())
        if (isTouch && !isMultiple) {
          // Копируем текущее место для вывода копии поверх блюра
          const clone = [el.cloneNode()]
          // Если у элемента есть галочка, то копируем и ее
          if (el.nextElementSibling.tagName?.toLowerCase() === 'use') clone.push(el.nextElementSibling.cloneNode())
          clone.forEach((el, i) => {
            el.id = `clone-${(i + 1)}`
            el.classList.add(SEAT_CLONE_CLASS)
            ref.current.appendChild(el)
          })
          showSeatTooltip(el)
        } else {
          toggleInCart(ticket)
        }
      } else {
        const delay = el.matches('.seating-tooltip') || el.closest('.seating-tooltip') ? 500 : 0
        setTooltipSeat(prev => ({ visible: false, ticketId: prev.ticketId, delay }))
        document.querySelectorAll('#clone-1, #clone-2').forEach(el => el.remove())
      }
    }
    hammer.on('tap', handleTap)

    return () => {
      hammer.off('tap', handleTap)
      hammer.destroy()
    }
  }, [ticketsByCategory, tickets, tooltipSeat, zoomIn, context?.transformState?.scale])

  const handleChangeMultiple = (count, tickets, cat) => {
    const catInCart = tickets.filter(item => item.category === cat && item.inCart)
    const diff = count - catInCart.length

    if (diff > 0) {
      const changed = tickets.filter(item => item.category === cat && !item.inCart).slice(0, diff)
      changed.forEach(item => toggleInCart(item, 1))
    } else {
      const changed = catInCart.slice(0, -diff)
      changed.forEach(item => toggleInCart(item, 0))
    }
  }
  const width = ref.current?.parentNode?.clientWidth
  const height = ref.current?.parentNode?.clientWidth
  const transform = ref.current?.parentNode?.style.transform

  const transformedComponent = useTransformComponent(({ state, instance }) => {
    return <KeepScale style={{ position: 'absolute', pointerEvents: 'none' }}>
      {tickets?.length > 0 && <SeatingTooltip
        {...tickets.find(ticket => ticket.id === tooltipSeat.ticketId)}
        categories={categories}
        visible={tooltipSeat.visible}
        x={tooltipSeat.x}
        y={tooltipSeat.y}
        text={tooltipSeat.text}
        hideDelay={tooltipSeat.delay ?? 500}
        scaleFactor={context?.transformState?.scale}
        toggleInCart={toggleInCart}
      />}

    </KeepScale>
  })

  const log = useCallback((msg) => {
    const el = document.querySelector('#log')
    if (!el) return
    if (typeof msg === 'object') msg = JSON.stringify(msg)
    el.innerHTML = msg + "<br>" + el.innerHTML
  })

  return (
    <>
      <TransformComponent
        onPinching={() => {
          log('pinching')
        }}
      >
        <div
          className='scheme-wrapper'
          id='svg-wrapper'
          style={wrapperSize}
        >
          <div className={classNames('scheme-overlay', { ['scheme-overlay_visible']: showOverlay })} />
          <svg
            className='scheme-svg'
            ref={ref}
          />
          {counters.map(({ category, ...counter }, i) => (
            <KeepScale style={{ position: 'absolute', zIndex: 20, ...counter }}>
              <TicketsCounter
                key={i}
                {...counter}
                onChange={value => handleChangeMultiple(value, tickets, category)}
              />
            </KeepScale>
          ))}
          <KeepScale
            style={{
              zIndex: 20,
              position: 'absolute',
              pointerEvents: 'none',
              left: tooltipSeat.x,
              top: tooltipSeat.y,
              transition: 'ease-in-out .2s',
              transitionProperty: 'left, top'
            }}
          >
            {tickets?.length > 0 && <SeatingTooltip
              {...tickets.find(ticket => ticket.id === tooltipSeat.ticketId)}
              categories={categories}
              visible={tooltipSeat.visible}
              text={tooltipSeat.text}
              hideDelay={tooltipSeat.delay ?? 500}
              scaleFactor={context?.transformState?.scale}
              toggleInCart={toggleInCart}
            />}
          </KeepScale>
        </div>
      </TransformComponent>
    </>
  )
})

export default SvgScheme