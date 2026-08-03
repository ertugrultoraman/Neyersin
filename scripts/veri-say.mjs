/** Taşımadan önce/sonra karşılaştırmak için tablo satır sayıları. */
import fs from "node:fs";
import postgres from "postgres";

const env = fs.readFileSync(".env.local", "utf8");
const anahtar = process.argv[2] ?? "DATABASE_URL";
const url = env
  .match(new RegExp(`^${anahtar}=(.*)$`, "m"))[1]
  .trim()
  .replace(/^["']|["']$/g, "");

const sql = postgres(url, { ssl: "require", max: 2 });
const tablolar = await sql`
  SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;

console.log(`${anahtar} — tablolar ve satir sayilari:`);
let toplam = 0;
for (const t of tablolar) {
  const r = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM "${t.tablename}"`);
  console.log(`  ${String(r[0].n).padStart(6)}  ${t.tablename}`);
  toplam += r[0].n;
}
console.log(`  ${String(toplam).padStart(6)}  TOPLAM (${tablolar.length} tablo)`);
await sql.end();
