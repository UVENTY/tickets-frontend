import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import { KeepScale, TransformComponent, TransformWrapper, useTransformComponent } from 'react-zoom-pan-pinch'
import { useDimensions } from 'utils/hooks'
import SeatingTooltip from 'components/seating-tooltip-2'
import Button from 'components/button'
import { svgSeat } from 'utils/dom-scheme'
import { createDefs, createStyles, getCursorOffsetToElementCenter, stringToSvg } from './utils'
import './seating-scheme.scss'
import { SEAT_CLONE_CLASS } from 'const'
import TicketsCounter from 'components/tickets-counter/tickets-counter'
import Controls from './controls'
import SvgScheme from './svg'

const SeatingScheme = forwardRef((props, ref) => {
  const { src, cart, categories, tickets, toggleInCart, highlight, selectedCategory, resetSelectedCategory } = props

  return (
    <TransformWrapper
      minScale={0.8}
      maxScale={4}
      initialScale={0.8}
      doubleClick={{
        disabled: true
      }}
    >
      <SvgScheme
        src={src}
        cart={cart}
        categories={categories}
        highlight={highlight}
        tickets={tickets}
        toggleInCart={toggleInCart}
      />
      <Controls
        selectedCategory={selectedCategory}
        resetCategory={resetSelectedCategory}
      />
    </TransformWrapper>
  )
})

export default SeatingScheme