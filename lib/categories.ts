import { resolveCdnUrl } from "@/lib/cdn";

export type CategoryLeaf = {
  id: string;
  name: string;
  image: string | null;
  parentId: string;
};

export type CategoryParent = {
  id: string;
  name: string;
  image: string | null;
  children: CategoryLeaf[];
};

function mapLeaf(raw: unknown, parentId: string): CategoryLeaf | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  const name = String(o.name ?? "").trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    image: typeof o.image === "string" ? resolveCdnUrl(o.image) || null : null,
    parentId,
  };
}

export function normalizeCategoryParents(data: unknown): CategoryParent[] {
  const rows = Array.isArray(data) ? data : [];
  return rows
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const c = raw as Record<string, unknown>;
      const id = String(c.id ?? "").trim();
      const name = String(c.name ?? "").trim();
      if (!id || !name) return null;
      const childrenRaw = Array.isArray(c.children) ? c.children : [];
      const children = childrenRaw
        .map((ch) => mapLeaf(ch, id))
        .filter(Boolean) as CategoryLeaf[];
      return {
        id,
        name,
        image: typeof c.image === "string" ? resolveCdnUrl(c.image) || null : null,
        children,
      };
    })
    .filter(Boolean) as CategoryParent[];
}

export function productMatchesLeaf(
  productCategory: string | null,
  leaf: CategoryLeaf,
) {
  if (!productCategory) return false;
  return productCategory === leaf.id || productCategory === leaf.name;
}

export function productMatchesAnyChild(
  productCategory: string | null,
  children: CategoryLeaf[],
) {
  return children.some((ch) => productMatchesLeaf(productCategory, ch));
}

export function findLeafByParam(
  parents: CategoryParent[],
  categoryParam: string,
): CategoryLeaf | undefined {
  const trimmed = categoryParam.trim();
  if (!trimmed) return undefined;
  for (const p of parents) {
    const byId = p.children.find((ch) => ch.id === trimmed);
    if (byId) return byId;
    const byName = p.children.find((ch) => ch.name === trimmed);
    if (byName) return byName;
  }
  return undefined;
}

export function findParentForLeaf(
  parents: CategoryParent[],
  leaf: CategoryLeaf,
) {
  return parents.find((p) => p.id === leaf.parentId);
}

export function pickCardImage(parent: CategoryParent): string {
  if (parent.image) return parent.image;
  const withImg = parent.children.find((ch) => ch.image);
  return withImg?.image ?? "/images/products/";
}
