export type ProblemDetail = {
	type: string;
	status: number;
	title: string;
	detail?: string;
	instance?: string;
	requestId?: string;
	timestamp?: string;
	errors?: Array<{
		pointer: string;
		keyword: string;
		message: string;
		params?: Record<string, unknown>;
	}>;
};
