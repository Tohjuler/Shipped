import type { repository } from "@/db/schema";
import type { RepositoryStatus } from "@/routes/v1/mainRoute";
import * as compose from "docker-compose";

const baseDir = process.env.STACKS_DIR ?? "/stacks";

function handleOptions(repo: repository): compose.IDockerComposeOptions {
	return repo.composeFile ? { composeOptions: [["-f", repo.composeFile]] } : {};
}

function pull(repo: repository): Promise<compose.IDockerComposeResult> {
	return compose.pullAll({
		...handleOptions(repo),
		cwd: `${baseDir}/${repo.name}`,
		log: true,
	});
}

function up(repo: repository): Promise<compose.IDockerComposeResult> {
	return compose.upAll({
		...handleOptions(repo),
		cwd: `${baseDir}/${repo.name}`,
		log: true,
	});
}

function down(repo: repository): Promise<compose.IDockerComposeResult> {
	return compose.down({
		...handleOptions(repo),
		cwd: `${baseDir}/${repo.name}`,
		log: true,
	});
}

function restart(repo: repository): Promise<compose.IDockerComposeResult> {
	return compose.restartAll({
		...handleOptions(repo),
		cwd: `${baseDir}/${repo.name}`,
		log: true,
	});
}

async function getStatus(repo: repository): Promise<{
	status: RepositoryStatus;
	containers: compose.DockerComposePsResultService[];
}> {
	const result = await compose.ps({
		cwd: `${baseDir}/${repo.name}`,
		commandOptions: [
			["--format", "json"],
			...(repo.composeFile ? [["-f", repo.composeFile]] : []),
		],
	});
	const onlineServices = result.data.services.filter(
		(service) => service.state === "Up",
	).length;

	return {
		status:
			onlineServices === result.data.services.length && onlineServices > 0
				? "ACTIVE"
				: "INACTIVE",
		containers: result.data.services,
	};
}

async function getLogs(
	repo: repository,
	container: string,
	lines = 100,
): Promise<string> {
	const result = await compose.logs(container, {
		cwd: `${baseDir}/${repo.name}`,
		commandOptions: [
			// ["--no-color"],
			["--tail", lines.toString()],
			["--timestamps"],
			...(repo.composeFile ? [["-f", repo.composeFile]] : []),
		],
	});
	if (result.exitCode !== 0) throw new Error(result.err);
	return result.out;
}

export { pull, up, down, restart, getStatus, getLogs };
