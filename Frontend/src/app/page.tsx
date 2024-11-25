"use client";

import NoStackHome from "@/components/noStackHome";
import ServerSelector from "@/components/serverSelector";
import StackSelHome from "@/components/stackSelHome";
import StacksCard from "@/components/stacksCard";
import type React from "react";
import { useEffect, useState } from "react";

export default function Home() {
	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window !== "undefined") setUrl(window.location.href);
	}, []);

	const endpoint = url?.split("/").slice(3).join("/").split("?")[0];

	console.log(endpoint);
	let page: React.ReactElement;
	if (endpoint === "new-stack/git") {
		page = <StackSelHome />;
	} else if (endpoint === "new-stack/file") {
		page = <StackSelHome />;
	} else if (endpoint?.startsWith("stack/")) {
		page = <StackSelHome />;
	} else {
		page = <NoStackHome />;
	}

	return (
		<div className="h-screen">
			<header className="w-full flex bg-card border-b-[1px] border-border">
				<h1 className="text-2xl font-bold m-5">Shipped</h1>

				{/* Sever selector */}
				<ServerSelector />
			</header>
			<div className="flex h-[89%]">
				{/* Stacks */}
				<div className="w-[25%] h-full m-4">
					<StacksCard />
				</div>
				<div className="w-[75%] h-full m-4">
					{/* <NoStackHome /> */}
					{page}
				</div>
			</div>
		</div>
	);
}
