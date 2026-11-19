import Image from 'next/image'

const CHARACTERS = [
  { name: 'The Pioneer', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gabmok.png?v=1777872574' },
  { name: 'The Adapter', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/eulmok.png?v=1777872574' },
  { name: 'The Energizer', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/byeonghwa.png?v=1777872574' },
  { name: 'The Empath', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/jeonghwa.png?v=1777872574' },
  { name: 'The Anchor', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/muto.png?v=1777872573' },
  { name: 'The Nurturer', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gito.png?v=1777872574' },
  { name: 'The Straight Shooter', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gyeonggeum.png?v=1777872574' },
  { name: 'The Perfectionist', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/singeum.png?v=1777872573' },
  { name: 'The Explorer', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/imsu.png?v=1777872574' },
  { name: 'The Intuitive', image: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gyesu.png?v=1777872574' },
]

function Row({ items, rowKey, className }: { items: typeof CHARACTERS; rowKey: string; className: string }) {
  return (
    <div className={className}>
      {items.map((char, i) => (
        <div key={`${rowKey}-${i}`} className="flex-shrink-0 w-20 mx-1 text-center">
          <div className="relative w-16 h-16 mx-auto mb-1">
            <Image src={char.image} alt={char.name} fill sizes="64px" className="object-contain" />
          </div>
          <p className="text-[9px] text-foreground/70 truncate">{char.name}</p>
        </div>
      ))}
    </div>
  )
}

function FixedRow({ items, offset }: { items: typeof CHARACTERS; offset: number }) {
  return (
    <ul className="grid grid-cols-5 gap-x-1">
      {items.map((char, i) => (
        <li key={char.name} className="min-w-0 text-center">
          <div
            className="animate-char-bob relative mx-auto mb-1 aspect-square w-full max-w-16"
            style={{ animationDelay: `${(((offset + i) * 7) % 10) * 0.2}s` }}
          >
            <Image src={char.image} alt={char.name} fill sizes="64px" className="object-contain" />
          </div>
          <p className="text-[9px] text-foreground/70 truncate">{char.name}</p>
        </li>
      ))}
    </ul>
  )
}

export function CharacterSlider({ fixed = false }: { fixed?: boolean }) {
  if (fixed) {
    return (
      <div className="flex flex-col gap-3">
        <FixedRow items={CHARACTERS.slice(0, 5)} offset={0} />
        <FixedRow items={CHARACTERS.slice(5)} offset={5} />
      </div>
    )
  }

  const second = [...CHARACTERS.slice(5), ...CHARACTERS.slice(0, 5)]
  return (
    <div className="overflow-hidden">
      <Row items={[...CHARACTERS, ...CHARACTERS]} rowKey="r1" className="flex w-max animate-slide-right mb-2" />
      <Row items={[...second, ...second]} rowKey="r2" className="flex w-max animate-slide-left" />
    </div>
  )
}
