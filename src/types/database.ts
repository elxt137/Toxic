export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      product_admin_data: {
        Row: { product_id: string; cost_price: number | null; barcode: string | null; updated_at: string };
        Insert: { product_id: string; cost_price?: number | null; barcode?: string | null; updated_at?: string };
        Update: { cost_price?: number | null; barcode?: string | null; updated_at?: string };
        Relationships: [];
      };
      coupons: {
        Row: { id: string; code: string; kind: "percent" | "fixed"; value: number; usage_limit: number | null; used_count: number; active: boolean; expires_at: string | null; created_at: string };
        Insert: { id?: string; code: string; kind?: "percent" | "fixed"; value: number; usage_limit?: number | null; used_count?: number; active?: boolean; expires_at?: string | null; created_at?: string };
        Update: { active?: boolean; expires_at?: string | null; usage_limit?: number | null };
        Relationships: [];
      };
      storefront_settings: {
        Row: { id: boolean; announcement_text: string; updated_at: string };
        Insert: { id?: boolean; announcement_text?: string; updated_at?: string };
        Update: { announcement_text?: string };
        Relationships: [];
      };
      admin_allowlist: {
        Row: {
          id: string;
          email: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          email?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          brand: string;
          description: string;
          category: "Decant" | "Frasco completo";
          price: number;
          currency: string;
          stock: number;
          image_url: string | null;
          concentration: string | null;
          size_ml: number | null;
          is_published: boolean;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          brand: string;
          description?: string;
          category?: "Decant" | "Frasco completo";
          price: number;
          currency?: string;
          stock?: number;
          image_url?: string | null;
          concentration?: string | null;
          size_ml?: number | null;
          is_published?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          size_ml: number | null;
          price: number;
          stock: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          label: string;
          size_ml?: number | null;
          price: number;
          stock?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          shipping_status: "preparing" | "in_transit" | "delivered";
          transaction_status: "pending" | "processed" | "completed";
          tracking_number: string | null;
          subtotal: number | null;
          discount_amount: number;
          coupon_code: string | null;
          coupon_id: string | null;
          id: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          total: number;
          currency: string;
          mercadopago_preference_id: string | null;
          mercadopago_payment_id: string | null;
          payer_name: string | null;
          payer_email: string | null;
          buyer_first_name: string | null;
          buyer_last_name: string | null;
          buyer_phone: string | null;
          shipping_street: string | null;
          shipping_number: string | null;
          shipping_apartment: string | null;
          shipping_city: string | null;
          shipping_province: string | null;
          shipping_postal_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          shipping_status?: "preparing" | "in_transit" | "delivered";
          transaction_status?: "pending" | "processed" | "completed";
          tracking_number?: string | null;
          subtotal?: number | null;
          discount_amount?: number;
          coupon_code?: string | null;
          coupon_id?: string | null;
          id?: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          total: number;
          currency?: string;
          mercadopago_preference_id?: string | null;
          mercadopago_payment_id?: string | null;
          payer_name?: string | null;
          payer_email?: string | null;
          buyer_first_name?: string | null;
          buyer_last_name?: string | null;
          buyer_phone?: string | null;
          shipping_street?: string | null;
          shipping_number?: string | null;
          shipping_apartment?: string | null;
          shipping_city?: string | null;
          shipping_province?: string | null;
          shipping_postal_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string;
          variant_label: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id: string;
          variant_label: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      reserve_order_coupon: { Args: { p_order_id: string; p_code: string }; Returns: number };
      is_admin: { Args: never; Returns: boolean };
      confirm_order_payment: {
        Args: { p_order_id: string; p_payment_id: string; p_status: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductWithVariants = Product & { variants: ProductVariant[] };
