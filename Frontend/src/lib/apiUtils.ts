
interface Stack {
    name: string;
    url?: string;
    branch?: string;
    commit?: string;
    status: "active" | "inactive" | "down";
}

