export default interface Testimonial {
    user: {
        name: string;
        description: string;
        avatar: {
            src: string;
            alt: string;
        }
    },
    quote: string;
}