import { forwardRef, useEffect, useRef } from 'react'
import { TransformWrapper } from 'react-zoom-pan-pinch'
import SvgScheme from './svg'
import Controls from './controls'
import './seating-scheme.scss'

const SeatingScheme = forwardRef((props, ref) => {
  const svgRef = useRef(null)

  const handleScale = () => {
    const seats = document.querySelectorAll('.svg-seat, .seat-path, path')
    seats.forEach(seat => {
      seat.classList.add('hovered')
      setTimeout(() => {
        seat.classList.remove('hovered')
      }, 200)
    })
  }

  // Обработчик для всех событий масштабирования
  useEffect(() => {
    const handleZoom = (e) => {
      // Для колесика мыши
      if (e.type === 'wheel' && e.deltaY < 0) {
        handleScale()
      }
      // Для пинча на тачскрине
      if (e.type === 'gesturechange' && e.scale > 1) {
        handleScale()
      }
    }

    const element = svgRef.current
    if (element) {
      element.addEventListener('wheel', handleZoom, { passive: true })
      element.addEventListener('gesturechange', handleZoom, { passive: true })
    }

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleZoom)
        element.removeEventListener('gesturechange', handleZoom)
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
      onZoom={() => handleScale()}
      // Добавляем обработку пинч-жестов
      pinch={{
        disabled: false,
        scalePadding: 0.2,
        velocityDisabled: true
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