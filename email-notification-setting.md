# Email Notification 설정 가이드

specctl의 `--email` 옵션을 사용하면 spec PR 생성 시 `.specctl/team.yml`에 등록된 팀원들에게 리뷰 요청 이메일을 자동 발송합니다.

---

## 1. 환경 변수 설정

아래 환경 변수를 설정해야 이메일 발송이 활성화됩니다.

```bash
export SPECCTL_SMTP_HOST="smtp.gmail.com"
export SPECCTL_SMTP_PORT="587"
export SPECCTL_SMTP_USERNAME="your-email@gmail.com"
export SPECCTL_SMTP_PASSWORD="your-app-password"
export SPECCTL_EMAIL_FROM="your-email@gmail.com"
```

## 2. Gmail 앱 비밀번호 발급 방법

Gmail은 일반 계정 비밀번호 대신 **앱 비밀번호**를 사용해야 합니다.

1. [Google 계정 보안 설정](https://myaccount.google.com/security) 접속
2. **2단계 인증** 활성화 (앱 비밀번호 사용을 위해 필수)
3. 검색창에 **"앱 비밀번호"** 검색 후 진입
4. 앱 선택: `기타 (직접 입력)` → 이름 입력 (예: `specctl`)
5. 생성된 **16자리 비밀번호**를 `SPECCTL_SMTP_PASSWORD`에 사용

> 앱 비밀번호는 생성 시 한 번만 표시됩니다. 안전한 곳에 보관하세요.

---

## 4. 팀원 이메일 등록

`.specctl/team.yml`의 각 멤버에 `email` 필드를 추가합니다.

```yaml
team_name: your-team-name
members:
  - name: Alice
    github: alice-github-id
    email: alice@gmail.com
  - name: Bob
    github: bob-github-id
    email: bob@company.com
```

> `example.com` 도메인 이메일은 테스트 주소로 간주되어 발송 대상에서 제외됩니다.

---

## 5. 사용 방법

환경 변수와 team.yml 설정 완료 후, `submit` 명령에 `--email` 플래그를 추가합니다.

```bash
# 이메일만 발송
specctl submit docs/specs/user-login.md --email

# GitHub 멘션 댓글 + 이메일 동시 발송
specctl submit docs/specs/user-login.md --notify --email
```

발송되는 이메일 제목 형식:

```
[Spec Review Needed] user-login
```


---

## 5.1 발송 빈도 정책

메일 알림은 리뷰 준비가 된 spec 또는 마일스톤에 영향을 주는 PR에만 사용합니다.

- Use `--email` only for review-ready specs or milestone-impacting PRs.
- Do not use `--email` for draft updates, typo fixes, or repeated CI retries.
- Prefer `--notify` for normal review requests.

일반 리뷰 요청은 GitHub 알림(`--notify`)을 우선 사용하고, 초안 수정·오타 수정·CI 재시도에는 이메일을 보내지 않습니다. Gmail/SMTP 한도와 스팸 판정을 피하기 위해 `--email`은 의도적으로 드물게 사용합니다.

---

## 6. 문제 해결

**"Email notification skipped. Missing environment variables" 출력 시**

누락된 환경 변수를 확인하고 설정합니다.

```bash
echo $SPECCTL_SMTP_HOST
echo $SPECCTL_SMTP_USERNAME
echo $SPECCTL_SMTP_PASSWORD
```

**"Failed to send review email" 출력 시**

| 원인              | 해결 방법                                    |
| ----------------- | -------------------------------------------- |
| 앱 비밀번호 오류  | Google 계정에서 앱 비밀번호 재발급           |
| 2단계 인증 미설정 | Google 계정에서 2단계 인증 활성화            |
| 포트 차단         | `SPECCTL_SMTP_PORT`를 `465`로 변경 후 재시도 |
| 수신자 없음       | `.specctl/team.yml`의 email 필드 확인        |

> 이메일 발송 실패 시에도 GitHub PR 생성은 정상적으로 완료됩니다.
