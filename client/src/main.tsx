import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import { App } from './App'
import { StoreProvider } from './store/root.store'
import './index.css'
import { reportWebVitals } from './utils/reportWebVitals'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
// Полифилл для Buffer (нужен для TON Connect)
import { Buffer } from 'buffer'

if (typeof window !== 'undefined' && !(window as any).Buffer) {
  (window as any).Buffer = Buffer
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <React.StrictMode>
      <StoreProvider>
        <TonConnectUIProvider manifestUrl="https://tem4ik.ru/api/tonconnect-manifest.json">
          <App />
        </TonConnectUIProvider>
      </StoreProvider>
    </React.StrictMode>

    <ToastContainer
      position="top-right"
      autoClose={1500}
      className="flex flex-col gap-1 my-2 min-w-[200px] p-2 "
      style={{marginTop: 'calc(var(--tg-safe-area-inset-top) * 2)'}}
      toastClassName={(props) =>
        (props?.defaultClassName ?? "") +
        " backdrop-blur-sm bg-[#232323]  mb-0 w-full rounded-xl h-auto !p-2  text-white flex items-center gap-0.5 text-base !font-bold select-none min-h-12"
      }
      hideProgressBar={true}
      closeButton={false}
      draggable
      draggableDirection="x"
    />


  </>
)

reportWebVitals(console.log);