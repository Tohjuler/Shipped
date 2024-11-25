"use client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useServerManager } from "@/lib/serverManagerProvider";
import { useRef } from "react";
import { CiServer } from "react-icons/ci";
import { FaTrashAlt } from "react-icons/fa";
import StatusIndicator from "./statusIndicator";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function ServerSelector() {
	const serverManager = useServerManager();
	const { toast } = useToast();

	const url = useRef<HTMLInputElement>(null);
	const key = useRef<HTMLInputElement>(null);

	const noServerManagerToast = () =>
		toast({
			variant: "destructive",
			title: "Server manager not found",
			description: "Please refresh the page.",
		});

	const addServer = () => {
		if (!url.current?.value || !key.current?.value) {
			toast({
				variant: "destructive",
				title: "Missing fields",
			});
			return;
		}
		if (!serverManager) {
			noServerManagerToast();
			return;
		}

		const serverUrl = url.current.value;
		if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
			toast({
				variant: "destructive",
				title: "Invalid URL",
			});
			return;
		}

		serverManager?.addServer({
			url: serverUrl,
			token: key.current.value,
		});
		toast({
			variant: "success",
			title: "Server added",
		});
		url.current.value = "";
		key.current.value = "";
	};

	const selectServer = (url: string) => {
		if (!serverManager) {
			noServerManagerToast();
			return;
		}

		serverManager.selectServer(url);
		toast({
			variant: "success",
			title: "Server selected",
		});
	};

	const deleteServer = (url: string) => {
		if (!serverManager) {
			noServerManagerToast();
			return;
		}

		serverManager.removeServer(url);
		if (serverManager.selectedServer?.url === url) serverManager.selectServer();
		toast({
			variant: "success",
			title: "Server deleted",
		});
	};

	return (
		<div className="bg-secondary ml-auto m-2 p-2 rounded-lg flex items-center my-auto gap-3 sm:min-w-[15%]">
			<div>
				<h2 className="text-white">Connected to:</h2>
				<p className="text-gray-400 text-sm">
					{serverManager?.selectedServer?.url ?? "No selected server."}
				</p>
			</div>
			<Dialog>
				<DialogTrigger asChild>
					<Button variant="outline" size="icon" className="ml-auto">
						<CiServer size={27} />
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Servers</DialogTitle>
					</DialogHeader>
					<hr />
					<div className="max-h-[25vh] overflow-scroll p-2 space-y-2">
						{(serverManager?.getServers().length ?? 0) > 0 ? (
							serverManager?.getServers().map((server) => (
								<Card
									key={server.url}
									className="flex p-2 cursor-pointer hover:scale-[1.02] duration-300"
									onClick={() => selectServer(server.url)}
								>
									<StatusIndicator
										status={
											serverManager.selectedServer?.url === server.url
												? "active"
												: "none"
										}
									/>
									<u className="my-auto text-lg">{server.url}</u>
									<Button
										variant="destructive"
										size="icon"
										className="ml-auto"
										onClick={() => deleteServer(server.url)}
									>
										<FaTrashAlt />
									</Button>
								</Card>
							))
						) : (
							<DialogDescription className="text-center">
								No servers found.
							</DialogDescription>
						)}
					</div>
					<hr />
					<div className="grid w-full max-w-sm items-center gap-1.5">
						<Label htmlFor="url">Url</Label>
						<Input type="text" id="url" ref={url} className="h-8" />
					</div>
					<div className="grid w-full max-w-sm items-center gap-1.5">
						<Label htmlFor="key">Key</Label>
						<Input type="text" id="key" ref={key} className="h-8" />
					</div>
					<Button variant="active" onClick={addServer}>
						Add
					</Button>
				</DialogContent>
			</Dialog>
		</div>
	);
}
