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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string
          delivery_fee: number
          estimated_time: string
          id: string
          is_active: boolean
          min_order: number
          radius_km: number
          store_id: string
          updated_at: string
          zone_name: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          estimated_time?: string
          id?: string
          is_active?: boolean
          min_order?: number
          radius_km?: number
          store_id: string
          updated_at?: string
          zone_name: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          estimated_time?: string
          id?: string
          is_active?: boolean
          min_order?: number
          radius_km?: number
          store_id?: string
          updated_at?: string
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_earnings: {
        Row: {
          created_at: string | null
          driver_id: string
          gross_amount: number
          id: string
          net_amount: number
          platform_fee: number
          ride_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          gross_amount: number
          id?: string
          net_amount: number
          platform_fee?: number
          ride_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          platform_fee?: number
          ride_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_earnings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          driver_id: string
          heading: number | null
          id: string
          lat: number
          lng: number
          updated_at: string | null
        }
        Insert: {
          driver_id: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          updated_at?: string | null
        }
        Update: {
          driver_id?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          bank_account: string | null
          cnh: string | null
          cpf: string | null
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          full_name: string | null
          id: string
          is_approved: boolean | null
          phone: string | null
          photo_url: string | null
          pix_key: string | null
          rating: number | null
          status: string | null
          total_earnings: number | null
          total_rides: number | null
          user_id: string
          vehicle_brand: string | null
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
          vehicle_year: number | null
        }
        Insert: {
          bank_account?: string | null
          cnh?: string | null
          cpf?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          full_name?: string | null
          id?: string
          is_approved?: boolean | null
          phone?: string | null
          photo_url?: string | null
          pix_key?: string | null
          rating?: number | null
          status?: string | null
          total_earnings?: number | null
          total_rides?: number | null
          user_id: string
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Update: {
          bank_account?: string | null
          cnh?: string | null
          cpf?: string | null
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          full_name?: string | null
          id?: string
          is_approved?: boolean | null
          phone?: string | null
          photo_url?: string | null
          pix_key?: string | null
          rating?: number | null
          status?: string | null
          total_earnings?: number | null
          total_rides?: number | null
          user_id?: string
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          item_id: string
          item_image: string | null
          item_name: string
          item_price: number
          order_id: string
          quantity: number
        }
        Insert: {
          id?: string
          item_id: string
          item_image?: string | null
          item_name: string
          item_price: number
          order_id: string
          quantity?: number
        }
        Update: {
          id?: string
          item_id?: string
          item_image?: string | null
          item_name?: string
          item_price?: number
          order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_fee: number
          id: string
          restaurant_id: string
          restaurant_name: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          id?: string
          restaurant_id: string
          restaurant_name: string
          status?: string
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          id?: string
          restaurant_id?: string
          restaurant_name?: string
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redeemed_coupons: {
        Row: {
          coupon_brand: string
          coupon_code: string
          coupon_discount: string
          coupon_id: string
          coupon_title: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_brand: string
          coupon_code: string
          coupon_discount: string
          coupon_id: string
          coupon_title: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_brand?: string
          coupon_code?: string
          coupon_discount?: string
          coupon_id?: string
          coupon_title?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          replied_at: string | null
          reply: string | null
          store_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating?: number
          replied_at?: string | null
          reply?: string | null
          store_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          replied_at?: string | null
          reply?: string | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          from_user: string
          id: string
          rating: number
          ride_id: string
          to_user: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          from_user: string
          id?: string
          rating: number
          ride_id: string
          to_user: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          from_user?: string
          id?: string
          rating?: number
          ride_id?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string | null
          destination_address: string | null
          destination_lat: number | null
          destination_lng: number | null
          distance_km: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          origin_address: string | null
          origin_lat: number | null
          origin_lng: number | null
          passenger_id: string
          payment_method: string | null
          rating_driver: number | null
          rating_passenger: number | null
          ride_type: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          destination_address?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          distance_km?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          origin_address?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          passenger_id: string
          payment_method?: string | null
          rating_driver?: number | null
          rating_passenger?: number | null
          ride_type?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          destination_address?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          distance_km?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          origin_address?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          passenger_id?: string
          payment_method?: string | null
          rating_driver?: number | null
          rating_passenger?: number | null
          ride_type?: string | null
          status?: string | null
        }
        Relationships: []
      }
      store_promotions: {
        Row: {
          coupon_code: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          min_order: number
          starts_at: string
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order?: number
          starts_at?: string
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order?: number
          starts_at?: string
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address_city: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          category: string
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
