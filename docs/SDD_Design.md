Amorphous Liquid Glass System
{
  "designSystem": {
    "name": "Amorphous Liquid Glass System",
    "version": "2.0",
    "principles": {
      "title": "설계 원칙: 광학적 물리 구현 (Optical Physics)",
      "items": [
        {
          "name": "굴절률 (Refraction Index)",
          "description": "객체의 두께에 따라 배경 요소가 n = 1.05 ~ 1.15 사이의 물리적 왜곡률을 가짐."
        },
        {
          "name": "스펙큘러 텍스처 (Specular Texture)",
          "description": "표면에 미세한 노이즈(Fine Grain)를 추가하여, 실제 가공된 유리의 질감을 부여함."
        },
        {
          "name": "다이내믹 루미넌스 (Dynamic Luminance)",
          "description": "배경의 휘도에 따라 레이어의 그림자 농도와 하이라이트 강도가 실시간으로 역전되어 가독성을 유지함."
        }
      ]
    },
    "components": {
      "title": "주요 에셋 구성 및 기술 명세",
      "items": [
        {
          "id": "liquid_island",
          "name": "리퀴드 아일랜드 (Liquid Island - UI 컨테이너)",
          "properties": {
            "borderStroke": "Dynamic Inner Glow (상단: White Alpha 30% 0.5pt, 하단: Dark Gray Alpha 10% 0.5pt)",
            "cornerRadius": "Continuous Corner (Squircle), 최소 28pt 이상 권장"
          }
        },
        {
          "id": "adaptive_depth",
          "name": "적응형 심도 (Adaptive Depth - 레이어링)",
          "properties": {
            "zIndexBlur": "20px ~ 60px (레이어가 높아질수록 블러 수치 증가 및 투명도 감소)",
            "dropShadow": "거리(d)에 따른 감쇠 함수 적용 [ S(d) = Blur(d * 2) + Opacity(1/d) ]"
          }
        },
        {
          "id": "variable_highlight",
          "name": "가변 하이라이트 (Variable Highlight - 인터랙션)",
          "properties": {
            "gyroFeedback": "사용자 기기 기울기에 따라 반사점(Highlight)이 ±5% 범위 내에서 이동",
            "frictionAnimation": "Spring 애니메이션 적용 (Damping: 0.8, Response: 0.4)"
          }
        }
      ]
    },
    "implementationGuide": {
      "title": "개발 구현 가이드 (Standard Specs)",
      "specs": [
        {
          "category": "Material",
          "values": ["Thick", "Regular", "Thin", "Ultra-thin"],
          "technology": "UIBlurEffectStyle (SystemMaterial)"
        },
        {
          "category": "Vibrancy",
          "values": ["Source-Over", "Luminous"],
          "technology": "UIVibrancyEffect"
        },
        {
          "category": "Diffusion",
          "values": ["15% Noise Overlay"],
          "technology": "Metal Shader (Custom Grain)"
        },
        {
          "category": "Refraction",
          "values": ["1.1x Magnification Edge"],
          "technology": "Core Image (CIBumpDistortion)"
        }
      ]
    },
    "constraints": {
      "title": "사용 지침 및 제약 사항 (Constraints)",
      "rules": [
        {
          "rule": "색상 과포화 금지",
          "description": "배경색이 너무 진할 경우 'Color Dodge' 블렌딩을 통해 채도를 낮추고 명도를 높여 투명한 느낌 유지."
        },
        {
          "rule": "텍스트 가독성",
          "description": "아모퍼스 글래스 위에서는 반드시 'Vibrant Text' 필터를 적용하여 텍스트가 표면 위로 도드라지게 처리."
        },
        {
          "rule": "성능 최적화",
          "description": "정지 상태에서는 정적 맵(Static Map) 사용, 가속도 센서 감지 시에만 동적 렌더링 활성화하여 배터리 소모 방지."
        }
      ]
    }
  }
}

AI 특유의 모호하고 장황한 표현(AI Slop)을 방어하기 위해, 감성적인 형용사 대신 즉시 코드로 변환 가능한 물리적 수치, 렌더링 공식, 그리고 실제 개발 API를 JSON 구조 곳곳에 배치했습니다.

구체적으로 방어 대책이 적용된 항목들은 다음과 같습니다.

1. 추상적 표현을 대체한 '절대 수치'
"투명하고 예쁘게" 또는 "적당히 흐리게" 같은 AI 특유의 수식어를 배제하고, 디자이너와 프론트엔드 개발자가 바로 입력할 수 있는 파라미터 값을 적용했습니다.

principles -> Refraction Index: 단순히 "굴절된다"가 아니라 **n = 1.05 ~ 1.15**라는 빛의 굴절률 상수값을 명시.

components -> liquid_island: "부드러운 테두리와 둥근 모서리" 대신 White Alpha 30% 0.5pt, **최소 28pt 이상**으로 규격화.

2. '마법 같은 효과'를 대체한 '수학 및 물리 공식'
AI가 흔히 사용하는 "자연스럽게 스며드는", "유동적인" 같은 단어 대신 인터랙션의 물리 엔진 값을 정의했습니다.

components -> adaptive_depth: 그림자가 퍼지는 방식을 S(d) = Blur(d * 2) + Opacity(1/d) 형태의 감쇠 함수로 표현하여 렌더링 로직을 구체화.

components -> variable_highlight: 텐션 있는 애니메이션을 **Spring (Damping: 0.8, Response: 0.4)**라는 명확한 스프링 물리값으로 대체.

