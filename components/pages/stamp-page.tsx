"use client";

import styled, { css } from "styled-components";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Stamp, Check, Lock, Loader2 } from "lucide-react";

// 부스 ID와 이름 매핑 (실제로는 Firestore에서 가져옴)
const boothInfo: Record<string, string> = {
  "1": "포토존",
  "2": "먹거리 부스",
  "3": "게임존",
  "4": "체험 부스",
  "5": "전시관",
};

const totalBooths = Object.keys(boothInfo).length;

export function StampPage() {
  const { userProfile } = useAuth();
  const [visitedBooths, setVisitedBooths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisits = async () => {
      if (!userProfile) return;

      try {
        const visitsSnapshot = await getDocs(
          collection(db, "users", userProfile.uid, "boothVisits")
        );
        const visited = new Set<string>();
        visitsSnapshot.forEach((doc) => {
          visited.add(doc.id);
        });
        setVisitedBooths(visited);
      } catch (error) {
        console.error("방문 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [userProfile]);

  if (loading) {
    return (
      <LoaderWrap>
        <Loader2 />
      </LoaderWrap>
    );
  }

  const stampCount = visitedBooths.size;
  const progress = (stampCount / totalBooths) * 100;

  return (
    <Page>
      <HeaderBlock>
        <Title>스탬프 수집</Title>
        <Subtitle>부스를 방문하고 스탬프를 모으세요!</Subtitle>
      </HeaderBlock>

      {/* Progress Card */}
      <PrimaryCard>
        <PrimaryContent>
          <PrimaryTop>
            <PrimaryLeft>
              <PrimaryIcon>
                <IconMD>
                  <Stamp />
                </IconMD>
              </PrimaryIcon>
              <div>
                <PrimaryLabel>수집한 스탬프</PrimaryLabel>
                <PrimaryCount>
                  {stampCount}
                  <PrimaryTotal>/{totalBooths}</PrimaryTotal>
                </PrimaryCount>
              </div>
            </PrimaryLeft>
          </PrimaryTop>

          <StyledProgress value={progress} />
          <PrimaryHint>
            {stampCount === totalBooths
              ? "축하합니다! 모든 스탬프를 수집했습니다! 🎉"
              : `${totalBooths - stampCount}개의 스탬프가 더 필요합니다`}
          </PrimaryHint>
        </PrimaryContent>
      </PrimaryCard>

      {/* Stamp Grid */}
      <Card>
        <StyledCardHeader>
          <CardTitle className="text-base">스탬프 현황</CardTitle>
          <CardDescription>방문한 부스의 스탬프가 표시됩니다</CardDescription>
        </StyledCardHeader>

        <NormalContent>
          <StampGrid>
            {Object.entries(boothInfo).map(([id, name]) => {
              const isCollected = visitedBooths.has(id);
              return (
                <StampCell key={id} $collected={isCollected}>
                  {isCollected ? (
                    <>
                      <CollectedIcon>
                        <IconSM>
                          <Check />
                        </IconSM>
                      </CollectedIcon>
                      <StampNameCollected title={name}>
                        {name}
                      </StampNameCollected>
                    </>
                  ) : (
                    <>
                      <LockedIcon>
                        <IconSM>
                          <Lock />
                        </IconSM>
                      </LockedIcon>
                      <StampNameLocked title={name}>{name}</StampNameLocked>
                    </>
                  )}
                </StampCell>
              );
            })}
          </StampGrid>
        </NormalContent>
      </Card>

      {/* Info */}
      <Card>
        <NormalContent>
          <TipText>
            💡 <TipStrong>Tip:</TipStrong> 각 부스의 NFC 태그를 스캔하면
            자동으로 스탬프가 적립됩니다. 같은 부스는 한 번만 인정됩니다.
          </TipText>
        </NormalContent>
      </Card>
    </Page>
  );
}

/* ---------------- styled-components ---------------- */

const Page = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HeaderBlock = styled.div``;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: var(--muted-foreground);
`;

const LoaderWrap = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
    color: var(--primary);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/** PrimaryCard는 배경/글자색만. Content는 별도 래핑 */
const PrimaryCard = styled(Card)`
  && {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }
`;

const PrimaryContent = styled(CardContent)`
  padding: 24px;
`;

const NormalContent = styled(CardContent)`
  padding: 16px;
`;

const PrimaryTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const PrimaryLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PrimaryIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  background: var(--primary-foreground) / 0.2;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PrimaryLabel = styled.p`
  font-size: 14px;
  opacity: 0.9;
`;

const PrimaryCount = styled.p`
  font-size: 30px;
  font-weight: 700;
`;

const PrimaryTotal = styled.span`
  font-size: 18px;
  font-weight: 400;
  opacity: 0.75;
`;

/** Progress도 직접 styled로 감싸서 */
const StyledProgress = styled(Progress)`
  height: 8px;
  background: var(--primary-foreground) / 0.2;
`;

const PrimaryHint = styled.p`
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.75;
`;

const StyledCardHeader = styled(CardHeader)`
  padding-bottom: 8px;
`;

const StampGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
`;

const StampCell = styled.div<{ $collected: boolean }>`
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  border: 2px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  transition: all 150ms ease;

  ${({ $collected }) =>
    $collected
      ? css`
          border-color: var(--primary);
          background: var(--primary) / 0.1;
        `
      : css`
          border-style: dashed;
          border-color: var(--muted-foreground) / 0.3;
          background: var(--muted) / 0.5;
        `}
`;

const CollectedIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;

  svg {
    color: var(--primary-foreground);
  }
`;

const LockedIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
`;

const lineClamp1 = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`;

const StampNameCollected = styled.p`
  ${lineClamp1};
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: var(--foreground);
`;

const StampNameLocked = styled.p`
  ${lineClamp1};
  font-size: 12px;
  text-align: center;
  color: var(--muted-foreground);
`;

const TipText = styled.p`
  font-size: 14px;
  color: var(--muted-foreground);
`;

const TipStrong = styled.strong`
  color: var(--foreground);
`;

const IconSM = styled.span`
  display: inline-flex;
  svg {
    width: 20px;
    height: 20px;
  }
`;

const IconMD = styled.span`
  display: inline-flex;
  svg {
    width: 24px;
    height: 24px;
  }
`;
