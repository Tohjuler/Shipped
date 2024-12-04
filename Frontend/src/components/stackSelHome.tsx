"use client";

import { useServerManager } from "@/lib/serverManagerProvider";
import StackSettings from "./stackSettings";
import StatusIndicator from "./statusIndicator";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import { type ExtededStack, type Container as ContainerInfo, getStack } from "@/lib/apiUtils";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function StackSelHome({ stackName }: { stackName: string }) {
	const { toast } = useToast();
	const serverManager = useServerManager();
	const [stack, setStack] = useState<ExtededStack | undefined>(undefined);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		getStack(serverManager?.selectedServer, stackName).then((res) => {
			if (!res || res?.status !== 200) {
				setNotFound(true);

				toast({
					title: "Error",
					description: `Failed to fetch stack ${stackName}`,
					variant: "destructive",
				});
				return;
			}

			setNotFound(false);
			setStack(res.stack);
		});
	}, [serverManager?.selectedServer, stackName, toast]);

	// TODO: Better not found message
	if (notFound)
		return (
			<h1 className="text-center text-2xl font-semibold leading-none tracking-tight mt-5">
				Stack not found
			</h1>
		);

	if (!stack)
		// TODO: Rework loader a some point
		return (
			<div className="h-full">
				<Skeleton className="w-full h-[10%]" />
			</div>
		);

	return (
		<div className="h-full">
			<Card className="w-full flex p-2">
				<StatusIndicator status="active" className="w-[2%]" />
				<div className="w-[55%]">
					<h1>{stack?.name ?? "Loading..."}</h1>
					{stack.url && (
						<>
							<hr className="" />
							<p className="text-gray-400 text-sm min-w-[70%]">{stack.url}</p>
							<p className="text-gray-400 text-sm">{stack.branch ?? "master"} - {stack.currentCommit ?? "Unknown"}</p>
						</>
					)}
				</div>
				<div className="min-w-[157px] w-[35%] ml-auto my-auto">
					<Button variant="secondary" className="min-w-[70px] w-[23%] ml-2">
						Update
					</Button>
					<Button variant="secondary" className="min-w-[70px] w-[23%] ml-2">
						Restart
					</Button>
					<Button variant="active" className="min-w-[70px] w-[23%] ml-2 mt-1">
						Start/Stop
					</Button>
					<Button
						variant="destructive"
						className="min-w-[70px] w-[23%] ml-2 mt-1"
					>
						Delete
					</Button>
				</div>
			</Card>

			<div className="md:flex mt-5">
				<Card className="md:w-[38%] p-2 h-fit">
					<CardHeader className="flex-row space-y-0 p-3">
						<CardTitle className="my-auto">Containers</CardTitle>
						<p className="text-gray-400 text-sm ml-auto my-auto">0/1</p>
					</CardHeader>
					<hr className="mb-2 mx-2" />
					<CardContent className="p-2 overflow-scroll">
						{
							stack.containers.map((container) => (
								<Container key={container.name} container={container} />
							))
						}
					</CardContent>
				</Card>

				<Card className="md:w-[58%] p-2 md:ml-auto h-fit mt-2 lg:mt-0">
					<CardHeader className="flex-row space-y-0 p-3">
						<CardTitle className="my-auto">Settings</CardTitle>
					</CardHeader>
					<hr className="mb-2 mx-2" />
					<CardContent className="p-2 space-y-2 w-full">
						{/* TODO: Implement */}
						{/* <GitStackSettings /> */}
						<StackSettings />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Container({ container }: { container: ContainerInfo }) {
	// TODO: Show ports
	return (
		<Card className="flex p-2 w-full">
			<StatusIndicator status="inactive" />
			<div className="w-[95%]">
				<h1>{container.name}</h1>
				<hr className="w-[90%]" />
				<p className="text-gray-400 text-sm">{container.image}</p>
			</div>
			<Button variant="active" className="w-[20%] ml-auto my-auto">
				Logs
			</Button>
		</Card>
	);
}
