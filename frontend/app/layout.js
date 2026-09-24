import './globals.css'
export const metadata = { title: 'vote-min', description: 'One question. One ballot each.' }
export default function Layout({ children }) {
  return <html lang="en"><body><main>{children}</main><footer>vote-min: no accounts, no cookies, no device data</footer></body></html>
}
