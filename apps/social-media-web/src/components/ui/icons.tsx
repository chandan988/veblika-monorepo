import type * as React from "react"

const base = {
  className: "h-4 w-4",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
}

export const CheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const DotsVertical = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
)

export const Filter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M3 6h18M7 12h10M10 18h4" />
  </svg>
)

export const Search = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3-3" />
  </svg>
)

export const Send = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

export const Plus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

