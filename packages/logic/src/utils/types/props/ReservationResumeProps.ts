import useCategory from '../../../composables/useCategory';

export default interface ReservationResumeProps {
  category: ReturnType<typeof useCategory>;
}
