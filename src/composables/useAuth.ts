import { reactive } from "vue";

export const auth = reactive({
  userRole: "guest",
  isLoggedIn: false,
});

export async function checkUser() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const data = await res.json();
    auth.userRole = data.user?.role || "guest";
    auth.isLoggedIn = auth.userRole !== "guest";
  } catch {
    auth.userRole = "guest";
    auth.isLoggedIn = false;
  }
}
