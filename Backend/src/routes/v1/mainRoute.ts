import Elysia, { t } from "elysia";

const mainRoute = new Elysia().get(
	"/health", // TODO: Implement health check
	async ({ set }) => {
		return {};
	},
	{
		response: {
			200: t.Object({}),
		},
		details: {
			description: "Fetch the health of the server",
		},
	},
);

export default mainRoute;
