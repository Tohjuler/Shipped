import type { stack } from "@/db/schema";
import * as compose from "docker-compose";
import mapPorts from "docker-compose/dist/map-ports";
import logger from "./logger";
import { safeAwait } from "./utils";

const baseDir = process.env.STACKS_DIR ?? "/stacks";

function handleOptions(stack: stack): compose.IDockerComposeOptions {
	return stack.composePath
		? { composeOptions: [["-f", stack.composePath]] }
		: {};
}

function pull(stack: stack): Promise<compose.IDockerComposeResult> {
	logger.debug(
		`Pulling images for stack ${stack.name} at ${baseDir}/${stack.name}/${stack.composePath ?? "docker-compose.yml"}`,
	);
	return compose.pullAll({
		...handleOptions(stack),
		cwd: `${baseDir}/${stack.name}`,
		log: true,
	});
}

function up(stack: stack): Promise<compose.IDockerComposeResult> {
	logger.debug(
		`Starting stack ${stack.name} at ${baseDir}/${stack.name}/${stack.composePath ?? "docker-compose.yml"}`,
	);
	return compose.upAll({
		...handleOptions(stack),
		cwd: `${baseDir}/${stack.name}`,
		log: true,
	});
}

function down(
	stack: stack,
	full = false,
): Promise<compose.IDockerComposeResult> {
	logger.debug(
		`Stopping stack ${stack.name} at ${baseDir}/${stack.name}/${stack.composePath ?? "docker-compose.yml"}${full ? " and removing volumes" : ""}`,
	);

	const flags = full ? [["-v"]] : [];
	if (full && (process.env.REMOVE_IMAGE_ON_DELETE ?? "true") === "true")
		flags.push(["--rmi", "all"]);

	return compose.down({
		...handleOptions(stack),
		cwd: `${baseDir}/${stack.name}`,
		log: true,
		commandOptions: flags,
	});
}

function restart(stack: stack): Promise<compose.IDockerComposeResult> {
	logger.debug(
		`Restarting stack ${stack.name} at ${baseDir}/${stack.name}/${stack.composePath ?? "docker-compose.yml"}`,
	);
	return compose.restartAll({
		...handleOptions(stack),
		cwd: `${baseDir}/${stack.name}`,
		log: true,
	});
}

async function pullAndUp(
	stack: stack,
): Promise<{ message: string; error?: string } | undefined> {
	const [_pullRes, pullError] = await safeAwait(pull(stack));

	if (pullError)
		return {
			message: "Failed to pull docker images",
			error: pullError.message,
		};

	const [_upRes, upError] = await safeAwait(up(stack));
	if (upError)
		return {
			message: "Failed to start docker containers",
			error: upError.message,
		};

	return undefined;
}

async function getStatus(
	stack: stack | { name: string; composePath?: string | null },
): Promise<{
	status: "ACTIVE" | "INACTIVE" | "DOWN";
	containers: (compose.DockerComposePsResultService & { image: string })[];
}> {
	const result = await compose.ps({
		cwd: `${baseDir}/${stack.name}`,
		commandOptions: [["--format", "json"]],
		composeOptions: [
			...(stack.composePath ? [["--file", stack.composePath]] : []),
		],
	});
	const onlineServices = result.data.services.filter(
		(service) => service.state === "running",
	).length;

	const services = result.out
		.split("\n")
		.filter((v: string) => v !== "")
		.map((line) => {
			const json = JSON.parse(line);
			return {
				name: json.Name.trim(),
				image: json.Image.trim(),
				command: json.Command.trim(),
				state: json.State.trim(),
				ports: mapPorts(json.Ports.trim()),
			};
		});

	return {
		status:
			onlineServices === result.data.services.length && onlineServices > 0
				? "ACTIVE"
				: "INACTIVE", // TODO: Rework statuses
		containers: services,
	};
}

async function getLogs(
	stack: stack,
	container: string,
	lines = 100,
): Promise<string> {
	const result = await compose.logs(container, {
		cwd: `${baseDir}/${stack.name}`,
		commandOptions: [
			// ["--no-color"],
			["--tail", lines.toString()],
			["--timestamps"],
			...(stack.composePath ? [["-f", stack.composePath]] : []),
		],
	});
	if (result.exitCode !== 0) throw new Error(result.err);
	return result.out;
}

export { pull, up, down, restart, pullAndUp, getStatus, getLogs };
