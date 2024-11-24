import axios from "axios";
export interface StackInfo {
    name: string;
    url?: string;
    branch?: string;
    commit?: string;
    status: "active" | "inactive" | "downed" | "none";
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