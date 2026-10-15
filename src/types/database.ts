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
      product_redirects:{Row:{old_slug:string;new_slug:string};Insert:{old_slug:string;new_slug:string};Update:{new_slug?:string};Relationships:[]};
      customer_groups: {
        Row: { id: string; slug: string; name: string; discount_percent: number; created_at: string };
        Insert: { id?: string; slug: string; name: string; discount_percent?: number };
        Update: { name?: string; discount_percent?: number };
        Relationships: [];
      };
      customers: {
        Row: { id: string; name: string; email: string; phone: string; address: string; group_id: string; registered_at: string; last_order_at: string | null; updated_at: string };
        Insert: { id?: string; name: string; email: string; phone?: string; address?: string; group_id: string; registered_at?: string; last_order_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
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
        // Optional during rollout; absent fields keep analytics disabled.
        Row: { google_analytics_enabled?: boolean; google_analytics_id?: string | null; id: boolean; announcement_text: string; whatsapp_number: string | null; updated_at: string; free_shipping_enabled: boolean; free_shipping_threshold: number; free_shipping_destination: "branch" | "home"; cart_whatsapp_enabled: boolean };
        Insert: { google_analytics_enabled?: boolean; google_analytics_id?: string | null; id?: boolean; announcement_text?: string; whatsapp_number?: string | null; updated_at?: string; free_shipping_enabled?: boolean; free_shipping_threshold?: number; free_shipping_destination?: "branch" | "home"; cart_whatsapp_enabled?: boolean };
        Update: { google_analytics_enabled?: boolean; google_analytics_id?: string | null; announcement_text?: string; free_shipping_enabled?: boolean; free_shipping_threshold?: number; free_shipping_destination?: "branch" | "home"; cart_whatsapp_enabled?: boolean };
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
          option_name?:string;video_urls?:string[];merged_into?:string|null;
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
          image_urls?: string[];
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
          option_name?:string;video_urls?:string[];merged_into?:string|null;
          description?: string;
          category?: "Decant" | "Frasco completo";
          price: number;
          currency?: string;
          stock?: number;
          image_url?: string | null;
          image_urls?: string[];
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
          image_url?:string|null;
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
          image_url?:string|null;
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
          customer_id: string | null; customer_group_name: string | null; group_discount_percent: number; free_shipping_qualified: boolean; free_shipping_threshold: number | null; shipping_destination: "branch" | "home" | null;
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
          customer_id?: string | null; customer_group_name?: string | null; group_discount_percent?: number; free_shipping_qualified?: boolean; free_shipping_threshold?: number | null; shipping_destination?: "branch" | "home" | null;
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
          list_unit_price: number | null;
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
          list_unit_price?: number | null;
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
      consume_checkout_attempt: { Args: { p_key: string }; Returns: boolean };
      confirm_verified_order_payment: { Args: { p_order_id: string; p_payment_id: string; p_status: string; p_amount: number; p_currency: string; p_preference_id: string }; Returns: boolean };
      save_catalog_product: { Args: { p_id: string | null; p_product: Json; p_variants: Json }; Returns: string };
      get_my_customer_benefit: { Args: Record<string, never>; Returns: Json };
      update_store_whatsapp: { Args: { p_number: string; p_password: string }; Returns: boolean };
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
