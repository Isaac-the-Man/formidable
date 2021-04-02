<template>
    <b-navbar toggleable="sm" type="dark" variant="dark">
        <b-navbar-brand to="/">PAS Reservation Portal</b-navbar-brand>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav>
            <!-- Left aligned nav items -->
            <b-navbar-nav>
                <b-nav-item to="/events" active-class="active">Events</b-nav-item>
                <b-nav-item to="/admin" exact active-class="active" v-if="isLoggedIn">Admin</b-nav-item>
                <b-nav-item to="/login" exact active-class="active" v-else>Login</b-nav-item>
            </b-navbar-nav>
            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto" v-if="isLoggedIn">
                <b-nav-item-dropdown right>
                    <!-- Using 'button-content' slot -->
                    <template v-slot:button-content>
                        <em>{{ user }}</em>
                    </template>
                    <b-dropdown-item @click="logout">Sign Out</b-dropdown-item>
                </b-nav-item-dropdown>
            </b-navbar-nav>
        </b-collapse>
    </b-navbar>
</template>

<script>
    export default {
        name: "TheNavbar",
        computed: {
            isLoggedIn() {
                return this.$store.state.isLoggedIn;
            },
            user() {
                return this.$store.state.admin.email;
            }
        },
        methods: {
            async logout() {
                await this.$store.dispatch('logout');
                this.$router.push('/login');
            }
        }
    }
</script>

<style scoped>

</style>
