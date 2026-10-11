/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node browser verification. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// Run against a local demo catalog; payment responses are intercepted.
const baseURL = process.env.RC2_TEST_URL || 'http://localhost:3100';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: process.env.RC2_BROWSER_CHANNEL || 'msedge' });
  try {
    for (const width of [320, 390, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(baseURL);
      await page.getByRole('link', { name: 'RC2 · Estética Vehicular, inicio' }).waitFor();
      const cookie = page.getByRole('button', { name: /Aceptar/ });
      if (await cookie.isVisible()) await cookie.click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Home overflows at ${width}px`);
      if (width <= 1000) {
        await page.getByRole('button', { name: 'Abrir menú' }).click();
        await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Lavado', exact: true }).click();
      } else {
        await page.getByRole('navigation', { name: 'Accesos por categoría' }).getByRole('link', { name: 'Lavado', exact: true }).click();
      }
      await page.waitForURL('**/productos?categoria=lavado');
      await page.getByRole('heading', { name: /Shampoo para autos/ }).first().waitFor();
      assert.equal(await page.getByRole('heading', { name: /Cera protectora/ }).count(), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Catalog overflows at ${width}px`);
      await page.getByRole('button', { name: 'Limpiar filtros' }).click();
      await page.getByRole('searchbox', { name: 'Buscar en el catálogo' }).fill('cera');
      await page.getByRole('heading', { name: /Cera protectora/ }).waitFor();
      assert.equal(await page.getByRole('heading', { name: /Shampoo para autos/ }).count(), 0);
      await page.getByRole('link', { name: 'Comprar', exact: true }).click();
      await page.getByRole('heading', { level: 1, name: 'Cera protectora' }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Detail overflows at ${width}px`);
      await page.getByRole('button', { name: 'Añadir al carrito' }).click();
      await page.waitForURL('**/#pedido');
      const drawer = page.getByRole('complementary', { name: 'Tu pedido' });
      await drawer.getByRole('button', { name: 'Iniciar compra' }).waitFor();
      assert(await drawer.isVisible());
      await page.keyboard.press('Escape');
      await page.getByRole('link', { name: /Carrito de compras/ }).click();
      await drawer.getByRole('button', { name: 'Iniciar compra' }).click();
      await page.waitForURL('**/checkout');
      await page.getByRole('heading', { name: 'Datos de envío' }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Checkout overflows at ${width}px`);
      await page.route('**/api/payments/create-preference', async (route) => {
        const body = route.request().postDataJSON();
        assert.equal(body.items[0].quantity, 1);
        assert.equal(body.customer.firstName, 'Prueba');
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Pago de prueba no disponible.' }) });
      });
      for (const [label, value] of Object.entries({ Nombre: 'Prueba', Apellido: 'Cliente', 'Correo electrónico': 'test@example.com', Teléfono: '1122334455', Calle: 'Calle de prueba', Número: '123', Ciudad: 'CABA', Provincia: 'Buenos Aires', 'Código postal': '1000' })) {
        await page.getByLabel(label, { exact: true }).fill(value);
      }
      await page.getByRole('button', { name: 'Ir a Mercado Pago' }).click();
      await page.getByRole('alert').filter({ hasText: 'Pago de prueba no disponible.' }).waitFor();
      assert(await page.getByRole('button', { name: 'Ir a Mercado Pago' }).isEnabled());
      assert.deepEqual(errors, [], `Browser errors at ${width}px`);
      await page.goto(baseURL);
      await page.screenshot({ path: `.next/rc2-${width}.png`, fullPage: false });
      await context.close();
      console.log(`PASS ${width}px: category, search, detail, cart, checkout and payment error`);
    }
    const page = await browser.newPage();
    await page.goto(baseURL);
    await page.getByRole('link', { name: 'RC2 · Estética Vehicular, inicio' }).waitFor();
    const categories = await page.getByRole('navigation', { name: 'Accesos por categoría' }).locator('a').evaluateAll((links) => links.slice(1).map((link) => ({ name: link.getAttribute('aria-label'), href: link.getAttribute('href') })));
    for (const category of categories) {
      await page.goto(baseURL);
      await page.getByRole('navigation', { name: 'Accesos por categoría' }).getByRole('link', { name: category.name, exact: true }).click();
      await page.waitForURL(`${baseURL}${category.href}`);
      const id = new URL(page.url()).searchParams.get('categoria') || '';
      assert.equal(await page.getByRole('combobox', { name: 'Categoría' }).inputValue(), id);
    }
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'Abrir buscador' }).click();
    await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('microfibra');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.waitForURL('**/productos?q=microfibra');
    await page.getByRole('heading', { name: /Paño de microfibra/ }).waitFor();
    await page.goto(baseURL);
    const cookie = page.getByRole('button', { name: /Aceptar/ });
    if (await cookie.isVisible()) await cookie.click();
    for (const [label, id] of [['Quiénes somos', 'nosotros'], ['Envíos', 'envios'], ['Cambios y devoluciones', 'cambios'], ['Medios de pago', 'pagos']]) {
      await page.getByRole('link', { name: label, exact: true }).click();
      await page.waitForURL(`**/#${id}`);
      assert(await page.locator(`#${id}`).isVisible());
    }
    console.log('PASS all sidebar shortcuts, header search and footer destinations');
    await page.goto(`${baseURL}/productos?q=shampoo`);
    await page.getByRole('heading', { name: /Shampoo para autos/ }).first().waitFor();
    assert.equal(await page.getByRole('heading', { name: /Cera protectora/ }).count(), 0);
    await page.goto(`${baseURL}/productos?categoria=interior`);
    await page.getByText('No encontramos productos con esos filtros.').waitFor();
    await page.goto(`${baseURL}/productos/no-existe`);
    await page.getByText('This page could not be found.').waitFor();
    console.log('PASS search URLs, empty categories and missing products');
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
