import type { Testimonial } from '../../../config';

export default interface City {
    id: string;
    name: string;
    description: string;
    link: string;
    testimonials: Testimonial[];
}