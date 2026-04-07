'use client';

import { useState } from 'react';

interface TestCase {
  date: string;
  time: string;
  country: string;
  countryCode: string;
  gender: string;
  expected: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
}

interface TestResult {
  testCase: TestCase;
  actual: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  passed: boolean;
}

export default function SajuTestPage() {
  const [testData, setTestData] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0 });

  const runTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testData }),
      });
      const data = await response.json();
      setResults(data.results || []);
      setSummary(data.summary || { total: 0, passed: 0, failed: 0 });
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const failedResults = results.filter(r => !r.passed);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">사주 계산기 테스트</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-2">테스트 데이터 입력</h2>
          <p className="text-sm text-gray-500 mb-4">
            탭으로 구분된 데이터를 붙여넣으세요: 날짜 시간 국가코드 성별 연주 월주 일주 시주
          </p>
          <textarea
            className="w-full h-64 border rounded p-3 font-mono text-sm"
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
            placeholder="1996-05-22&#9;16:30&#9;KR&#9;female&#9;병자&#9;계사&#9;기미&#9;임신"
          />
          <button
            onClick={runTests}
            disabled={loading || !testData.trim()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '테스트 중...' : '테스트 실행'}
          </button>
        </div>

        {summary.total > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">
              결과: {summary.passed}/{summary.total} 통과 ({((summary.passed / summary.total) * 100).toFixed(1)}%)
            </h2>
            <div className="flex gap-4">
              <span className="text-green-600">통과: {summary.passed}</span>
              <span className="text-red-600">실패: {summary.failed}</span>
            </div>
          </div>
        )}

        {failedResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-4 text-red-600">실패 케이스 (처음 50개)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">날짜</th>
                    <th className="p-2 text-left">시간</th>
                    <th className="p-2 text-left">국가</th>
                    <th className="p-2 text-left">기대 연주</th>
                    <th className="p-2 text-left">실제 연주</th>
                    <th className="p-2 text-left">기대 월주</th>
                    <th className="p-2 text-left">실제 월주</th>
                    <th className="p-2 text-left">기대 일주</th>
                    <th className="p-2 text-left">실제 일주</th>
                    <th className="p-2 text-left">기대 시주</th>
                    <th className="p-2 text-left">실제 시주</th>
                  </tr>
                </thead>
                <tbody>
                  {failedResults.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{r.testCase.date}</td>
                      <td className="p-2">{r.testCase.time || '-'}</td>
                      <td className="p-2">{r.testCase.country}</td>
                      <td className={`p-2 ${r.testCase.expected.year !== r.actual.year ? 'bg-red-100' : ''}`}>
                        {r.testCase.expected.year}
                      </td>
                      <td className={`p-2 ${r.testCase.expected.year !== r.actual.year ? 'bg-red-100' : ''}`}>
                        {r.actual.year}
                      </td>
                      <td className={`p-2 ${r.testCase.expected.month !== r.actual.month ? 'bg-red-100' : ''}`}>
                        {r.testCase.expected.month}
                      </td>
                      <td className={`p-2 ${r.testCase.expected.month !== r.actual.month ? 'bg-red-100' : ''}`}>
                        {r.actual.month}
                      </td>
                      <td className={`p-2 ${r.testCase.expected.day !== r.actual.day ? 'bg-red-100' : ''}`}>
                        {r.testCase.expected.day}
                      </td>
                      <td className={`p-2 ${r.testCase.expected.day !== r.actual.day ? 'bg-red-100' : ''}`}>
                        {r.actual.day}
                      </td>
                      <td className={`p-2 ${r.testCase.expected.hour !== r.actual.hour ? 'bg-red-100' : ''}`}>
                        {r.testCase.expected.hour}
                      </td>
                      <td className={`p-2 ${r.testCase.expected.hour !== r.actual.hour ? 'bg-red-100' : ''}`}>
                        {r.actual.hour}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
