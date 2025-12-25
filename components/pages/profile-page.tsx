"use client";

import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Coins,
  TrendingUp,
  LogOut,
  Trophy,
  Stamp,
  Loader2,
} from "lucide-react";

export function ProfilePage() {
  const { userProfile, signOut } = useAuth();

  const [stampLoading, setStampLoading] = useState(true);
  const [stampCountFromVisits, setStampCountFromVisits] = useState<number>(0);

  useEffect(() => {
    const fetchStampCount = async () => {
      if (!userProfile) return;
      setStampLoading(true);

      try {
        const visitsSnapshot = await getDocs(
          collection(db, "users", userProfile.uid, "boothVisits")
        );
        setStampCountFromVisits(visitsSnapshot.size);
      } catch (error) {
        console.error("스탬프(방문) 데이터 로드 실패:", error);
        // 실패하면 프로필의 stampCount로 폴백
        setStampCountFromVisits(userProfile.stampCount ?? 0);
      } finally {
        setStampLoading(false);
      }
    };

    fetchStampCount();
  }, [userProfile]);

  if (!userProfile) return null;

  const displayMileage = useMemo(() => {
    const base = userProfile.baseMileage ?? 0;
    const mult = userProfile.multiplier ?? 1;
    return Math.floor(base * mult);
  }, [userProfile.baseMileage, userProfile.multiplier]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <Page>
      <HeaderBlock>
        <Title>내 정보</Title>
        <Subtitle>계정 및 마일리지 정보</Subtitle>
      </HeaderBlock>

      {/* 1) Profile Card */}
      <Card>
        <ProfileCardContent>
          <ProfileRow>
            <Avatar>
              <IconLG>
                <User />
              </IconLG>
            </Avatar>
            <div>
              <Name>{userProfile.name}</Name>
              <Meta>
                {userProfile.grade}학년 {userProfile.class}반{" "}
                {userProfile.number}번
              </Meta>
            </div>
          </ProfileRow>
        </ProfileCardContent>
      </Card>

      {/* 2) 반 기여도 (기존 4번째 → 2번째로 이동) */}
      <Card>
        <StyledCardHeader>
          <CardTitle>
            <InlineTitle>
              <IconSM>
                <Trophy />
              </IconSM>
              반 기여도
            </InlineTitle>
          </CardTitle>
          <CardDescription>우승 반 선정에 기여하는 내 마일리지</CardDescription>
        </StyledCardHeader>

        <NormalCardContent>
          <ContributionBox>
            <ContributionText>
              {userProfile.grade}학년 {userProfile.class}반에 기여 중
            </ContributionText>
            <ContributionValue>
              {(userProfile.baseMileage ?? 0).toLocaleString()}
            </ContributionValue>
            <ContributionHint>(배수 이벤트 마일리지는 제외)</ContributionHint>
          </ContributionBox>
        </NormalCardContent>
      </Card>

      {/* 3) Mileage Info (그대로) */}
      <Card>
        <StyledCardHeader>
          <CardTitle>
            <InlineTitle>
              <IconSM>
                <Coins />
              </IconSM>
              마일리지 정보
            </InlineTitle>
          </CardTitle>
          <CardDescription>
            우승 반 계산에는 기본 마일리지만 사용됩니다
          </CardDescription>
        </StyledCardHeader>

        <NormalCardContent>
          <MileageBox>
            <MileageTop>
              <MileageLabel>표시 마일리지</MileageLabel>
              <MileageBig>{displayMileage.toLocaleString()}</MileageBig>
            </MileageTop>

            {(userProfile.multiplier ?? 1) > 1 && (
              <StyledBadge variant="secondary">
                <InlineBadge>
                  <IconXS>
                    <TrendingUp />
                  </IconXS>
                  x{(userProfile.multiplier ?? 1).toFixed(1)} 배수 적용
                </InlineBadge>
              </StyledBadge>
            )}
          </MileageBox>

          <StyledSeparator />

          <InfoList>
            <InfoRow>
              <InfoLabel>기본 마일리지</InfoLabel>
              <InfoValue>
                {(userProfile.baseMileage ?? 0).toLocaleString()}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>현재 배수</InfoLabel>
              <InfoValue>x{(userProfile.multiplier ?? 1).toFixed(1)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>스탬프 수</InfoLabel>
              <InfoValue>
                {(userProfile.stampCount ?? 0).toLocaleString()}개
              </InfoValue>
            </InfoRow>
          </InfoList>
        </NormalCardContent>
      </Card>

      {/* 4) ✅ 맨 아래 “스탬프” 카드 추가 */}
      <Card>
        <StyledCardHeader>
          <CardTitle>
            <InlineTitle>
              <IconSM>
                <Stamp />
              </IconSM>
              스탬프
            </InlineTitle>
          </CardTitle>
          <CardDescription>부스 방문으로 모은 스탬프 개수</CardDescription>
        </StyledCardHeader>

        <NormalCardContent>
          <StampBox>
            <StampLeft>
              <StampCount>
                {stampLoading ? (
                  <StampLoading>
                    <Loader2 />
                    불러오는 중...
                  </StampLoading>
                ) : (
                  <>
                    {stampCountFromVisits}
                    <StampUnit>개</StampUnit>
                  </>
                )}
              </StampCount>
              <StampHint>방문 기록 기준으로 계산됩니다</StampHint>
            </StampLeft>
          </StampBox>
        </NormalCardContent>
      </Card>

      {/* Sign Out */}
      <LogoutButton variant="outline" onClick={handleSignOut}>
        <IconSM>
          <LogOut />
        </IconSM>
        로그아웃
      </LogoutButton>
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
  font-size: 1.65rem;
  font-weight: 800;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.3);
`;

const StyledCardHeader = styled(CardHeader)`
  padding-bottom: 8px;
`;

const ProfileCardContent = styled(CardContent)`
  padding: 24px;
`;

const NormalCardContent = styled(CardContent)`
  padding: 16px;
`;

const ProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  background: var(--primary) / 0.1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Name = styled.h2`
  font-size: 22px;
  font-weight: 800;
`;

const Meta = styled.p`
  color: var(--muted-foreground);
  font-size: 16px;
  font-weight: 500;
`;

const InlineTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const InfoLabel = styled.span`
  font-size: 14px;
  color: var(--muted-foreground);
`;

const InfoValue = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const MileageBox = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: var(--primary) / 0.1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MileageTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const MileageLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const MileageBig = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
`;

const StyledBadge = styled(Badge)`
  font-size: 12px;
  width: fit-content;
`;

const InlineBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
`;

const StyledSeparator = styled(Separator)`
  margin: 16px 0;
`;

const ContributionBox = styled.div`
  text-align: center;
  padding: 16px;
  border-radius: 12px;
  background: var(--secondary);
`;

const ContributionText = styled.p`
  font-size: 14px;
  color: var(--muted-foreground);
  margin-bottom: 4px;
`;

const ContributionValue = styled.p`
  font-size: 30px;
  font-weight: 700;
  color: var(--foreground);
`;

const ContributionHint = styled.p`
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted-foreground);
`;

const StampBox = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--muted) / 0.4;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StampLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StampCount = styled.div`
  font-size: 22px;
  font-weight: 800;
`;

const StampUnit = styled.span`
  margin-left: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted-foreground);
`;

const StampHint = styled.p`
  font-size: 12px;
  color: var(--muted-foreground);
`;

const StampLoading = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--muted-foreground);

  svg {
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LogoutButton = styled(Button)`
  && {
    width: 100%;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
`;

const IconXS = styled.span`
  display: inline-flex;
  svg {
    width: 12px;
    height: 12px;
  }
`;

const IconSM = styled.span`
  display: inline-flex;
  svg {
    width: 16px;
    height: 16px;
  }
`;

const IconLG = styled.span`
  display: inline-flex;
  svg {
    width: 32px;
    height: 32px;
    color: var(--primary);
  }
`;
