"use client";
import type React from "react";
import { createContext, useState, useEffect, useContext } from "react";

interface ServerLogin {
	url: string;
	token: string;
}

const ServerContext = createContext<
	| {
			selectedServer?: ServerLogin;
			getServers: () => ServerLogin[];
			selectServer: (url?: string) => void;
			addServer: (server: ServerLogin) => void;
			removeServer: (url: string) => void;
	  }
	| undefined
>(undefined);

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
	const [selected, setSelected] = useState<string | undefined>(undefined);
	const [servers, setServers] = useState<ServerLogin[] | undefined>(undefined);

	useEffect(() => {
		const server = localStorage.getItem("server");
		if (server) setSelected(server);

		const servers = localStorage.getItem("servers");
		if (servers) setServers(JSON.parse(servers));
	}, []);

	const getServers = () => servers || [];

	const selectServer = (url?: string) => {
		if (!url) {
			if (servers && servers.length > 0) selectServer(servers[0].url);
			else setSelected(undefined);
            return;
		}

		localStorage.setItem("server", url);
		setSelected(url);
	};

	const addServer = (server: ServerLogin) => {
		const newServers = servers ? [...servers, server] : [server];
		localStorage.setItem("servers", JSON.stringify(newServers));
		setServers(newServers);
	};

	const removeServer = (url: string) => {
		const newServers = servers?.filter((server) => server.url !== url);
		localStorage.setItem("servers", JSON.stringify(newServers));
		setServers(newServers);
	};

	return (
		<ServerContext.Provider
			value={{
				selectedServer: servers?.find((server) => server.url === selected),
				getServers,
				selectServer,
				addServer,
				removeServer,
			}}
		>
			{children}
		</ServerContext.Provider>
	);
};

export const useServerManager = () => useContext(ServerContext);
