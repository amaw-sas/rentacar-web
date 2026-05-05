import type Testimonial from './Testimonial';

export default interface City {
    id: string;
    name: string;
    description: string;
    testimonials: Testimonial[];
}
