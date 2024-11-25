import Link from "next/link";
import ServerSelector from "./serverSelector";

export default function Header() {
	return (
		<header className="w-full flex bg-card border-b-[1px] border-border">
			<Link href="/">
				<h1 className="text-2xl font-bold m-5">Shipped</h1>
			</Link>

			{/* Sever selector */}
			<ServerSelector />
		</header>
	);
}
