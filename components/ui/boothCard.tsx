import styled, { keyframes, css } from "styled-components";

import { MapPin, Check, HelpCircle, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function BoothCardComponent({ boothInfo, states, functions }) {
  return (
    <Wrapper
      $highlight={Boolean(
        states.isVisited && boothInfo.quiz && !states.isQuizDone
      )}
      $isQuizDone={states.isVisited}
    >
      <Mid>
        <Left>
          <Header>
            {states.isVisited && (
              <SmallBadge variant="secondary">
                <IconXS as={Check} />
                방문완료
              </SmallBadge>
            )}
          </Header>

          <Title>{boothInfo.name}</Title>
          <Description>{boothInfo.description}</Description>
        </Left>
        <Right>
          {boothInfo.imageUrl ? (
            <BoothImage src={boothInfo.imageUrl} />
          ) : (
            <ImageReplace />
          )}
          {/* {states.isVisited && boothInfo.quiz && (
            <QuizButton
              onClick={() => {
                if (!states.isQuizDone) {
                  functions.cl(boothInfo);
                }
              }}
            >
              <IconSM>
                <HelpCircle />
              </IconSM>
              {states.isQuizDone ? "퀴즈 완료" : "퀴즈 풀기 (+10 마일리지)"}
            </QuizButton>
          )} */}
        </Right>
      </Mid>
      {/* {states.isVisited && boothInfo.quiz && <QuestionSpace />} */}
      <Footer>
        <FooterLeft>
          <Location>
            <IconXS>
              <MapPin />
            </IconXS>
            {boothInfo.location}
          </Location>

          <VisitCount>
            <IconXS>
              <Users />
            </IconXS>
            {boothInfo.visitCount}
          </VisitCount>
        </FooterLeft>
      </Footer>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  padding: 8px 16px 32px 20px;
  position: relative;
  box-sizing: border-box;
  border-radius: 12px;

  background-color: #ffffff;
  user-select: none;
  border: solid black 1px;

  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.04);

  ${({ $isQuizDone }) =>
    $isQuizDone &&
    css`
      opacity: 0.8;
      border: none;
    `}

  ${({ $highlight }) =>
    $highlight &&
    css`
      /* 상용 앱 스타일 포인트 */

      /* shimmer는 유지 (이건 고급스러움 담당) */
      overflow: hidden;
      &::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.55) 45%,
          rgba(255, 255, 255, 0.2) 55%,
          transparent 100%
        );
        transform: translateX(-120%);
        animation: ${shimmer} 1.1s ease-out 1;
      }
    `}

  &:hover {
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    &::after {
      animation: none !important;
    }
  }
`;

const QuestionSpace = styled.div`
  height: 35px;
`;

const Header = styled.div`
  width: 100%;
`;

const Mid = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
`;

const Left = styled.div`
  width: calc(100% - 16px - 100px);
`;
const Right = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;
const FooterLeft = styled.div`
  display: flex;
  gap: 10px;
`;

const ImageReplace = styled.div`
  width: 100px;
  height: 100px;
  background-color: #f1f1f1;
`;

const Noti = styled.div``;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-top: 2px;
`;

const Description = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 6px;
  width: 100%;
`;

const Footer = styled.div`
  display: flex;
  position: absolute;
  bottom: 8px;
  width: calc(100% - 32px);
  justify-content: space-between;
`;

const IconXS = styled.span`
  display: inline-flex;
  align-items: center;
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const IconSM = styled.span`
  display: inline-flex;
  align-items: center;
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const SmallBadge = styled(Badge)`
  font-size: 0.65rem;
`;

const Location = styled.div`
  display: flex;
  gap: 2px;
  font-size: 13px;
  font-weight: 500;
  align-items: center;
`;

const VisitCount = styled.div`
  display: flex;
  gap: 2px;
  font-size: 13px;
  font-weight: 500;
  align-items: center;
`;

const QuizButton = styled.button`
  background-color: var(--primary);
  color: white;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  padding: 6px 10px;

  display: inline-flex;
  align-items: center;
  gap: 4px;

  cursor: pointer;
  border: none;

  transition: transform 80ms ease, box-shadow 80ms ease, filter 80ms ease;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);

  &:hover {
    filter: brightness(1.05);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    filter: brightness(0.95);
  }
`;

const Overlay = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
`;

// 2) 카드 위를 한 번 지나가는 하이라이트(상용 앱에서 자주 씀)
const shimmer = keyframes`
  0% { transform: translateX(-120%); opacity: 0; }
  10% { opacity: 1; }
  60% { opacity: 1; }
  100% { transform: translateX(120%); opacity: 0; }
`;

const BoothImage = styled.img`
  width: 100px;
  height: 100px;
`;
