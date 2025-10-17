import type { AppProps } from 'next/app';
import '../globals.css'; // tenemos globals.css en la raíz (lo trajo create-next-app)

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}