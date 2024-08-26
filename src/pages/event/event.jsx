import { useCallback, useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import classNames from "classnames"
import Hammer from 'hammerjs'
import { cn } from '@bem-react/classname'
import Button from "components/button";
import TicketsCounter from "components/tickets-counter";
import CategorySelector from "components/category-selector";
import SeatingScheme from "components/seating-scheme";
import Countdown from "components/countdown/countdown";
import Cart from "components/cart";
import CartModal from "components/modal/modal";
import { ReactComponent as IconArrow } from 'icons/arrow.svg'
import { ReactComponent as IconArrowDouble } from 'icons/arrow_2_down.svg'
import { clearCart, updateCart } from "api/cart";
import { getEventQuery } from "api/event";
import { useClickAway, useCountdown, useEventId, useIsMobile, useLocalStorage } from "utils/hooks";
import { isEqualSeats } from "utils";
import { getFromLocalStorage } from "utils/common";
import { EMPTY_ARRAY, STORAGE_KEY_USER_EMAIL } from "const";
import './event.scss'

const bem = cn('event')

export default function Event() {
  const routeParams = useParams()
  const [searchParams] = useSearchParams()
  const id = useEventId()
  const queryClient = useQueryClient()
  const { bookingExpired, bookingLimit, cart, cartByCategory, categories, config, scheme, tickets, event, errors } = useOutletContext()
  const isMobile = useIsMobile()
  const [selectValue, setSelectValue] = useState(null)
  const [selectOpened, setSelectOpened] = useState(false)
  const [highlightCat, setHighlightCat] = useState(null)
  const [orderExpanded, setOrderExpanded] = useState(false)
  const [cartModal, setCartModal] = useState(false)
  const [viewport, setViewport] = useState(null)

  const ref = useClickAway(() => setSelectOpened(false))
  const cartRef = useRef(false)
  const schemeRef = useRef(null)

  useEffect(() => {
    const el = schemeRef.current
    if (!el) return
    const viewport = el.getBoundingClientRect()
    setViewport(viewport)
  }, [])

  useLayoutEffect(() => {
    const isDesktop = window.innerWidth > 1023
    setSelectOpened(isDesktop)
  }, [])
  
  useEffect(() => {
    if (selectOpened) {
      setOrderExpanded(false)
    }
  }, [selectOpened])

  useEffect(() => {
    if (!bookingExpired || !bookingExpired.length) return
    bookingExpired.forEach(item => updateCart(item, 0))
  }, [bookingExpired])

  const toggleInCart = useMutation({
    mutationFn: (item) => updateCart(item, Number(!item.inCart)),
    onMutate: async (ticket) => {
      const booking = ticket.inCart ? 0 : (bookingLimit || (Date.now() + 15 * 60 * 1000 + 59 * 1000))
      const queryKey = ['tickets', id]
      await queryClient.cancelQueries({ queryKey })
      const previousCart = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, items =>
        items.map(item => item.id === ticket.id ? {
          ...item,
          inCart: !item.inCart,
          bookingLimit: booking
        } : item)
      )
      return { previousCart }
    }
  })

  const handleClearCart = useCallback((queryKey) => {
    return clearCart().then(() => queryClient.resetQueries({ queryKey, exact: true }))
  }, [cart])
  
  return (
    <div className={bem('layout')}>
      <div className={bem('scheme')} ref={schemeRef}>
        <Countdown to={bookingLimit} className={bem('countdown')} />
        {!!viewport && <SeatingScheme
          src={scheme}
          categories={categories}
          highlight={highlightCat || selectValue}
          selectedCategory={selectValue}
          resetSelectedCategory={() => setSelectValue(null)}
          cart={cartByCategory}
          tickets={tickets || EMPTY_ARRAY}
          toggleInCart={toggleInCart.mutate}
          viewport={viewport}
        />}
      </div>
      <div className={classNames(bem('sidebar'), bem('categories'))} ref={ref}>
        <h2 className={bem('title')}>select a category:</h2>
        <CategorySelector
          defaultCurrency={config?.currency}
          value={selectValue}
          options={categories}
          opened={selectOpened}
          onChange={(val) => {
            if (selectOpened) setSelectValue(val)
            setSelectOpened(!selectOpened)
          }}
          onMouseOver={(e, val) => setHighlightCat(val.value)}
          onMouseOut={() => setHighlightCat(null)}
          currency={event?.currency_sign}
        />
        <Button
          color='ghost'
          className={bem('toggle-cat', { opened: selectOpened })}
          onClick={() => setSelectOpened(!selectOpened)}
        >
          <IconArrow />
        </Button>
      </div>
      <div
        className={classNames(
          bem('sidebar'),
          bem('order', { expanded: orderExpanded })
        )}
        ref={cartRef}
      >
        <button
          className={classNames(bem('toggleCart'), 'only-mobile')}
          onClick={() => {
            setOrderExpanded(!orderExpanded)
            setSelectOpened(false)
          }}
        >
          <IconArrowDouble style={{ width: 16 }} /> More details
        </button>
        {!!cartByCategory  && <Cart
          tickets={tickets}
          categories={categories}
          cart={cartByCategory}
          toggleInCart={toggleInCart.mutate}
          setCartModal={setCartModal}
          fee={event?.fee * 1}
          currency={event?.currency_sign}
        />}
      </div>
      {cartModal && (
        <CartModal
          open={cartModal}
          fee={event?.fee * 1}
          categoriesF={categories}
          bookingLimit={bookingLimit}
          cart={cart}
          cartByCategory={cartByCategory}
          setOpen={setCartModal}
          clearCart={handleClearCart}
        />
      )}
    </div>
  )
};
