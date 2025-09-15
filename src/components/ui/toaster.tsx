import { useToast } from "../../hooks/use-toast"
import {
  Toast,
  ToastProvider,
  ToastViewport,
} from "./toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      <ToastViewport>
        {toasts.map(function ({ id, title, description, ...props }) {
          return (
            <Toast 
              key={id} 
              title={title}
              description={description}
              variant={props.variant}
              onClose={() => dismiss(id)}
            />
          )
        })}
      </ToastViewport>
    </ToastProvider>
  )
}
