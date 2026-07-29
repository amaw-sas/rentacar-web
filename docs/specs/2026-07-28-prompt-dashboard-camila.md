# Instrucción para ejecutar en rentacar-dashboard

Este cambio no es de rentacar-web. El web solo manda `brand` a `/api/chat`; el nombre del
bot, su saludo y el agente que queda registrado en la atención los resuelve el dashboard.

Pega el bloque de abajo en una sesión abierta sobre el repo rentacar-dashboard.

---

En este repo vive el cerebro del chat que consumen las tres marcas de rentacar-web. Cada
petición a `/api/chat` llega con un campo `brand` (`alquilatucarro`, `alquilame`,
`alquicarros`).

Hoy el bot se presenta como Valeria en las tres, y en el registro de conversaciones el
agente aparece como `valeriabot`. La marca alquilame ya tiene chat propio en la web
(cabecera con "Camila · alquilame" y otro avatar), así que el bot que responde ahí tiene
que llamarse Camila.

Quiero tres cosas, solo para `alquilame`:

1. Que el bot se presente como **Camila**, la asesora de Alquílame. Nunca Valeria.
2. Que el agente que queda registrado en la atención deje de ser `valeriabot` y refleje el
   nombre nuevo. Busca dónde se escribe ese identificador — puede estar en el prompt, en
   la tabla de conversaciones o en la integración de WhatsApp.
3. Que el saludo de apertura sea distinto del de alquilatucarro. No una variación de la
   misma frase: otra forma de saludar. El de alquilatucarro hoy es "Hola, buenos días. Soy
   Valeria, la asesora virtual de Alquílame, atenta a resolver todas tus dudas, cotizarte
   y reservarte al instante." Ojo: ese saludo también dice "Alquílame" aunque lo sirva
   alquilatucarro, así que revisa si el nombre de la marca está mal cableado ahí.

Condiciones:

- alquilatucarro y alquicarros no cambian. Valeria sigue siendo Valeria en esas dos.
- La personalización tiene que colgar de `brand`, no de un if suelto en un solo sitio.
- Antes de tocar nada, dime dónde encontraste cada una de las tres cosas y qué archivos
  vas a modificar.

Al terminar, quiero probarlo: abre una conversación de alquilame y otra de alquilatucarro
y enséñame las dos primeras respuestas de cada una.
