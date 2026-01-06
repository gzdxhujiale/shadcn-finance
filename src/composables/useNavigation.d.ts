import { Ref, ComputedRef } from 'vue'

export interface NavigationState {
    main: string
    sub: string
    detail: string | null
}

export function useNavigation(): {
    currentMainNav: Ref<string>
    currentSubNav: Ref<string>
    detailTitle: Ref<string | null>
    breadcrumbs: ComputedRef<NavigationState>
    currentPage: ComputedRef<string>
    setNavigation: (mainNav: string, subNav: string) => void
    setDetailTitle: (title: string | null) => void
}
