"use client";

import { useToast } from "@/hooks/use-toast";
import { createStack } from "@/lib/apiUtils";
import { useServerManager } from "@/lib/serverManagerProvider";
import { useRef } from "react";
import GitStackSettings, { type GitStackSettingsRef } from "./gitStackSettings";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function NewGitStack() {
	const serverManager = useServerManager();
	const { toast } = useToast();
	const inputsRef = useRef<GitStackSettingsRef>(null);

	const handleCreate = () => {
		const valid = inputsRef.current?.isValid();
		if (valid) {
			toast({
				title: valid.split("|")[0] ?? undefined,
				description:
					valid.split("|").slice(1).join("|") ?? "Something went wrong...",
				variant: "destructive",
			});
			return;
		}
		const stack = inputsRef.current?.getStack();
		if (!stack) {
			toast({
				title: "Error",
				description: "Someting went wrong... Please try again.",
				variant: "destructive",
			});
			return;
		}

		if (!serverManager?.selectedServer) {
			toast({
				description: "No server selected.",
				variant: "destructive",
			});
			return;
		}

		createStack(serverManager?.selectedServer, stack)
			.then((res) => {
				if (typeof res === "string") {
					toast({
						description: res,
						variant: "destructive",
					});
					return;
				}

				toast({
					title: "Success",
					description: "Stack created successfully.",
					variant: "success",
				});
				window.location.href = `/stack/${res.name}`;
			})
			.catch((err) => {
				toast({
					title: "Error",
					description: err.message,
					variant: "destructive",
				});
			});
	};

	return (
		<div className="h-full">
			<Card className="md:w-[58%] p-2 mx-auto h-fit my-2 lg:mt-0">
				<CardHeader className="flex-row space-y-0 p-3">
					<CardTitle className="my-auto">New Stack from Git</CardTitle>
				</CardHeader>
				<hr className="mb-2 mx-2" />
				<CardContent className="p-2 space-y-2 w-full">
					<GitStackSettings ref={inputsRef} />
					<hr className="!mt-5" />
					{/* TODO: Loader */}
					<Button variant="active" onClick={handleCreate}>
						Create
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
