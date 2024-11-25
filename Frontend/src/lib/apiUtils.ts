import axios from "axios";
export interface StackInfo {
    name: string;
    url?: string;
    branch?: string;
    commit?: string;
    status: "active" | "inactive" | "downed" | "none";
}

export interface Stack {
    name: string;
    type: "git" | "file";

    // Git
    url?: string;
    cloneDepth: number;
    branch?: string;
    fetchInterval: string;
    revertOnFailure: boolean;
    composePath?: string;

    // File
    composeFile?: string;
    envFile?: string;

    // Notifications
    notificationUrl?: string;
    notificationProvider?: string;

    createdAt?: string;
    updatedAt?: string;
}

export async function getStacks(serverUrl?: string): Promise<StackInfo[]> {
    if (!serverUrl) return [];
    return await axios.get<StackInfo[]>(`${serverUrl}/v1/stacks`)
        .then((response) => response.data)
        .catch(() => {
            // TODO: Handle error
            return [];
        });
}

export async function createStack(serverUrl: string, stack: Stack): Promise<Stack | string> {
    return await axios.post(`${serverUrl}/v1/stacks/${stack.type}`, stack)
        .then((response) => {
            if (response.status === 201) return response.data;
            if (response.status === 400) return response.data.message ?? "Something went wrong...";
            return "Something went wrong...";
        })
        .catch((res) => {
            if (res.response.status === 400) return res.response.data.message ?? "Something went wrong...";
            // TODO: Handle error
            return undefined;
        });
}
