import fs from "node:fs";
import path from "node:path";

const dumpPath = process.argv[2];
const outputPath = process.argv[3] || "supabase/import-legacy-catalog.sql";

if (!dumpPath) {
  console.error("Usage: node scripts/import-legacy-catalog.mjs <dump.sql> [output.sql]");
  process.exit(1);
}

const dump = fs.readFileSync(dumpPath, "utf8");

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed.toUpperCase() === "NULL") return null;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'").replaceAll("\\'", "'");
  }
  if (trimmed === "") return "";
  const number = Number(trimmed);
  return Number.isNaN(number) ? trimmed : number;
}

function parseTuples(text) {
  const tuples = [];
  let current = [];
  let value = "";
  let depth = 0;
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === "'" && quoted && next === "'") {
      value += "''";
      index += 1;
      continue;
    }
    if (character === "'") {
      quoted = !quoted;
      value += character;
      continue;
    }
    if (!quoted && character === "(") {
      depth += 1;
      if (depth === 1) {
        current = [];
        value = "";
        continue;
      }
    }
    if (!quoted && character === ")") {
      depth -= 1;
      if (depth === 0) {
        current.push(parseValue(value));
        tuples.push(current);
        value = "";
        continue;
      }
    }
    if (!quoted && depth === 1 && character === ",") {
      current.push(parseValue(value));
      value = "";
      continue;
    }
    if (depth > 0) value += character;
  }

  return tuples;
}

function rows(table) {
  const match = dump.match(new RegExp("INSERT INTO `" + table + "`[^;]+;", "s"));
  if (!match) return [];
  const valuesStart = match[0].indexOf("VALUES");
  return valuesStart >= 0 ? parseTuples(match[0].slice(valuesStart + "VALUES".length)) : [];
}

function sql(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mlFromLabel(label) {
  const match = String(label || "").match(/(\d+)\s*ml/i);
  return match ? Number(match[1]) : null;
}

const brands = new Map(rows("brands").map(([id, name]) => [id, name]));
const products = rows("products");
const sizes = rows("product_sizes");
const images = new Map(rows("product_images").map(([, productId, file]) => [productId, file]));
const sizesByProduct = new Map();

for (const [, productId, ml, label, price, offerPrice, order] of sizes) {
  const list = sizesByProduct.get(productId) || [];
  list.push({ ml, label, price, offerPrice, order });
  sizesByProduct.set(productId, list);
}

const projectRef = "ufkckpsgngfcimgugsni";
const lines = [
  "-- Generated from the legacy Notta Decants MySQL export.",
  "-- This imports products only; users, coupons and reviews are intentionally excluded.",
  "begin;",
];

for (const product of products) {
  const [id, name, brandId, , inspired, , family, topNotes, heartNotes, baseNotes,
    concentration, description, featured, , , , stockStatus, active, order] = product;
  const productSizes = (sizesByProduct.get(id) || []).sort((a, b) => a.order - b.order);
  const firstSize = productSizes[0];
  const image = images.get(id);
  const imageUrl = image
    ? `https://${projectRef}.supabase.co/storage/v1/object/public/product-images/legacy/${image}`
    : null;
  const category = String(name).startsWith("Decant ") ? "Decant" : "Frasco completo";
  const stock = stockStatus === "sin_stock" ? 0 : 1;
  const published = active === 1;
  const brand = brands.get(brandId) || "Sin marca";
  const details = [family, topNotes, heartNotes, baseNotes].filter(Boolean).join(" | ");
  const fullDescription = [description, inspired ? `Inspirado en ${inspired}.` : "", details].filter(Boolean).join(" ");
  lines.push(`insert into public.products (name, slug, brand, description, category, price, currency, stock, image_url, concentration, size_ml, is_published, is_featured, sort_order)`);
  lines.push(`values (${sql(name)}, ${sql(`${slugify(name)}-${id}`)}, ${sql(brand)}, ${sql(fullDescription)}, ${sql(category)}, ${sql(firstSize?.offerPrice ?? firstSize?.price ?? 0)}, 'ARS', ${stock}, ${sql(imageUrl)}, ${sql(concentration)}, ${firstSize ? sql(firstSize.ml || mlFromLabel(firstSize.label)) : "null"}, ${published}, ${Boolean(featured)}, ${sql(order)}) on conflict (slug) do nothing;`);
}

lines.push("commit;", "");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Generated ${products.length} products and ${images.size} image references in ${outputPath}`);