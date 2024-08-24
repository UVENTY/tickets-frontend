import { useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import { cn } from '@bem-react/classname'
import { ReactComponent as Close } from 'icons/close.svg'
import { ReactComponent as ArrowRight } from 'icons/arrow_right.svg'
import { ReactComponent as Spinner } from 'icons/spinner-dots.svg'
import { ReactComponent as Clear } from 'icons/close.svg'
import Button from 'components/button'
import InputNumber from 'components/input-number/input-number'
import './cart.scss'

const bem = cn('cart')

function Cart({ tickets, cart, categories, currency = '', toggleInCart, setCartModal, fee }) {
  const total = useMemo(() => Object.values(cart).reduce((acc, { sum }) => acc + sum, 0), [cart])
  const totalCount = useMemo(() => Object.values(cart).reduce((acc, { items }) => acc + items.length, 0), [cart])
  const isEmpty = !Object.values(cart).length
  const [promoCode, setPromoCode] = useState('')
  const [sendingPromo, setSendingPromo] = useState(false)
  const [promoCheckStatus, setPromoCheckStatus] = useState(null)
  
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

  const handleSubmitPromo = useCallback(e => {
    e.preventDefault()
    setSendingPromo(true)
    setTimeout(() => {
      setPromoCheckStatus(false)
      setSendingPromo(false)
    }, 1024)
  }, [])
  
  const feeAbs = (total * fee / 100).toFixed(2) * 1

  return (
    <div className={bem()}>
      <div>
        <h2 className={bem('title')}>Your order:</h2>
        <div className={bem('delimiter')} />
      </div>
      <div className={bem('list')}>
        {isEmpty && <div className={bem('empty')}>Select a ticket</div>}
        {Object.values(cart).filter(({ data, items }) => !!data && !!items).map(({ data, sum, items, ...rest }) => (
          <div className={bem('category')} key={data.value}>
            <div className={bem('category-title')} style={{ borderColor: data.color }}>
              <div className={bem('icon')} dangerouslySetInnerHTML={{ __html: data.icon}} style={{ color: data.color }} />
              <div className={bem('label')}>{data.label}</div>
              <div className={bem('count')}><Close style={{ width: 8 }} /> {items.length}</div>
              <div className={bem('price')}>{sum} {currency}</div>
              <button
                className={bem('remove')}
                onClick={() => {
                  items.forEach(item => toggleInCart(item, 0))
                }}
              >
                <Close style={{ width: 12, height: 12 }} />
              </button>
            </div>
            {rest.isMulitple ?
              (<div className={bem('items')}>
                <div className={bem('item')}>
                  <div className={bem('name')}>Quantity:</div>
                  <div className={bem('price')}>
                    <InputNumber
                      value={items.length}
                      onChange={value => handleChangeMultiple(value, tickets, data.value)}
                      disabledInput
                      ghost
                    />
                  </div>
                </div>
              </div>) :
              (<div className={bem('items')}>
                {items.map(item => (
                  <div className={bem('item')} key={item.id}>
                    <div className={bem("item-data-container")}>
                      <div className={bem('name')}>Row:</div>
                      <div className={bem('value')}>{item.row}</div>
                      <div className={bem('name')}>Seat:</div>
                      <div className={bem('value')}>{item.seat}</div>
                    </div>
                    <div className={bem('price')}>{item.price} {currency}</div>
                    <button className={bem('remove')} onClick={() => toggleInCart(item, 0)}><Close style={{ width: 10 }} /></button>
                  </div>
                ))}
              </div>)
            }
            
          </div>
        ))}
      </div>
      <div className={bem('form')}>
        <div className={bem('delimiter')} />
        {/* <form className={bem('promo')} onSubmit={handleSubmitPromo}>
          <input
            type='text'
            className={bem('input', { invalid: promoCheckStatus === false })}
            placeholder='enter promo code'
            value={promoCode}
            onChange={e => {
              setPromoCode(e.target.value)
              setPromoCheckStatus(null)
            }}
          />
          <Clear
            className={bem('clear')}
            onClick={() => {
              setPromoCode('')
              setPromoCheckStatus(null)
            }}
          />
          <Button className={bem('applyPromo')} disabled={!promoCode || isEmpty || sendingPromo}>
            {sendingPromo ? <Spinner style={{ width: 24 }} /> : <ArrowRight style={{ width: 9 }} />}
          </Button>
        </form> */}
        {promoCheckStatus !== null && <div className={bem('status-text', { success: promoCheckStatus })}>
          {promoCheckStatus ? 'Valid' : 'Promo code is wrong!'}
        </div>}
        <div className={bem('group')}>
          <div className={bem('summary')}>
            <div className={classNames(bem('total'), 'only-mobile')}>
              <div className={bem('fee')}>Selected tickets:</div>
              <div className={bem('fee')}>{totalCount}</div>
            </div>
            {!!fee && <div className={bem('total')}>
              <div className={bem('fee')}>transaction fee {fee}%:</div>
              <div className={bem('fee')}>{feeAbs} {currency}</div>
            </div>}
            <div className={bem('total')}>
              <div className={bem('cost')}>Total:</div>
              <div className={bem('cost')}>{total + feeAbs} {currency}</div>
            </div>
          </div>

          <Button
            color='bordered'
            size='large'
            className={bem('submit')}
            onClick={e => {
              e.preventDefault()
              setCartModal(true)
            }}
            disabled={isEmpty}
            type='button'
          >
            Buy tickets
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Cart