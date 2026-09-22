import { NextRequest, NextResponse } from 'next/server';
import { catalogStore, type CatalogProduct } from '@/lib/catalog-store';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('admin') === 'true';
    const alertsOnly = searchParams.get('stock_alerts') === 'true';

    if (alertsOnly) {
      const alerts = catalogStore.getStockAlerts();
      return NextResponse.json({ success: true, alerts });
    }

    // Try reading products from Supabase first
    try {
      const admin = createAdminClient();
      const { data: dbProducts, error } = await (admin
        .from('products') as any)
        .select(`
          id,
          title,
          slug,
          description,
          base_price,
          rating,
          review_count,
          is_archived,
          categories ( slug, name ),
          product_variants (
            id,
            color_name,
            color_hex,
            sku,
            stock_quantity,
            additional_price,
            images
          )
        `);

      if (!error && dbProducts && dbProducts.length > 0) {
        const transformed: CatalogProduct[] = dbProducts.map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.description || '',
          base_price: p.base_price,
          rating: Number(p.rating) || 5,
          review_count: p.review_count || 1,
          category: p.categories?.slug || 'hijabs-scarves',
          category_name: p.categories?.name || 'Hijabs & Scarves',
          image: p.product_variants?.[0]?.images?.[0] || '/images/collection_hijabs.jpg',
          images: p.product_variants?.[0]?.images || [],
          is_archived: Boolean(p.is_archived),
          variants: (p.product_variants || []).map((v: any) => ({
            id: v.id,
            color_name: v.color_name,
            color_hex: v.color_hex,
            sku: v.sku,
            stock_quantity: v.stock_quantity,
            additional_price: v.additional_price,
            images: v.images,
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // Sync with local memory store
        transformed.forEach((tp) => catalogStore.upsert(tp));
      }
    } catch (e) {
      console.warn('Supabase products fetch fallback to catalogStore:', e);
    }

    const products = catalogStore.getAll(includeArchived);
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, description, category, base_price, variants, is_archived } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    const newProduct: CatalogProduct = {
      id: body.id || `prod_${Date.now()}`,
      title,
      slug: slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
      description: description || '',
      category: category || 'hijabs-scarves',
      category_name: (category || 'hijabs-scarves').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      base_price: Number(base_price) || 2500,
      rating: 5,
      review_count: 0,
      image: body.image || '/images/collection_hijabs.jpg',
      badge: 'New',
      is_archived: Boolean(is_archived),
      variants: (variants || []).map((v: any, i: number) => ({
        id: v.id || `var_${Date.now()}_${i}`,
        color_name: v.color_name || 'Classic',
        color_hex: v.color_hex || '#1A1A1A',
        sku: v.sku || `VC-${slug.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
        stock_quantity: Number(v.stock_quantity) || 0,
        additional_price: Number(v.additional_price) || 0,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to shared catalog store
    const saved = catalogStore.upsert(newProduct);

    // Also persist to Supabase database via admin client
    try {
      const admin = createAdminClient();
      await (admin.from('products') as any).upsert({
        id: saved.id,
        title: saved.title,
        slug: saved.slug,
        description: saved.description,
        base_price: saved.base_price,
        is_published: true,
        is_archived: saved.is_archived,
      });

      for (const v of saved.variants) {
        await (admin.from('product_variants') as any).upsert({
          id: v.id,
          product_id: saved.id,
          color_name: v.color_name,
          color_hex: v.color_hex,
          sku: v.sku,
          stock_quantity: v.stock_quantity,
          additional_price: v.additional_price,
        });
      }
    } catch (e) {
      console.warn('Supabase product sync warning:', e);
    }

    return NextResponse.json({ success: true, product: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const existing = catalogStore.getById(id);
    if (!existing) {
      // Upsert anyway
      return POST(req);
    }

    const updatedProduct: CatalogProduct = {
      ...existing,
      ...body,
      updated_at: new Date().toISOString(),
    };

    const saved = catalogStore.upsert(updatedProduct);

    // Sync to Supabase
    try {
      const admin = createAdminClient();
      await (admin.from('products') as any).update({
        title: saved.title,
        slug: saved.slug,
        description: saved.description,
        base_price: saved.base_price,
        is_archived: saved.is_archived,
        updated_at: new Date().toISOString(),
      }).eq('id', saved.id);

      for (const v of saved.variants) {
        await (admin.from('product_variants') as any).upsert({
          id: v.id,
          product_id: saved.id,
          color_name: v.color_name,
          color_hex: v.color_hex,
          sku: v.sku,
          stock_quantity: v.stock_quantity,
          additional_price: v.additional_price,
        });
      }
    } catch (e) {
      console.warn('Supabase product update warning:', e);
    }

    return NextResponse.json({ success: true, product: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    catalogStore.delete(id);

    try {
      const admin = createAdminClient();
      await (admin.from('products') as any).delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase product delete warning:', e);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
