import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { BookProvider } from "@/contexts/BookContext";
import { WalletProvider } from "@/contexts/WalletContext";
import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <BookProvider>
            <Component {...pageProps} />
            <Toaster />
          </BookProvider>
        </WalletProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
