import Header from "@/components/header";
import NewGitStack from "@/components/newGitStack";
import StacksCard from "@/components/stacksCard";
import type React from "react";

export default function Home() {
	return (
		<div className="h-screen">
			<Header />
			<div className="flex h-[89%]">
				{/* Stacks */}
				<div className="w-[25%] h-full m-4">
					<StacksCard />
				</div>
				<div className="w-[75%] h-full m-4">
					<NewGitStack />
				</div>
			</div>
		</div>
	);
}
