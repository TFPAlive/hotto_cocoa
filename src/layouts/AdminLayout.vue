<script setup lang="ts">
	import Navbar from "../components/admin/Navbar.vue";
	import { auth } from "@/composables/useAuth";
	import { useRoute } from "vue-router";

	const route = useRoute()
	const showNavbar = () => {
		// Hide navbar on access denied page or if not admin
		return route.path !== '/admin/access-denied' && auth.userRole === 'admin'
	}
</script>

<template>
	<Navbar v-if="showNavbar()" />
	<main>
		<RouterView />
	</main>
</template>
