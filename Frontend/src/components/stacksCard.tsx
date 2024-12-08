"use client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type StackInfo, getStacks } from "@/lib/apiUtils";
import { useServerManager } from "@/lib/serverManagerProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import StatusIndicator from "./statusIndicator";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function StacksCard() {
	const serverManager = useServerManager();
	const [fetched, setFetched] = useState(false);
	const [stacks, setStacks] = useState<StackInfo[] | undefined>(undefined);

	// biome-ignore lint/correctness/useExhaustiveDependencies: If serverManager is added as a dependency, the useEffect will run infinitely
	useEffect(() => {
		if (!serverManager) return;

		if (!stacks && serverManager.cache.stacks) {
			setStacks(serverManager.cache.stacks as StackInfo[]);
			setFetched(true);
			return;
		}

		setFetched(false);
		getStacks(serverManager.selectedServer).then((stacks) => {
			setStacks(stacks);
			setFetched(true);

			if (serverManager) serverManager.cache.stacks = stacks;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [serverManager?.selectedServer]);

	return (
		<Card className="h-full">
			<CardHeader className="flex-row space-y-0 p-3">
				<CardTitle className="my-auto">Stacks</CardTitle>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="bg-green-600 hover:bg-green-700 w-fit ml-auto">
							New Stack
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem asChild>
							<Link href="/new-stack/git">From Git</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href="/new-stack/file">From File</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<hr className="mb-2 mx-2" />
			<CardContent className="p-2">
				{!fetched && <p className="text-center text-gray-400">Loading...</p>}
				{fetched && stacks?.length === 0 && (
					<p className="text-center text-gray-400">No stacks found</p>
				)}
				{stacks?.map((stack) => (
					<Stack key={stack.name} {...stack} />
				))}
			</CardContent>
		</Card>
	);
}

function Stack({ name, url, branch, commit, status }: StackInfo) {
	return (
		<Card
			className="flex p-2 w-full cursor-pointer hover:scale-[1.02] duration-300"
			onClick={() => {
				window.location.href = `/stack/${name}`;
			}}
		>
			<StatusIndicator status={status} />
			<div className="w-[95%]">
				<h1>{name}</h1>
				<hr />
				<p className="text-gray-400 text-sm">{url ?? ""}</p>
				<p className="text-gray-400 text-sm">
					{branch && commit && `${branch} - ${commit.substring(0, 7)}`}
				</p>
			</div>
		</Card>
	);
}
