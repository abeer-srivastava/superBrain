import { ItemView } from "@/components/item/item-view";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ItemView id={id} />;
}
