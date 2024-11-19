import NoStackHome from "@/components/noStackHome";
import ServerSelector from "@/components/serverSelector";
import StackSelHome from "@/components/stackSelHome";
import StacksCard from "@/components/stacksCard";

export default function Home() {
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
					<StackSelHome />
				</div>
			</div>
		</div>
	);
}
