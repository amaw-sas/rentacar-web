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

        toast.add({
            title: error.title,
            description: error.message,
            duration: 20000,
            progress: false,
            color: 'error',
            icon: 'lucide:x',
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