import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="TorcidaClub" width={240} height={72} className="object-contain" />
        </div>

        {/* Conteúdo */}
        {children}
      </div>
    </div>
  )
}
