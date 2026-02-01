import sql from "mssql";

const config: sql.config = {
	server: process.env.DB_SERVER!,
	port: Number(process.env.DB_PORT) || 1433,
	database: process.env.DB_DATABASE!,
	user: process.env.DB_USER!,
	password: process.env.DB_PASSWORD!,
	options: {
		encrypt: true,
		trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
	},
	pool: {
		min: 0,
		max: 10,
	},
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
	if (!pool) {
		pool = new sql.ConnectionPool(config);
		await pool.connect();
	}
	return pool;
}
