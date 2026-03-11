import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - RBAC Platform",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
