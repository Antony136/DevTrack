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
  | "plus"
  | "refresh"
  | "search"
  | "sort"
  | "spark"
  | "tasks"
  | "trash"
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
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: <path d="M20 12a8 8 0 0 1-14.9 4M4 12A8 8 0 0 1 18.9 8M19 4v4h-4M5 20v-4h4" />,
  search: <path d="m21 21-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />,
  sort: <path d="M7 4v16m0 0-3-3m3 3 3-3m7 3V4m0 0-3 3m3-3 3 3" />,
  spark: <path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5z" />,
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
