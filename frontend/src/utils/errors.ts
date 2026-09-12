import axios from "axios"

interface ValidationErrorItem {
  msg?: string
  loc?: Array<string | number>
}

interface ApiErrorBody {
  detail?: string | ValidationErrorItem[] | Record<string, unknown>
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return "Unable to reach the server. Check that the API is running."
    }

    const detail = error.response.data?.detail

    if (typeof detail === "string") {
      return detail
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => item.msg)
        .filter((message): message is string => Boolean(message))

      return messages.length > 0 ? messages.join(", ") : fallback
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401
}
