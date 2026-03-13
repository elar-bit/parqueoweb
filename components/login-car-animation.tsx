'use client'

/**
 * Escena de ciudad: pistas, carritos recorriendo la vía
 * y un águila surcando el cielo de fondo.
 */
export function LoginCarAnimation() {
  const path1 = 'M -40 85 Q 90 45 180 85 T 360 85 T 540 85'
  const path2 = 'M 540 195 Q 380 235 260 195 T -40 195'

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <svg className="absolute w-full h-full opacity-[0.2]" viewBox="0 0 500 280" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Ejes de pistas */}
          <path id="road-1" d={path1} fill="none" stroke="currentColor" strokeWidth="1" />
          <path id="road-2" d={path2} fill="none" stroke="currentColor" strokeWidth="1" />
          {/* Carrito */}
          <g id="car-sprite">
            <rect x="-10" y="-6" width="20" height="12" rx="3" fill="currentColor" opacity="0.95" />
            <circle cx="-6" cy="6" r="4" fill="currentColor" opacity="0.8" />
            <circle cx="6" cy="6" r="4" fill="currentColor" opacity="0.8" />
            <rect x="-5" y="-10" width="10" height="5" rx="1" fill="currentColor" opacity="0.7" />
          </g>
          {/* Árbol simple */}
          <g id="tree">
            <ellipse cx="0" cy="-12" rx="14" ry="18" fill="currentColor" opacity="0.25" />
            <rect x="-2" y="2" width="4" height="14" fill="currentColor" opacity="0.2" />
          </g>
          {/* Águila sencilla (cuerpo + alas) */}
          <g id="eagle-sprite">
            <path d="M -10 0 C -4 -4, 4 -4, 10 0 C 4 2, -4 2, -10 0 Z" fill="currentColor" opacity="0.85" />
            <path d="M 0 0 C -4 -10, -2 -14, 0 -10 C 2 -14, 4 -10, 0 0 Z" fill="currentColor" opacity="0.9" />
            <circle cx="7" cy="-1" r="1.3" fill="var(--background)" opacity="0.9" />
          </g>
        </defs>

        {/* Edificios de fondo */}
        <rect x="0" y="0" width="120" height="70" fill="currentColor" opacity="0.06" />
        <rect x="380" y="0" width="130" height="55" fill="currentColor" opacity="0.06" />
        <rect x="180" y="0" width="80" height="90" fill="currentColor" opacity="0.05" />

        {/* Árboles en la ciudad (verde) */}
        <g transform="translate(55, 35)" className="text-green-600">
          <use href="#tree" />
        </g>
        <g transform="translate(220, 28)" className="text-green-600">
          <use href="#tree" />
        </g>
        <g transform="translate(420, 40)" className="text-green-600">
          <use href="#tree" />
        </g>
        <g transform="translate(130, 230)" className="text-green-600">
          <use href="#tree" />
        </g>
        <g transform="translate(340, 218)" className="text-green-600">
          <use href="#tree" />
        </g>

        {/* Pistas: calzada + línea central discontinua */}
        <g className="text-primary">
          <use href="#road-1" stroke="currentColor" strokeWidth="14" opacity="0.12" />
          <use href="#road-1" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" opacity="0.35" />
        </g>
        <g className="text-primary">
          <use href="#road-2" stroke="currentColor" strokeWidth="14" opacity="0.12" />
          <use href="#road-2" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" opacity="0.35" />
        </g>

        {/* Carritos recorriendo la pista superior (colores variados) */}
        <g fill="hsl(var(--chart-1))" className="text-primary">
          <use href="#car-sprite" />
          <animateMotion
            path={path1}
            dur="14s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </g>
        <g fill="hsl(var(--chart-2))" className="text-primary opacity-85">
          <use href="#car-sprite" />
          <animateMotion
            path={path1}
            dur="16s"
            begin="3s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </g>

        {/* Carritos recorriendo la pista inferior */}
        <g fill="hsl(var(--chart-3))" className="text-primary opacity-90">
          <use href="#car-sprite" />
          <animateMotion
            path={path2}
            dur="15s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </g>
        <g fill="hsl(var(--chart-4))" className="text-primary opacity-75">
          <use href="#car-sprite" />
          <animateMotion
            path={path2}
            dur="17s"
            begin="4s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </g>

        {/* Águila surcando el cielo en la parte superior */}
        <g className="text-primary" fill="hsl(var(--primary))" transform="translate(0, 25)">
          <use href="#eagle-sprite" />
          <animateMotion
            dur="26s"
            repeatCount="indefinite"
            rotate="auto"
            path="M -60 -5 C 60 -20, 180 -10, 260 -18 S 420 -5, 560 -10"
          />
        </g>
      </svg>
    </div>
  )
}
