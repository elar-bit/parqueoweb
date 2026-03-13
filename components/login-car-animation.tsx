'use client'

export function LoginCarAnimation() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <svg
        className="absolute w-full h-full opacity-[0.15]"
        viewBox="0 0 500 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Línea del camino 1 (ondulada) */}
          <path
            id="road-1"
            d="M -30 80 Q 100 40 200 80 T 400 80 T 530 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="10 8"
            strokeLinecap="round"
          />
          {/* Línea del camino 2 (sentido contrario) */}
          <path
            id="road-2"
            d="M 530 180 Q 400 220 250 180 T -30 180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="10 8"
            strokeLinecap="round"
          />
          {/* Carrito tipo sprite */}
          <g id="car-sprite">
            <rect x="-10" y="-6" width="20" height="12" rx="3" fill="currentColor" opacity="0.95" />
            <circle cx="-6" cy="6" r="4" fill="currentColor" opacity="0.8" />
            <circle cx="6" cy="6" r="4" fill="currentColor" opacity="0.8" />
            <rect x="-5" y="-10" width="10" height="5" rx="1" fill="currentColor" opacity="0.7" />
          </g>
        </defs>
        {/* Camino 1 */}
        <use href="#road-1" className="text-primary" />
        {/* Carritos en camino 1 */}
        <g fill="hsl(var(--primary))" className="text-primary">
          <use href="#car-sprite" />
          <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path="M -30 80 Q 100 40 200 80 T 400 80 T 530 80" />
        </g>
        <g fill="hsl(var(--primary))" className="text-primary opacity-80">
          <use href="#car-sprite" />
          <animateMotion dur="7s" repeatCount="indefinite" begin="1.5s" rotate="auto" path="M -30 80 Q 100 40 200 80 T 400 80 T 530 80" />
        </g>
        <g fill="hsl(var(--primary))" className="text-primary opacity-60">
          <use href="#car-sprite" />
          <animateMotion dur="7s" repeatCount="indefinite" begin="3.5s" rotate="auto" path="M -30 80 Q 100 40 200 80 T 400 80 T 530 80" />
        </g>
        {/* Camino 2 */}
        <use href="#road-2" className="text-primary" />
        {/* Carritos en camino 2 */}
        <g fill="hsl(var(--primary))" className="text-primary opacity-70">
          <use href="#car-sprite" />
          <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" path="M 530 180 Q 400 220 250 180 T -30 180" />
        </g>
        <g fill="hsl(var(--primary))" className="text-primary opacity-50">
          <use href="#car-sprite" />
          <animateMotion dur="9s" repeatCount="indefinite" begin="3s" rotate="auto" path="M 530 180 Q 400 220 250 180 T -30 180" />
        </g>
      </svg>
    </div>
  )
}
