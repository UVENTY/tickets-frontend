import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import { KeepScale, TransformComponent, TransformWrapper, useTransformComponent } from 'react-zoom-pan-pinch'
import { useDimensions } from 'utils/hooks'
import SeatingTooltip from 'components/seating-tooltip'
import Button from 'components/button'
import { svgSeat } from 'utils/dom-scheme'
import { createDefs, createStyles, getCursorOffsetToElementCenter, stringToSvg } from './utils'
import './seating-scheme.scss'
import { SEAT_CLONE_CLASS } from 'const'
import TicketsCounter from 'components/tickets-counter/tickets-counter'
import Controls from './controls'
import SvgScheme from './svg'

const SeatingScheme = forwardRef((props, ref) => {
  const svgRef = useRef(null)

  // Добавляем обработчик колесика мыши
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY !== 0) { // Если происходит скролл
        const seats = document.querySelectorAll('.svg-seat, .seat-path, path')
        seats.forEach(seat => {
          // Добавляем класс hovered при увеличении
          if (e.deltaY < 0) { // Увеличение (скролл вверх)
            seat.classList.add('hovered')
          }
          // Удаляем класс через небольшую задержку
          setTimeout(() => {
            seat.classList.remove('hovered')
          }, 200)
        })
      }
    }

    // Добавляем слушатель события
    const element = svgRef.current
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: true })
    }

    // Очистка при размонтировании
    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel)
      }
    }
  }, [])

  const { src, cart, categories, currency, tickets, toggleInCart, highlight, selectedCategory, resetSelectedCategory, viewport } = props
  
  return (
    <TransformWrapper
      minScale={0.8}
      maxScale={4}
      initialScale={1}
      doubleClick={{
        disabled: true
      }}
      onZoom={({ state }) => {
        // При зуме также добавляем эффект hover
        const seats = document.querySelectorAll('.svg-seat, .seat-path, path')
        seats.forEach(seat => {
          seat.classList.add('hovered')
          setTimeout(() => {
            seat.classList.remove('hovered')
          }, 200)
        })
      }}
    >
      <SvgScheme
        src={src}
        cart={cart}
        categories={categories}
        currency={currency}
        highlight={highlight}
        tickets={tickets}
        toggleInCart={toggleInCart}
        viewport={viewport}
        ref={svgRef}
      />
      <Controls
        selectedCategory={selectedCategory}
        resetCategory={resetSelectedCategory}
      />
    </TransformWrapper>
  )
})

export default SeatingScheme