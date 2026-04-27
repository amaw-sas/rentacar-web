// External dependencies
import { storeToRefs } from 'pinia';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';

export default function useShareSearchParams() {
  // Capture inject-dependent handles during setup; calling these inside the
  // click handler would trigger a "inject() can only be used inside setup()"
  // Vue warning and may also fail to resolve the toast container.
  const storeForm = useStoreReservationForm();
  const toast = useToast();
  const {
    selectedPickupLocation,
    selectedReturnLocation,
    humanFormattedPickupDate,
    humanFormattedPickupHour,
    humanFormattedReturnDate,
    humanFormattedReturnHour,
    selectedDays,
    haveTotalInsurance,
    haveMonthlyReservation,
  } = storeToRefs(storeForm);

  const buildWhatsappMessage = (): string => {
    const lines: string[] = ['*Consulta de alquiler de carro*', ''];

    const pickup = selectedPickupLocation.value?.name;
    const ret = selectedReturnLocation.value?.name;

    if (pickup && ret && pickup !== ret) {
      lines.push(`📍 Recogida: ${pickup}`);
      lines.push(`📍 Devolución: ${ret}`);
    } else if (pickup) {
      lines.push(`📍 Lugar: ${pickup}`);
    }

    const pickupParts = [humanFormattedPickupDate.value, humanFormattedPickupHour.value]
      .filter(Boolean)
      .join(', ');
    if (pickupParts) lines.push(`📅 Recogida: ${pickupParts}`);

    const returnParts = [humanFormattedReturnDate.value, humanFormattedReturnHour.value]
      .filter(Boolean)
      .join(', ');
    if (returnParts) lines.push(`📅 Devolución: ${returnParts}`);

    if (selectedDays.value > 0) {
      const dayLabel = selectedDays.value === 1 ? 'día' : 'días';
      lines.push(`🗓 ${selectedDays.value} ${dayLabel}`);
    }

    if (haveMonthlyReservation.value) lines.push('📆 Reserva mensual');
    if (haveTotalInsurance.value) lines.push('🛡 Cobertura total');

    return lines.join('\n');
  };

  const copyToWhatsapp = async (): Promise<boolean> => {
    if (!import.meta.client) return false;

    const message = buildWhatsappMessage();

    try {
      await navigator.clipboard.writeText(message);
      toast.add({
        title: 'Datos copiados',
        description: 'Pégalos en WhatsApp para compartir tu búsqueda',
        color: 'success',
        icon: 'i-heroicons-clipboard-document-check',
      });
      return true;
    } catch (err) {
      console.error('Error al copiar parámetros de búsqueda:', err);
      toast.add({
        title: 'No se pudo copiar',
        description: 'Inténtalo de nuevo en unos segundos',
        color: 'error',
      });
      return false;
    }
  };

  return {
    buildWhatsappMessage,
    copyToWhatsapp,
  };
}
