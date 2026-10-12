import { saveCommerceSettings } from "@/app/admin/commerce-actions";
import { AdminMutationForm } from "./mutation-form";
import type { CommerceSettings } from "@/lib/shipping";
export function CommerceSettingsPanel({ settings }: { settings: CommerceSettings }) {
  return <section className="console-panel commerce-settings-panel"><h2>Carrito y envío gratis</h2><p className="console-note">El beneficio se calcula sobre el total de productos después de los descuentos. Los envíos que no califican se coordinan por separado.</p>
    <AdminMutationForm action={saveCommerceSettings} submitLabel="Guardar carrito y envío">
      <label className="console-checkbox"><input name="free_shipping_enabled" type="checkbox" defaultChecked={settings.freeShippingEnabled} /> Ofrecer envío gratis</label>
      <label>Monto mínimo ($)<input name="free_shipping_threshold" type="number" min="0.01" max="999999999" step="0.01" required defaultValue={settings.freeShippingThreshold} /></label>
      <label>Destino del envío gratis<select name="free_shipping_destination" defaultValue={settings.freeShippingDestination}><option value="branch">A sucursal</option><option value="home">A domicilio</option></select></label>
      <label className="console-checkbox"><input name="cart_whatsapp_enabled" type="checkbox" defaultChecked={settings.cartWhatsappEnabled} /> Permitir pedidos por WhatsApp desde el carrito</label>
    </AdminMutationForm>
  </section>;
}
