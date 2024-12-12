import axios from "axios";
import type { ServerLogin } from "./serverManagerProvider";
export interface StackInfo {
	name: string;
	url?: string;
	branch?: string;
	commit?: string;
	status: "ACTIVE" | "INACTIVE" | "DOWNED" | "NONE";
}

export interface Stack {
	name: string;
	type: "git" | "file";

	// Git
	url?: string;
	cloneDepth?: number;
	branch?: string;
	fetchInterval?: string;
	revertOnFailure?: boolean;
	composePath?: string;

	// File
	composeFile?: string;
	envFile?: string;

	// Notifications
	notificationUrl?: string;
	notificationProvider?: string;

	createdAt?: string;
	updatedAt?: string;
}

export interface Container {
	name: string;
	image: string;
	command: string;
	state:
		| "paused"
		| "restarting"
		| "removing"
		| "running"
		| "dead"
		| "created"
		| "exited";
	ports: {
		mapped?: { address: string; port: number };
		exposed: { port: number; protocol: string };
	}[];
}

export interface ExtededStack extends Stack {
	currentCommit?: string;
	status: "ACTIVE" | "INACTIVE" | "DOWNED" | "NONE";
	containers: Container[];
}

function url(serverUrl: string, path: string) {
	const url = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;

	return `${url}/v1/${path}`;
}

function authHeader(server: ServerLogin) {
	return {
		headers: {
			Authorization: `Bearer ${server.token}`,
		},
	};
}

// Get info
// ---

export async function getStacks(server?: ServerLogin): Promise<StackInfo[]> {
	if (!server || !server.url) return [];
	return await axios
		.get<StackInfo[]>(url(server.url, "stacks"), authHeader(server))
		.then((response) => response.data)
		.catch(() => {
			// TODO: Handle error
			return [];
		});
}

export async function getStack(
	server: ServerLogin | undefined,
	stackName: string,
): Promise<{ status: number; stack: ExtededStack | undefined } | undefined> {
	if (!server || !server.url) return undefined;

	return await axios
		.get<ExtededStack>(
			url(server.url, `stacks/${stackName}`),
			authHeader(server),
		)
		.then((response) => ({ status: response.status, stack: response.data }))
		.catch((err) => {
			// TODO: Handle error
			return { status: err.response.status, stack: undefined };
		});
}

export async function getStatus(
	server: ServerLogin | undefined,
	stackName: string,
): Promise<
	| {
			status: "ACTIVE" | "INACTIVE" | "DOWNED";
			containers: Container[];
	  }
	| undefined
> {
	if (!server || !server.url) return undefined;

	return await axios
		.get(url(server.url, `stacks/${stackName}/containers`), authHeader(server))
		.then((response) => response.data);
}

// Controls
// ---

interface ComposeLog {
	out: string;
	err: string;
}

export interface ApiControlResponse {
	success: boolean;
	message: string;
	log: ComposeLog;
}

export async function defaultControlCall(
	server: ServerLogin,
	stackName: string,
	action: "start" | "stop" | "restart",
): Promise<ApiControlResponse> {
	return await axios
		.get<{ message: string; log: ComposeLog }>(
			url(server.url, `stacks/${stackName}/${action}`),
			authHeader(server),
		)
		.then((res) => ({
			success: res.status === 200,
			message: res.data.message,
			log: res.data.log,
		}))
		.catch((err) => {
			console.error(err);
			if (err.response.status === 500)
				return { success: false, ...err.response.data };

			return {
				success: false,
				message: "Something went wrong...",
				log: { out: "", err: "" },
			};
		});
}

export async function updateStack(
	server: ServerLogin,
	stackName: string,
): Promise<ApiControlResponse> {
	return await axios
		.get<{
			message: string;
			log: {
				pull: ComposeLog & { exitCode: number };
				up: ComposeLog & { exitCode: number };
			};
		}>(url(server.url, `stacks/${stackName}/update`), authHeader(server))
		.then((res) => ({
			success: res.status === 200,
			message: res.data.message,
			log: res.data.log.up,
		}))
		.catch((err) => {
			console.error(err);
			const data = err.response.data;
			if (err.response.status === 500)
				return {
					success: false,
					message: data.message,
					log: data.log.pull.exitCode === 0 ? data.log.up : data.log.pull,
				};

			return {
				success: false,
				message: "Something went wrong...",
				log: { out: "", err: "" },
			};
		});
}

// Create
// ---

export async function createStack(
	server: ServerLogin,
	stack: Stack,
): Promise<Stack | string> {
	return await axios
		.post(url(server.url, `stacks/${stack.type}`), stack, authHeader(server))
		.then((response) => {
			if (response.status === 201) return response.data;
			if (response.status === 400)
				return response.data.message ?? "Something went wrong...";
			return "Something went wrong...";
		})
		.catch((res) => {
			if (res.response.status === 400)
				return res.response.data.message ?? "Something went wrong...";
			// TODO: Handle error
			return undefined;
		});
}
