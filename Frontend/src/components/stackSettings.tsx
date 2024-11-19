"use client";

import { highlight, languages } from "prismjs";
import { useState } from "react";
import Editor from "react-simple-code-editor";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-properties";

export default function StackSettings() {
	const [code, setCode] = useState(
		"services:\n  nginx:\n    image: nginx:latest\n    restart: unless-stopped\n    ports:\n      - 8080:80",
	);
	const [env, setEnv] = useState("# VARIABLE=value #comment");

	return (
		<>
			<div className="grid w-full max-w-sm items-center gap-1.5">
				<Label htmlFor="name">Name</Label>
				<Input type="text" id="name" placeholder="Name" />
			</div>

			<div className="grid w-full gap-1.5">
				<Label htmlFor="compose">Compose</Label>
				<EditorContainer editorName="compose" text={code}>
					<Editor
						id="compose"
						value={code}
						onValueChange={(code) => setCode(code)}
						highlight={(code) => highlight(code, languages.yaml, "yaml")}
						padding={10}
						style={{
							fontFamily: '"Fira code", "Fira Mono", monospace',
							fontSize: 12,
							marginLeft: `${20 + String((code.match(/\n/g) || []).length + 2).length * 8}px`,
							color: "#9ca3af",
						}}
					/>
				</EditorContainer>
			</div>

			<div className="grid w-full gap-1.5">
				<Label htmlFor="env">.env</Label>
				<EditorContainer editorName="env" text={env}>
					<Editor
						id="env"
						value={env}
						onValueChange={(env) => setEnv(env)}
						highlight={(env) =>
							highlight(env, languages.properties, "properties")
						}
						padding={10}
						style={{
							fontFamily: '"Fira code", "Fira Mono", monospace',
							fontSize: 12,
							marginLeft: `${20 + String((env.match(/\n/g) || []).length + 2).length * 8}px`,
							color: "#9ca3af",
						}}
					/>
				</EditorContainer>
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

function EditorContainer({
	editorName,
	text,
	children,
}: { editorName: string; text: string; children: React.ReactNode }) {
	const lines = (text.match(/\n/g) || []).length + 2;
	const pad = String(lines).length;
	const lineNos = [...Array(lines).keys()].slice(1).join("\\00000a");

	const style: { [key: string]: string } = {
		borderRadius: "var(--radius)",
		background: `linear-gradient(90deg, hsl(var(--secondary) / .8) ${20 + pad * 8}px, ${20 + pad * 8}px, hsl(var(--secondary)) 100%)`,
		position: "relative",
	};
	style[`--content-${editorName}`] = `"${lineNos}"`;
	style[`--width-${editorName}`] = `${20 + pad * 8}px`;

	return (
		<div className={`${editorName}-editor`} style={style}>
			{children}
		</div>
	);
}
