"use client";
import { useEffect, useState } from "react";
import StatusIndicator from "./statusIndicator";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getStacks, type StackInfo } from "@/lib/apiUtils";
import { useServerManager } from "@/lib/tokenProvider";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StacksCard() {
	const serverManager = useServerManager();
	const [fetched, setFetched] = useState(false);
	const [stacks, setStacks] = useState<StackInfo[]>([]);

	useEffect(() => {
		setFetched(false);
		getStacks(serverManager?.selectedServer?.url).then((stacks) => {
			setStacks(stacks);
			setFetched(true);
		});
	}, [serverManager?.selectedServer]);

	return (
		<Card className="h-full">
			<CardHeader className="flex-row space-y-0 p-3">
				<CardTitle className="my-auto">Stacks</CardTitle>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="bg-green-600 hover:bg-green-700 w-[20%] ml-auto">
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
				{fetched && stacks.length === 0 && (
					<p className="text-center text-gray-400">No stacks found</p>
				)}
				{stacks.map((stack) => (
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
					{branch && commit && `${branch} - ${commit}`}
				</p>
			</div>
		</Card>
	);
}
