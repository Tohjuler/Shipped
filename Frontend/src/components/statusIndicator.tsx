import { cn } from "@/lib/utils";

export default function StatusIndicator({
	status,
	className,
	...props
}: {
	status: "active" | "inactive" | "downed";
} & React.HTMLAttributes<HTMLDivElement>) {
	switch (status) {
		case "active":
			return (
				<div
					className={cn("bg-green-500 w-[5%] mr-2 rounded", className)}
					{...props}
				/>
			);
		case "inactive":
			return (
				<div
					className={cn("bg-red-500 w-[5%] mr-2 rounded", className)}
					{...props}
				/>
			);
		case "downed":
			return (
				<div
					className={cn("bg-gray-500 w-[5%] mr-2 rounded", className)}
					{...props}
				/>
			);
		default:
			return null;
	}
}
