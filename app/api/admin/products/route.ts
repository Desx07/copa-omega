import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// POST /api/admin/products — Create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check admin
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, stock, image_urls } = body;

    // Validate required fields
    if (!name || price == null) {
      return Response.json(
        { error: "Faltan campos: name, price" },
        { status: 400 }
      );
    }

    // Validate price
    if (typeof price !== "number" || price < 0) {
      return Response.json(
        { error: "El precio debe ser un número >= 0" },
        { status: 400 }
      );
    }

    // Validate stock
    if (stock != null && (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0)) {
      return Response.json(
        { error: "El stock debe ser un entero >= 0" },
        { status: 400 }
      );
    }

    // Insert product
    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        name,
        description: description || null,
        price,
        stock: stock ?? 0,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Insert images if provided
    if (Array.isArray(image_urls) && image_urls.length > 0) {
      const imageRows = image_urls.map((url: string, index: number) => ({
        product_id: product.id,
        image_url: url,
        sort_order: index,
      }));

      const { error: imgError } = await supabase
        .from("product_images")
        .insert(imageRows);

      if (imgError) {
        console.error("Error inserting product images:", imgError);
        // Product was created, images failed — return product with warning
        return Response.json(
          { ...product, images: [], _warning: "Producto creado pero las imágenes fallaron" },
          { status: 201 }
        );
      }
    }

    // Re-fetch with images
    const { data: full } = await supabase
      .from("products")
      .select("*, images:product_images(id, image_url, sort_order)")
      .eq("id", product.id)
      .single();

    return Response.json(full, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/products error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
