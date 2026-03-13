'use client'

/**
 * Escena de ciudad: pistas, carritos que recorren la vía
 * y se estacionan en una zona de parqueo, con un águila en el cielo.
 */
export function LoginCarAnimation() {
  // Caminos principales (curvas suaves)
  const path1 = 'M -40 85 Q 90 45 180 85 T 360 85 T 540 85'
  const path2 = 'M 540 195 Q 380 235 260 195 T -40 195'

  // Paths que terminan en zona de parqueo (alargados hacia una “bahía”)
  const parkPath1 = 'M -40 85 Q 90 45 180 85 T 320 85 T 360 95 T 380 110'
  const parkPath2 = 'M 540 195 Q 420 225 300 195 T 220 190 T 200 180'

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
          {/* Recorridos hasta la zona de parqueo */}
          <path id="park-1" d={parkPath1} fill="none" stroke="currentColor" strokeWidth="1" />
          <path id="park-2" d={parkPath2} fill="none" stroke="currentColor" strokeWidth="1" />
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

        {/* Árboles en la ciudad */}
        <g transform="translate(55, 35)" className="text-primary">
          <use href="#tree" />
        </g>
        <g transform="translate(220, 28)" className="text-primary">
          <use href="#tree" />
        </g>
        <g transform="translate(420, 40)" className="text-primary">
          <use href="#tree" />
        </g>
        <g transform="translate(130, 230)" className="text-primary">
          <use href="#tree" />
        </g>
        <g transform="translate(340, 218)" className="text-primary">
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

        {/* Zona de parqueo en la pista superior (cajones marcados) */}
        <g className="text-primary">
          <rect x="360" y="98" width="44" height="18" fill="currentColor" opacity="0.05" />
          <rect x="362" y="100" width="18" height="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <rect x="382" y="100" width="18" height="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
        </g>

        {/* Zona de parqueo en la pista inferior */}
        <g className="text-primary">
          <rect x="188" y="174" width="40" height="20" fill="currentColor" opacity="0.05" />
          <rect x="190" y="176" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <rect x="208" y="176" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        </g>

        {/* Carritos camino 1: hacen el recorrido y se “estacionan” en la zona de parqueo */}
        <g fill="hsl(var(--primary))" className="text-primary">
          <use href="#car-sprite" />
          <animateMotion
            path={parkPath1}
            dur="14s"
            repeatCount="indefinite"
            rotate="auto"
            keyTimes="0;0.6;0.85;1"
            keyPoints="0;0.65;0.95;0.95"
            calcMode="linear"
          />
        </g>
        <g fill="hsl(var(--primary))" className="text-primary opacity-75">
          <use href="#car-sprite" />
          <animateMotion
            path={parkPath1}
            dur="16s"
            begin="3s"
            repeatCount="indefinite"
            rotate="auto"
            keyTimes="0;0.6;0.85;1"
            keyPoints="0;0.65;0.95;0.95"
            calcMode="linear"
          />
        </g>

        {/* Carritos camino 2: también terminan en su zona de parqueo */}
        <g fill="hsl(var(--primary))" className="text-primary opacity-85">
          <use href="#car-sprite" />
          <animateMotion
            path={parkPath2}
            dur="15s"
            repeatCount="indefinite"
            rotate="auto"
            keyTimes="0;0.6;0.9;1"
            keyPoints="0;0.65;0.95;0.95"
            calcMode="linear"
          />
        </g>
        <g fill="hsl(var(--primary))" className="text-primary opacity-65">
          <use href="#car-sprite" />
          <animateMotion
            path={parkPath2}
            dur="17s"
            begin="4s"
            repeatCount="indefinite"
            rotate="auto"
            keyTimes="0;0.6;0.9;1"
            keyPoints="0;0.65;0.95;0.95"
            calcMode="linear"
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
