import { useId } from "react";

const SHELL = "M192 291L265 253L352 233L415 177Q430 164 453 166L585 179Q600 180 614 195L668 250L755 279Q787 290 798 314L794 351L717 388L239 341L194 324Z";

/** Brand-neutral translucent body; all coordinates share the scanner's 1000 × 563 stage. */
export function ScannerVehicle() {
  const id = useId().replaceAll(":", "");
  return (
    <svg viewBox="0 0 1000 563" className="scanner-vehicle absolute inset-0 h-full w-full text-primary" role="img" aria-label="Carroceria transparente de um veículo genérico, sem marca">
      <defs>
        <clipPath id={`${id}-shell`}><path d={SHELL} /></clipPath>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.5" y2="1">
          <stop className="scanner-glass-light" offset="0" /><stop className="scanner-glass-clear" offset="1" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="currentColor" stopOpacity="0" /><stop offset="1" stopColor="currentColor" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <g opacity="0.3" strokeDasharray="5 7">
          <path d="M239 310L689 349L756 314M267 267L698 306M350 247L745 287M453 183L442 259M527 194L531 268M597 207L619 281" />
          <path d="M300 295L401 256L709 285L639 328ZM334 295L433 262M412 301L509 270M503 310L591 278M583 317L670 284" />
          <ellipse cx="413" cy="285" rx="25" ry="38" transform="rotate(-15 413 285)" />
          <ellipse cx="729" cy="312" rx="25" ry="38" transform="rotate(-15 729 312)" />
        </g>
        <path d={SHELL} fill={`url(#${id}-glass)`} strokeWidth="2.5" />
        <path d="M352 233L529 253L585 179M415 177L529 190L614 195M529 190L529 253L668 250M352 233L415 177M529 253L604 308L717 329L798 314M192 291L604 330L717 388M265 253L604 308L755 279M604 308V359M239 341L275 344M365 353L621 378M710 384L794 351" />
        <path d="M371 232L422 188L514 199L514 245ZM544 245V202L602 205L647 244Z" fill="currentColor" fillOpacity="0.04" />
        <path d="M382 251L379 336M528 265L532 354M392 265L425 268M548 278L578 281M736 307L773 294" opacity="0.65" />
        <g fill="currentColor" fillOpacity="0.025" strokeWidth="2">
          <ellipse cx="320" cy="330" rx="37" ry="49" transform="rotate(-15 320 330)" />
          <ellipse cx="664" cy="365" rx="37" ry="49" transform="rotate(-15 664 365)" />
          <ellipse cx="320" cy="330" rx="24" ry="33" transform="rotate(-15 320 330)" />
          <ellipse cx="664" cy="365" rx="24" ry="33" transform="rotate(-15 664 365)" />
          <path d="M310 301L330 359M297 326L343 334M654 336L674 394M641 361L687 369" strokeWidth="1" opacity="0.5" />
        </g>
        <g clipPath={`url(#${id}-shell)`} stroke="none"><g className="scanner-body-sweep">
          <rect x="185" y="150" width="630" height="60" fill={`url(#${id}-beam)`} />
          <path d="M185 210H815" stroke="currentColor" strokeWidth="3" />
        </g></g>
        <g className="scanner-body-nodes" fill="currentColor" stroke="none">
          <circle cx="352" cy="233" r="4" /><circle cx="529" cy="253" r="4" /><circle cx="604" cy="308" r="4" /><circle cx="717" cy="329" r="4" />
        </g>
      </g>
    </svg>
  );
}