import { Badge, Card, CtaButton, Notice, classNames } from '../../components/ui';
import { HomeUtilityLauncher } from './home-utility-launcher';
import type { AdaptiveStateHomeBaseProps } from './types';
import styles from './injection-day-home.module.css';

export function InjectionDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const primaryCardId = context.cards[0]?.id ?? null;
  const sharedCount = context.cards.filter((card) => card.description).length;

  return (
    <main className="app-shell">
      <Card aria-labelledby="home-title" className={classNames('hero-card', styles.screen)}>
        <p className="eyebrow">Fevio Care OS</p>
        <h1 id="home-title" className={styles.title}>
          오늘의 케어 운영을 둘이 함께 보게 해요
        </h1>
        <p className="lead">
          병원 밖에서 흩어지는 일정·약·감정을 한 화면에 정리하고, 파트너에게는 지금 맡을 역할만 조용히 번역합니다.
        </p>

        <section className={styles.careSurface} aria-label="오늘 케어 운영 요약">
          <div className={styles.careSurfaceCopy}>
            <span className={styles.blockLabel}>오늘의 케어 중심</span>
            <strong>지금은 주사 시간이 케어의 중심이에요.</strong>
            <p>Fevio는 치료를 판단하지 않고, 내가 확인한 시간과 준비물을 잊히지 않는 순서로 놓습니다.</p>
          </div>
          <div className={styles.careOrb} aria-hidden="true">
            <span>{context.cards.length}</span>
          </div>
        </section>

        <div className={styles.signalGrid} aria-label="케어 운영 신호">
          <div>
            <span>오늘 집중</span>
            <strong>주사 시간</strong>
            <p>확정된 시간만 먼저 보여요.</p>
          </div>
          <div>
            <span>파트너 보기</span>
            <strong>{sharedCount}개 역할</strong>
            <p>원문 대신 행동 단서로 전달돼요.</p>
          </div>
        </div>

        <Notice tone="coral" className={styles.notificationBlock} aria-label="재확인 문구 예시">
          <span className={styles.blockLabel}>놓치지 않게, 과장하지 않게</span>
          <p>알림은 불안을 키우지 않고 “아직 확인 안 됐어요. 조용히 다시 확인해 주세요.”처럼 말합니다.</p>
        </Notice>

        <section className={styles.cardSection} aria-labelledby="care-flow-title">
          <div className={styles.sectionHeader}>
            <span className={styles.blockLabel}>오늘의 흐름</span>
            <h2 id="care-flow-title">오늘 실제로 해야 할 일</h2>
          </div>
          <div className={styles.cardList} aria-label="오늘 카드 목록">
            {context.cards.map((card) => {
              const isPrimary = card.id === primaryCardId || card.displaySafetyLevel === 'critical';

              return (
                <article
                  className={classNames(styles.actionCard, isPrimary && styles.actionCardPriority)}
                  data-testid="home-action-card"
                  key={card.id}
                >
                  <div className={styles.cardHeader}>
                    <Badge tone={card.displaySafetyLevel === 'critical' ? 'coral' : 'sage'}>
                      {card.displaySafetyLevel === 'critical' ? '먼저 확인' : card.title.includes('파트너') ? '함께 맡기' : '다음 차례'}
                    </Badge>
                    {isPrimary ? <span className={styles.priorityText}>내가 확인한 시간 기준</span> : null}
                  </div>
                  <h3>{card.title}</h3>
                  {card.urgencyCopy ? <p className={styles.urgencyCopy}>{card.urgencyCopy}</p> : null}
                  {card.description ? <p className="lead">{card.description}</p> : null}
                </article>
              );
            })}
          </div>
        </section>

        <div className={styles.ctaRow}>
          <CtaButton type="button" className={styles.primaryAction}>
            오늘 케어 흐름 확인하기
          </CtaButton>
        </div>

        <section className={styles.partnerBlock} aria-labelledby="partner-role-title">
          <span className={styles.blockLabel}>파트너 역할 번역</span>
          <h2 id="partner-role-title">파트너에게는 “도와줘”가 아니라 역할로 번역돼요</h2>
          <ul>
            <li>주사 30분 전에는 준비물과 조용한 공간을 함께 확인해요.</li>
            <li>약 이름과 시간은 카드 기준으로만 확인하고, 용량 판단은 하지 않아요.</li>
            <li>감정 신호가 공유되면 질문보다 물·식사·이동 같은 작은 도움을 먼저 건네요.</li>
          </ul>
        </section>
        <HomeUtilityLauncher />
      </Card>
    </main>
  );
}
