"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  doc,
  setDoc,
  serverTimestamp,
  increment,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booth } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booth: Booth;
  onComplete: (boothKey: string) => void; // ✅ boothIdx string으로 통일
}

export function QuizDialog({
  open,
  onOpenChange,
  booth,
  onComplete,
}: QuizDialogProps) {
  const { userProfile, updateUserProfile } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<
    "correct" | "incorrect" | "already" | null
  >(null);

  const quiz = booth.quiz;
  const boothKey = booth.boothIdx.toString(); // ✅ 통일 키

  useEffect(() => {
    // 다이얼로그 열릴 때 상태 초기화
    if (open) {
      setSelectedAnswer(null);
      setIsSubmitting(false);
      setResult(null);
    }
  }, [open]);

  if (!quiz || !userProfile) return null;

  const handleSubmit = async () => {
    if (selectedAnswer === null || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // ✅ 이미 퀴즈 보상 받은 적 있으면 막기
      const rewardRef = doc(
        db,
        "users",
        userProfile.uid,
        "quizRewards",
        boothKey
      );
      const rewardSnap = await getDoc(rewardRef);
      if (rewardSnap.exists()) {
        setResult("already");
        onComplete(boothKey); // ✅ UI 즉시 반영
        return;
      }

      const isCorrect = selectedAnswer === quiz.correctAnswer;

      // ✅ 퀴즈 결과 저장 (문서 ID는 boothIdx)
      await setDoc(rewardRef, {
        boothIdx: booth.boothIdx,
        answeredAt: serverTimestamp(),
        mileageEarned: isCorrect ? 10 : 0,
        isCorrect,
      });

      if (isCorrect) {
        await setDoc(
          doc(db, "users", userProfile.uid),
          {
            baseMileage: increment(10),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 로컬 상태 업데이트(즉시 반영)
        await updateUserProfile({
          baseMileage: (userProfile.baseMileage ?? 0) + 10,
        });
      }

      // 로그 기록(여기도 boothIdx로)
      await setDoc(
        doc(
          db,
          "users",
          userProfile.uid,
          "logs",
          `quiz_${boothKey}_${Date.now()}`
        ),
        {
          type: "quiz",
          boothIdx: booth.boothIdx,
          isCorrect,
          mileageChange: isCorrect ? 10 : 0,
          timestamp: serverTimestamp(),
        }
      );

      setResult(isCorrect ? "correct" : "incorrect");
      onComplete(boothKey); // ✅ 여기서도 boothIdx로 UI 반영
    } catch (error) {
      console.error("퀴즈 제출 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{booth.name} 퀴즈</DialogTitle>
          <DialogDescription>
            정답을 맞추면 +10 마일리지를 받을 수 있어요!
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="text-center py-6">
            {result === "already" ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  이미 완료된 퀴즈예요
                </h3>
                <p className="text-muted-foreground">
                  중복 적립은 불가능합니다
                </p>
              </>
            ) : result === "correct" ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  정답입니다!
                </h3>
                <p className="text-muted-foreground">
                  +10 마일리지가 적립되었습니다
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-bold text-destructive mb-2">
                  오답입니다
                </h3>
                <p className="text-muted-foreground">
                  다음 기회에 도전해보세요!
                </p>
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

            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || isSubmitting}
              className="w-full"
            >
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
  );
}
