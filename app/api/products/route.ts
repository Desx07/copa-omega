import { createClient } from "@/lib/supabase/server";

// GET /api/products — List active products with images
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("*, images:product_images(id, image_url, sort_order)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Sort images by sort_order within each product
    const result = (products ?? []).map((p) => ({
      ...p,
      images: (p.images ?? []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    }));

    return Response.json(result);
  } catch (err) {
    console.error("GET /api/products error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
