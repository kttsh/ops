export function getErrorMessage(errors: unknown[]): string | undefined {
	if (errors.length === 0) return undefined;
	const first = errors[0];
	if (typeof first === "string") return first;
	if (first && typeof first === "object" && "message" in first) {
		return String((first as { message: string }).message);
	}
	return String(first);
}
