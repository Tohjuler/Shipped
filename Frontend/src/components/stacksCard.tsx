"use client";
import StatusIndicator from "./statusIndicator";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function StacksCard() {
	

	return (
		<Card className="h-full">
			<CardHeader className="flex-row space-y-0 p-3">
				<CardTitle className="my-auto">Stacks</CardTitle>
				<Button className="bg-green-600 hover:bg-green-700 w-[20%] ml-auto">
					New Stack
				</Button>
			</CardHeader>
			<hr className="mb-2 mx-2" />
			<CardContent className="p-2">
				{/* Placeholder */}
				<Stack />
			</CardContent>
		</Card>
	);
}

function Stack() {
	return (
		<Card className="flex p-2 w-full cursor-pointer hover:scale-[1.02] duration-300">
			<StatusIndicator status="active" />
			<div className="w-[95%]">
				<h1>STACK</h1>
				<hr />
				<p className="text-gray-400 text-sm">URL</p>
				<p className="text-gray-400 text-sm">BRANCH - COMMIT</p>
			</div>
		</Card>
	);
}
