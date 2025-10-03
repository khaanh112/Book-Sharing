import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import {BookProvider } from './context/BookContext'
import {BorrowProvider} from './context/BorrowContext'
import { NotificationProvider } from './context/NotificationContext'

createRoot(document.getElementById('root')).render(
  //<StrictMode>
    <BrowserRouter>
     <AuthProvider>
        <NotificationProvider>
          <BookProvider>
            <BorrowProvider>
              <App />
            </BorrowProvider>
         </BookProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
 // </StrictMode>,
)
