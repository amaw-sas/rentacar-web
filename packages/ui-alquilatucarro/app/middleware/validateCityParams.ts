export default defineNuxtRouteMiddleware((to) => {
    const city = to.params.city;
    if (city) {
        const { cities } = useFetchRentacarData();
        const allowedRoutes = cities.map((c) => c.id);

        if (!allowedRoutes.find((route) => city === route)) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Page Not Found',
            });
        }
    }
})