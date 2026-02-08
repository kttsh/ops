import { toast } from "sonner";

export function showSuccessToast(message: string) {
	toast.success(message);
}

export function showErrorToast(message: string) {
	toast.error(message, { duration: Infinity });
}

export function showWarningToast(message: string) {
	toast.warning(message, { duration: 5000 });
}
