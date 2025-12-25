"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function InvalidStudentScreen() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
          <CardTitle>학생 계정이 아닙니다</CardTitle>
          <CardDescription>
            이 서비스는
            <br />
            <b>학번 + 이름 형식의 새롬고 학생 계정</b>만 사용할 수 있어요.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            현재 로그인 계정:
            <br />
            <b>{user?.email}</b>
          </div>

          <Button onClick={signOut} variant="destructive" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
