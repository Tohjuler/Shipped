import type { stack } from "@/db/schema";

export async function sendNotification(
	stack: stack | undefined,
	type: string,
	baseTitle: string,
	baseMessage: string,
) {
	const url = stack?.notificationUrl ?? process.env.DEFAULT_NOTIFICATION_URL;
	const provider =
		stack?.notificationProvider ?? process.env.DEFAULT_NOTIFICATION_PROVIDER;
	if (!url || !provider) return;

	if (process.env.IGNORE_NOTIFICATIONS_TYPES?.split(",").includes(type)) return;

	const stackInfo = !stack ? "" : `\n---\nStack: ${stack.name}\nType: ${stack.type}${stack.url ? `\nURL: ${stack.url} (${stack.branch ?? "!You should not read this!"})` : ""}`;

	const title = `${baseTitle}${stack ? ` - ${stack?.name}` : ""}`;
	const message = `${baseMessage}${stackInfo}`;

	switch (provider) {
		case "ntfy":
			fetch(url, {
				method: "POST",
				body: message,
				headers: { Title: title },
			});
			break;
		case "discord-webhook":
			fetch(url, {
				method: "POST",
				body: JSON.stringify({
					content: `**${title}**\n\r${message}`,
				}),
				headers: { "Content-Type": "application/json" },
			});
			break;

		case "webhook":
			fetch(url, {
				method: "POST",
				body: JSON.stringify({
					title,
					message: message,
				}),
				headers: { "Content-Type": "application/json" },
			});
			break;

		default:
			console.warn("Unknown provider", provider);
			break;
	}
}
