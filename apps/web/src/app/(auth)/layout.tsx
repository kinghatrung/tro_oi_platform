import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Authentication layout component that redirects authenticated users to the home page.
 * Checks for access token in cookies and redirects if present.
 * @param children - Child components to render within the layout
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (token) {
    redirect('/');
  }

  return <section className="min-h-full">{children}</section>;
}
