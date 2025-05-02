export const metadata = {
  title: 'Jasper - Sign In',
}

export default function SignInLayout({ children }) {
  return (
    <div
      className="
          flex items-center justify-center 
          min-h-screen 
          bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200
          p-6
        ">
      {children}
    </div>
  )
}
