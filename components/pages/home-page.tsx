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
import { Badge } from "@/components/ui/badge";
import { PartyPopper, Coins, Stamp, TrendingUp, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Announcement {
  id: string;
  title: string;
  detail: string;
  createdAt: Date;
}

export function HomePage() {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(
          collection(db, "announcements"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const fetchedAnnouncements = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          detail: doc.data().detail,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        setAnnouncements(fetchedAnnouncements);
      } catch (error) {
        console.error("공지사항 로드 실패:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  if (!userProfile) return null;

  const displayMileage = Math.floor(
    userProfile.baseMileage * userProfile.multiplier
  );

  return (
    <Page>
      {/* Header */}
      <HeaderRow>
        <div>
          <Title>새롬고연말축제</Title>
          <Subtitle>
            {userProfile.grade}학년 {userProfile.class}반 {userProfile.name}
          </Subtitle>
        </div>
        <HeaderIconWrap>
          <IconMD>
            <PartyPopper />
          </IconMD>
        </HeaderIconWrap>
      </HeaderRow>

      {/* Summary Cards */}
      <SummaryGrid>
        <PrimaryCard>
          <PrimaryCardContent>
            <RowGap>
              <Row>
                <IconSM>
                  <Coins />
                </IconSM>
                <SmallText>마일리지</SmallText>
              </Row>

              <BigNumber>{displayMileage.toLocaleString()}</BigNumber>

              {userProfile.multiplier > 1 && (
                <PrimaryBadge variant="secondary">
                  배수 x{userProfile.multiplier.toFixed(1)} 적용
                </PrimaryBadge>
              )}
            </RowGap>
          </PrimaryCardContent>
        </PrimaryCard>

        <Card>
          <NormalCardContent>
            <RowGap>
              <RowMuted>
                <IconSM>
                  <Stamp />
                </IconSM>
                <SmallTextMuted>스탬프</SmallTextMuted>
              </RowMuted>

              <StampRow>
                <StampNumber>{userProfile.stampCount}</StampNumber>
                <StampTotal>/10</StampTotal>
              </StampRow>
            </RowGap>
          </NormalCardContent>
        </Card>
      </SummaryGrid>

      {/* Mileage Detail */}
      <Card>
        <NormalCardContent>
          <MileageRow>
            <div>
              <SmallTextMuted>기본 마일리지</SmallTextMuted>
              <MileageValue>
                {userProfile.baseMileage.toLocaleString()}
              </MileageValue>
            </div>

            {userProfile.multiplier > 1 && (
              <RightBox>
                <AccentRow>
                  <IconSM>
                    <TrendingUp />
                  </IconSM>
                  <AccentText>배수 적용</AccentText>
                </AccentRow>
                <SmallTextMuted>
                  x{userProfile.multiplier.toFixed(1)} ={" "}
                  {displayMileage.toLocaleString()}
                </SmallTextMuted>
              </RightBox>
            )}
          </MileageRow>
        </NormalCardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <StyledCardHeader>
          <CardTitle>
            <InlineTitle>
              <IconSM>
                <Bell />
              </IconSM>
              공지사항
            </InlineTitle>
          </CardTitle>
        </StyledCardHeader>

        <AnnouncementContent>
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <AnnouncementItem key={a.id}>
                <AnnouncementTitle>{a.title}</AnnouncementTitle>
                <AnnouncementDetail>{a.detail}</AnnouncementDetail>
              </AnnouncementItem>
            ))
          ) : (
            <AnnouncementItem>
              <AnnouncementEmpty>공지사항이 없습니다.</AnnouncementEmpty>
            </AnnouncementItem>
          )}
        </AnnouncementContent>
      </Card>

      {/* Quick Guide */}
      <Card>
        <StyledCardHeader>
          <CardTitle className="text-base">참여 방법</CardTitle>
          <CardDescription>간단한 3단계로 축제를 즐기세요</CardDescription>
        </StyledCardHeader>

        <NormalCardContent>
          <StepList>
            <Step>
              <StepNum>1</StepNum>
              <StepBody>
                <StepTitle>부스 방문</StepTitle>
                <StepDesc>
                  NFC 태그를 스캔하여 방문 인증 (+100 마일리지, +1 스탬프)
                </StepDesc>
              </StepBody>
            </Step>

            <Step>
              <StepNum>2</StepNum>
              <StepBody>
                <StepTitle>퀴즈 참여</StepTitle>
                <StepDesc>
                  방문한 부스의 퀴즈를 풀고 추가 마일리지 획득 (+10 마일리지)
                </StepDesc>
              </StepBody>
            </Step>

            <Step>
              <StepNum>3</StepNum>
              <StepBody>
                <StepTitle>마일리지가 획득이 안 된 것 같다?</StepTitle>
                <StepDesc>새로고침하여 적용</StepDesc>
              </StepBody>
            </Step>
          </StepList>
        </NormalCardContent>
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

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h1`
  font-size: 1.65rem;
  font-weight: 800;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.3);
`;

const HeaderIconWrap = styled.div`
  width: 40px;
  height: 40px;
  background: var(--primary) / 0.1;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`;

/** PrimaryCard: 배경/글자색만 담당. CardContent는 별도 styled로 */
const PrimaryCard = styled(Card)`
  background: var(--primary);
  color: var(--primary-foreground);
`;

const PrimaryCardContent = styled(CardContent)`
  padding: 16px;
`;

const NormalCardContent = styled(CardContent)`
  padding: 16px;
`;

const PrimaryBadge = styled(Badge)`
  margin-top: 4px;
  font-size: 12px;
  background: var(--primary-foreground) / 0.2;
  color: var(--primary-foreground);
`;

const RowGap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Row = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const RowMuted = styled(Row)`
  color: var(--muted-foreground);
`;

const SmallText = styled.span`
  font-size: 14px;
  opacity: 0.9;
`;

const SmallTextMuted = styled.span`
  font-size: 14px;
  color: var(--muted-foreground);
`;

const BigNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
`;

const StampRow = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
`;

const StampNumber = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: var(--foreground);
`;

const StampTotal = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: var(--muted-foreground);
`;

const MileageRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const MileageValue = styled.p`
  margin-top: 2px;
  font-size: 18px;
  font-weight: 600;
`;

const RightBox = styled.div`
  text-align: right;
  align-items: center;
  display: flex;
  gap: 4px;
`;

const AccentRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
`;

const AccentText = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const StyledCardHeader = styled(CardHeader)`
  padding-bottom: 8px;
`;

const InlineTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
`;

const AnnouncementContent = styled(CardContent)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AnnouncementItem = styled.div`
  padding: 12px;
  border-radius: 12px;
  background: var(--secondary);
`;

const AnnouncementTitle = styled.p`
  font-weight: 600;
  font-size: 14px;
`;

const AnnouncementDetail = styled.p`
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted-foreground);
`;

const AnnouncementEmpty = styled.p`
  font-size: 14px;
  color: var(--muted-foregroun);
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const StepNum = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

const StepBody = styled.div``;

const StepTitle = styled.p`
  font-weight: 600;
  font-size: 14px;
`;

const StepDesc = styled.p`
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted-foreground);
`;

const IconSM = styled.span`
  display: inline-flex;
  svg {
    width: 16px;
    height: 16px;
  }
`;

const IconMD = styled.span`
  display: inline-flex;
  svg {
    width: 20px;
    height: 20px;
    color: var(--primary);
  }
`;
