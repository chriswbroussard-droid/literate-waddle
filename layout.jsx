export const metadata = {
  title: "ChaoticColors",
  description: "ChaoticColors by ChaoticColorDesigns",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
