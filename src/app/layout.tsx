import Providers from "@/components/Providers";
import "./globals.css";

//even switching pages layout page never rerenders
export const metadata = {
  title: "Realtime Chat App",
  description: "Realtime live chat app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
