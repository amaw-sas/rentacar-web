// External dependencies

// Types
import type { LocalizaErrorResponse, Message } from '@rentacar-main/logic/utils';

export default function useMessages(){
    const toast = useToast();

    const createMessage = (message: Message) => {
        toast.add({
            title: message.title,
            description: message.message,
            duration: 20000,
            progress: false,
            icon: 'lucide:alert-triangle',
            color: 'neutral',
            ui: {
                root: 'bg-white text-gray-900',
                icon: 'text-amber-500',
                title: 'text-gray-900 text-base font-semibold',
                description: 'text-gray-600',
            }
        });
    }

    const createErrorMessage = (message: LocalizaErrorResponse) => {
        const error: Message = {
            type: "error",
            title: "Error",
            message: message.message,
        };

        if (message.error == "no_available_categories_error")
            error.title = "No hay vehículos";

        // A pickup datetime in the past (e.g. an hour earlier today than now).
        // The backend's raw message talks about the "fecha" and reads harsh;
        // override title + message with a friendly, hour-focused notice so the
        // customer knows exactly what to fix. Same copy as the doSearch guard.
        if (message.error == "inferior_pickup_date") {
            error.title = "Revisa la hora de recogida";
            error.message = "Por favor escoge una hora de recogida posterior a la hora actual.";
        }

        // The chosen HOUR is outside the branch's opening hours. Pickup and
        // return can be different branches, so name which one is closed and
        // which hour field to fix instead of a single ambiguous "el local".
        if (message.error == "out_of_schedule_pickup_hour_error") {
            error.title = "Sede de recogida cerrada";
            error.message = "La sede donde recoges el carro no abre a esa hora. Elige otra hora de recogida.";
        }
        if (message.error == "out_of_schedule_return_hour_error") {
            error.title = "Sede de devolución cerrada";
            error.message = "La sede donde entregas el carro no abre a esa hora. Elige otra hora de devolución.";
        }

        // Return is at or before pickup. The backend reports this as
        // `same_hour_error` (LLNRRE010) with a confusing "recogida y devolución
        // son iguales" message even when return is strictly earlier. Reframe it
        // as the actionable rule the customer has to satisfy.
        if (message.error == "same_hour_error") {
            error.title = "Revisa las fechas";
            error.message = "La devolución debe ser posterior a la recogida.";
        }

        // Infrastructure / unexpected failures (timeouts, 5xx, anything the
        // backend can't classify). Their raw messages are technical or empty and
        // the bare "Error" title is alarming — show a calm, generic retry notice
        // instead. Specific validation codes are handled above and never reach
        // this fallback.
        if (
            message.error == "server_error" ||
            message.error == "connection_timeout" ||
            message.error == "unknown_error"
        ) {
            error.title = "No pudimos completar la búsqueda";
            error.message = "Ocurrió un problema al consultar la disponibilidad. Por favor intenta de nuevo en unos minutos.";
        }

        toast.add({
            title: error.title,
            description: error.message,
            duration: 20000,
            progress: false,
            color: 'error',
            // Warning triangle, not an "x": the close control is already an "x",
            // and two x's read as "error + error" instead of "alert + dismiss".
            icon: 'lucide:alert-triangle',
            // Force an explicit light surface + dark text (same pattern as
            // createMessage). Without it the error toast inherits theme tokens
            // that Android Chrome force-dark paints black, leaving the "Error"
            // title dark-on-dark and unreadable. `bg-white` (a literal colour,
            // not a token) resists force-dark, so the toast stays legible on
            // mobile and desktop alike.
            ui: {
                root: 'bg-white text-gray-900',
                icon: 'text-red-500',
                title: 'text-gray-900 text-base font-semibold',
                description: 'text-gray-600',
            },
        })
    }

    const flushMessages = () => {
        toast.clear();
    }

    return {
        toast,
        createMessage,
        createErrorMessage,
        flushMessages,
    }
}