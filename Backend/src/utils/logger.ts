function info(message: string) {
	console.log(`[INFO] ${message}`);
}

function error(message: string, error?: Error | Error[]) {
	if (error) {
		if (Array.isArray(error)) console.error(`[ERROR] ${message}`, ...error);
		else console.error(`[ERROR] ${message}`, error);
		return;
	}

	console.error(`[ERROR] ${message}`);
}

function warn(message: string) {
	console.warn(`[WARN] ${message}`);
}

function debug(message: string, extra?: unknown) {
	if (process.env.LOG_LEVEL !== "DEBUG") return;

	if (!extra) return console.debug(`[DEBUG] ${message}`);

	console.debug(`[DEBUG] ${message}`, extra);
}

// export all functions as logger
export default {
	info,
	error,
	warn,
	debug,
};
