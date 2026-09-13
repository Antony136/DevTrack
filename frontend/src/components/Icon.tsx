import type { ReactElement, SVGProps } from "react"

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "bell"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "dashboard"
  | "edit"
  | "filter"
  | "folder"
  | "logout"
  | "moon"
  | "palette"
  | "plus"
  | "refresh"
  | "search"
  | "settings"
  | "sort"
  | "spark"
  | "sun"
  | "tasks"
  | "trash"
  | "type"
  | "user"

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
}

const paths: Record<IconName, ReactElement> = {
  "arrow-left": <path d="M19 12H5m6-6-6 6 6 6" />,
  "arrow-right": <path d="M5 12h14m-6-6 6 6-6 6" />,
  bell: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  dashboard: (
    <>
      <path d="M4 13h7V4H4z" />
      <path d="M13 20h7V4h-7z" />
      <path d="M4 20h7v-5H4z" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L8 20H4v-4z" />
    </>
  ),
  filter: <path d="M4 5h16M7 12h10m-7 7h4" />,
  folder: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  logout: <path d="M10 17 15 12l-5-5m5 5H3m10-8h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-5" />,
  moon: <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  palette: (
    <>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <circle cx="6.5" cy="9.5" r="1.5" />
      <circle cx="9.5" cy="4" r="1.5" />
      <circle cx="14.5" cy="4" r="1.5" />
      <circle cx="17.5" cy="9.5" r="1.5" />
      <circle cx="17.5" cy="14.5" r="1.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: <path d="M20 12a8 8 0 0 1-14.9 4M4 12A8 8 0 0 1 18.9 8M19 4v4h-4M5 20v-4h4" />,
  search: <path d="m21 21-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-15.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24M4.22 19.78l4.24-4.24m3.08-3.08l4.24-4.24" />
    </>
  ),
  sort: <path d="M7 4v16m0 0-3-3m3 3 3-3m7 3V4m0 0-3 3m3-3 3 3" />,
  spark: <path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5z" />,
  sun: <path d="M12 3v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M3 12h6m6 0h6m-15.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24M19.78 4.22l-4.24 4.24m-3.08 3.08l-4.24 4.24" />,
  tasks: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m4 6 .8.8L6.5 5M4 12l.8.8 1.7-1.8M4 18l.8.8 1.7-1.8" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
    </>
  ),
  type: (
    <>
      <path d="M4 7h16M6 15h12M5 11h14" />
    </>
  ),
  user: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
}

function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}

export default Icon
