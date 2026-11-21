import { useId } from "react";

const SHELL = "M410 65Q500 40 590 65Q611 73 616 108L628 192L628 419Q623 488 590 505Q500 525 410 505Q377 488 372 419L372 192L384 108Q389 73 410 65Z";

/** Orthographic overhead cutaway, in the scanner's shared 1000 × 563 stage. */
export function ScannerVehicle({ activeArea = "" }: { activeArea?: string }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg viewBox="0 0 1000 563" className="scanner-vehicle absolute inset-0 h-full w-full text-primary" role="img" aria-label="Carro visto de cima, com carroceria transparente, quatro rodas, bancos e estrutura interna visíveis">
      <defs>
        <clipPath id={`${id}-shell`}><path d={SHELL} /></clipPath>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop className="scanner-glass-light" offset="0" /><stop className="scanner-glass-clear" offset="0.5" /><stop className="scanner-glass-light" offset="1" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="currentColor" stopOpacity="0" /><stop offset="1" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        {/* Four exposed tires, two on each side, with visible tread. */}
        {[155, 389].map((y) => <g key={y}>
          {[353, 620].map((x) => <g key={x}>
            <rect x={x} y={y} width="27" height="65" rx="7" fill="currentColor" fillOpacity="0.12" strokeWidth="2.5" />
            <path d={`M${x + 7} ${y + 8}V${y + 57}M${x + 20} ${y + 8}V${y + 57}`} opacity="0.55" />
            {[14, 26, 38, 50].map((offset) => <path key={offset} d={`M${x + 3} ${y + offset}H${x + 24}`} opacity="0.4" />)}
          </g>)}
          <path d={`M380 ${y + 32}H620`} strokeDasharray="5 5" opacity="0.4" />
        </g>)}
        <path d={SHELL} fill={`url(#${id}-glass)`} strokeWidth="3" />
        <path d="M400 95Q500 72 600 95M390 122Q500 106 610 122M396 479Q500 498 604 479" opacity="0.6" />
        {/* Chassis rails and exposed engine bay, without a roof. */}
        <path d="M393 137V449M607 137V449M405 148H595M405 445H595M486 153V448M514 153V448" opacity="0.35" />
        <rect x="446" y="100" width="108" height="56" rx="8" fill="currentColor" fillOpacity="0.08" />
        <path d="M460 112H539M460 122H539M460 132H539M460 142H520M432 117H446M554 117H574" opacity="0.65" />
        <rect x="410" y="105" width="20" height="39" rx="3" />
        <path d="M417 112H423M420 109V115" />
        {/* Windshield outline and dashboard seen directly from above. */}
        <path d="M401 162Q500 146 599 162L592 206Q500 191 408 206Z" fill="currentColor" fillOpacity="0.025" />
        <path d="M408 207Q500 190 592 207L590 222H410Z" fill="currentColor" fillOpacity="0.08" />
        <circle cx="444" cy="224" r="18" strokeWidth="2.5" />
        <path d="M427 221H461M444 224V242" />
        <rect x="489" y="202" width="27" height="10" rx="2" />
        {/* Two front seats: headrests, backrests and cushions. */}
        {[414, 526].map((x) => <g key={x}>
          <rect x={x + 16} y="249" width="34" height="15" rx="5" fill="currentColor" fillOpacity="0.15" />
          <rect x={x + 3} y="269" width="60" height="23" rx="7" fill="currentColor" fillOpacity="0.13" strokeWidth="2.2" />
          <rect x={x} y="295" width="66" height="59" rx="12" fill="currentColor" fillOpacity="0.07" strokeWidth="2.2" />
          <path d={`M${x + 10} 304V343M${x + 56} 304V343M${x + 15} 346H${x + 51}`} opacity="0.5" />
        </g>)}
        <rect x="490" y="248" width="20" height="99" rx="5" fill="currentColor" fillOpacity="0.08" />
        <circle cx="500" cy="263" r="4" /><circle cx="500" cy="281" r="5" /><circle cx="500" cy="299" r="5" />
        {/* Rear bench, three headrests and the luggage compartment. */}
        {[423, 483, 543].map((x) => <rect key={x} x={x} y="366" width="34" height="14" rx="4" fill="currentColor" fillOpacity="0.15" />)}
        <rect x="410" y="385" width="180" height="20" rx="6" fill="currentColor" fillOpacity="0.13" strokeWidth="2.2" />
        <rect x="409" y="408" width="182" height="36" rx="8" fill="currentColor" fillOpacity="0.07" strokeWidth="2.2" />
        <path d="M470 409V442M530 409V442M414 453H586L580 478H420Z" opacity="0.6" />
        {/* Side sills, door divisions, mirrors and neutral lamps. */}
        <path d="M382 210V359M618 210V359M373 361H392M608 361H627M389 242H398M602 242H611M389 387H398M602 387H611" />
        <path d="M378 204L343 211Q337 222 343 232L375 225M622 204L657 211Q663 222 657 232L625 225" fill="currentColor" fillOpacity="0.07" />
        <path d="M401 80L425 76M575 76L599 80M400 488L423 494M577 494L600 488" strokeWidth="4" />
        <g clipPath={`url(#${id}-shell)`} stroke="none"><g className="scanner-body-sweep">
          <rect x="365" y="48" width="270" height="66" fill={`url(#${id}-beam)`} />
          <path d="M365 114H635" stroke="currentColor" strokeWidth="3" />
        </g></g>
        <g className="scanner-area-highlight" aria-hidden="true">
          {(activeArea === "motor" || activeArea === "falhas") && <rect x="436" y="91" width="128" height="73" rx="9" />}
          {activeArea === "oleo" && <circle cx="500" cy="137" r="28" />}
          {activeArea === "bateria" && <rect x="401" y="96" width="37" height="56" rx="5" />}
          {activeArea === "comb" && <rect x="445" y="451" width="110" height="28" rx="6" />}
        </g>
        <g className="scanner-body-nodes" fill="currentColor" stroke="none">
          <circle cx="500" cy="128" r="5" /><circle cx="444" cy="224" r="5" /><circle cx="500" cy="319" r="5" /><circle cx="500" cy="424" r="5" />
        </g>
      </g>
    </svg>
  );
}