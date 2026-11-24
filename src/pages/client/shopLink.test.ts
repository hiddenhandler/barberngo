import { expect, it } from 'vitest'
import { shopCode } from './shopLink'

it.each([' fade-factory ', 'https://example.com/shop/Fade-Factory/book?barber=x', '/shop/fade-factory/', '/s/fade-factory'])(
  'reads a shop code from %s', (value) => expect(shopCode(value)).toBe('fade-factory'),
)
it.each(['', 'two words', 'https://example.com/login', '/shop/a/book/unrelated', '//example.com'])(
  'rejects an invalid shop reference %s', (value) => expect(shopCode(value)).toBeNull(),
)
