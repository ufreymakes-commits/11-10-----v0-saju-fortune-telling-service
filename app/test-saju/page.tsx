"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const TEST_CASES = `1	1998-03-08	4:46	Indonesia - Jakarta		Female	무인 (戊寅)	을묘 (乙卯)	갑인 (甲寅)	병인 (丙寅)
2	2001-04-26	12:38	United States - New York		Female	신사 (辛巳)	임진 (壬辰)	기미 (己未)	경오 (庚午)
3	1995-01-26	13:55	Vietnam		Female	갑술 (甲戌)	정축 (丁丑)	정사 (丁巳)	정미 (丁未)
4	2003-11-11	3:43	United States - New York		Female	계미 (癸未)	계해 (癸亥)	무자 (戊子)	갑인 (甲寅)
5	1987-06-13	2:51	Turkey		Female	정묘 (丁卯)	병오 (丙午)	계사 (癸巳)	계축 (癸丑)
6	1993-07-15	15:00	United States - Los Angeles		Female	계유 (癸酉)	기미 (己未)	정유 (丁酉)	정미 (丁未)
7	1997-08-26	9:40	United States - New York		Female	정축 (丁丑)	무신 (戊申)	경자 (庚子)	신사 (辛巳)
8	2006-04-11	8:34	Brazil - São Paulo		Male	병술 (丙戌)	임진 (壬辰)	경오 (庚午)	경진 (庚辰)
9	2003-04-13	3:35	Vietnam		Female	계미 (癸未)	병진 (丙辰)	병진 (丙辰)	경인 (庚寅)
10	1991-12-05	15:20	United States - Chicago		Female	신미 (辛未)	기해 (己亥)	기유 (己酉)	신미 (辛未)
11	1994-10-11	11:46	Morocco		Female	갑술 (甲戌)	갑술 (甲戌)	경오 (庚午)	임오 (壬午)
12	1991-07-12		Qatar		Male	신미 (辛未)	을미 (乙未)	계미 (癸未)	시간 모른
13	1998-11-12	4:00	India - West (Mumbai, Gujarat)		Female	무인 (戊寅)	계해 (癸亥)	계해 (癸亥)	갑인 (甲寅)
14	1992-05-14	4:27	United States - New York		Female	임신 (壬申)	을사 (乙巳)	경인 (庚寅)	무인 (戊寅)
15	2002-11-10	10:30	Vietnam		Female	임오 (壬午)	신해 (辛亥)	임오 (壬午)	을사 (乙巳)
16	1990-08-23	1:10	India - West (Mumbai, Gujarat)		Female	경오 (庚午)	갑신 (甲申)	경신 (庚申)	병자 (丙子)
17	1999-09-05	6:33	India - West (Mumbai, Gujarat)		Female	기묘 (己卯)	임신 (壬申)	경신 (庚申)	기묘 (己卯)
18	1993-06-07	6:51	United States - Los Angeles		Female	계유 (癸酉)	무오 (戊午)	기미 (己未)	정묘 (丁卯)
19	1997-01-27		Mexico - Mexico City		Female	병자 (丙子)	신축 (辛丑)	기사 (己巳)	시간 모른
20	1988-04-14	10:01	United States - Los Angeles		Female	무진 (戊辰)	병진 (丙辰)	기해 (己亥)	기사 (己巳)`;

export default function TestSajuPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fullTestCases, setFullTestCases] = useState(TEST_CASES);

  const runTest = async () => {
    setLoading(true);
    try {
      const lines = fullTestCases.split('\n').filter(l => l.trim());
      const res = await fetch('/api/test-saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases: lines })
      });
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setResults({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">사주 계산기 테스트</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">테스트 케이스 (탭으로 구분)</label>
        <textarea
          className="w-full h-64 p-2 border rounded font-mono text-xs"
          value={fullTestCases}
          onChange={(e) => setFullTestCases(e.target.value)}
          placeholder="번호	날짜	시간	국가	성별	연주	월주	일주	시주"
        />
      </div>
      
      <Button onClick={runTest} disabled={loading}>
        {loading ? '테스트 중...' : '테스트 실행'}
      </Button>
      
      {results && (
        <div className="mt-6">
          {results.error ? (
            <div className="text-red-500">오류: {results.error}</div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-gray-100 rounded">
                <div className="text-lg font-bold">
                  결과: {results.passed}/{results.total} 통과 ({((results.passed / results.total) * 100).toFixed(1)}%)
                </div>
                <div className="text-green-600">통과: {results.passed}</div>
                <div className="text-red-600">실패: {results.failed}</div>
              </div>
              
              {results.failures?.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-2">실패 케이스 (처음 50개)</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border p-1">#</th>
                          <th className="border p-1">날짜</th>
                          <th className="border p-1">시간</th>
                          <th className="border p-1">국가</th>
                          <th className="border p-1">기대 연주</th>
                          <th className="border p-1">실제 연주</th>
                          <th className="border p-1">기대 월주</th>
                          <th className="border p-1">실제 월주</th>
                          <th className="border p-1">기대 일주</th>
                          <th className="border p-1">실제 일주</th>
                          <th className="border p-1">기대 시주</th>
                          <th className="border p-1">실제 시주</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.failures.map((f: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border p-1">{f.num}</td>
                            <td className="border p-1">{f.date}</td>
                            <td className="border p-1">{f.time || '-'}</td>
                            <td className="border p-1 text-xs">{f.country}<br/>({f.countryCode || '?'})</td>
                            <td className={`border p-1 ${f.yearOk ? '' : 'bg-red-100'}`}>{f.expected?.year}</td>
                            <td className={`border p-1 ${f.yearOk ? '' : 'bg-red-100'}`}>{f.actual?.year}</td>
                            <td className={`border p-1 ${f.monthOk ? '' : 'bg-red-100'}`}>{f.expected?.month}</td>
                            <td className={`border p-1 ${f.monthOk ? '' : 'bg-red-100'}`}>{f.actual?.month}</td>
                            <td className={`border p-1 ${f.dayOk ? '' : 'bg-red-100'}`}>{f.expected?.day}</td>
                            <td className={`border p-1 ${f.dayOk ? '' : 'bg-red-100'}`}>{f.actual?.day}</td>
                            <td className={`border p-1 ${f.hourOk ? '' : 'bg-red-100'}`}>{f.expected?.hour}</td>
                            <td className={`border p-1 ${f.hourOk ? '' : 'bg-red-100'}`}>{f.actual?.hour}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
