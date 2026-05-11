# FAQs Supabase migration toolkit (#12)

This directory ships the artifacts that move `faqs.config.ts` into the
Supabase `faqs` table. The migration was applied via Supabase MCP from this
repo, so no `.sql` file is committed — the SQL canonical source is recorded
inside Supabase and mirrored here for re-seed without Claude.

Related design: `docs/specs/2026-05-06-faqs-supabase-migration-design.md`.

## Files

| File | Lifecycle | Purpose |
|---|---|---|
| `faqs-snapshot.ts` | One-shot — stops compiling after Step 9 (`faqs.config.ts` is deleted) | Reads `faqsConfig`, writes `faqs-data.json`. Frozen historical snapshot. |
| `faqs-data.json` | Permanent | 11 entries with `label`, `content`, `display_order`. Source for the SQL seed below. |
| `faqs-README.md` | Permanent | This file. Escape hatch for re-seeding without Claude. |

## Schema (applied via MCP `apply_migration` — Step 7)

```sql
CREATE TABLE faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  content text NOT NULL,
  display_order integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX faqs_display_order_idx ON faqs (display_order) WHERE status = 'active';

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faqs_select_anon" ON faqs
  FOR SELECT TO anon
  USING (status = 'active');
```

### Schema rationale

- `label UNIQUE` lets `ON CONFLICT (label) DO NOTHING` make the seed
  idempotent (SCEN-005). Re-running the INSERTs never duplicates rows and
  never overwrites manual edits (SCEN-006).
- `status text NOT NULL DEFAULT 'active'` mirrors `cities`, `locations`,
  `vehicle_categories`. The endpoint filters with `.eq('status', 'active')`
  server-side so inactive rows never reach the client.
- `display_order` preserves the original sequence of the 11 FAQs (reserva
  flow → payment methods → requirements → vehicle use → coverage), which
  is semantic, not arbitrary.
- RLS policy is SELECT-only for `anon`. Writes happen via the service role
  through Supabase Studio or MCP — there is no admin UI.

## Seed (applied via MCP `execute_sql` — Step 7)

11 `INSERT … ON CONFLICT (label) DO NOTHING` statements, copy-pastable into
the Supabase SQL editor:

```sql
INSERT INTO faqs (label, content, display_order) VALUES ('¿Cómo puedo hacer una reserva?', 'Para realizar un alquiler de carros debe generar una reserva en nuestra página web o a través de nuestra línea telefónica, esta reserva será enviada con todos los datos necesarios para montar una reserva, una vez confirmada la disponibilidad, Se enviará un correo de confirmación indicando que la reserva ha sido montada. El día de reserva deberá presentarse con cupo disponible y documentos según lo acordado en las oficinas para retirar el vehículo, llenará y firmará las formas para el trámite; si cumple con las condiciones, el vehículo será entregado y la reserva será efectiva.', 0) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿Se puede realizar un alquiler de carros sin tarjeta de crédito?', 'Lamentablemente no se puede realizar el alquiler de vehículos sin tarjeta de crédito ya que las agencias no está autorizada para recibir dineros en efectivo o con tarjetas débito, la única manera es con Tarjeta de crédito a nombre de quien hace el alquiler.', 1) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿No tengo todo el cupo en la tarjeta, puedo hacer la reserva?', 'comuníquese con nuestros asesores de alquiler de carros colombia para validar la información de sus tarjetas de crédito, ya que se puede realizar un voucher por el valor de la renta y otro por el valor de garantía mientras tiene el vehículo en uso.', 2) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿Puedo alquilar carro en colombia con tarjeta de crédito de almacenes Éxito o Falabella?', 'Algunos almacenes de cadena ofrecen tarjetas de crédito con franquicias Mastercard o Visa, las cuales le servirán para rentar carros en Colombia, pero debe verificar ya que los almacenes también ofrecen tarjetas de crédito propias sin franquicias y estas tarjetas no sirven para renta de carros en Colombia', 3) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿Que edad debo tener para acceder al Alquiler de Carros en Colombia?', 'Para acceder al servicio de Alquiler de Carros en Colombia debe tener mínimo 21 años de edad, tener licencia de conducción y una tarjeta de crédito con cupo disponible', 4) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿Cómo se debe entregar el vehículo?', 'Se debe entregar igual como lo recibe, tanqueado, limpio y en perfecto estado como se le entregó.', 5) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿Mi licencia es extranjera, puedo usarla en Colombia?', 'Las licencias de conducción expedidas en otro país, que se encuentren vigentes y que sean utilizadas por turistas o personas en tránsito en el territorio nacional, serán válidas y admitidas para conducir en Colombia durante la permanencia autorizada a su titular, conforme a las disposiciones internacionales sobre la materia. (Artículo 25 Del código nacional de tránsito en Colombia), Así que apresúrate y realiza el alquiler de carros para viajar por Colombia', 6) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿Puedo recibir el vehículo en una ciudad y entregarlo en otra?', 'Sí, es posible hacer esto, siempre y cuando lo manifieste con anterioridad y pague el recargo correspondiente por el servicio. (Aplican restricciones). $ 1.283 por kilometraje para la devolución del vehículo... Rentar carro en Colombia es tu mejor opción', 7) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿Puedo usar la Tarjeta de Crédito de otra persona para el Alquiler de un Carro?', 'Sí, siempre y cuando el titular de la tarjeta de crédito este en el momento de firma el contrato y usted estaría como conductor adicional dentro del contrato de alquiler de autos en Colombia', 8) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿Que no cubre el seguro Protección?', 'Perdida de papeles del vehículo, llaves, foto multa y placa. No cubre la perdida de accesorios tales como, llantas de emergencia, aros, radio, parlantes, apoyacabezas, retrovisores, entre otros. Tampoco está cubierto el robo de piezas, ni componentes del Motor. *** Cabe resaltar que ninguna de las protecciones o seguros de alquiler de autos en Colombia cubre accesorios como: radio, espejos, copas, farolas etc. (accesorios removibles).', 9) ON CONFLICT (label) DO NOTHING;
INSERT INTO faqs (label, content, display_order) VALUES ('¿A los cuántos días se realiza el desbloqueo del dinero después de que se haga la transacción?', 'Se libera después de la devolución del vehículo el bloqueo entre 4 a 6 días hábiles tanto para renta de carros en Colombia, camionetas o utilitarias.', 10) ON CONFLICT (label) DO NOTHING;
```

