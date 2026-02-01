import { z } from "zod";

export const paginationQuerySchema = z.object({
	"page[number]": z.coerce.number().int().min(1).default(1),
	"page[size]": z.coerce.number().int().min(1).max(1000).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
