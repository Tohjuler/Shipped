"use client";

import type { Stack } from "@/lib/apiUtils";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";

export interface GitStackSettingsRef {
	getStack: () => Stack;
}

interface GitStackSettingsProps {
	disabled?: boolean;
}

const GitStackSettings = forwardRef<GitStackSettingsRef, GitStackSettingsProps>(
	({ disabled }, ref) => {
		const name = useRef<HTMLInputElement>(null);
		const repo = useRef<HTMLInputElement>(null);
		const branch = useRef<HTMLInputElement>(null);
		const cloneDepth = useRef<HTMLInputElement>(null);
		const composePath = useRef<HTMLInputElement>(null);
		const fetchInterval = useRef<HTMLInputElement>(null);
		const [revertFailed, setRevertFailed] = useState(false);
		const notiUrl = useRef<HTMLInputElement>(null);
		const [notiProvider, setNotiProvider] = useState<string>("webhook");

		useImperativeHandle(ref, () => ({
			getStack: () => ({
				name: name.current?.value || "",
				type: "git",
				url: repo.current?.value || "",
				branch: branch.current?.value || "",
				cloneDepth: Number.parseInt(cloneDepth.current?.value || "1"),
				composePath: composePath.current?.value || "",
				fetchInterval: fetchInterval.current?.value || "",
				revertOnFailure: revertFailed,
				notificationUrl: notiUrl.current?.value || "",
				notificationProvider: notiProvider,
			}),
		}));

		return (
			<>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="name">Name</Label>
					<Input
						ref={name}
						disabled={disabled}
						type="text"
						id="name"
						placeholder="Name"
					/>
				</div>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="repo">Repository</Label>
					<Input
						ref={repo}
						disabled={disabled}
						type="text"
						id="repo"
						placeholder="https://github.com/Tohjuler/Shipped.git"
					/>
				</div>
				<div className="flex space-x-2 w-full">
					<div className="grid w-[34.5%] max-w-sm items-center gap-1.5">
						<Label htmlFor="branch">Branch</Label>
						<Input
							ref={branch}
							disabled={disabled}
							type="text"
							id="branch"
							placeholder="main"
						/>
					</div>
					<div className="grid w-[20%] items-center gap-1.5">
						<Label htmlFor="depth">Clone Depth</Label>
						<Input
							ref={cloneDepth}
							disabled={disabled}
							type="number"
							id="depth"
							placeholder="1"
						/>
					</div>
				</div>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="file">Compose File</Label>
					<Input
						ref={composePath}
						disabled={disabled}
						type="text"
						id="file"
						placeholder="./docker-compose.yml"
					/>
				</div>

				<div className="flex">
					<div className="grid max-w-sm items-center gap-1.5 w-[30%]">
						<Label htmlFor="fetchInterval">Fetch Interval</Label>
						<Input
							ref={fetchInterval}
							disabled={disabled}
							type="text"
							id="fetchInterval"
							placeholder="15m"
						/>
					</div>

					<div className="flex items-center space-x-2 ml-5 mt-5">
						<Switch
							checked={revertFailed}
							disabled={disabled}
							onCheckedChange={setRevertFailed}
							id="revertFailed"
						/>
						<Label htmlFor="revertFailed">Revert on fail</Label>
					</div>
				</div>

				<h1 className="font-semibold leading-none tracking-tight !mt-10">
					Notifications
				</h1>
				<hr />

				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="notiUrl">Notification Url</Label>
					<Input ref={notiUrl} disabled={disabled} type="text" id="notiUrl" />
				</div>

				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="notiProvider">Notification Provider</Label>
					<Select
						value={notiProvider}
						disabled={disabled}
						onValueChange={setNotiProvider}
					>
						<SelectTrigger className="w-[180px]" id="notiProvider">
							<SelectValue placeholder="Webhook" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="discordWebhook">Discord Webhook</SelectItem>
							<SelectItem value="ntfy">NTFY</SelectItem>
							<SelectItem value="webhook">Webhook</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</>
		);
	},
);
GitStackSettings.displayName = "GitStackSettings";

export default GitStackSettings;
