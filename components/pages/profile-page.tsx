"use client";

import styled from "styled-components";
import { useAuth } from "@/contexts/auth-context";
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
import { User, Mail, Coins, TrendingUp, LogOut, Trophy } from "lucide-react";

export function ProfilePage() {
  const { userProfile, signOut } = useAuth();

  if (!userProfile) return null;

  const displayMileage = Math.floor(
    userProfile.baseMileage * userProfile.multiplier
  );

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

      {/* Profile Card */}
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

      {/* Account Info */}
      <Card>
        <StyledCardHeader>
          <CardTitle>
            <InlineTitle>
              <IconSM>
                <Mail />
              </IconSM>
              계정 정보
            </InlineTitle>
          </CardTitle>
        </StyledCardHeader>

        <NormalCardContent>
          <InfoList>
            <InfoRow>
              <InfoLabel>이메일</InfoLabel>
              <InfoValue>{userProfile.email}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>학교</InfoLabel>
              <InfoValue>새롬고등학교</InfoValue>
            </InfoRow>
          </InfoList>
        </NormalCardContent>
      </Card>

      {/* Mileage Info */}
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

            {userProfile.multiplier > 1 && (
              <StyledBadge variant="secondary">
                <InlineBadge>
                  <IconXS>
                    <TrendingUp />
                  </IconXS>
                  x{userProfile.multiplier.toFixed(1)} 배수 적용
                </InlineBadge>
              </StyledBadge>
            )}
          </MileageBox>

          <StyledSeparator />

          <InfoList>
            <InfoRow>
              <InfoLabel>기본 마일리지</InfoLabel>
              <InfoValue>{userProfile.baseMileage.toLocaleString()}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>현재 배수</InfoLabel>
              <InfoValue>x{userProfile.multiplier.toFixed(1)}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>스탬프 수</InfoLabel>
              <InfoValue>{userProfile.stampCount}개</InfoValue>
            </InfoRow>
          </InfoList>
        </NormalCardContent>
      </Card>

      {/* Class Contribution */}
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
              {userProfile.baseMileage.toLocaleString()}
            </ContributionValue>
            <ContributionHint>(배수 이벤트 마일리지는 제외)</ContributionHint>
          </ContributionBox>
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
  font-size: 24px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: var(--muted-foreground);
`;

/** shadcn CardHeader / CardContent를 직접 styled로 감싸서 사용 */
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
  font-size: 20px;
  font-weight: 700;
`;

const Meta = styled.p`
  color: var(--muted-foreground);
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

/** Separator도 직접 styled로 감싸서 margin 부여 */
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

/** outline 버튼 배경 투명 유지 + 폭 100% */
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
