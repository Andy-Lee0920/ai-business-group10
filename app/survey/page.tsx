"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import styles from "./interview.module.css";

type Gender = "남성" | "여성" | "기타" | "";
type IvfExperience = "Y" | "N" | "";

interface Interview {
  id: string;
  gender: Gender;
  age: string;
  ivfExperience: IvfExperience;
  interviewDate: string;
  interviewContent: string;
}

export default function SurveyPage() {
  const [gender, setGender] = useState<Gender>("");
  const [age, setAge] = useState("");
  const [ivfExperience, setIvfExperience] = useState<IvfExperience>("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewContent, setInterviewContent] = useState("");

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "interviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInterviews(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Interview, "id">),
        })),
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addInterview = async () => {
    if (
      !gender ||
      !age ||
      !ivfExperience ||
      !interviewDate ||
      !interviewContent.trim()
    ) {
      alert(
        "성별, 나이, 시험관 경험, 인터뷰 일자, 인터뷰 내용을 모두 입력해주세요.",
      );
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "interviews"), {
        gender,
        age,
        ivfExperience,
        interviewDate,
        interviewContent: interviewContent.trim(),
        createdAt: serverTimestamp(),
      });
      setGender("");
      setAge("");
      setIvfExperience("");
      setInterviewDate("");
      setInterviewContent("");
    } catch (err) {
      alert("저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
      console.error("Firestore save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteInterview = async (id: string) => {
    if (!window.confirm("이 인터뷰를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "interviews", id));
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
      console.error("Firestore delete error:", err);
    }
  };

  return (
    <main className={`app-shell ${styles.page}`}>
      <header className={styles.header}>
        <h1>인터뷰 관리 페이지</h1>
        <p>인터뷰어와의 기본 정보와 STT 대화 내용을 관리하세요.</p>
      </header>

      <section className={styles.card}>
        <h2>인터뷰 등록</h2>

        <div className={styles.formGrid}>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value as Gender)}
            aria-label="성별"
          >
            <option value="">성별 선택</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
            <option value="기타">기타</option>
          </select>

          <input
            type="number"
            value={age}
            min="0"
            placeholder="나이"
            onChange={(event) => setAge(event.target.value)}
            aria-label="나이"
          />

          <select
            value={ivfExperience}
            onChange={(event) =>
              setIvfExperience(event.target.value as IvfExperience)
            }
            aria-label="시험관 경험"
          >
            <option value="">시험관 경험 Y/N</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>

          <input
            type="date"
            value={interviewDate}
            onChange={(event) => setInterviewDate(event.target.value)}
            aria-label="인터뷰 일자"
          />
        </div>

        <textarea
          className={styles.textarea}
          value={interviewContent}
          onChange={(event) => setInterviewContent(event.target.value)}
          placeholder="인터뷰어와 대화한 STT 내용을 여기에 복사해서 붙여넣으세요."
          aria-label="인터뷰 내용"
        />

        <button
          type="button"
          className={styles.primaryButton}
          onClick={addInterview}
          disabled={saving}
        >
          {saving ? "저장 중…" : "인터뷰 추가"}
        </button>
      </section>

      <section className={styles.card} aria-label="인터뷰 목록">
        <div className={styles.sectionHeader}>
          <h2>인터뷰 목록</h2>
          <span>{interviews.length}건</span>
        </div>

        {loading ? (
          <p className={styles.emptyText}>불러오는 중…</p>
        ) : interviews.length === 0 ? (
          <p className={styles.emptyText}>등록된 인터뷰가 없습니다.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>성별</th>
                  <th>나이</th>
                  <th>시험관 경험</th>
                  <th>인터뷰 일자</th>
                  <th>인터뷰 내용</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {interviews.map((interview) => (
                  <tr key={interview.id}>
                    <td>{interview.gender}</td>
                    <td>{interview.age}</td>
                    <td>{interview.ivfExperience}</td>
                    <td>{interview.interviewDate}</td>
                    <td className={styles.interviewContent}>
                      {interview.interviewContent}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => deleteInterview(interview.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
