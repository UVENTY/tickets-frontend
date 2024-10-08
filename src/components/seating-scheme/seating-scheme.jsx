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
  const { src, cart, categories, currency, tickets, toggleInCart, highlight, selectedCategory, resetSelectedCategory, viewport } = props
  
  return (
    <TransformWrapper
      minScale={0.8}
      maxScale={4}
      initialScale={1}
      doubleClick={{
        disabled: true
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