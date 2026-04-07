"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const DEFAULT_TEST_CASES = `1	1998-03-08	4:46	Indonesia - Jakarta		Female	무인	을묘	갑인	병인
2	2001-04-26	12:38	United States - New York		Female	신사	임진	기미	경오
3	1995-01-26	13:55	Vietnam		Female	갑술	정축	정사	정미
4	2003-11-11	3:43	United States - New York		Female	계미	계해	무자	갑인
5	1987-06-13	2:51	Turkey		Female	정묘	병오	계사	계축
6	1993-07-15	15:00	United States - Los Angeles		Female	계유	기미	정유	정미
7	1997-08-26	9:40	United States - New York		Female	정축	무신	경자	신사
8	2006-04-11	8:34	Brazil - São Paulo		Male	병술	임진	경오	경진
9	2003-04-13	3:35	Vietnam		Female	계미	병진	병진	경인
10	1991-12-05	15:20	United States - Chicago		Female	신미	기해	기유	신미
11	1994-10-11	11:46	Morocco		Female	갑술	갑술	경오	임오
12	1991-07-12		Qatar		Male	신미	을미	계미	시간
13	1998-11-12	4:00	India - West (Mumbai, Gujarat)		Female	무인	계해	계해	갑인
14	1992-05-14	4:27	United States - New York		Female	임신	을사	경인	무인
15	2002-11-10	10:30	Vietnam		Female	임오	신해	임오	을사
16	1990-08-23	1:10	India - West (Mumbai, Gujarat)		Female	경오	갑신	경신	병자
17	1999-09-05	6:33	India - West (Mumbai, Gujarat)		Female	기묘	임신	경신	기묘
18	1993-06-07	6:51	United States - Los Angeles		Female	계유	무오	기미	정묘
19	1997-01-27		Mexico - Mexico City		Female	병자	신축	기사	시간
20	1988-04-14	10:01	United States - Los Angeles		Female	무진	병진	기해	기사`;

export default function TestSajuPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState(DEFAULT_TEST_CASES);

  const runTest = async () => {
    setLoading(true);
    try {
      const lines = testCases.split('\n').filter(l => l.trim());
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
        <label className="block text-sm font-medium mb-2">
          테스트 케이스 (탭으로 구분: 번호, 날짜, 시간, 국가, 성별, 연주, 월주, 일주, 시주)
        </label>
        <textarea
          className="w-full h-64 p-2 border rounded font-mono text-xs"
          value={testCases}
          onChange={(e) => setTestCases(e.target.value)}
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
                            <td className="border p-1 text-xs">{f.country}<br/>({f.countryCode})</td>
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
