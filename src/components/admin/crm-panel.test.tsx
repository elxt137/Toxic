import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database";
vi.mock("@/app/admin/commerce-actions", () => ({ saveCustomer: vi.fn(),saveCustomerGroup: vi.fn() }));
import { CrmPanel } from "./crm-panel";
const id="11111111-1111-4111-8111-111111111111";
const groups=[{ id,slug: "professional",name: "Detailer Profesional",discount_percent: 15,created_at: "2026-01-01" }];
const customers=[{ id,name: "Ana",email: "ana@example.invalid",phone: "123456",address: "Calle 123",group_id: id,registered_at: "2026-01-01",last_order_at: null,updated_at: "2026-01-01" }];
const orders=[{ id: "order-a",customer_id: id,payer_email: "old@example.invalid",status: "approved",total: 100,created_at: "2026-01-01T12:00:00Z" }] as Database["public"]["Tables"]["orders"]["Row"][];
const items=[{ id:"item-a",order_id:"order-a",product_name:"Shampoo 5 litros",unit_price:100,quantity:1 }] as Database["public"]["Tables"]["order_items"]["Row"][];
afterEach(cleanup);
describe("customer CRM", () => {
  it("shows contact details, registered date and purchased items even after an email correction", () => {
    render(<CrmPanel customers={customers} groups={groups} orders={orders} items={items} query="" />);
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.getByDisplayValue("Calle 123")).toBeTruthy();
    expect(screen.getByText(/Registro:/)).toBeTruthy();
    expect(screen.getByText(/Shampoo 5 litros/)).toBeTruthy();
    expect(screen.getByText("1 compras")).toBeTruthy();
  });
  it("searches customers by group and returns an explicit no-match state", () => {
    const { rerender }=render(<CrmPanel customers={customers} groups={groups} orders={orders} items={items} query="profesional" />);
    expect(screen.getByText("Ana")).toBeTruthy();
    rerender(<CrmPanel customers={customers} groups={groups} orders={orders} items={items} query="missing" />);
    expect(screen.queryByText("Ana")).toBeNull();
    expect(screen.getByText("No hay clientes que coincidan con la búsqueda.")).toBeTruthy();
  });
});
