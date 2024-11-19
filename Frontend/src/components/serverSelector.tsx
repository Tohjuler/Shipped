"use client";
import { CiServer } from "react-icons/ci";
import { Button } from "./ui/button";

export default function ServerSelector() {
	return (
		<div className="bg-secondary ml-auto m-2 p-2 rounded-lg flex items-center my-auto gap-3">
			<div>
				<h2 className="text-white">Connected to:</h2>
				<p className="text-gray-400 text-sm">http://49.13.26.118:5055</p>
			</div>
			<Button variant="outline" size="icon">
				<CiServer size={27} />
			</Button>
		</div>
	);
}
