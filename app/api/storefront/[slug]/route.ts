import { connection } from "next/server";
import { StorefrontSchema } from "@/lib/schemas";
import { getStorefront, saveStorefront } from "@/lib/storefront-store";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  await connection();
  const { slug } = await params;
  const storefront = await getStorefront(slug);

  if (!storefront) {
    return Response.json({ error: "Storefront not found." }, { status: 404 });
  }

  return Response.json({ storefront });
}

export async function PATCH(request: Request, { params }: Params) {
  await connection();
  const { slug } = await params;
  const existing = await getStorefront(slug);

  if (!existing) {
    return Response.json({ error: "Storefront not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const candidate = {
      ...existing,
      ...body,
      slug: existing.slug,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    if (Array.isArray(candidate.products)) {
      const featuredIndex = candidate.products.findIndex(
        (product: { featured?: boolean }) => product.featured,
      );
      candidate.products = candidate.products.map(
        (product: { featured?: boolean }, index: number) => ({
          ...product,
          featured: featuredIndex >= 0 ? index === featuredIndex : index === 0,
        }),
      );
    }

    const merged = StorefrontSchema.parse(candidate);

    await saveStorefront(merged);
    return Response.json({ storefront: merged });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update storefront.";
    return Response.json({ error: message }, { status: 400 });
  }
}
