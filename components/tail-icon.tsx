interface TailIconProps {
  hex: string
  className?: string
}

export function TailIcon({ hex, className }: TailIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4.5 21C2 13.5 6 5 16.5 2.5c1.2-.3 1.8.6 1.2 1.6C15 8.2 15.600 11 18.300 13c2.300 1.800 2.200 4.600-.2 6.200C14.500 21.600 9 22.700 4.500 21z"
        fill={hex}
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M16.500 2.500c1.200-.3 1.800.6 1.200 1.600-1.500 2.200-2.200 4-2.100 5.600C14 7.300 14.300 4.700 16.500 2.500z"
        fill="#ffffff"
        fillOpacity="0.9"
      />
    </svg>
  )
}
