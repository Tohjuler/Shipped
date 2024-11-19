import { Card } from "./ui/card";

export default function NoStackHome() {
	return (
		<div>
			{/* Stats Block */}
			<Card className="h-full flex items-center justify-center gap-x-5 p-2">
				<div className="p-2">
					<h2 className="flex text-lg">
						Active: <p className="text-green-500 ml-2">0</p>
					</h2>
				</div>
				<div className="p-2">
					<h2 className="flex text-lg">
						Inactive: <p className="text-gray-500 ml-2">0</p>
					</h2>
				</div>
				<div className="p-2">
					<h2 className="flex text-lg">
						Downed: <p className="text-red-500 ml-2">0</p>
					</h2>
				</div>
			</Card>
		</div>
	);
}
