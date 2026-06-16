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

        // The chosen pickup/return HOUR is outside the branch's opening hours.
        // The backend message reads harsh and date-centric; replace it with a
        // clear "the location is closed then" notice. Covers both hour codes.
        if (
            message.error == "out_of_schedule_pickup_hour_error" ||
            message.error == "out_of_schedule_return_hour_error"
        ) {
            error.title = "Local cerrado a esa hora";
            error.message = "La sede seleccionada no está abierta en el horario que elegiste.";
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