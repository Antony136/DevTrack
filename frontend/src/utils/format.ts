export function initialsFromName(name?: string | null) {
  if (!name?.trim()) {
    return "?"
  }

  return name.trim().charAt(0).toUpperCase()
}

export function formatStatus(value: string) {
  return value
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatPriority(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
