import { CartProvider } from "./_components/cart-context";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}
