import './globals.css';
import { Nav } from '@/components/Nav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
