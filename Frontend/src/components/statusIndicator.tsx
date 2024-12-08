import { cn } from "@/lib/utils";

export type Status = "ACTIVE" | "INACTIVE" | "DOWNED" | "NONE";

export default function StatusIndicator({
	status,
	className,
	...props
}: {
	status: Status;
} & React.HTMLAttributes<HTMLDivElement>) {
	switch (status) {
		case "ACTIVE":
			return (
				<div
					className={cn("bg-green-500 w-[5%] mr-2 rounded", className)}
					{...props}
				/>
			);
		case "INACTIVE":
			return (
				<div
					className={cn("bg-red-500 w-[5%] mr-2 rounded", className)}
					{...props}
				/>
			);
		case "DOWNED":
			return (
				<div
					className={cn("bg-gray-500 w-[5%] mr-2 rounded", className)}
					{...props}
				/>
			);
		case "NONE":
			return (
				<div className={cn("w-[5%] mr-2 rounded", className)} {...props} />
			);
		default:
			return null;
	}
}
