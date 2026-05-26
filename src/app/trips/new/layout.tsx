import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New trip',
};

export default function NewTripLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
