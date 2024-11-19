import type { repository } from "@/db/schema";

export async function sendNotification(
	repo: repository,
	title: string,
	message: string,
) {
	const url = repo.notificationUrl ?? process.env.DEFAULT_NOTIFICATION_URL;
	const provider =
		repo.notificationProvider ?? process.env.DEFAULT_NOTIFICATION_PROVIDER;
	if (!url || !provider) return;

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

		default:
			console.warn("Unknown provider", provider);
			break;
	}
}