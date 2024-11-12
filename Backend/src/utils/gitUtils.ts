import { rmdirSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import type { repository } from "@/db/schema";
import { type SimpleGit, type SimpleGitOptions, simpleGit } from "simple-git";

const baseDir = process.env.REPOSITORIES_DIR ?? "./repositories";

const options: Partial<SimpleGitOptions> = {
	// baseDir: baseDir,
	binary: "git",
	maxConcurrentProcesses: 6,
	trimmed: false,
};

async function getRepo(repo: repository): Promise<SimpleGit> {
	if (await dirExits(`${baseDir}/${repo.name}`))
		return simpleGit(`${baseDir}/${repo.name}`, options);

	await clone(repo);
	return getRepo(repo);
}

async function clone(repo: repository) {
	await mkdir(`${baseDir}/${repo.name}`, { recursive: true });
	const git = simpleGit(`${baseDir}`, options);
	await git.clone(repo.url, `${repo.name}`, {
		...(repo.cloneDepth === -1
			? {}
			: {
					"--depth":
						repo.cloneDepth === 0
							? process.env.DEFAULT_CLONE_DEPTH
							: repo.cloneDepth,
				}),
		...(repo.branch && {
			"--branch": repo.branch,
		}),
	});
}

async function deleteRepo(repoName: string) {
	rmdirSync(`${baseDir}/${repoName}`);
}

async function dirExits(path: string): Promise<boolean> {
	try {
		await readdir(path);
		return true;
	} catch (err) {
		return false;
	}
}

export { getRepo, clone, deleteRepo };