The list is generated from `faqs-data.json` with:

```bash
node -e "const d=require('./scripts/faqs-data.json'); const e=s=>\"'\"+s.replace(/'/g,\"''\")+\"'\"; console.log(d.map(f=>'INSERT INTO faqs (label, content, display_order) VALUES ('+e(f.label)+', '+e(f.content)+', '+f.display_order+') ON CONFLICT (label) DO NOTHING;').join('\\n'))"
```

## MCP command sequence (Step 7 of the implementation plan)

Run these from a session with the Supabase MCP server connected.

```text
# 1. Apply schema + RLS
mcp__plugin_supabase_supabase__apply_migration({
  name: "create_faqs_table",
  query: <Schema SQL block from this README, concatenated as one string>
})

# 2. Verify table exists
mcp__plugin_supabase_supabase__list_tables({ schemas: ['public'] })
# Expect: 'faqs' in the returned list with columns (id, label, content, display_order, status, created_at, updated_at).

# 3. Verify RLS pre-seed (anon role)
mcp__plugin_supabase_supabase__execute_sql({ query: "SELECT count(*) FROM faqs" })
# Expect: 0.

# 4. Seed — 11 INSERTs
mcp__plugin_supabase_supabase__execute_sql({ query: <Seed SQL block, all 11 statements concatenated> })

# 5. Verify post-seed
mcp__plugin_supabase_supabase__execute_sql({ query: "SELECT count(*), count(DISTINCT label) FROM faqs" })
# Expect: both = 11.

# 6. SCEN-005 — idempotency: re-run the same INSERT block.
mcp__plugin_supabase_supabase__execute_sql({ query: <same Seed SQL block> })
mcp__plugin_supabase_supabase__execute_sql({ query: "SELECT count(*) FROM faqs" })
# Expect: still 11 — ON CONFLICT (label) DO NOTHING absorbed every duplicate.

# 7. SCEN-006 — manual-edit survival, isolated on a preview branch.
mcp__plugin_supabase_supabase__create_branch({ name: "faqs-scen-006-test" })
# (subsequent execute_sql calls auto-target the branch)
mcp__plugin_supabase_supabase__execute_sql({ query: "UPDATE faqs SET content='EDITADO_MANUALMENTE_2026_05_11' WHERE label='¿Cómo puedo hacer una reserva?'" })
mcp__plugin_supabase_supabase__execute_sql({ query: <Seed SQL block> })
mcp__plugin_supabase_supabase__execute_sql({ query: "SELECT content FROM faqs WHERE label='¿Cómo puedo hacer una reserva?'" })
# Expect: 'EDITADO_MANUALMENTE_2026_05_11' — the manual edit survived the re-seed.
mcp__plugin_supabase_supabase__delete_branch({ branch_id: <id from create_branch response> })
```

## Re-seed without Claude

1. Open the Supabase Studio SQL editor for this project.
2. Paste the **Schema SQL** block above. If the table already exists, the
   `CREATE TABLE` will fail — that's fine, skip it.
3. Paste the **Seed SQL** block. The `ON CONFLICT (label) DO NOTHING` clause
   makes this safe to run any number of times. It will only add rows that
   are missing by `label`.

## Lifecycle notes

- `faqs-snapshot.ts` stops compiling after Step 9 of the migration plan
  (`faqs.config.ts` is deleted). Keep it as a historical artifact — do not
  rewrite it to read from Supabase.
- `faqs-data.json` is the frozen snapshot of the 11 entries at migration
  time. **Not** a source of truth after migration — Supabase is.
- If FAQs diverge between this JSON and Supabase (operator edits the rows in
  Studio), trust Supabase. The JSON is reference-only.

## Behaviour under re-run

- **SCEN-005** (idempotency): re-running the Seed SQL never duplicates rows.
  `UNIQUE(label)` + `ON CONFLICT DO NOTHING` guarantee this.
- **SCEN-006** (manual edits survive): if an operator edits `content` for a
  given `label` directly in Supabase, re-running the Seed SQL leaves that
  edit intact. The `DO NOTHING` clause never touches existing rows. This
  diverges from the cities migration, which used a forcing `UPDATE` and
  would have overwritten manual edits.
