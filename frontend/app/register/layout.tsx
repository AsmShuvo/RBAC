import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - RBAC Platform",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
