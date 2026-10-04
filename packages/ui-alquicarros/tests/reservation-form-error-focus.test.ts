// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { firstInvalidFieldEl } from '../app/utils/firstInvalidFieldEl';

/**
 * Issue #366 (D6, sugerencia S1 del gate de review) — blinda el resolver del handler
 * `@error` contra dos derivas silenciosas que hoy solo cazaría el e2e gateado por Supabase:
 * un cambio en la forma del evento de @nuxt/ui (`errors[].id` / `errors[].name`) y una
 * regresión del caso especial de `telefono` o del orden-de-DOM. Si cualquiera se rompe, el
 * handler deja de mover el foco EN SILENCIO (cae en su rama `null`). Estos tests fijan el
 * contrato de la resolución pura; el foco/scroll siguen probados por el e2e.
 */
describe('firstInvalidFieldEl — resolución del primer campo inválido (D6)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  /** Monta inputs con ids en un ORDEN DE DOM explícito. */
  function mountFields(ids: string[]) {
    for (const id of ids) {
      const input = document.createElement('input');
      input.id = id;
      document.body.appendChild(input);
    }
  }

  it('devuelve el primero en ORDEN DE DOM, no el primero de la lista de errores', () => {
    // valibot emite los issues en orden de DECLARACIÓN del schema, que NO coincide con el
    // DOM: aquí el DOM es [email, telefono] pero los errores llegan [telefono, email].
    mountFields(['email', 'telefono']);
    const errors = [
      { name: 'telefono', id: 'telefono' },
      { name: 'email', id: 'email' },
    ];

    const el = firstInvalidFieldEl(errors, document);

    // Orden de lista → 'telefono'; orden de DOM → 'email'. El resolver debe dar 'email'.
    expect(el?.id).toBe('email');
  });

  it('resuelve `telefono` por su name aunque el id del error no exista en el DOM', () => {
    // VueTelInput no registra su id vía useFormField: el error trae un id sintético que no
    // está en el DOM; usePhoneField fija id="telefono". Sin el mapeo por name, este campo
    // resolvería a null y el foco no se movería.
    mountFields(['telefono']);
    const errors = [{ name: 'telefono', id: 'field-uform-xyz-inexistente' }];

    const el = firstInvalidFieldEl(errors, document);

    expect(el?.id).toBe('telefono');
  });

  it('el caso especial de `telefono` gana sobre el id: aunque traiga un id válido, resuelve por name', () => {
    // Si @nuxt/ui algún día SÍ registrara un id para telefono, el mapeo por name debe seguir
    // apuntando al input determinista de usePhoneField (#telefono), no al id del evento.
    mountFields(['telefono']);
    const errors = [{ name: 'telefono', id: 'telefono' }];

    expect(firstInvalidFieldEl(errors, document)?.id).toBe('telefono');
  });

  it('sin errores (null / undefined / lista vacía) → null', () => {
    mountFields(['email']);
    expect(firstInvalidFieldEl(null, document)).toBeNull();
    expect(firstInvalidFieldEl(undefined, document)).toBeNull();
    expect(firstInvalidFieldEl([], document)).toBeNull();
  });

  it('un id que cae en un contenedor NO enfocable (radiogroup) resuelve al primer control interno', () => {
    // SCEN-LIC-04 (alquicarros): UFormField registra el id del error en el DIV raíz de
    // u-radio-group, que no tiene tabindex — `first.focus()` sobre él es un no-op mudo.
    // El resolver debe bajar al primer control enfocable interno (el radio).
    // Nombre genérico a propósito: el fallback al descendiente enfocable es para
    // CUALQUIER campo cuyo id caiga en un contenedor, no solo la licencia.
    const group = document.createElement('div');
    group.id = 'field-gama';
    group.setAttribute('role', 'radiogroup');
    for (const id of ['gama-a', 'gama-b']) {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = id;
      group.appendChild(radio);
    }
    document.body.appendChild(group);
    const errors = [{ name: 'gama', id: 'field-gama' }];

    expect(firstInvalidFieldEl(errors, document)?.id).toBe('gama-a');
  });

  it('resuelve `tipoLicencia` por su name aunque el error llegue SIN id (bind:false)', () => {
    // URadioGroup llama useFormField con bind:false → inputId = undefined → el error de
    // UForm trae `id: undefined` y el mapeo por id descarta la entrada EN SILENCIO. Igual
    // que `telefono`: id determinista en el DOM (`id="tipoLicencia"` en el radiogroup) y
    // caso especial por name en el resolver.
    const group = document.createElement('div');
    group.id = 'tipoLicencia';
    group.setAttribute('role', 'radiogroup');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = 'lic-col';
    group.appendChild(radio);
    document.body.appendChild(group);
    const errors = [{ name: 'tipoLicencia', id: undefined }];

    expect(firstInvalidFieldEl(errors, document)?.id).toBe('lic-col');
  });

  it('el orden-de-DOM se compara sobre el contenedor, no sobre el control interno', () => {
    // El radiogroup (tipoLicencia) está ANTES del email en el DOM: debe ganar aunque el
    // elemento devuelto sea su radio interno.
    const group = document.createElement('div');
    group.id = 'tipoLicencia';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.id = 'lic-primero';
    group.appendChild(radio);
    document.body.appendChild(group);
    mountFields(['email']);
    const errors = [
      { name: 'email', id: 'email' },
      { name: 'tipoLicencia', id: undefined },
    ];

    expect(firstInvalidFieldEl(errors, document)?.id).toBe('lic-primero');
  });

  it('errores que no resuelven a ningún elemento del DOM → null (no lanza)', () => {
    mountFields(['email']);
    // Ningún id/name coincide con un elemento presente → el handler no hace nada.
    const errors = [{ name: 'nombres', id: 'nombres' }, { name: 'apellidos', id: 'apellidos' }];
    expect(firstInvalidFieldEl(errors, document)).toBeNull();
  });
});
