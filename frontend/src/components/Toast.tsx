import Icon from "./Icon"

interface ToastProps {
  message: string
  tone?: "success" | "error"
  onDismiss: () => void
}

function Toast({ message, tone = "success", onDismiss }: ToastProps) {
  if (!message) {
    return null
  }

  return (
    <div className={`toast toast-${tone}`} role="status">
      <Icon name={tone === "success" ? "check" : "close"} />
      <span>{message}</span>
      <button
        className="icon-button"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
      >
        <Icon name="close" />
      </button>
    </div>
  )
}

export default Toast
