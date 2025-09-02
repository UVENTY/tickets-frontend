import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { TransformWrapper } from 'react-zoom-pan-pinch'
import './seating-scheme.scss'
import Controls from './controls'
import SvgScheme from './svg'

const SeatingScheme = forwardRef((props, ref) => {
  const svgRef = useRef(null);
  const reflowTimeoutRef = useRef(null);

  // Эта функция использует "тяжелый" трюк для принудительной перерисовки SVG.
  // Кратковременное изменение свойства `display` заставляет браузер полностью
  // пересчитать геометрию и перерисовать элемент, что решает проблему с размытием.
  // Этот метод более надежен, чем манипуляции с классами или трансформациями.
  const forceSvgReflow = useCallback(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    // 1. Скрываем SVG. Это удаляет его из потока отрисовки.
    svg.style.display = 'none';

    // 2. Вызов getBoundingClientRect() заставляет браузер синхронно применить
    //    изменение стиля 'display: none'. Это ключевая часть трюка.
    svg.getBoundingClientRect();

    // 3. Возвращаем SVG в DOM. Браузер вынужден перерисовать его с нуля, четко.
    //    Пустая строка вернет свойство к значению из CSS.
    svg.style.display = '';
  }, []);

  // Используем "дебаунс", чтобы функция перерисовки вызывалась только один раз
  // после того,как пользователь закончил масштабирование.
  const debouncedReflow = useCallback(() => {
    if (reflowTimeoutRef.current) {
      clearTimeout(reflowTimeoutRef.current);
    }
    reflowTimeoutRef.current = setTimeout(forceSvgReflow, 150);
  }, [forceSvgReflow]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (reflowTimeoutRef.current) {
        clearTimeout(reflowTimeoutRef.current);
      }
    }
  }, []);

  const { src, cart, categories, currency, tickets, toggleInCart, highlight, selectedCategory, resetSelectedCategory, viewport } = props

  return (
    <TransformWrapper
      minScale={0.8}
      maxScale={4}
      initialScale={1}
      doubleClick={{
        disabled: true
      }}
      // onZoom срабатывает при любом масштабировании и запускает нашу функцию перерисовки.
      onZoom={debouncedReflow}
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