import Header from "@/components/header";
import StackSelHome from "@/components/stackSelHome";
import StacksCard from "@/components/stacksCard";

export default async function Page({
	params,
}: {
	params: Promise<{ stack: string }>;
}) {
	return (
		<div className="h-screen">
			<Header />
			<div className="flex h-[89%]">
				{/* Stacks */}
				<div className="w-[25%] h-full m-4">
					<StacksCard />
				</div>
				<div className="w-[75%] h-full m-4">
					<StackSelHome stackName={(await params).stack} />
				</div>
			</div>
		</div>
	);
}
