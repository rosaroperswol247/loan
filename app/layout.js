import './globals.css';

export const metadata = {
  title: 'মাই ব্যাংক (MyBank) - ঋণ আবেদন ও ব্যবস্থাপনা পোর্টাল',
  description: 'MyBank Bangladesh - Digital Loan Application & Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
