import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TokenProvider } from "@/lib/serverManagerProvider";
import { Toaster } from "@/components/ui/toaster"

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Shipped",
	description: "A web panel for managing your shipping instances.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<TokenProvider>{children}</TokenProvider>
				<Toaster />
			</body>
		</html>
	);
}
