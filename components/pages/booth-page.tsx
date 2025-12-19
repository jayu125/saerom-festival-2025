"use client";

import { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { useAuth } from "@/contexts/auth-context";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booth } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Check, HelpCircle, Loader2, Users } from "lucide-react";
import { QuizDialog } from "@/components/quiz-dialog";

export function BoothPage() {
  const { userProfile } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [visitedBooths, setVisitedBooths] = useState<Set<string>>(new Set());
  const [quizCompleted, setQuizCompleted] = useState<Set<string>>(new Set());
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const floors =
    booths.length > 0
      ? ["all", ...Array.from(new Set(booths.map((b) => b.floor))).sort()]
      : ["all"];

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;

      try {
        const boothsQuery = query(
          collection(db, "booths"),
          orderBy("visitCount", "desc")
        );
        const boothsSnapshot = await getDocs(boothsQuery);
        const boothsData: Booth[] = [];
        boothsSnapshot.forEach((doc) => {
          boothsData.push({
            id: doc.id,
            ...doc.data(),
          } as Booth);
        });
        setBooths(boothsData);

        const visitsSnapshot = await getDocs(
          collection(db, "users", userProfile.uid, "boothVisits")
        );
        const visited = new Set<string>();
        visitsSnapshot.forEach((doc) => {
          visited.add(doc.id);
        });
        setVisitedBooths(visited);

        const quizSnapshot = await getDocs(
          collection(db, "users", userProfile.uid, "quizRewards")
        );
        const completed = new Set<string>();
        quizSnapshot.forEach((doc) => {
          completed.add(doc.id);
        });
        setQuizCompleted(completed);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const handleQuizClick = (booth: Booth) => {
    setSelectedBooth(booth);
    setIsQuizOpen(true);
  };

  const handleQuizComplete = (boothId: string) => {
    setQuizCompleted((prev) => new Set([...prev, boothId]));
  };

  if (loading) {
    return (
      <LoaderWrap>
        <Loader2 />
      </LoaderWrap>
    );
  }

  if (booths.length === 0) {
    return (
      <Page>
        <EmptyTitle>부스 안내</EmptyTitle>
        <EmptyDesc>아직 등록된 부스가 없습니다.</EmptyDesc>
      </Page>
    );
  }

  return (
    <Page>
      <Header>
        <Title>부스 안내</Title>
        <Subtitle>층별 부스를 확인하고 NFC로 방문하세요</Subtitle>
      </Header>

      <Tabs defaultValue="all" className="w-full">
        <StyledTabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="1">1층</TabsTrigger>
          <TabsTrigger value="2">2층</TabsTrigger>
          <TabsTrigger value="3">3층</TabsTrigger>
          <TabsTrigger value="4">4층</TabsTrigger>
        </StyledTabsList>

        <StyledTabsContent value="all">
          {booths.map((booth) => {
            const isVisited = visitedBooths.has(booth.boothIdx.toString());
            const isQuizDone = quizCompleted.has(booth.boothIdx.toString());

            return (
              <BoothCard key={booth.id} $visited={isVisited}>
                <StyledCardHeader>
                  <HeaderRow>
                    <HeaderLeft>
                      <StyledCardTitle>
                        {booth.name}
                        {isVisited && (
                          <SmallBadge variant="secondary">
                            <IconXS as={Check} />
                            방문완료
                          </SmallBadge>
                        )}
                      </StyledCardTitle>

                      <StyledCardDescription>
                        <IconXS as={MapPin} />
                        {booth.location}
                      </StyledCardDescription>
                    </HeaderLeft>

                    <CountWrap>
                      <IconXS as={Users} />
                      {booth.visitCount}
                    </CountWrap>
                  </HeaderRow>
                </StyledCardHeader>

                <CardContent>
                  <DescText>{booth.description}</DescText>

                  {isVisited && booth.quiz && (
                    <FullButton
                      variant={isQuizDone ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleQuizClick(booth)}
                      disabled={isQuizDone}
                    >
                      <IconSM as={HelpCircle} />
                      {isQuizDone ? "퀴즈 완료" : "퀴즈 풀기 (+10 마일리지)"}
                    </FullButton>
                  )}

                  {!isVisited && (
                    <HintText>NFC 태그를 스캔하여 방문하세요</HintText>
                  )}
                </CardContent>
              </BoothCard>
            );
          })}
        </StyledTabsContent>

        {[1, 2, 3, 4].map((floor) => (
          <StyledTabsContent key={floor} value={floor.toString()}>
            {booths
              .filter((booth) => booth.floor === floor)
              .map((booth) => {
                const isVisited = visitedBooths.has(booth.boothIdx.toString());
                const isQuizDone = quizCompleted.has(booth.boothIdx.toString());

                return (
                  <BoothCard key={booth.id} $visited={isVisited}>
                    <StyledCardHeader>
                      <HeaderRow>
                        <HeaderLeft>
                          <StyledCardTitle>
                            {booth.name}
                            {isVisited && (
                              <SmallBadge variant="secondary">
                                <IconXS as={Check} />
                                방문완료
                              </SmallBadge>
                            )}
                          </StyledCardTitle>

                          <StyledCardDescription>
                            <IconXS as={MapPin} />
                            {booth.location}
                          </StyledCardDescription>
                        </HeaderLeft>

                        <CountWrap>
                          <IconXS as={Users} />
                          {booth.visitCount}
                        </CountWrap>
                      </HeaderRow>
                    </StyledCardHeader>

                    <CardContent>
                      <DescText>{booth.description}</DescText>

                      {isVisited && booth.quiz && (
                        <FullButton
                          variant={isQuizDone ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleQuizClick(booth)}
                          disabled={isQuizDone}
                        >
                          <IconSM as={HelpCircle} />
                          {isQuizDone
                            ? "퀴즈 완료"
                            : "퀴즈 풀기 (+10 마일리지)"}
                        </FullButton>
                      )}

                      {!isVisited && (
                        <HintText>NFC 태그를 스캔하여 방문하세요</HintText>
                      )}
                    </CardContent>
                  </BoothCard>
                );
              })}
          </StyledTabsContent>
        ))}
      </Tabs>

      {selectedBooth && (
        <QuizDialog
          open={isQuizOpen}
          onOpenChange={setIsQuizOpen}
          booth={selectedBooth}
          onComplete={handleQuizComplete}
        />
      )}
    </Page>
  );
}

/* styled-components */

const Page = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Header = styled.div``;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
`;

const LoaderWrap = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 1.5rem;
    height: 1.5rem;
    color: hsl(var(--primary));
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const EmptyDesc = styled.p`
  color: hsl(var(--muted-foreground));
`;

const StyledTabsList = styled(TabsList)`
  height: 300px;
  display: grid;
  grid-template-rows: repeat(5, minmax(0, 1fr));
  position: fixed;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 35px;
`;

const StyledTabsContent = styled(TabsContent)`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-left: 50px;
`;

const BoothCard = styled(Card)<{ $visited: boolean }>`
  ${({ $visited }) =>
    $visited &&
    css`
      border-color: hsl(var(--primary) / 0.3);
      background: hsl(var(--primary) / 0.05);
    `}
`;

const StyledCardHeader = styled(CardHeader)`
  padding-bottom: 0.5rem;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

const HeaderLeft = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledCardTitle = styled(CardTitle)`
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledCardDescription = styled(CardDescription)`
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CountWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
`;

const SmallBadge = styled(Badge)`
  font-size: 0.75rem;
`;

const DescText = styled.p`
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.75rem;
`;

const FullButton = styled(Button)`
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const HintText = styled.p`
  font-size: 0.75rem;
  text-align: center;
  color: hsl(var(--muted-foreground));
  padding: 0.5rem 0;
`;

const IconXS = styled.span`
  display: inline-flex;

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

const IconSM = styled.span`
  display: inline-flex;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;
