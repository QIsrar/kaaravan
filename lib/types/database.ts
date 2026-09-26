export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          area: string
          city: string
          created_at: string
          deleted_at: string | null
          full_name: string
          id: string
          is_default: boolean
          label: string | null
          phone: string
          postal_code: string | null
          profile_id: string
          province: string
          street: string
          updated_at: string
        }
        Insert: {
          area: string
          city: string
          created_at?: string
          deleted_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone: string
          postal_code?: string | null
          profile_id: string
          province: string
          street: string
          updated_at?: string
        }
        Update: {
          area?: string
          city?: string
          created_at?: string
          deleted_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string
          postal_code?: string | null
          profile_id?: string
          province?: string
          street?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transfer_proofs: {
        Row: {
          created_at: string
          file_path: string
          id: string
          order_id: string
          status: string
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          order_id: string
          status?: string
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          order_id?: string
          status?: string
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfer_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfer_proofs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          logo: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      buyer_trust: {
        Row: {
          delivered: number
          phone_hash: string
          refused: number
          risk_level: string
          total_cod_orders: number
          updated_at: string
        }
        Insert: {
          delivered?: number
          phone_hash: string
          refused?: number
          risk_level?: string
          total_cod_orders?: number
          updated_at?: string
        }
        Update: {
          delivered?: number
          phone_hash?: string
          refused?: number
          risk_level?: string
          total_cod_orders?: number
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          quantity: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          quantity: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          currency: string
          guest_token: string | null
          id: string
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          guest_token?: string | null
          id?: string
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          guest_token?: string | null
          id?: string
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          commission_rate_bps: number | null
          created_at: string
          deleted_at: string | null
          id: string
          image: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          commission_rate_bps?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          commission_rate_bps?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cod_confirmations: {
        Row: {
          channel: string
          confirmed_at: string | null
          created_at: string
          id: string
          order_id: string
          status: Database["public"]["Enums"]["cod_confirmation_status"]
          updated_at: string
        }
        Insert: {
          channel: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          status?: Database["public"]["Enums"]["cod_confirmation_status"]
          updated_at?: string
        }
        Update: {
          channel?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["cod_confirmation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cod_confirmations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cod_remittance_items: {
        Row: {
          amount_minor: number
          created_at: string
          id: string
          remittance_id: string
          shipment_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          id?: string
          remittance_id: string
          shipment_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          id?: string
          remittance_id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cod_remittance_items_remittance_id_fkey"
            columns: ["remittance_id"]
            isOneToOne: false
            referencedRelation: "cod_remittances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cod_remittance_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      cod_remittances: {
        Row: {
          amount_minor: number
          courier_code: string
          created_at: string
          id: string
          received_at: string
          reconciled_by: string | null
          remittance_reference: string
          updated_at: string
        }
        Insert: {
          amount_minor: number
          courier_code: string
          created_at?: string
          id?: string
          received_at: string
          reconciled_by?: string | null
          remittance_reference: string
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          courier_code?: string
          created_at?: string
          id?: string
          received_at?: string
          reconciled_by?: string | null
          remittance_reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cod_remittances_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          base_minor: number
          commission_minor: number
          created_at: string
          id: string
          rate_bps: number
          sub_order_id: string
        }
        Insert: {
          base_minor: number
          commission_minor: number
          created_at?: string
          id?: string
          rate_bps: number
          sub_order_id: string
        }
        Update: {
          base_minor?: number
          commission_minor?: number
          created_at?: string
          id?: string
          rate_bps?: number
          sub_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: true
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          discount_minor: number
          id: string
          order_id: string
          profile_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_minor: number
          id?: string
          order_id: string
          profile_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_minor?: number
          id?: string
          order_id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          ends_at: string | null
          fixed_minor: number | null
          id: string
          is_active: boolean
          max_discount_minor: number | null
          min_order_minor: number | null
          percent_bps: number | null
          starts_at: string
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          ends_at?: string | null
          fixed_minor?: number | null
          id?: string
          is_active?: boolean
          max_discount_minor?: number | null
          min_order_minor?: number | null
          percent_bps?: number | null
          starts_at: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          ends_at?: string | null
          fixed_minor?: number | null
          id?: string
          is_active?: boolean
          max_discount_minor?: number | null
          min_order_minor?: number | null
          percent_bps?: number | null
          starts_at?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      couriers: {
        Row: {
          code: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          supports_cod: boolean
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          supports_cod?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          supports_cod?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      dispute_messages: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          id: string
          opened_by: string
          status: string
          sub_order_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          opened_by: string
          status?: string
          sub_order_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          opened_by?: string
          status?: string
          sub_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          profile_id: string
          read_at: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          profile_id: string
          read_at?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          profile_id?: string
          read_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          buyer_id: string
          counter_minor: number | null
          created_at: string
          expires_at: string
          id: string
          offered_minor: number
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
          variant_id: string
        }
        Insert: {
          buyer_id: string
          counter_minor?: number | null
          created_at?: string
          expires_at: string
          id?: string
          offered_minor: number
          seller_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          variant_id: string
        }
        Update: {
          buyer_id?: string
          counter_minor?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          offered_minor?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_minor: number
          product_title: string
          quantity: number
          sub_order_id: string
          unit_price_minor: number
          updated_at: string
          variant_attributes: Json
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total_minor: number
          product_title: string
          quantity: number
          sub_order_id: string
          unit_price_minor: number
          updated_at?: string
          variant_attributes: Json
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total_minor?: number
          product_title?: string
          quantity?: number
          sub_order_id?: string
          unit_price_minor?: number
          updated_at?: string
          variant_attributes?: Json
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["sub_order_status"] | null
          id: string
          note: string | null
          sub_order_id: string
          to_status: Database["public"]["Enums"]["sub_order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["sub_order_status"] | null
          id?: string
          note?: string | null
          sub_order_id: string
          to_status: Database["public"]["Enums"]["sub_order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["sub_order_status"] | null
          id?: string
          note?: string | null
          sub_order_id?: string
          to_status?: Database["public"]["Enums"]["sub_order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json
          created_at: string
          currency: string
          deleted_at: string | null
          discount_minor: number
          guest_email: string | null
          guest_phone: string | null
          id: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          placed_at: string
          profile_id: string | null
          shipping_address: Json
          shipping_minor: number
          subtotal_minor: number
          total_minor: number
          updated_at: string
        }
        Insert: {
          billing_address: Json
          created_at?: string
          currency?: string
          deleted_at?: string | null
          discount_minor?: number
          guest_email?: string | null
          guest_phone?: string | null
          id?: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          profile_id?: string | null
          shipping_address: Json
          shipping_minor: number
          subtotal_minor: number
          total_minor: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json
          created_at?: string
          currency?: string
          deleted_at?: string | null
          discount_minor?: number
          guest_email?: string | null
          guest_phone?: string | null
          id?: string
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          profile_id?: string | null
          shipping_address?: Json
          shipping_minor?: number
          subtotal_minor?: number
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_minor: number
          created_at: string
          gateway: string
          gateway_ref: string | null
          id: string
          idempotency_key: string | null
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          raw_response: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          gateway: string
          gateway_ref?: string | null
          id?: string
          idempotency_key?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          raw_response?: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          gateway?: string
          gateway_ref?: string | null
          id?: string
          idempotency_key?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_minor: number
          approved_by: string | null
          bank_reference: string | null
          created_at: string
          id: string
          paid_at: string | null
          seller_id: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount_minor: number
          approved_by?: string | null
          bank_reference?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          approved_by?: string | null
          bank_reference?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: string
          price_minor: number
          recorded_at: string
          variant_id: string
        }
        Insert: {
          id?: string
          price_minor: number
          recorded_at?: string
          variant_id: string
        }
        Update: {
          id?: string
          price_minor?: number
          recorded_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          path: string
          product_id: string
          sort_order: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          product_id: string
          sort_order?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          compare_at_minor: number | null
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          is_active: boolean
          min_offer_minor: number | null
          offers_enabled: boolean
          price_minor: number
          product_id: string
          reserved_quantity: number
          sku: string
          stock_quantity: number
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          attributes?: Json
          compare_at_minor?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          min_offer_minor?: number | null
          offers_enabled?: boolean
          price_minor: number
          product_id: string
          reserved_quantity?: number
          sku: string
          stock_quantity?: number
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          attributes?: Json
          compare_at_minor?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          min_offer_minor?: number | null
          offers_enabled?: boolean
          price_minor?: number
          product_id?: string
          reserved_quantity?: number
          sku?: string
          stock_quantity?: number
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          rating_avg: number
          rating_count: number
          rejection_reason: string | null
          search_vector: unknown
          seller_id: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          rating_avg?: number
          rating_count?: number
          rejection_reason?: string | null
          search_vector?: unknown
          seller_id: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          rating_avg?: number
          rating_count?: number
          rejection_reason?: string | null
          search_vector?: unknown
          seller_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["role_type"]
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["role_type"]
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["role_type"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      qafila_deals: {
        Row: {
          created_at: string
          deal_price_minor: number
          ends_at: string
          id: string
          status: string
          target_buyers: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          deal_price_minor: number
          ends_at: string
          id?: string
          status?: string
          target_buyers: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          deal_price_minor?: number
          ends_at?: string
          id?: string
          status?: string
          target_buyers?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qafila_deals_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      qafila_participants: {
        Row: {
          buyer_id: string
          created_at: string
          deal_id: string
          id: string
          order_id: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          deal_id: string
          id?: string
          order_id?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          deal_id?: string
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qafila_participants_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qafila_participants_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "qafila_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qafila_participants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string
          evidence_paths: string[]
          id: string
          order_item_id: string
          reason: string
          refund_minor: number
          status: Database["public"]["Enums"]["return_status"]
          sub_order_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_paths?: string[]
          id?: string
          order_item_id: string
          reason: string
          refund_minor: number
          status?: Database["public"]["Enums"]["return_status"]
          sub_order_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_paths?: string[]
          id?: string
          order_item_id?: string
          reason?: string
          refund_minor?: number
          status?: Database["public"]["Enums"]["return_status"]
          sub_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          order_item_id: string
          product_id: string
          profile_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          order_item_id: string
          product_id: string
          profile_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          order_item_id?: string
          product_id?: string
          profile_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_synonyms: {
        Row: {
          created_at: string
          id: string
          maps_to: string
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          maps_to: string
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          maps_to?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_bank_accounts: {
        Row: {
          account_title: string
          bank_name: string
          created_at: string
          iban: string
          id: string
          is_verified: boolean
          seller_id: string
          updated_at: string
        }
        Insert: {
          account_title: string
          bank_name: string
          created_at?: string
          iban: string
          id?: string
          is_verified?: boolean
          seller_id: string
          updated_at?: string
        }
        Update: {
          account_title?: string
          bank_name?: string
          created_at?: string
          iban?: string
          id?: string
          is_verified?: boolean
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_bank_accounts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_path: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_path: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_path?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_documents_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_kyc: {
        Row: {
          cnic_number: string
          created_at: string
          id: string
          ntn: string | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          cnic_number: string
          created_at?: string
          id?: string
          ntn?: string | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          cnic_number?: string
          created_at?: string
          id?: string
          ntn?: string | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_kyc_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_ledger: {
        Row: {
          amount_minor: number
          available_at: string
          balance_after_minor: number
          created_at: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          seller_id: string
          sub_order_id: string | null
        }
        Insert: {
          amount_minor: number
          available_at: string
          balance_after_minor: number
          created_at?: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          seller_id: string
          sub_order_id?: string | null
        }
        Update: {
          amount_minor?: number
          available_at?: string
          balance_after_minor?: number
          created_at?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          seller_id?: string
          sub_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_ledger_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_ledger_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_pickup_addresses: {
        Row: {
          area: string
          city: string
          created_at: string
          deleted_at: string | null
          full_name: string
          id: string
          is_default: boolean
          phone: string
          postal_code: string | null
          province: string
          seller_id: string
          street: string
          updated_at: string
        }
        Insert: {
          area: string
          city: string
          created_at?: string
          deleted_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean
          phone: string
          postal_code?: string | null
          province: string
          seller_id: string
          street: string
          updated_at?: string
        }
        Update: {
          area?: string
          city?: string
          created_at?: string
          deleted_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string
          postal_code?: string | null
          province?: string
          seller_id?: string
          street?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_pickup_addresses_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          business_name: string
          business_type: string | null
          commission_rate_bps: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          logo: string | null
          owner_profile_id: string
          rating_avg: number
          return_window_days: number
          slug: string
          status: Database["public"]["Enums"]["seller_status"]
          updated_at: string
        }
        Insert: {
          business_name: string
          business_type?: string | null
          commission_rate_bps?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          owner_profile_id: string
          rating_avg?: number
          return_window_days?: number
          slug: string
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
        }
        Update: {
          business_name?: string
          business_type?: string | null
          commission_rate_bps?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          owner_profile_id?: string
          rating_avg?: number
          return_window_days?: number
          slug?: string
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellers_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          created_at: string
          id: string
          location: string | null
          occurred_at: string
          raw: Json | null
          shipment_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          occurred_at: string
          raw?: Json | null
          shipment_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          occurred_at?: string
          raw?: Json | null
          shipment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          booked_at: string | null
          cod_amount_minor: number
          courier_code: string
          created_at: string
          delivered_at: string | null
          id: string
          label_url: string | null
          status: string
          sub_order_id: string
          tracking_number: string
          updated_at: string
        }
        Insert: {
          booked_at?: string | null
          cod_amount_minor?: number
          courier_code: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          label_url?: string | null
          status: string
          sub_order_id: string
          tracking_number: string
          updated_at?: string
        }
        Update: {
          booked_at?: string | null
          cod_amount_minor?: number
          courier_code?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          label_url?: string | null
          status?: string
          sub_order_id?: string
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_courier_code_fkey"
            columns: ["courier_code"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "shipments_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_orders: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          order_id: string
          seller_id: string
          shipping_minor: number
          status: Database["public"]["Enums"]["sub_order_status"]
          subtotal_minor: number
          total_minor: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_id: string
          seller_id: string
          shipping_minor: number
          status?: Database["public"]["Enums"]["sub_order_status"]
          subtotal_minor: number
          total_minor: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_id?: string
          seller_id?: string
          shipping_minor?: number
          status?: Database["public"]["Enums"]["sub_order_status"]
          subtotal_minor?: number
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cod_confirmation_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "no_response"
      coupon_discount_type: "percent" | "fixed"
      ledger_entry_type:
        | "sale"
        | "commission"
        | "shipping_fee"
        | "refund"
        | "adjustment"
        | "payout"
      offer_status:
        | "pending"
        | "countered"
        | "accepted"
        | "rejected"
        | "expired"
      payment_method:
        | "cod"
        | "jazzcash"
        | "easypaisa"
        | "card"
        | "bank_transfer"
      payment_status:
        | "pending"
        | "authorized"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      payout_status: "requested" | "approved" | "paid" | "failed"
      product_status:
        | "draft"
        | "pending_review"
        | "active"
        | "rejected"
        | "archived"
      return_status:
        | "requested"
        | "approved"
        | "rejected"
        | "in_transit"
        | "received"
        | "refunded"
      review_status: "pending" | "published" | "hidden"
      role_type: "superadmin" | "admin_staff" | "seller" | "customer"
      seller_status: "pending" | "approved" | "rejected" | "suspended"
      sub_order_status:
        | "awaiting_confirmation"
        | "pending"
        | "confirmed"
        | "packed"
        | "ready_to_ship"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cod_confirmation_status: [
        "pending",
        "confirmed",
        "cancelled",
        "no_response",
      ],
      coupon_discount_type: ["percent", "fixed"],
      ledger_entry_type: [
        "sale",
        "commission",
        "shipping_fee",
        "refund",
        "adjustment",
        "payout",
      ],
      offer_status: ["pending", "countered", "accepted", "rejected", "expired"],
      payment_method: ["cod", "jazzcash", "easypaisa", "card", "bank_transfer"],
      payment_status: [
        "pending",
        "authorized",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      payout_status: ["requested", "approved", "paid", "failed"],
      product_status: [
        "draft",
        "pending_review",
        "active",
        "rejected",
        "archived",
      ],
      return_status: [
        "requested",
        "approved",
        "rejected",
        "in_transit",
        "received",
        "refunded",
      ],
      review_status: ["pending", "published", "hidden"],
      role_type: ["superadmin", "admin_staff", "seller", "customer"],
      seller_status: ["pending", "approved", "rejected", "suspended"],
      sub_order_status: [
        "awaiting_confirmation",
        "pending",
        "confirmed",
        "packed",
        "ready_to_ship",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
    },
  },
} as const
