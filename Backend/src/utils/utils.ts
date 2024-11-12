import type { repository } from "@/db/schema";
import * as compose from "@/utils/dockerUtils";
import * as git from "@/utils/gitUtils";
import logger from "./logger";
import { sendNotification } from "./notifications";

export async function safeAwait<T, E = Error>(
	promise: Promise<T>,
): Promise<[T | null, E | null]> {
	try {
		const res = await promise;
		return [res, null];
	} catch (error) {
		return [null, error as E];
	}
}

export function randomString(length: number): string {
	const chars =
		"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let result = "";
	for (let i = length; i > 0; --i)
		result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

export function stringTimeToMinuttes(time: string): number {
	if (!time) return 15; // Default to 15 minutes
	const match = time.match(/(\d+)(\w+)/);
	if (!match) return 15; // Default to 15 minutes
	const [_, value, unit] = match;
	switch (unit) {
		case "s":
			return Number.parseInt(value) / 60;
		case "m":
			return Number.parseInt(value);
		case "h":
			return Number.parseInt(value) * 60;
		case "d":
			return Number.parseInt(value) * 60 * 24;
		default:
			return 15;
	}
}

export async function handleUpdateCheck(repo: repository): Promise<{
	updated: boolean;
	from: string | null;
	to: string | null;
} | null> {
	const gitRepo = await git.getRepo(repo);

	const status = await gitRepo.status();
	logger.debug(`Status for ${repo.name} (${repo.url}):`, status);

	if (status.behind === 0)
		return {
			updated: false,
			from: null,
			to: null,
		};
	const currentCommit = (await gitRepo.log(["-1"])).latest?.hash;
	const newCommit = (await gitRepo.log(["origin/master", "-1"])).latest?.hash;

	const failed = (error: Error, dockerChanged: boolean) => {
		updateFailed(repo, currentCommit ?? "HEAD", error, dockerChanged);
		throw new Error(
			`Failed check for ${repo.name} (${repo.url})${dockerChanged ? " in docker step" : ""}: ${error.message}`,
		);
	};

	const [_, fetchError] = await safeAwait(gitRepo.fetch(["--all"]));
	if (fetchError) return failed(fetchError, false);

	const [__, pullError] = await safeAwait(
		gitRepo.reset(["--hard", "origin/master"]),
	);
	if (pullError) return failed(pullError, false);

	const [___, imagePullError] = await safeAwait(compose.pull(repo));
	if (imagePullError) return failed(imagePullError, false);

	const [____, upError] = await safeAwait(compose.up(repo));
	if (upError) {
		await compose
			.down(repo)
			.catch((error) => console.error("Failed to down", error));
		return failed(upError, true);
	}

	logger.info(
		`Updated ${repo.name} (${repo.url}) from ${currentCommit} to ${newCommit}`,
	);
	return {
		updated: true,
		from: currentCommit ?? "NOT_FOUND",
		to: newCommit ?? "NOT_FOUND",
	};
}

async function updateFailed(
	repo: repository,
	revertToCommit: string,
	error: Error,
	dockerChanged: boolean,
) {
	sendNotification(
		repo,
		"Failed to update",
		`Failed to update the repository ${repo.name} (${repo.url})\nError: ${error.message}${repo.revertOnFailure ? "\nReverting changes" : ""}`,
	);

	if (!repo.revertOnFailure) return;
	logger.debug(`Reverting changes for ${repo.name} (${repo.url})`);

	let failed = false;
	const errors: Error[] = [];

	// Revert changes to git
	const gitRepo = await git.getRepo(repo).catch((error) => {
		failed = true;
		errors.push(error);
		return null;
	});

	if (gitRepo)
		await gitRepo.reset(["--hard", revertToCommit]).catch((error) => {
			console.error("Failed to revert changes", error);
			failed = true;
			errors.push(error);
		});

	logger.debug(`Reverted changes for ${repo.name} (${repo.url}) in git`);

	if (dockerChanged) {
		// Revert changes to docker
		await compose.down(repo).catch((error) => {
			console.error("Failed to revert changes", error);
			failed = true;
			errors.push(error);
		});

		await compose.up(repo).catch((error) => {
			console.error("Failed to revert changes", error);
			failed = true;
			errors.push(error);
		});
	}

	if (failed) {
		logger.error(
			`Failed to revert changes for ${repo.name} (${repo.url})`,
			errors,
		);

		sendNotification(
			repo,
			"Failed to revert changes",
			`Failed to revert changes for ${repo.name} (${repo.url})\nErrors: ${errors
				.map((e) => e.message)
				.join("\n")}`,
		);
	} else
		logger.debug(`Reverted changes for ${repo.name} (${repo.url}) in docker`);
}
