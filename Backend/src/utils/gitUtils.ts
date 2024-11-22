import { mkdir, readdir, rmdir } from "node:fs/promises";
import type { stack } from "@/db/schema";
import { type SimpleGit, type SimpleGitOptions, simpleGit } from "simple-git";

const baseDir = process.env.STACKS_DIR ?? "/stacks";

const options: Partial<SimpleGitOptions> = {
	binary: "git",
	maxConcurrentProcesses: 6,
	trimmed: false,
};

async function getRepoByName(
	stackName: string,
): Promise<SimpleGit | undefined> {
	if (await dirExits(`${baseDir}/${stackName}`))
		return simpleGit(`${baseDir}/${stackName}`, options);
}

async function getRepo(stack: stack): Promise<SimpleGit> {
	if (await dirExits(`${baseDir}/${stack.name}`))
		return simpleGit(`${baseDir}/${stack.name}`, options);

	await clone(stack);
	return getRepo(stack);
}

async function currentCommit(
	stack: stack | { name: string },
): Promise<string | undefined> {
	const git = await getRepoByName(stack.name);
	if (!git) return;
	const log = await git.log();
	return log.latest?.hash;
}

async function clone(stack: stack) {
	if (!stack.url) throw new Error("No url provided for stack");
	await mkdir(`${baseDir}/${stack.name}`, { recursive: true });
	const git = simpleGit(`${baseDir}`, options);
	await git.clone(stack.url, `${stack.name}`, {
		...(stack.cloneDepth === -1
			? {}
			: {
					"--depth":
						stack.cloneDepth === 0
							? (process.env.DEFAULT_CLONE_DEPTH ?? 1)
							: stack.cloneDepth,
				}),
		...(stack.branch && {
			"--branch": stack.branch,
		}),
	});
}

async function deleteRepo(stackName: string) {
	await rmdir(`${baseDir}/${stackName}`, { recursive: true });
}

async function dirExits(path: string): Promise<boolean> {
	try {
		await readdir(path);
		return true;
	} catch (err) {
		return false;
	}
}

export { getRepo, currentCommit, clone, deleteRepo };
