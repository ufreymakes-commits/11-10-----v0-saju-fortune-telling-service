// Shopify CDN은 width 쿼리로 작은 이미지를 내려준다. 다른 호스트나 이미 width가 있는 주소는 그대로 둔다.
export function cdnImage(url: string, width: number): string {
  if (!url.includes('cdn.shopify.com') || /[?&]width=/.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`
}