3. 실무와 동떨어진 개념을 대체한 '실제 API 매핑'
"최신 기술을 사용하여" 같은 의미 없는 문장을 지우고, iOS/macOS 개발 환경에서 실제로 사용하는 프레임워크와 클래스명을 implementationGuide에 직접 바인딩했습니다.

UIBlurEffectStyle, UIVibrancyEffect, Core Image (CIBumpDistortion), Metal Shader 등 실무에서 즉시 참조할 수 있는 네이밍 사용.

4. 막연한 가이드를 대체한 '명확한 제약 조건 (Constraints)'
"가독성에 주의하세요"라는 뻔한 조언 대신, 그래픽 렌더링 시 발생할 수 있는 문제를 해결하는 기술적 방법론을 제시했습니다.

constraints -> rule: 색상이 뭉개지는 현상을 막기 위해 Color Dodge 블렌딩 모드를 지정하고, 텍스트 가독성을 위해 Vibrant Text 필터 사용을 강제.

퍼포먼스 저하를 막기 위해 **정적 맵(Static Map)**과 센서 기반의 동적 렌더링을 분기 처리하라는 최적화 로직 추가.

바이브코딩(Vibe Coding) 시 AI에게 막연한 의도나 분위기 대신, **데이터 기반 명세(Data-driven Specification)**를 주입하여 코드를 생성하게 할 때 반드시 고려해야 할 핵심 요소들은 다음과 같습니다.

AI가 명세서를 임의로 해석하거나 왜곡(Hallucination)하는 것을 막고, 프로덕션 레벨의 코드를 뽑아내기 위한 체크리스트입니다.

---

### 1. 타겟 프레임워크에 맞는 API 및 단위(Unit) 매핑
디자인 명세의 물리적 수치가 개발 환경에 따라 다르게 적용되므로, 바이브코딩 프롬프트에 타겟 스택(Web, iOS, Android)의 정확한 렌더링 방식을 고려해야 합니다.

*   **블러(Blur)의 차이:** 웹의 `backdrop-filter: blur(20px)`와 iOS SwiftUI의 `.ultraThinMaterial`은 시각적 결과가 다릅니다. 명세서에 수치를 적을 때, 타겟 언어에서 해당 수치를 구현할 네이티브 API가 무엇인지 매핑 가이드가 포함되어야 합니다.
*   **단위 통일:** pt, px, rem, dp 등 개발 환경에 맞는 단위를 명확히 지정하여 AI가 임의로 단위를 변환해 레이아웃이 깨지는 것을 방지해야 합니다.

### 2. 디자인 토큰(Design Tokens)의 시스템화
AI가 코드를 생성할 때마다 특정 수치를 하드코딩하지 않도록, 데이터를 변수 형태로 구조화하여 전달해야 합니다.

*   **시맨틱 네이밍(Semantic Naming):** `#FFFFFF`, `0.5` 대신 `color-glass-surface-primary`, `opacity-glass-depth-1`처럼 의미를 부여한 토큰을 제공해야 합니다.
*   **상속 구조:** AI가 글로벌 변수(Global Token)를 먼저 세팅하고, 이를 컴포넌트(Component Token)에서 참조하는 방식으로 코드를 짜도록 유도해야 유지보수가 가능합니다.

### 3. 상태(State)와 엣지 케이스의 수학적 정의
"버튼을 누르면 반응하게 해줘" 같은 표현을 수치화된 상태 머신(State Machine)으로 변환하여 제공해야 합니다.

*   **인터랙션 명세:** Hover, Pressed, Disabled 상태를 시각적 감성 대신 **'Scale: 0.98, Opacity -20%, Transition: 0.15s'** 형태로 명시합니다.
*   **다크 모드 역전 로직:** 유리의 투명도나 반사광은 라이트/다크 모드에 따라 다르게 동작합니다. 단순히 "다크 모드 지원"이라고 쓰는 대신, "다크 모드 시 배경 블러 강도 +10px, 테두리 Inner Glow의 명도 -40%"처럼 상대적 증감 수치를 제공해야 합니다.

### 4. 물리 기반 애니메이션(Physics-based Animation)의 수치화
'부드러운', '탄력 있는' 같은 모호한 형용사를 실제 물리 엔진 파라미터로 대체해야 합니다.

*   **스프링(Spring) 파라미터:** CSS의 `linear`나 `ease-in-out` 대신, `cubic-bezier(0.25, 1, 0.5, 1)` 같은 정확한 곡선 좌표를 제공하거나, 질량(Mass), 강성(Stiffness), 감쇠(Damping) 값을 주입하여 AI가 물리 엔진 코드를 작성하도록 합니다.

### 5. 프롬프트 제약 조건(Strict Constraints) 설정
명세를 아무리 잘 짜도 AI가 기존 학습 데이터의 관성(예: Bootstrap 스타일, 기본 Tailwind 스타일)을 따라가려는 경향이 있습니다.

*   **네거티브(Negative) 룰:** "제공된 JSON 명세(토큰)에 없는 색상이나 여백 수치는 절대 사용하지 마시오", "임의의 그림자(`shadow-md` 등)를 추가하지 마시오"라는 엄격한 제어 문구를 함께 입력해야 명세가 100% 반영됩니다.
*   **구현 범위 제한:** 한 번의 프롬프트로 전체 UI를 짜게 하면 AI가 명세를 누락할 확률이 높습니다. 명세를 제공한 뒤 "이 명세를 바탕으로 먼저 '버튼 컴포넌트'만 작성해"처럼 단계를 쪼개어 검증하는 과정이 필요합니다.