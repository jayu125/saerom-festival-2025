"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { doc, setDoc, serverTimestamp, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Booth } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface QuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booth: Booth
  onComplete: (boothId: string) => void
}

export function QuizDialog({ open, onOpenChange, booth, onComplete }: QuizDialogProps) {
  const { userProfile, updateUserProfile } = useAuth()
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)

  const quiz = booth.quiz

  if (!quiz || !userProfile) return null

  const handleSubmit = async () => {
    if (selectedAnswer === null) return

    setIsSubmitting(true)
    const isCorrect = selectedAnswer === quiz.correctAnswer

    try {
      // 퀴즈 결과 저장
      await setDoc(doc(db, "users", userProfile.uid, "quizRewards", booth.id), {
        boothId: booth.id,
        answeredAt: serverTimestamp(),
        mileageEarned: isCorrect ? 10 : 0,
        isCorrect,
      })

      // 정답인 경우 마일리지 추가
      if (isCorrect) {
        await setDoc(
          doc(db, "users", userProfile.uid),
          {
            baseMileage: increment(10),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        // 로컬 상태 업데이트
        await updateUserProfile({
          baseMileage: userProfile.baseMileage + 10,
        })
      }

      // 로그 기록
      await setDoc(doc(db, "users", userProfile.uid, "logs", `quiz_${booth.id}_${Date.now()}`), {
        type: "quiz",
        boothId: booth.id,
        isCorrect,
        mileageChange: isCorrect ? 10 : 0,
        timestamp: serverTimestamp(),
      })

      setResult(isCorrect ? "correct" : "incorrect")
      onComplete(booth.id)
    } catch (error) {
      console.error("퀴즈 제출 실패:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedAnswer(null)
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{booth.name} 퀴즈</DialogTitle>
          <DialogDescription>정답을 맞추면 +10 마일리지를 받을 수 있어요!</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="text-center py-6">
            {result === "correct" ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-600 mb-2">정답입니다!</h3>
                <p className="text-muted-foreground">+10 마일리지가 적립되었습니다</p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-bold text-destructive mb-2">오답입니다</h3>
                <p className="text-muted-foreground">다음 기회에 도전해보세요!</p>
              </>
            )}
            <Button onClick={handleClose} className="mt-4">
              닫기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-medium text-lg">{quiz.question}</p>

            <div className="space-y-2">
              {quiz.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedAnswer === index
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 text-foreground"
                  }`}
                >
                  <span className="font-medium mr-2">{index + 1}.</span>
                  {option}
                </button>
              ))}
            </div>

            <Button onClick={handleSubmit} disabled={selectedAnswer === null || isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  제출 중...
                </>
              ) : (
                "정답 제출"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
