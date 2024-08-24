import { useEffect, useRef, useState } from 'react'
import { cn } from '@bem-react/classname'
import Button from 'components/button'
import { toHaveAttribute } from '@testing-library/jest-dom/dist/matchers'
import { CURRENCY_SYMBOL_MAP } from 'const'
import { ReactComponent as Selected } from 'icons/selected.svg'
import './seating-tooltip.scss'
import { useIsMobile } from 'utils/hooks'

const bem = cn('seating-tooltip')

export default function SeatingTooltip(props) {
  const isMobile = useIsMobile()
  const [ visible, setVisible ] = useState(props.visible)
  let timer = useRef(null)
  const ref = useRef(null)
  
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const { x } = el.getBoundingClientRect()
    el.style.transform = `translateX(${x < 0 ? `calc(-100% - x)` : '-100%'}px)`
  }, [props])

  useEffect(() => {
    console.log(props)
    
    if (props.hideDelay) {
      if (!props.visible) {
        timer.current = setTimeout(() => setVisible(false), props.hideDelay)
      } else if (timer.current) {
        clearTimeout(timer.current)
        setVisible(true)
      }
    } else {
      setVisible(props.visible)
    }
  }, [props.visible, props.hideDelay])

  if (props.scaleFactor && props.scaleFactor < 1) {
    return null
  }
  const cat = props.categories.find((c) => c.value === props.category);
  const svg = props.icon || cat?.icon;
  const color = props.color || cat?.color || "#fff";
  
  return (
    <div
      className={bem({ visible })}
      style={{ left: props.x, top: props.y }}
      onClick={() => props.toggleInCart(props, Number(!props.inCart))}
      ref={ref}
      data-visible={visible}
      data-ticket={props.ticketId}
    >
      <div className={bem('head')}>
        <div className={bem('price')}>
          {props?.price || '-'}&nbsp;{CURRENCY_SYMBOL_MAP[props?.currency] || ''}
        </div>
        {!!svg && <div
          className={bem('icon')}
          style={{ color }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />}
      </div>
      <div className={bem('desc')} style={{ color }}>
        <div className={bem('category')}>{cat?.name || props.category}</div>
        {!!props.text && <div className={bem('text')}>{props.text}</div>}
      </div>
      <div className={bem('seat')}>
        <div className={bem('row')}>
          <span>Row:</span> {props.row}
        </div>
        <div className={bem('num')}>
          <span>Seat:</span> {props.seat}
        </div>
      </div>
      <button
        className={bem('button', { selected: props.inCart })}
        style={{
          backgroundColor: props.inCart ? color : undefined,
          borderColor: props.inCart ? color : undefined
        }}
      >
        {props.inCart ? <><Selected style={{ width: 12 }} /> Selected</> : `${isMobile ? 'Tap' : 'Click'} to select`}
      </button>
    </div>
  )
}