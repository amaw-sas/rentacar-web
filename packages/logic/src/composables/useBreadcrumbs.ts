// External dependencies
import type { BreadcrumbList, ListItem } from 'schema-dts';

interface BreadcrumbItem {
    name: string
    path: string
}

export const useBreadcrumbs = (items: BreadcrumbItem[]) => {
    const { franchise } = useAppConfig()

    const breadcrumbItems: ListItem[] = items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: {
            '@type': 'WebPage',
            '@id': `${franchise.website}${item.path}`
        }
    }))

    useSchemaOrg([
        <BreadcrumbList>{
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems
        }
    ])

    return {
        items: breadcrumbItems
    }
}

export const useHomeBreadcrumb = () => {
    return useBreadcrumbs([
        { name: 'Inicio', path: '/' }
    ])
}

export const useCityBreadcrumbs = (cityName: string, citySlug: string) => {
    return useBreadcrumbs([
        { name: 'Inicio', path: '/' },
        { name: cityName, path: `/${citySlug}` }
    ])
}

export const useSearchBreadcrumbs = (cityName: string, citySlug: string) => {
    return useBreadcrumbs([
        { name: 'Inicio', path: '/' },
        { name: cityName, path: `/${citySlug}` },
        { name: 'Buscar Vehículos', path: `/${citySlug}/buscar-vehiculos` }
    ])
}
