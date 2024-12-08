"use client";

import { useToast } from "@/hooks/use-toast";
import * as Api from "@/lib/apiUtils";
import {
	type ServerLogin,
	useServerManager,
} from "@/lib/serverManagerProvider";
import { useEffect, useState } from "react";
import GitStackSettings from "./gitStackSettings";
import StackSettings from "./stackSettings";
import StatusIndicator, { type Status } from "./statusIndicator";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { ToastAction } from "./ui/toast";
import { Loader2 } from "lucide-react";

type Action = "update" | "start" | "stop" | "restart" | "delete";

export default function StackSelHome({ stackName }: { stackName: string }) {
	const { toast } = useToast();
	const serverManager = useServerManager();
	const [stack, setStack] = useState<Api.ExtededStack | undefined>(undefined);
	const [notFound, setNotFound] = useState(false);

	// Used to track what is currently happening, undefined means nothing is happening
	const [currentAction, setCurrentAction] = useState<Action | undefined>(
		undefined,
	);

	// TODO: Implement actions

	// Load stack
	useEffect(() => {
		if (!serverManager?.selectedServer || !serverManager.selectedServer.url)
			return;

		Api.getStack(serverManager?.selectedServer, stackName).then((res) => {
			if (!res || res?.status !== 200) {
				setNotFound(true);

				toast({
					title: "Error",
					description: `Failed to fetch stack ${stackName}`,
					variant: "destructive",
				});
				if (!res)
					console.error(
						`Failed to fetch stack, no result. stack: ${stackName}`,
					);
				else
					console.error(
						`Failed to fetch stack. status: ${res.status} stack: ${stackName}`,
					);
				return;
			}

			setNotFound(false);
			setStack(res.stack);
		});
	}, [serverManager?.selectedServer, stackName, toast]);

	// Local variables
	// ---

	const activeContainers = stack?.containers.filter(
		(container) => container.state === "running",
	).length;

	const handleAction = (action: Action) => {
		if (!serverManager?.selectedServer || !stack) return;
		if (currentAction)
			return toast({
				title: "Error",
				description: "Another action is already in progress",
				variant: "destructive",
			});

		const messages = {
			start: "Starting stack...",
			stop: "Stopping stack...",
			restart: "Restarting stack...",
			update: "Updating stack...",
			delete: "Deleting stack...",
		} as const

		toast({
			title: messages[action],
			variant: "default",
		});

		setCurrentAction(action);
		runAction(action, serverManager.selectedServer, stack).then(async (res) => {
			// Fetch new status
			const status = await Api.getStatus(
				serverManager.selectedServer,
				stack.name,
			).catch(() => {
				toast({
					title: "Error",
					description: "Failed to fetch status",
					variant: "destructive",
				});
				return undefined;
			});
			setStack({
				...stack,
				status: status?.status ?? "NONE",
				containers: status?.containers ?? [],
			});

			if (res.success) {
				toast({
					title: res.success ? "Success" : "Error",
					description: res.message,
					variant: res.success ? "success" : "destructive",
				});
			}

			// Failed

			toast({
				title: "Error",
				description: res.message,
				variant: "destructive",
				action: <ToastAction altText="Logs">Logs</ToastAction>, // TODO: Implement view logs
			});
			setCurrentAction(undefined);
		});
	};

	// ---

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
				<StatusIndicator status={stack.status} className="w-[2%]" />
				<div className="w-[55%]">
					<h1>{stack?.name ?? "Loading..."}</h1>
					{stack.url && (
						<>
							<hr className="" />
							<a
								className="text-gray-400 text-sm min-w-[70%]"
								href={stack.url}
								target="_blank"
								rel="noreferrer"
							>
								{stack.url}
							</a>
							<p className="text-gray-400 text-sm">
								{stack.branch ?? "master"} -{" "}
								{stack.currentCommit?.substring(0, 7) ?? "Unknown"}
							</p>
						</>
					)}
				</div>
				{/* Loader for actions */}
				{currentAction && <Loader2 className="animate-spin my-auto ml-auto" />}
				<div className={`min-w-[157px] w-[35%] my-auto ${currentAction ? "ml-2" : "ml-auto"}`}>
					<Button
						variant="secondary"
						className="min-w-[70px] w-[23%] ml-2"
						onClick={() => handleAction("update")}
						disabled={currentAction === "update"}
					>
						Update
					</Button>
					<Button
						variant="secondary"
						className="min-w-[70px] w-[23%] ml-2"
						onClick={() => handleAction("restart")}
						disabled={currentAction === "restart"}
					>
						Restart
					</Button>
					<Button
						variant="active"
						className="min-w-[70px] w-[23%] ml-2 mt-1"
						onClick={() => {
							if (stack.status === "ACTIVE") handleAction("stop");
							else handleAction("start");
						}}
						disabled={currentAction === "start" || currentAction === "stop"}
					>
						Start/Stop
					</Button>
					<Button
						variant="destructive"
						className="min-w-[70px] w-[23%] ml-2 mt-1"
						onClick={() => handleAction("delete")}
						disabled={currentAction === "delete"}
					>
						Delete
					</Button>
				</div>
			</Card>

			<div className="md:flex mt-5">
				<Card className="md:w-[38%] p-2 h-fit">
					<CardHeader className="flex-row space-y-0 p-3">
						<CardTitle className="my-auto">Containers</CardTitle>
						<p className="text-gray-400 text-sm ml-auto my-auto">
							{activeContainers}/{stack.containers.length}
						</p>
					</CardHeader>
					<hr className="mb-2 mx-2" />
					<CardContent className="p-2 overflow-scroll">
						{stack.containers.map((container) => (
							<Container key={container.name} container={container} />
						))}
					</CardContent>
				</Card>

				<Card className="md:w-[58%] p-2 md:ml-auto h-fit mt-2 lg:mt-0">
					<CardHeader className="flex-row space-y-0 p-3">
						<CardTitle className="my-auto">Settings</CardTitle>
						<Button variant="secondary" className="w-fit ml-auto">
							Edit
						</Button>
					</CardHeader>
					<hr className="mb-2 mx-2" />
					<CardContent className="p-2 space-y-2 w-full">
						{stack.type === "git" ? (
							<GitStackSettings stack={stack} disabled={true} />
						) : (
							<StackSettings stack={stack} disabled={true} />
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Container({ container }: { container: Api.Container }) {
	// TODO: Show ports
	const image = container.image.replace("docker.io/library/", "");
	const status: Status = stateToStatus(container.state);

	return (
		<Card className="flex p-2 w-full">
			<StatusIndicator status={status} />
			<div className="w-[95%]">
				<h1>{container.name}</h1>
				<hr className="w-[90%]" />
				<p className="text-gray-400 text-sm">{image}</p>
			</div>
			<Button variant="secondary" className="w-[20%] ml-auto my-auto">
				Logs
			</Button>
		</Card>
	);
}

function stateToStatus(state: Api.Container["state"]): Status {
	switch (state) {
		case "running":
		case "paused":
		case "restarting":
		case "removing":
			return "ACTIVE";
		case "dead":
		case "created":
		case "exited":
			return "INACTIVE";
		default:
			return "NONE";
	}
}

async function runAction(
	action: Action,
	server: ServerLogin,
	stack: Api.ExtededStack,
): Promise<{
	success: boolean;
	message: string;
	log: {
		out: string;
		err: string;
	};
}> {
	switch (action) {
		case "start":
		case "stop":
		case "restart":
			return await Api.defaultControlCall(server, stack.name, action);
		case "update":
			return await Api.updateStack(server, stack.name);

		case "delete":
			return {
				success: false,
				message: "Not implemented",
				log: { out: "", err: "" },
			};

		default:
			return {
				success: false,
				message: "Unknown action",
				log: { out: "", err: "" },
			};
	}
}
