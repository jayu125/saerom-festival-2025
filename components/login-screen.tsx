"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PartyPopper, Sparkles } from "lucide-react"

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError("로그인에 실패했습니다. 새롬고 Google 계정으로 다시 시도해주세요.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
          <PartyPopper className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">새롬 축제</h1>
        <p className="text-muted-foreground">NFC로 즐기는 스마트 축제</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>로그인</CardTitle>
          <CardDescription>새롬고 Google 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleLogin} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              "로그인 중..."
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Google로 로그인
              </>
            )}
          </Button>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <p className="text-xs text-center text-muted-foreground">@saerom.hs.kr 계정만 로그인 가능합니다</p>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">NFC</div>
          <div className="text-muted-foreground">태깅으로 방문</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">스탬프</div>
          <div className="text-muted-foreground">부스별 수집</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">퀴즈</div>
          <div className="text-muted-foreground">마일리지 적립</div>
        </div>
      </div>
    </div>
  )
}
