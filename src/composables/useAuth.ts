import { reactive } from "vue";

export const auth = reactive({
    userRole: "guest",
    isLoggedIn: false,
    user: null as null | { userid?: number; username?: string; email?: string; imageurl?: string },
});

export async function checkUser() {
    try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
    auth.userRole = data.user?.role || "guest";
    auth.isLoggedIn = auth.userRole !== "guest";
    auth.user = data.user || null;
    } catch {
    auth.userRole = "guest";
    auth.isLoggedIn = false;
    auth.user = null;
    }
}
