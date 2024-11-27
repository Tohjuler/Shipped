import axios from "axios";
import type { ServerLogin } from "./serverManagerProvider";
export interface StackInfo {
	name: string;
	url?: string;
	branch?: string;
	commit?: string;
	status: "active" | "inactive" | "downed" | "none";
}

export interface Stack {
	name: string;
	type: "git" | "file";

	// Git
	url?: string;
	cloneDepth: number;
	branch?: string;
	fetchInterval: string;
	revertOnFailure: boolean;
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
