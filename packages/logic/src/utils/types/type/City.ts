import type Testimonial from './Testimonial';

export default interface City {
    id: string;
    name: string;
    description: string;
    /**
     * The city is still offered for booking. Optional on purpose: a payload cached before the
     * column existed has no field, and absent must read as ON SALE. Never test it directly —
     * use `isBookable()`, which writes that rule down once.
     */
    bookable?: boolean;
    /**
     * @deprecated Issue #322 PR10 — testimonials no longer travel in the
     * master catalog payload (they were ~35KB shipped on every page). City
     * pages fetch them per city via useCityTestimonials → /api/city-testimonials.
     * Kept optional so old fixtures typecheck.
     */
    testimonials?: Testimonial[];
}
