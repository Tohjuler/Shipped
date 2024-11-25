"use client";

import { highlight, languages } from "prismjs";
import { useState } from "react";
import Editor from "react-simple-code-editor";
import { EditorContainer } from "./stackSettings";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export default function NewFileStack() {
	const [code, setCode] = useState(
		"services:\n  nginx:\n    image: nginx:latest\n    restart: unless-stopped\n    ports:\n      - 8080:80",
	);
	const [env, setEnv] = useState("# VARIABLE=value #comment");

	return (
		<div className="h-full flex">
			<Card className="md:w-[30%] p-2 mx-auto h-fit mt-2 lg:mt-0">
				<CardHeader className="flex-row space-y-0 p-3">
					<CardTitle className="my-auto">New Stack from File</CardTitle>
				</CardHeader>
				<hr className="mb-2 mx-2" />
				<CardContent className="p-2 space-y-2 w-full">
					<div className="grid w-full max-w-sm items-center gap-1.5">
						<Label htmlFor="name">Name</Label>
						<Input type="text" id="name" placeholder="Name" />
					</div>

					<h1 className="font-semibold leading-none tracking-tight !mt-7">
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

					<hr className="!mt-5" />
					<Button variant="active">Create</Button>
				</CardContent>
			</Card>

			<Card className="md:w-[65%] p-2 mx-auto h-fit mt-2 lg:mt-0">
				<CardHeader className="flex-row space-y-0 p-3">
					<CardTitle className="my-auto">Files</CardTitle>
				</CardHeader>
				<hr className="mb-2 mx-2" />
				<CardContent className="p-2 space-y-2 w-full">
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
				</CardContent>
			</Card>
		</div>
	);
}
