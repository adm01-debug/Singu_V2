import { useState, useCallback } from 'react';

/** Lightweight math CAPTCHA — no external dependency */
export function useCaptcha() {
  const [challenge, setChallenge] = useState(() => generateChallenge());
  const [isVerified, setIsVerified] = useState(false);

  function generateChallenge() {
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    const a = Math.floor(Math.random() * 10) + 1;
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b, question: `Quanto é ${a} + ${b}?` };
  }

  const verify = useCallback((answer: string): boolean => {
    const num = parseInt(answer, 10);
    if (num === challenge.answer) {
      setIsVerified(true);
      return true;
    }
    setChallenge(generateChallenge());
    return false;
  }, [challenge.answer]);

  const reset = useCallback(() => {
    setChallenge(generateChallenge());
    setIsVerified(false);
  }, []);

  return { question: challenge.question, verify, isVerified, reset };
}
