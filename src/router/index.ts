import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import AuthenticationLayout from "@/layouts/Authentication.vue";
import { auth } from "@/composables/useAuth";

const routes = [
	{
		path: "/",
		component: MainLayout,
		children: [
			{ path: "", component: () => import("@/components/views/Home.vue") },
			{ path: "design", component: () => import("@/components/views/Design.vue") },
			{ path: "store", component: () => import("@/components/views/Store.vue") },
			{ path: "products/:id", component: () => import("@/components/views/ProductDetail.vue") },
			{ path: "drinks/:id", component: () => import("@/components/views/DrinkDetail.vue") },
			{ path: "mypage", component: () => import("@/components/views/MyPage.vue")},
			{ path: "checkout", component: () => import("@/components/views/Checkout.vue") },
			//{ path: "store", component: () => import("@/components/views/Store.vue") }
			// ...other normal pages
		]
	},
	{
		path: "/admin",
		component: AdminLayout,
		meta: { requiresAdmin: true },
		children: [
			{ path: "", component: () => import("@/components/admin/Landing.vue"), meta: { requiresAdmin: true } },
			{ path: "product", component: () => import("@/components/admin/Product.vue"), meta: { requiresAdmin: true } },
			{ path: "drink", component: () => import("@/components/admin/Drink.vue"), meta: { requiresAdmin: true } },
			{ path: "order", component: () => import("@/components/admin/Order.vue"), meta: { requiresAdmin: true } },
			{ path: "access-denied", component: () => import("@/components/admin/AccessDenied.vue") }
			// ...other admin pages
		]
	},
	{
		path: "/auth",
		component: AuthenticationLayout,
		children: [
			{ path: "login", component: () => import("@/components/auth/Login.vue") },
			{ path: "register", component: () => import("@/components/auth/Register.vue") },
			{ path: "logging-out", component: () => import("@/components/auth/LoggingOut.vue") },
			{ path: "logging-in", component: () => import("@/components/auth/LoggingIn.vue") }
		]
	},
	// Move catch-all route here to avoid conflict with /admin
	{ path: "/:pathMatch(.*)*", name: "NotFound", component: () => import("@/components/views/NotFound.vue") }  // Catch-all route
];
export const router = createRouter({
	history: createWebHistory(),
	routes,
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition;
		}
		if (to.hash) {
			return {
				el: to.hash,
				behavior: 'smooth',
			};
		}
		return {
			top: 0
		};
	}
});

// Admin authentication guard
router.beforeEach(async (to, from, next) => {
	// Allow access to the access-denied page without admin check
	if (to.path === '/admin/access-denied') {
		next()
		return
	}

	// Check if route requires admin access
	if (to.matched.some(record => record.meta.requiresAdmin)) {
		// If user role is not set, wait a moment for auth to initialize
		if (auth.userRole === "guest" && !auth.isLoggedIn) {
			// Give auth a chance to load
			await new Promise(resolve => setTimeout(resolve, 100))
		}
		
		// Check if user is admin
		if (auth.userRole !== "admin") {
			// Not an admin, redirect to access denied page
			next({ path: '/admin/access-denied' })
			return
		}
	}
	
	// Allow navigation
	next()
})