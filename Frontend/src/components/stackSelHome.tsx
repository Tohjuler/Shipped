import GitStackSettings from "./gitStackSettings";
import StackSettings from "./stackSettings";
import StatusIndicator from "./statusIndicator";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function StackSelHome() {
	return (
		<div className="h-full">
			<Card className="w-full flex p-2">
				<StatusIndicator status="active" className="w-[2%]" />
				<div className="w-[55%]">
					<h1>STACK</h1>
					<hr className="" />
					<p className="text-gray-400 text-sm min-w-[70%]">URL</p>
					<p className="text-gray-400 text-sm">BRANCH - COMMIT</p>
				</div>
				<div className="min-w-[157px] w-[35%] ml-auto my-auto">
					<Button variant="secondary" className="min-w-[70px] w-[23%] ml-2">
						Update
					</Button>
					<Button variant="secondary" className="min-w-[70px] w-[23%] ml-2">
						Restart
					</Button>
					<Button variant="active" className="min-w-[70px] w-[23%] ml-2 mt-1">
						Start/Stop
					</Button>
					<Button
						variant="destructive"
						className="min-w-[70px] w-[23%] ml-2 mt-1"
					>
						Delete
					</Button>
				</div>
			</Card>

			<div className="md:flex mt-5">
				<Card className="md:w-[38%] p-2 h-fit">
					<CardHeader className="flex-row space-y-0 p-3">
						<CardTitle className="my-auto">Containers</CardTitle>
						<p className="text-gray-400 text-sm ml-auto my-auto">0/1</p>
					</CardHeader>
					<hr className="mb-2 mx-2" />
					<CardContent className="p-2 overflow-scroll">
						{/* Placeholder */}
						<Container />
					</CardContent>
				</Card>

				<Card className="md:w-[58%] p-2 md:ml-auto h-fit mt-2 lg:mt-0">
					<CardHeader className="flex-row space-y-0 p-3">
						<CardTitle className="my-auto">Settings</CardTitle>
					</CardHeader>
					<hr className="mb-2 mx-2" />
					<CardContent className="p-2 space-y-2 w-full">
						{/* TODO: Implement */}
						{/* <GitStackSettings /> */}
						<StackSettings />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Container() {
	return (
		<Card className="flex p-2 w-full">
			<StatusIndicator status="inactive" />
			<div className="w-[95%]">
				<h1>NAME</h1>
				<hr className="w-[90%]" />
				<p className="text-gray-400 text-sm">IMAGE:TAG</p>
			</div>
			<Button variant="active" className="w-[20%] ml-auto my-auto">
				Logs
			</Button>
		</Card>
	);
}
