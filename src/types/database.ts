/**
 * Veiled Canvas — Database Type Definitions
 * Manually typed to match the Supabase schema defined in 001_schema.sql
 */

export type UserRole = 'customer' | 'admin';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ContactStatus = 'unread' | 'resolved';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          role?: UserRole;
          phone?: string | null;
          avatar_url?: string | null;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          recipient_name: string;
          street_address: string;
          city: string;
          state: string | null;
          postal_code: string;
          country: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_name: string;
          street_address: string;
          city: string;
          state?: string | null;
          postal_code: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          recipient_name?: string;
          street_address?: string;
          city?: string;
          state?: string | null;
          postal_code?: string;
          country?: string;
          is_default?: boolean;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          title: string;
          slug: string;
          description: string | null;
          base_price: number;
          is_published: boolean;
          is_archived: boolean;
          rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          title: string;
          slug: string;
          description?: string | null;
          base_price: number;
          is_published?: boolean;
          is_archived?: boolean;
          rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          title?: string;
          slug?: string;
          description?: string | null;
          base_price?: number;
          is_published?: boolean;
          is_archived?: boolean;
          rating?: number;
          review_count?: number;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          color_name: string;
          color_hex: string;
          size: string | null;
          sku: string;
          stock_quantity: number;
          additional_price: number;
          images: string[];
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          color_name: string;
          color_hex?: string;
          size?: string | null;
          sku: string;
          stock_quantity?: number;
          additional_price?: number;
          images?: string[];
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
          color_name?: string;
          color_hex?: string;
          size?: string | null;
          sku?: string;
          stock_quantity?: number;
          additional_price?: number;
          images?: string[];
          is_archived?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          guest_email: string | null;
          status: OrderStatus;
          total_amount: number;
          currency: string;
          stripe_session_id: string | null;
          stripe_payment_intent: string | null;
          shipping_address_snapshot: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_email?: string | null;
          status?: OrderStatus;
          total_amount: number;
          currency?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          shipping_address_snapshot?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          guest_email?: string | null;
          status?: OrderStatus;
          total_amount?: number;
          currency?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          shipping_address_snapshot?: Record<string, unknown> | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          product_title: string;
          variant_label: string;
          quantity: number;
          price_at_purchase: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id: string;
          product_title: string;
          variant_label: string;
          quantity: number;
          price_at_purchase: number;
        };
        Update: {
          quantity?: number;
          price_at_purchase?: number;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_image: string | null;
          author_name: string;
          category: string | null;
          tags: string[];
          read_time: number;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string;
          cover_image?: string | null;
          author_name?: string;
          category?: string | null;
          tags?: string[];
          read_time?: number;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          cover_image?: string | null;
          author_name?: string;
          category?: string | null;
          tags?: string[];
          read_time?: number;
          is_published?: boolean;
          published_at?: string | null;
        };
      };
      testimonials: {
        Row: {
          id: string;
          product_id: string | null;
          customer_name: string;
          customer_avatar: string | null;
          location: string | null;
          collection_tag: string | null;
          rating: number;
          review_text: string;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          customer_name: string;
          customer_avatar?: string | null;
          location?: string | null;
          collection_tag?: string | null;
          rating: number;
          review_text: string;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          product_id?: string | null;
          customer_name?: string;
          customer_avatar?: string | null;
          location?: string | null;
          collection_tag?: string | null;
          rating?: number;
          review_text?: string;
          is_featured?: boolean;
        };
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          is_active: boolean;
          subscribed_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          is_active?: boolean;
          subscribed_at?: string;
        };
        Update: {
          email?: string;
          is_active?: boolean;
        };
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          status: ContactStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject?: string | null;
          message: string;
          status?: ContactStatus;
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          subject?: string | null;
          message?: string;
          status?: ContactStatus;
        };
      };
      stripe_events: {
        Row: {
          id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: never;
      };
    };
    Views: {
      product_catalog: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          base_price: number;
          rating: number;
          review_count: number;
          is_published: boolean;
          is_archived: boolean;
          created_at: string;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          variants: ProductVariantJson[] | null;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      contact_status: ContactStatus;
    };
  };
}

/** JSON shape returned by the product_catalog view's variants column */
export interface ProductVariantJson {
  id: string;
  color_name: string;
  color_hex: string;
  size: string | null;
  sku: string;
  stock_quantity: number;
  additional_price: number;
  images: string[];
  is_archived: boolean;
}

/** Convenience type aliases */
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
export type Testimonial = Database['public']['Tables']['testimonials']['Row'];
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row'];
export type ContactSubmission = Database['public']['Tables']['contact_submissions']['Row'];
export type ProductCatalogItem = Database['public']['Views']['product_catalog']['Row'];
