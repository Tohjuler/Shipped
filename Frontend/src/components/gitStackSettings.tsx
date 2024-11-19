"use client";

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

export default function GitStackSettings() {
	return (
		<>
			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Label htmlFor="name">Name</Label>
				<Input type="text" id="name" placeholder="Name" />
			</div>
			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Label htmlFor="repo">Repository</Label>
				<Input
					type="text"
					id="repo"
					placeholder="https://github.com/Tohjuler/Shipped.git"
				/>
			</div>
			<div className="flex space-x-2 w-full">
				<div className="grid w-[34.5%] max-w-sm items-center gap-1.5">
					<Label htmlFor="branch">Branch</Label>
					<Input type="text" id="branch" placeholder="main" />
				</div>
				<div className="grid w-[20%] items-center gap-1.5">
					<Label htmlFor="depth">Clone Depth</Label>
					<Input type="number" id="depth" placeholder="1" />
				</div>
			</div>
			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Label htmlFor="file">Compose File</Label>
				<Input type="text" id="file" placeholder="./docker-compose.yml" />
			</div>

			<div className="flex">
				<div className="grid max-w-sm items-center gap-1.5 w-[30%]">
					<Label htmlFor="fetchInterval">Fetch Interval</Label>
					<Input type="text" id="fetchInterval" placeholder="15m" />
				</div>

				<div className="flex items-center space-x-2 ml-5 mt-5">
					<Switch id="revertFailed" />
					<Label htmlFor="revertFailed">Revert on fail</Label>
				</div>
			</div>

			<h1 className="font-semibold leading-none tracking-tight !mt-10">
				Notifications
			</h1>
			<hr />

			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Label htmlFor="notiUrl">Notification Url</Label>
				<Input type="text" id="notiUrl" />
			</div>

			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Label htmlFor="notiProvider">Notification Provider</Label>
				<Select>
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
}
