import { Providers } from "@/libs/chakraprovider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Walkie Talkie",
  description: "Walkie Talkie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
