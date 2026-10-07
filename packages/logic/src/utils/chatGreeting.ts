/**
 * Single source for the contact teaser bubble AND the empty-chat greeting: the
 * two lines the teaser shows as Alquie's messages are the same two bubbles an
 * empty conversation renders, so the badge's promise is kept inside the chat.
 *
 * Kept out of the utils barrel on purpose: ChatConversation is lazy-loaded and
 * imports this file directly so it never drags the teaser module into its chunk.
 */
// Displayed lines (line 1 carries an emoji for the visible bubble).
export const TEASER_LINE_1 = '¡Hola! 👋 ¿Buscas carro? Escríbenos, respondemos ya.'
export const TEASER_LINE_2 = '¿Dudas de requisitos o precios? Estamos en línea.'
// Screen-reader copy: emoji-free (line 1 without the waving hand).
export const TEASER_LINE_1_PLAIN = '¡Hola! ¿Buscas carro? Escríbenos, respondemos ya.'
