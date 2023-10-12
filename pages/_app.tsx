import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import Script from 'next/script'
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Raleway } from 'next/font/google';
import  {  ClerkProvider  }  from  '@clerk/nextjs';

import AuthContextProvider from "../contexts/authContext";
import '@/styles/globals.css';

const inter = Raleway({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();

  return (
    <>
    <ClerkProvider>
    <AuthContextProvider>
    <div className={inter.className}>
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </div>
    </AuthContextProvider>
    </ClerkProvider>
    <Script src="//code.tidio.co/shqay9dyzehoqprjvcmzj0veozd4gfy8.js" />

    </>
  );
}

export default appWithTranslation(App);
