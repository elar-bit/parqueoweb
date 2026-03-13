'use client'

/**
 * Escena de ciudad: pistas, carritos que se detienen en semáforos
 * y un águila surcando el cielo de fondo.
 */
export function LoginCarAnimation() {
  const path1 = 'M -40 85 Q 90 45 180 85 T 360 85 T 540 85'
  const path2 = 'M 540 195 Q 380 235 260 195 T -40 195'

  // Duraciones de los ciclos (coinciden con los semáforos)
  const dur1 = 22
  const dur2 = 20

  // Autos en camino 1: avanzan, se detienen cerca del primer semáforo,
  // avanzan de nuevo, se detienen cerca del segundo, y continúan.
  // Usamos keyPoints (posición en el path) y keyTimes (tiempo) para "congelar"
  // la posición durante varios segundos.
  const keyTimes1 = '0;0.18;0.4;0.4;0.7;0.9;0.9;1'
  const keyPoints1 = '0;0.25;0.25;0.55;0.55;0.9;0.9;1'

  // Autos en camino 2: mismo concepto, con otro ritmo.
  const keyTimes2 = '0;0.2;0.45;0.45;0.7;0.9;0.9;1'
  const keyPoints2 = '0;0.3;0.3;0.6;0.6;0.9;0.9;1'

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <svg className="absolute w-full h-full opacity-[0.2]" viewBox="0 0 500 280" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Pistas: usamos el path como eje y luego dibujamos la calzada y la línea central */}
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

        {/* Pistas: calzada (recta) + línea central discontinua siguiendo el path */}
        <g className="text-primary">
          <use href="#road-1" stroke="currentColor" strokeWidth="14" opacity="0.12" />
          <use href="#road-1" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" opacity="0.35" />
        </g>
        <g className="text-primary">
          <use href="#road-2" stroke="currentColor" strokeWidth="14" opacity="0.12" />
          <use href="#road-2" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" opacity="0.35" />
        </g>

        {/* Semáforo 1 (camino 1, primera parada) */}
        <g transform="translate(155, 78)" className="text-primary">
          <rect x="-6" y="-20" width="12" height="24" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
          <circle id="tl1-green" r="3" cy="-12" fill="#22c55e" opacity="0.9" />
          <circle id="tl1-red" r="3" cy="4" fill="#ef4444" opacity="0.15" />
          <animate href="#tl1-red" attributeName="opacity" values="0.15;0.15;0.9;0.9;0.15" keyTimes="0;0.36;0.36;0.73;1" dur={`${dur1}s`} repeatCount="indefinite" />
          <animate href="#tl1-green" attributeName="opacity" values="0.9;0.9;0.15;0.15;0.9" keyTimes="0;0.36;0.36;0.73;1" dur={`${dur1}s`} repeatCount="indefinite" />
        </g>
        {/* Semáforo 2 (camino 1, segunda parada) */}
        <g transform="translate(355, 78)" className="text-primary">
          <rect x="-6" y="-20" width="12" height="24" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
          <circle id="tl2-green" r="3" cy="-12" fill="#22c55e" opacity="0.15" />
          <circle id="tl2-red" r="3" cy="4" fill="#ef4444" opacity="0.9" />
          <animate href="#tl2-red" attributeName="opacity" values="0.9;0.15;0.15;0.9;0.9" keyTimes="0;0.18;0.55;0.55;1" dur={`${dur1}s`} repeatCount="indefinite" />
          <animate href="#tl2-green" attributeName="opacity" values="0.15;0.9;0.9;0.15;0.15" keyTimes="0;0.18;0.55;0.55;1" dur={`${dur1}s`} repeatCount="indefinite" />
        </g>
        {/* Semáforo 3 (camino 2) */}
        <g transform="translate(390, 188)" className="text-primary">
          <rect x="-6" y="-20" width="12" height="24" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
          <circle id="tl3-green" r="3" cy="-12" fill="#22c55e" opacity="0.15" />
          <circle id="tl3-red" r="3" cy="4" fill="#ef4444" opacity="0.9" />
          <animate href="#tl3-red" attributeName="opacity" values="0.9;0.9;0.15;0.15" keyTimes="0;0.4;0.4;1" dur={`${dur2}s`} repeatCount="indefinite" />
          <animate href="#tl3-green" attributeName="opacity" values="0.15;0.15;0.9;0.9" keyTimes="0;0.4;0.4;1" dur={`${dur2}s`} repeatCount="indefinite" />
        </g>
        {/* Semáforo 4 (camino 2) */}
        <g transform="translate(150, 200)" className="text-primary">
          <rect x="-6" y="-20" width="12" height="24" rx="2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.5" />
          <circle id="tl4-green" r="3" cy="-12" fill="#22c55e" opacity="0.9" />
          <circle id="tl4-red" r="3" cy="4" fill="#ef4444" opacity="0.15" />
          <animate href="#tl4-red" attributeName="opacity" values="0.15;0.15;0.9;0.9" keyTimes="0;0.2;0.2;1" dur={`${dur2}s`} repeatCount="indefinite" />
          <animate href="#tl4-green" attributeName="opacity" values="0.9;0.9;0.15;0.15" keyTimes="0;0.2;0.2;1" dur={`${dur2}s`} repeatCount="indefinite" />
        </g>

        {/* Carritos camino 1 (avanzan y se detienen cerca de los semáforos rojos) */}
        <g fill="hsl(var(--primary))" className="text-primary">
          <use href="#car-sprite" />
          <animateMotion
            path={path1}
            dur={`${dur1}s`}
            repeatCount="indefinite"
            rotate="auto"
            keyTimes={keyTimes1}
            keyPoints={keyPoints1}
            calcMode="linear"
          />
        </g>
        <g fill="hsl(var(--primary))" className="text-primary opacity-80">
          <use href="#car-sprite" />
          <animateMotion
            path={path1}
            dur={`${dur1}s`}
            repeatCount="indefinite"
            begin="2.5s"
            rotate="auto"
            keyTimes={keyTimes1}
            keyPoints={keyPoints1}
            calcMode="linear"
          />
        </g>
        <g fill="hsl(var(--primary))" className="text-primary opacity-60">
          <use href="#car-sprite" />
          <animateMotion
            path={path1}
            dur={`${dur1}s`}
            repeatCount="indefinite"
            begin="5s"
            rotate="auto"
            keyTimes={keyTimes1}
            keyPoints={keyPoints1}
            calcMode="linear"
          />
        </g>

        <g fill="hsl(var(--primary))" className="text-primary opacity-75">
          <use href="#car-sprite" />
          <animateMotion
            path={path2}
            dur={`${dur2}s`}
            repeatCount="indefinite"
            rotate="auto"
            keyTimes={keyTimes2}
            keyPoints={keyPoints2}
            calcMode="linear"
          />
        </g>
        <g fill="hsl(var(--primary))" className="text-primary opacity-55">
          <use href="#car-sprite" />
          <animateMotion
            path={path2}
            dur={`${dur2}s`}
            repeatCount="indefinite"
            begin="4s"
            rotate="auto"
            keyTimes={keyTimes2}
            keyPoints={keyPoints2}
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
