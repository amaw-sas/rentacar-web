export default defineNuxtRouteMiddleware((to, from) => {
    const city = to.params.city;
    if(city){

        const { cities } = useAppConfig();
        const allowedRoutes = [
            ...cities.map((c) => c.id)
        ];

        if(!allowedRoutes.find((route) => city == route)){
            throw createError({
                statusCode: 404,
                statusMessage: 'Page Not Found',
            });
        }
    }
})